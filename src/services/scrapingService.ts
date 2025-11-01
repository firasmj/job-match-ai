import axios from "axios";
import * as cheerio from "cheerio";
import { job, site } from "../types/interfaces";
import { mockJobs } from "../utils/mockData";
import { progressEmitter } from "../websocket/progressEmitter";

// Check if testing mode is enabled
const TESTING_MODE = process.env.TESTING_MODE === 'true';

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
        name: "Jobs For Lebanon",
        link: "https://www.jobsforlebanon.com",
        jobsLink: "https://www.jobsforlebanon.com/wp-admin/admin-ajax.php",
        location: "a.catalogue-job-title-text",
        jobs: []
        // new target :)
    },
    {
        name: "Hire Lebanese",
        link: "https://hirelebanese.com/",
        // jobsLink: "https://hirelebanese.com/searchresults.aspx?order=date&keywords=software%2bdeveloper&category=&type=&duration=&country=117,241,258,259,260&state=&city=&emp=&pg=1&s=-1&top=0",
        jobsLink: "https://hirelebanese.com/searchresults.aspx?order=date&keywords=#&category=&type=&duration=&country=117,241,258,259,260&state=&city=&emp=&pg=1&s=-1&top=0",
        location: "div.panel-title > h4 > a",
        jobs: []
    },
    // {
    //     name: "Bayt",
    //     // link: "https://www.bayt.com/en/lebanon/jobs/software-jobs/",
    //     link: "https://www.bayt.com",
    //     jobsLink: "https://www.bayt.com/en/lebanon/jobs/",
    //     location: "div > ul > li > div > h2 > a",
    //     jobs: [],
    //     //this now has protection against scraping (CloudFlare), so I stopped it for now
    // },
    {
        name: "OLX Lebanon",
        link: "https://www.olx.com.lb/",
        jobsLink: "https://www.olx.com.lb/jobs/jobs-available",
        location: 'li[aria-label="Listing"]',
        jobs: []
    }
];

export interface ScrapingProgressContext {
    progressId?: string;
}

