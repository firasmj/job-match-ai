import { Request, Response, NextFunction } from 'express';
import { openai } from '../utils/openAIHelper';
import { getPostTitles } from '../services/scrapingService';
import { job } from '../types/interfaces';
const mammoth = require('mammoth');
const fs = require('fs');

export const uploadFile = async (req: any, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!req.file.path || !fs.existsSync(req.file.path)) {
            return res.status(400).json({ error: 'Uploaded file not found on server' });
        }

        let extractedText: any;

        if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            extractedText = await mammoth.extractRawText({ path: req.file.path });
        } else if (req.file.mimetype === 'application/pdf') {
            return res.status(400).json({ error: 'PDF files are not yet supported. Please upload a DOCX file.' });
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }

        if (!extractedText || !extractedText.value) {
            return res.status(400).json({ error: 'Failed to extract text from the document' });
        }

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

        const jobs: job[] | undefined = await getPostTitles(suggestedJobTitles);

        const filteredJobs = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: `Here is a resume:\n${extractedText.value}` },
                { role: 'user', content: `Here are some job postings:\n${JSON.stringify(jobs)}` },
                { role: 'user', content: 'Filter the suitable jobs based on the resume and return them in an array of numbers containing the IDs of these jobs. Respond with only the JSON object, without any formatting markers or triple backticks.' },
            ],
        });

        let finalJobs = filteredJobs.choices[0]?.message?.content || '[]';
        let final: number[] = JSON.parse(finalJobs);

        if (Array.isArray(final) && jobs) {
            let filteredJobs: job[] = jobs.filter((job) => final.includes(Number(job.id)));
            res.json(filteredJobs);
        } else {
            res.status(500).json({ error: 'Failed to process jobs' });
        }
    } catch (error) {
        next(error);
    } finally {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError);
            }
        }
    }
};

export const testUrlController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const url = await req?.body?.url;
        // const response = await testUrl(url);
        res.json({
            message: 'URL tested successfully',
            // content: response,
            ok: true
        });
    } catch (error) {
        next(error);
    }
};
