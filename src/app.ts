import axios from "axios";
import { job, site } from "./types/interfaces";
// import { extractTextFromDOCX } from "./utils/textFromFile";
// import { exit } from "process";
import { openai } from "./utils/openAIHelper";
import { exit } from "process";

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
        // console.log('extractedText: ', extractedText.value);

        const jobAnalysis = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                {
                    role: 'user', content: `Analyze the following resume and suggest job titles in the following string array format. Return only 2 most suitable job titles only. Respond with only the JSON object, without any formatting markers or triple backticks.:
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
            res.json(filteredJobs);
        }
    } catch (error) {
        console.log(error);
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

                const { data } = await axios.get(
                    // 'https://www.hirelebanese.com/searchresults.aspx?resume=0&top=0&location=&company=&category=10'
                    // "https://www.naukrigulf.com/engineering-jobs"
                    // "https://lebanon.tanqeeb.com/s/jobs/ember-jobs"
                    // "https://www.bayt.com/en/lebanon/jobs/software-jobs/"
                    // site.jobsLink + title.replace(/\s+/g, '-') + '-jobs'
                    searchLink
                );

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
    return jobs;
}


//////////testing

// const getp = async () => {

//     const jobs: job[] = [];
//     const jobTitles: string[] = ['software developer'];

//     for (const site of sitesData) {
//         // sitesData.forEach((site) => {

//         //let url: string = '';

//         // Initialise empty data array
//         const postTitles: string[] = [];
//         const postLinks: string[] = [];
//         let jobsCounter: number = 0;

//         for (const title of jobTitles) {
//             try {
//                 let tmpJobs: job[] = [];
//                 let jobLinks: string[] = [];
//                 // for (let i = 0; i < sitesData.length; i++) {
//                 //     switch (sitesData[i].name) {
//                 //         case 'Tanqeeb':
//                 //             url = sitesData[i].link;
//                 //     }
//                 // }
//                 let searchLink: string = '';
//                 switch (site.name) {
//                     case "Hire Lebanese":
//                         searchLink = site.jobsLink.replace('#', title);
//                         break;
//                     case "Bayt":
//                         searchLink = site.jobsLink + title.replace(/\s+/g, '-') + '-jobs';
//                         break;
//                 }
//                 const { data } = await axios.get(
//                     // 'https://www.hirelebanese.com/searchresults.aspx?resume=0&top=0&location=&company=&category=10'
//                     // "https://www.naukrigulf.com/engineering-jobs"
//                     // "https://lebanon.tanqeeb.com/s/jobs/ember-jobs"
//                     // "https://www.bayt.com/en/lebanon/jobs/software-jobs/"
//                     // site.jobsLink + title.replace(/\s+/g, '-') + '-jobs'
//                     searchLink
//                 );

//                 // Parse HTML with Cheerio
//                 const $ = cheerio.load(data);

//                 // // Initialise empty data array
//                 // const postTitles: string[] = [];
//                 // const postLinks: string[] = [];

//                 // Iterate over all anchor links for the given selector and ....
//                 // $('div > h4 > a').each((_idx:number, el:any) => {
//                 // $('h2 .hover-title').each((_idx:number, el:any) => {
//                 $(site.location).each((_idx: number, el: any) => {
//                     // .... extract for each the tag text and add it to the data array
//                     const postTitle: string = $(el).text().trim();
//                     const link: string = $(el).attr('href');
//                     // postLinks.push(`${site.link.slice(0, -1)}${link}`);
//                     let tempLink: string = `${site.link}${link}`;
//                     if (!postLinks.includes(tempLink)) {
//                         postLinks.push(tempLink);
//                         jobLinks.push(tempLink);
//                         postTitles.push(postTitle);
//                     }
 
//                 });
//                 console.log(postTitles.toString());
//                 // (async () => {
//                 // switch (site.name) {
//                 //     case 'Bayt':
//                 //         for (const link of jobLinks) {
//                 //             console.log(link);
//                 //             try {
//                 //                 // postLinks.forEach((link) => {
//                 //                 const { data } = await axios.get(link);
//                 //                 const $ = cheerio.load(data);
//                 //                 let id: number = jobsCounter;
//                 //                 let name: string = $('div.media-d > div > div > h1.h3').text();
//                 //                 let description: string = $('div.t-break > p').text();
//                 //                 let company: string = $('div.p0 > ul.p0t > li > a.t-default').text();
//                 //                 let location: string = '';
//                 //                 $('div > ul > li > span > a.t-mute').each((_idx: number, el: any) => {
//                 //                     location += $(el).text() + ' ';
//                 //                 });
//                 //                 let date: string = $('div.m10y > span.u-none').text();
//                 //                 // console.log("name: ", name, " - descriptionn: ", description);
//                 //                 tmpJobs.push({
//                 //                     id: id,
//                 //                     name: name,
//                 //                     link: link,
//                 //                     description: description,
//                 //                     company: company,
//                 //                     location: location,
//                 //                     datePosted: date
//                 //                 });
//                 //                 jobsCounter++;
//                 //                 // $('div.t-break > p').each((_idx: number, el: any) => {
//                 //                 //     description = $(el).text();
//                 //                 // })
//                 //             } catch (error) {
//                 //                 console.log("errorrr");
//                 //                 // exit();
//                 //             }
//                 //         }
//                 //         break;
//                 //     case 'Hire Lebanese':
//                 //         for (const link of jobLinks) {
//                 //             console.log(link);
//                 //             try {
//                 //                 // postLinks.forEach((link) => {
//                 //                 const { data } = await axios.get(link);
//                 //                 const $ = cheerio.load(data);
//                 //                 let id: number = jobsCounter;
//                 //                 let name: string = $('div.media-d > div > div > h1.h3').text();
//                 //                 let description: string = $('div.t-break > p').text();
//                 //                 let company: string = $('div.p0 > ul.p0t > li > a.t-default').text();
//                 //                 let location: string = '';
//                 //                 $('div > ul > li > span > a.t-mute').each((_idx: number, el: any) => {
//                 //                     location += $(el).text() + ' ';
//                 //                 });
//                 //                 let date: string = $('div.m10y > span.u-none').text();
//                 //                 // console.log("name: ", name, " - descriptionn: ", description);
//                 //                 tmpJobs.push({
//                 //                     id: id,
//                 //                     name: name,
//                 //                     link: link,
//                 //                     description: description,
//                 //                     company: company,
//                 //                     location: location,
//                 //                     datePosted: date
//                 //                 });
//                 //                 jobsCounter++;
//                 //                 // $('div.t-break > p').each((_idx: number, el: any) => {
//                 //                 //     description = $(el).text();
//                 //                 // })
//                 //             } catch (error) {
//                 //                 console.log("errorrr");
//                 //                 // exit();
//                 //             }
//                 //         }
//                 //         break;
//                 // }
//                 // // });
//                 // site.jobs = tmpJobs;

//                 // // Return the array with all titles
//                 // // return postTitles.concat(postLinks);
//                 // // return site.jobs;
//                 // site.jobs.forEach((job) => {
//                 //     jobs.push(job);
//                 //     // console.log("idd: ", job.id,"linkk: ", job.link);
//                 // });
//             } catch (error) {
//                 throw error;
//             }
//         }
//     }
//     return jobs;
// }

// getPostTitles()
//     .then((postTitles) => postTitles?.forEach((job) => { console.log(JSON.stringify(job)) }));

// getp()
//     .then((postTitles) => postTitles?.forEach((job) => { console.log(JSON.stringify(job)) }));

//////////testing

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("server listening on port: ", port);
});





/////  todo

// scrape job requirements skills and qualifications too from some websites where not included in description