export const getPostTitles = async (jobTitles: string[], progressContext?: ScrapingProgressContext): Promise<job[] | undefined> => {
    
    // Return mock data if testing mode is enabled
    if (TESTING_MODE) {
        console.log('🧪 TESTING MODE: Returning mock job data');
        progressEmitter.emitProgress({
            progressId: progressContext?.progressId,
            stage: 'scraping_complete',
            message: 'Testing mode enabled. Returning mock jobs from cache.',
            meta: { totalJobs: mockJobs.length }
        });
        return mockJobs;
    }

    const jobs: job[] = [];
    let jobsCounter: number = 0;
    const progressId = progressContext?.progressId;

    for (const site of sitesData) {
        progressEmitter.emitProgress({
            progressId,
            stage: 'scraping_site',
            message: `Searching ${site.name} for relevant job postings.`,
            meta: { site: site.name }
        });

        // Initialise empty array
        const postTitles: string[] = [];
        const postLinks: string[] = [];

        for (const title of jobTitles) {
            try {
                let tmpJobs: job[] = [];
                let jobLinks: string[] = [];
                let searchLink: string = '';
                let responseData: any;

                switch (site.name) {
                    case "Jobs For Lebanon":
                        const body = new URLSearchParams({
                            action: 'jfh_ajax_get_jobs',
                            offset: '0',
                            limit: '15', // Or a higher limit if needed
                            'options[terms]': title
                        });

                        const { data: jobsForLebanonData } = await axios.post(site.jobsLink, body, {
                            headers: {
                                'accept': 'text/html',
                                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                'origin': 'https://www.jobsforlebanon.com',
                                'referer': `https://www.jobsforlebanon.com/search/?filters=1&terms=${encodeURIComponent(title)}`,
                                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                                'x-requested-with': 'XMLHttpRequest'
                            }
                        });
                        responseData = jobsForLebanonData;
                        break;
                    case "Hire Lebanese":
                        searchLink = site.jobsLink.replace('#', title);
                        const { data: hireLebaneseData } = await axios.get(searchLink, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" } });
                        responseData = hireLebaneseData;
                        break;
                    case "Bayt":
                        searchLink = site.jobsLink + title.replace(/\s+/g, '-') + '-jobs';
                        const { data: baytData } = await axios.get(searchLink, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" } });
                        responseData = baytData;
                        break;
                    case "OLX Lebanon":
                        searchLink = site.jobsLink + '/q-' + title.replace(/\s+/g, '-');
                        const { data: olxData } = await axios.get(searchLink, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" } });
                        responseData = olxData;
                        break;
                }

                // Parse HTML with Cheerio
                const $ = cheerio?.load(responseData as string);

                $(site.location).each((_idx: number, el: any) => {
                    const link: string = site.name === 'OLX Lebanon' ? $(el).find('a[title]').attr('href') ?? '' : $(el).attr('href') ?? ''; // Corrected to find 'a' within the listing 'li'
                    let tempLink: string = '';

                    if (site.name === 'Jobs For Lebanon') {
                        tempLink = link;
                    } else if (site.name === 'OLX Lebanon') {
                        tempLink = `${site.link}${link.substring(1)}`; // Build full URL for OLX
                    } else {
                        tempLink = `${site.link}${link}`;
                    }

                    if (link && !postLinks.includes(tempLink)) {
                        postLinks.push(tempLink);
                        jobLinks.push(tempLink);
                    }

                });

                switch (site.name) {
                    case 'Jobs For Lebanon':
                        for (const link of jobLinks) {
                            console.log(link);
                            try {
                                const { data } = await axios.get(link);
                                const $ = cheerio?.load(data as string);
                                let id: number = jobsCounter;
                                let name: string = $('h1[style="font-weight: bold;"]').text().trim();
                                let description: string = $('section:has(h3:contains("Job Description")) > div > div').text().trim();
                                let company: string = $('h2[style="font-size: 1.5rem; font-weight: 600;"]').text().trim();
                                let location: string = $('header.header > div > span').first().text().trim();
                                let date: string = ''; // Date is not available on the job page
                                console.log("name: ", name, " - descriptionn: ", description);
                                tmpJobs.push({
                                    id: id, // Ensure ID is a string to match interface
                                    name: name,
                                    link: link,
                                    description: description,
                                    company: company,
                                    location: location,
                                    datePosted: date
                                });
                                jobsCounter++;

                            } catch (error) {
                                console.log("Error fetching job details for Jobs For Lebanon:", error instanceof Error ? error.message : "Unknown error");
                            }
                        }
                        break;
                    case 'Bayt':
                        for (const link of jobLinks) {
                            console.log(link);
                            try {
                                const { data } = await axios.get(link);
                                const $ = cheerio?.load(data as string);
                                let id: number = jobsCounter;
                                let name: string = $('div.media-d > div > div > h1.h3').text();
                                let description: string = $('div.t-break > p').text();
                                let company: string = $('div.p0 > ul.p0t > li > a.t-default').text();
                                let location: string = '';
                                $('div > ul > li > span > a.t-mute').each((_idx: number, el: any) => {
                                    location += $(el).text() + ' ';
                                });
                                let date: string = $('div.m10y > span.u-none').text();
                                console.log("name: ", name, " - descriptionn: ", description);
                                tmpJobs.push({
                                    id: id, // Ensure ID is a string to match interface
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
                                const $ = cheerio?.load(data as string);
                                let id: number = jobsCounter;
                                let name: string = $('div.col-sm-12 > h3 > span.h2').text();
                                let description: string = $('div.white-div > div.padding-top > div.col-sm-12 > #description').text();
                                let company: string = $('#company').text();
                                let location: string = $('#location').text();
                                let date: string = $('#date').text();
                                console.log("name: ", name, " - descriptionn: ", description);
                                tmpJobs.push({
                                    id: id, // Ensure ID is a string to match interface
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
                    
                    // --- START OF CORRECTED OLX BLOCK ---
                    case 'OLX Lebanon':
                        for (const link of jobLinks) {
                            try {
                                // 1. Fetch the detail page for each link
                                const { data: detailData } = await axios.get(link, {
                                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" }
                                });

                                // 2. Load the detail page HTML into a new Cheerio instance
                                const $detail = cheerio.load(detailData as string);

                                // 3. Extract data using selectors from the detail page HTML
                                
                                // ID
                                const idMatch = link.match(/-ID(\d+)\.html$/);
                                const id = idMatch ? idMatch[1] : jobsCounter;

                                // Name
                                const name = $detail('h1._75bce902').text().trim();
                                
                                // Location
                                const location = $detail('span[aria-label="Location"]').text().trim();

                                // Date Posted
                                const datePosted = $detail('span[aria-label="Creation date"]').text().trim();

                                // Description & Company (from description text)
                                const descriptionText = $detail('div[aria-label="Description"] ._472bfbef').text().trim();
                                let description: string = descriptionText;
                                let company: string | undefined = undefined;
                                
                                // Use the same split logic as before
                                const parts = descriptionText.split(' : ');
                                if (parts.length > 1) {
                                    company = parts[0].trim();
                                    description = parts.slice(1).join(' : ').trim();
                                }
                                console.log("name: ", name, " - descriptionn: ", description);
                                // 4. Push the job object
                                tmpJobs.push({
                                    id: parseInt(id.toString()), // Ensure ID is a number
                                    name: name,
                                    link: link,
                                    description: description,
                                    company: company,
                                    location: location,
                                    datePosted: datePosted
                                });
                                jobsCounter++;

                            } catch (error) {
                                console.error(`Error fetching job details for OLX link ${link}:`, error instanceof Error ? error.message : "Unknown error");
                            }
                        }
                        break;
                    // --- END OF CORRECTED OLX BLOCK ---
                }
                site.jobs = tmpJobs;

                site.jobs.forEach((job) => {
                    jobs.push(job);
                    // console.log("idd: ", job.id,"linkk: ", job.link);
                });
            } catch (error) {
                console.error(`Failed to scrape site ${site.name} for title ${title}:`, error);
                progressEmitter.emitProgress({
                    progressId,
                    stage: 'scraping_error',
                    message: `Failed to scrape ${site.name} for ${title}.`,
                    meta: {
                        site: site.name,
                        jobTitle: title,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
                // Continue to the next site/title even if one fails
            }
        }

        progressEmitter.emitProgress({
            progressId,
            stage: 'scraping_site_complete',
            message: `Finished scraping ${site.name}.`,
            meta: { site: site.name, jobsFound: site.jobs?.length ?? 0 }
        });
    }

    // Initialize GraphQL server
    // Search(jobs);

    progressEmitter.emitProgress({
        progressId,
        stage: 'scraping_complete',
        message: 'Completed scraping across all job sources.',
        meta: { totalJobs: jobs.length }
    });

    return jobs;
}
