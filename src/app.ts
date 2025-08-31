import axios from "axios";
import { job, site } from "./types/interfaces";
// import { extractTextFromDOCX } from "./utils/textFromFile";
// import { exit } from "process";
import { openai } from "./utils/openAIHelper";
import { Search } from "./schema/schema";
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mammoth = require('mammoth');
const cheerio = require('cheerio');

const app = express();

// Error handling middleware for multer
app.use((error: any, req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
        }
        return res.status(400).json({ error: `File upload error: ${error.message}` });
    }

    if (error.message === 'Invalid file type. Only docx and pdf are allowed.') {
        return res.status(400).json({ error: error.message });
    }

    next(error);
});

const storage = multer.diskStorage({
    destination: (req: any, res: any, cb: any) => {
        const uploadPath = path.join(__dirname, 'uploads');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req: any, file: any, cb: any) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 2,
    },
    fileFilter: (req: any, file: any, cb: any) => {
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only docx and pdf are allowed.'));
        }
    }
})

// route to upload a resume docx file
app.post('/upload', upload.single("document1"), async (req: any, res: any) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Check if file path exists
        if (!req.file.path) {
            return res.status(400).json({ error: 'File path is missing' });
        }

        // Check if file exists on disk
        if (!fs.existsSync(req.file.path)) {
            return res.status(400).json({ error: 'Uploaded file not found on server' });
        }

        console.log('Processing file:', req.file.path);
        console.log('File mimetype:', req.file.mimetype);

        let extractedText: any;

        // Handle different file types
        if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Handle DOCX files
            extractedText = await mammoth.extractRawText({ path: req.file.path });
        } else if (req.file.mimetype === 'application/pdf') {
            // For now, return an error for PDF files as we need a PDF parser
            return res.status(400).json({ error: 'PDF files are not yet supported. Please upload a DOCX file.' });
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }

        // Check if text extraction was successful
        if (!extractedText || !extractedText.value) {
            return res.status(400).json({ error: 'Failed to extract text from the document' });
        }

        console.log('Extracted text length:', extractedText.value.length);

        const jobAnalysis = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                {
                    role: 'user', content: `Analyze the following resume and suggest job titles in the following string array format. Return only 1 most suitable job titles only. Respond with only the JSON object, without any formatting markers or triple backticks.:
                    {
                    "jobs": 
                    [
                    'job example 1',
                    'job example 2'
                    ]
                    }

                    resume text:
                    ${extractedText.value}`
                },
            ]
        });

        const temp = JSON.parse(jobAnalysis.choices[0]?.message?.content?.trim() || '{"jobs":[""]}').jobs;
        const suggestedJobTitles: string[] = temp ?? [];

        console.log("SUGGESTEDDDD:  ", suggestedJobTitles.toString());

        const jobs: job[] | undefined = await getPostTitles(suggestedJobTitles);

        const filteredJobs = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: `Here is a resume:\n${extractedText.value}` },
                { role: 'user', content: `Here are some job postings:\n${JSON.stringify(jobs)}` },
                // { role: 'user', content: 'Filter the suitable jobs based on the resume and return them in a json format identical to the one i sent you.' },
                { role: 'user', content: 'Filter the suitable jobs based on the resume and return them in an array of numbers containing the IDs of these jobs. Respond with only the JSON object, without any formatting markers or triple backticks.' },
            ],
        });

        // const finalJobs = filteredJobs.choices[0]?.message?.content;
        let finalJobs = filteredJobs.choices[0]?.message?.content || '[]';
        console.log("Final Jobsss: ", finalJobs);
        let final: number[] = JSON.parse(finalJobs);
        if (!Array.isArray(final)) {
            console.log('parsed data is not an array');
        } else {
            console.log("FINALJOBS", finalJobs);
            let filteredJobs: job[] = jobs.filter((job) => final.includes(Number(job.id)));
            console.log("Filtered JOBSSS: ", JSON.stringify(filteredJobs));

            // Clean up uploaded file after successful processing
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try {
                    fs.unlinkSync(req.file.path);
                    console.log('Cleaned up uploaded file after successful processing');
                } catch (cleanupError) {
                    console.error('Error cleaning up file:', cleanupError);
                }
            }

            res.json(filteredJobs);
        }
    } catch (error) {
        console.error('Error processing upload:', error);

        // Clean up uploaded file if it exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('Cleaned up uploaded file after error');
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError);
            }
        }

        res.status(500).json({
            error: 'Internal server error processing file',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

const sitesData: site[] = [

    // {
    //     name: "LinkedIn",
    //     link: "https://linkedin.com/jobs",
    //     location: "div > a > span > strong",
    //     jobs: []
    // },
    // {
    //     name: "Naukrigulf",
    //     link: "https://www.naukrigulf.com/",
    //     location: "a .info-position > p",
    //     jobs: []
    //     //note that this website won't work for now since it's a SPA and won't work with cheerio alone
    // },
    // {
    //     name: "Indeed.com",
    //     link: "https://www.indeed.com/jobs?q=software&l=&from=searchOnDesktopSerp&vjk=7ab3722928a75aa1",
    //     location: "not seen yet",
    //     jobs: [],
    //     //this is not available for all countries
    // },
    // {
    //     name: "Tanqeeb",
    //     link: "https://lebanon.tanqeeb.com/s/jobs/ember-jobs",
    //     location: "a .card-list-item",
    //     jobs: [],
    //     //this is not available for all countries, this may be a SPA
    // },
    {
        name: "Hire Lebanese",
        link: "https://hirelebanese.com/",
        // jobsLink: "https://hirelebanese.com/searchresults.aspx?order=date&keywords=software%2bdeveloper&category=&type=&duration=&country=117,241,258,259,260&state=&city=&emp=&pg=1&s=-1&top=0",
        jobsLink: "https://hirelebanese.com/searchresults.aspx?order=date&keywords=#&category=&type=&duration=&country=117,241,258,259,260&state=&city=&emp=&pg=1&s=-1&top=0",
        location: "div.panel-title > h4 > a",
        jobs: []
    },
    {
        name: "Bayt",
        // link: "https://www.bayt.com/en/lebanon/jobs/software-jobs/",
        link: "https://www.bayt.com",
        jobsLink: "https://www.bayt.com/en/lebanon/jobs/",
        location: "div > ul > li > div > h2 > a",
        jobs: [],
        //this now has protection against scraping, so it won't work with cheerio alone for now
    }
]

const getPostTitles = async (jobTitles: string[]) => {

    const jobs: job[] = [];
    let jobsCounter: number = 0;

    for (const site of sitesData) {

        // Initialise empty array
        const postTitles: string[] = [];
        const postLinks: string[] = [];

        for (const title of jobTitles) {
            try {
                let tmpJobs: job[] = [];
                let jobLinks: string[] = [];
                let searchLink: string = '';

                switch (site.name) {
                    case "Hire Lebanese":
                        searchLink = site.jobsLink.replace('#', title);
                        break;
                    case "Bayt":
                        searchLink = site.jobsLink + title.replace(/\s+/g, '-') + '-jobs';
                        break;
                }

                const { data } = await axios.get(searchLink, {
                    // headers: {
                    //     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    //     'Accept-Language': 'en-US,en;q=0.9',
                    //     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    //     'Connection': 'keep-alive',
                    // },
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                            "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                        "Accept":
                            "text/html,application/xhtml+xml,application/xml;q=0.9," +
                            "image/avif,image/webp,image/apng,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.9",
                        "Accept-Encoding": "gzip, deflate, br",
                        "Referer": "https://google.com/",
                        "Connection": "keep-alive",
                    },
                });

                // Parse HTML with Cheerio
                const $ = cheerio.load(data);

                $(site.location).each((_idx: number, el: any) => {
                    const postTitle: string = $(el).text().trim();
                    const link: string = $(el).attr('href');
                    let tempLink: string = `${site.link}${link}`;

                    if (!postLinks.includes(tempLink)) {
                        postLinks.push(tempLink);
                        jobLinks.push(tempLink);
                        postTitles.push(postTitle);
                    }

                });

                switch (site.name) {
                    case 'Bayt':
                        for (const link of jobLinks) {
                            console.log(link);
                            try {
                                const { data } = await axios.get(link);
                                const $ = cheerio.load(data);
                                let id: number = jobsCounter;
                                let name: string = $('div.media-d > div > div > h1.h3').text();
                                let description: string = $('div.t-break > p').text();
                                let company: string = $('div.p0 > ul.p0t > li > a.t-default').text();
                                let location: string = '';
                                $('div > ul > li > span > a.t-mute').each((_idx: number, el: any) => {
                                    location += $(el).text() + ' ';
                                });
                                let date: string = $('div.m10y > span.u-none').text();
                                // console.log("name: ", name, " - descriptionn: ", description);
                                tmpJobs.push({
                                    id: id,
                                    name: name,
                                    link: link,
                                    description: description,
                                    company: company,
                                    location: location,
                                    datePosted: date
                                });
                                jobsCounter++;

                            } catch (error) {
                                console.log("errorrr");
                                // exit();
                            }
                        }
                        break;
                    case 'Hire Lebanese':
                        for (const link of jobLinks) {
                            console.log(link);
                            try {
                                const { data } = await axios.get(link);
                                const $ = cheerio.load(data);
                                let id: number = jobsCounter;
                                let name: string = $('div.col-sm-12 > h3 > span.h2').text();
                                let description: string = $('div.white-div > div.padding-top > div.col-sm-12 > #description').text();
                                let company: string = $('#company').text();
                                let location: string = $('#location').text();
                                let date: string = $('#date').text();
                                // console.log("name: ", name, " - descriptionn: ", description);
                                tmpJobs.push({
                                    id: id,
                                    name: name,
                                    link: link,
                                    description: description,
                                    company: company,
                                    location: location,
                                    datePosted: date
                                });
                                jobsCounter++;
                            } catch (error) {
                                console.log("errorrr");
                            }
                        }
                        break;
                }
                site.jobs = tmpJobs;

                site.jobs.forEach((job) => {
                    jobs.push(job);
                    // console.log("idd: ", job.id,"linkk: ", job.link);
                });
            } catch (error) {
                throw error;
            }
        }
    }
    Search(jobs);
    return jobs;
}



const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("server listening on port: ", port);
});





/////  todo

// scrape job requirements skills and qualifications too from some websites where not included in description