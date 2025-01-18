import axios from "axios";
import { job, site } from "./types/interfaces";
// import { extractTextFromDOCX } from "./utils/textFromFile";
// import { exit } from "process";
import { openai } from "./utils/openAIHelper";

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mammoth = require('mammoth');
const cheerio = require('cheerio');

const app = express();

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
        // const extractedText = req.file != null ? await extractTextFromDOCX(req.file.path) : 'no file';
        const extractedText = await mammoth.extractRawText({ path: req.file.path });
        console.log('extractedText: ', extractedText.value);

        const jobAnalysis = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                {
                    role: 'user', content: `Analyze the following resume and suggest job titles in the following string array format. Respond with only the JSON object, without any formatting markers or triple backticks.:
                    {
                    "jobs": 
                    [
                    'job example 1',
                    'job example 2', ...
                    ]
                    }

                    resume text:
                    ${extractedText.value}`
                },
            ]
        });

        const temp = JSON.parse(jobAnalysis.choices[0]?.message?.content?.trim() || 'jobs:[\'\']').jobs;
        const suggestedJobTitles: string[] = temp ?? [];

        console.log( "SUGGESTEDDDD:  ", suggestedJobTitles.toString());

        const jobs: job[] | undefined = await getPostTitles(suggestedJobTitles);

        const filteredJobs = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: `Here is a resume:\n${extractedText.value}` },
                { role: 'user', content: `Here are some job postings:\n${JSON.stringify(jobs)}` },
                { role: 'user', content: 'Filter the suitable jobs based on the resume and return them in a json format identical to the one i sent you.' },
            ],
        });

        const finalJobs = filteredJobs.choices[0]?.message?.content;
        console.log("FINALJOBS", finalJobs);
    } catch (error) {
        console.log(error);
    }
});

const sitesData: site[] = [
    // {
    //     name: "Hire Lebanese",
    //     link: "https://hirelebanese.com/",
    //     location: "div > h4 > a",
    //     jobs: []
    // },
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
    //     //this is not available for all countries
    // },
    {
        name: "Bayt",
        // link: "https://www.bayt.com/en/lebanon/jobs/software-jobs/",
        link: "https://www.bayt.com/en/lebanon/jobs/",
        location: "div > ul > li > div > h2 > a",
        jobs: [],
    }
]

const getPostTitles = async (jobTitles: string[]) => {

    for (const site of sitesData) {
        // sitesData.forEach((site) => {

        //let url: string = '';
        let tmpJobs: job[] = [{
            name: '',
            description: '',
            company: '',
            location: '',
            datePosted: ''
        }];

        // Initialise empty data array
        const postTitles: string[] = [];
        const postLinks: string[] = [];

        try {
            // for (let i = 0; i < sitesData.length; i++) {
            //     switch (sitesData[i].name) {
            //         case 'Tanqeeb':
            //             url = sitesData[i].link;
            //     }
            // }
            const { data } = await axios.get(
                // 'https://www.hirelebanese.com/searchresults.aspx?resume=0&top=0&location=&company=&category=10'
                // "https://www.naukrigulf.com/engineering-jobs"
                // "https://lebanon.tanqeeb.com/s/jobs/ember-jobs"
                // "https://www.bayt.com/en/lebanon/jobs/software-jobs/"
                site.link + jobTitles[0].replace(/\s+/g, '-') + '-jobs'
            );

            // Parse HTML with Cheerio
            const $ = cheerio.load(data);

            // // Initialise empty data array
            // const postTitles: string[] = [];
            // const postLinks: string[] = [];

            // Iterate over all anchor links for the given selector and ....
            // $('div > h4 > a').each((_idx:number, el:any) => {
            // $('h2 .hover-title').each((_idx:number, el:any) => {
            $(site.location).each((_idx: number, el: any) => {
                // .... extract for each the tag text and add it to the data array
                const postTitle: string = $(el).text().trim();
                const link: string = $(el).attr('href');
                // postLinks.push(`${site.link.slice(0, -1)}${link}`);
                postLinks.push(`https://www.bayt.com${link}`);
                postTitles.push(postTitle);
            });

            // (async () => {
            switch (site.name) {
                case 'Bayt':
                    for (const link of postLinks) {
                        console.log(link);
                        try {
                            // postLinks.forEach((link) => {
                            const { data } = await axios.get(link);
                            const $ = cheerio.load(data);
                            let name: string = $('div.media-d > div > div > h1.h3').text();
                            let description: string = $('div.t-break > p').text();
                            let company: string = $('div.p0 > ul > li > a').text();
                            let location: string = '';
                            $('div > ul > li > span > a.t-mute').each((_idx: number, el: any) => {
                                location += $(el).text();
                            });
                            let date: string = $('div.m10y > span').text();
                            // console.log("name: ", name, " - descriptionn: ", description);
                            tmpJobs.push({
                                name: name,
                                description: description,
                                company: company,
                                location: location,
                                datePosted: date
                            });
                            // $('div.t-break > p').each((_idx: number, el: any) => {
                            //     description = $(el).text();
                            // })
                        } catch (error) {
                            console.log("errorrr");
                            // exit();
                        }
                    }
                    break;
            }
            // });
            site.jobs = tmpJobs;

            // Return the array with all titles
            // return postTitles.concat(postLinks);
            return site.jobs;
        } catch (error) {
            throw error;
        }
    }
}

// getPostTitles()
//     .then((postTitles) => postTitles?.forEach((job) => { console.log(JSON.stringify(job)) }));

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("server listening on port: ", port);
});