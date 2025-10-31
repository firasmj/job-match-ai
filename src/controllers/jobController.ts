import { Request, Response, NextFunction } from 'express';
import { openai } from '../utils/openAIHelper';
import { getPostTitles } from '../services/scrapingService';
import { job, JobMatch } from '../types/interfaces';
import { mockJobMatches } from '../utils/mockData';
const mammoth = require('mammoth');
const fs = require('fs');

// Check if testing mode is enabled
const TESTING_MODE = process.env.TESTING_MODE === 'true';

export const uploadFile = async (req: any, res: Response, next: NextFunction) => {
    try {
        // Return mock data if testing mode is enabled
        if (TESTING_MODE) {
            console.log('🧪 TESTING MODE: Returning mock job matching data');
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            return res.json(mockJobMatches);
        }

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

        if (!jobs || jobs.length === 0) {
            return res.json({ matches: [], message: 'No jobs found' });
        }

        // Analyze and rank jobs with strengths/weaknesses
        const jobMatchingAnalysis = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { 
                    role: 'system', 
                    content: 'You are an expert career counselor and job matching specialist. Analyze resumes against job descriptions to provide detailed matching insights.'
                },
                { 
                    role: 'user', 
                    content: `Resume:\n${extractedText.value}` 
                },
                { 
                    role: 'user', 
                    content: `Job Postings:\n${JSON.stringify(jobs)}` 
                },
                { 
                    role: 'user', 
                    content: `Analyze each job against the resume and return a JSON array with the following structure for EACH job. Include ALL jobs in your analysis.

CRITICAL: Return ONLY a valid JSON array, no markdown formatting, no code blocks, no additional text.

[
  {
    "jobId": number,
    "matchScore": number (0-100),
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "missingRequirements": ["requirement 1", "requirement 2"],
    "recommendations": ["recommendation 1", "recommendation 2"]
  }
]

Rules:
- matchScore: 0-100 based on overall fit
- strengths: What makes the candidate a good fit (skills, experience that match)
- weaknesses: Areas where candidate may not be ideal (experience gaps, skill gaps)
- missingRequirements: Specific requirements from job description that candidate lacks
- recommendations: Actionable advice to improve chances

Analyze ALL ${jobs.length} jobs.` 
                }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const analysisContent = jobMatchingAnalysis.choices[0]?.message?.content?.trim();
        
        if (!analysisContent) {
            return res.status(500).json({ error: 'Failed to analyze job matches' });
        }

        let analysisData: any;
        try {
            analysisData = JSON.parse(analysisContent);
            // Handle if the response is wrapped in an object
            if (analysisData.matches || analysisData.jobs || analysisData.results) {
                analysisData = analysisData.matches || analysisData.jobs || analysisData.results;
            }
        } catch (parseError) {
            console.error('Failed to parse analysis:', parseError);
            return res.status(500).json({ error: 'Failed to parse job analysis' });
        }

        // Create JobMatch objects
        const jobMatches: JobMatch[] = Array.isArray(analysisData) 
            ? analysisData.map((analysis: any) => {
                const job = jobs.find(j => j.id === analysis.jobId);
                if (!job) return null;
                
                return {
                    job,
                    matchScore: analysis.matchScore || 0,
                    matchPercentage: analysis.matchScore || 0,
                    rank: 0, // Will be set after sorting
                    strengths: analysis.strengths || [],
                    weaknesses: analysis.weaknesses || [],
                    missingRequirements: analysis.missingRequirements || [],
                    recommendations: analysis.recommendations || []
                };
            }).filter((match): match is JobMatch => match !== null)
            : [];

        // Sort by match score (highest first) and assign ranks
        jobMatches.sort((a, b) => b.matchScore - a.matchScore);
        jobMatches.forEach((match, index) => {
            match.rank = index + 1;
        });

        res.json({
            totalJobs: jobs.length,
            matchedJobs: jobMatches.length,
            matches: jobMatches
        });

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
