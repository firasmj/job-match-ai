import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { openai } from '../utils/openAIHelper';
import { getPostTitles } from '../services/scrapingService';
import { job, JobMatch } from '../types/interfaces';
import { mockJobMatches } from '../utils/mockData';
import { progressEmitter } from '../websocket/progressEmitter';
const mammoth = require('mammoth');
const fs = require('fs');

// Check if testing mode is enabled
const TESTING_MODE = process.env.TESTING_MODE === 'true';

export const uploadFile = async (req: any, res: Response, next: NextFunction) => {
    const providedId = typeof req?.body?.progressId === 'string' ? req.body.progressId.trim() : undefined;
    const headerIdRaw = req?.headers?.['x-progress-id'];
    const headerId = typeof headerIdRaw === 'string' ? headerIdRaw.trim() : Array.isArray(headerIdRaw) ? headerIdRaw[0] : undefined;
    const progressId = providedId || headerId || randomUUID();

    res.setHeader('X-Progress-Id', progressId);

    try {
        // Return mock data if testing mode is enabled
        if (TESTING_MODE) {
            console.log('🧪 TESTING MODE: Returning mock job matching data');
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            progressEmitter.emitProgress({
                progressId,
                stage: 'testing',
                message: 'Testing mode enabled. Returning mock job matches.'
            });
            progressEmitter.emitProgress({
                progressId,
                stage: 'completed',
                message: 'Mock job matches ready.',
                meta: { matchedJobs: mockJobMatches.length }
            });
            return res.json({
                progressId,
                matches: mockJobMatches
            });
        }

        if (!req.file) {
            progressEmitter.emitProgress({
                progressId,
                stage: 'error',
                message: 'No file uploaded.'
            });
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!req.file.path || !fs.existsSync(req.file.path)) {
            progressEmitter.emitProgress({
                progressId,
                stage: 'error',
                message: 'Uploaded file not found on server.'
            });
            return res.status(400).json({ error: 'Uploaded file not found on server' });
        }

        progressEmitter.emitProgress({
            progressId,
            stage: 'resume_received',
            message: 'Resume received and ready for processing.',
            meta: { filename: req.file.originalname }
        });

        let extractedText: any;

        progressEmitter.emitProgress({
            progressId,
            stage: 'extracting_text',
            message: 'Extracting text from uploaded resume.'
        });

        if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            extractedText = await mammoth.extractRawText({ path: req.file.path });
        } else if (req.file.mimetype === 'application/pdf') {
            progressEmitter.emitProgress({
                progressId,
                stage: 'error',
                message: 'PDF files are not yet supported. Please upload a DOCX file.'
            });
            return res.status(400).json({ error: 'PDF files are not yet supported. Please upload a DOCX file.' });
        } else {
            progressEmitter.emitProgress({
                progressId,
                stage: 'error',
                message: 'Unsupported file type uploaded.'
            });
            return res.status(400).json({ error: 'Unsupported file type' });
        }

        if (!extractedText || !extractedText.value) {
            progressEmitter.emitProgress({
                progressId,
                stage: 'error',
                message: 'Failed to extract text from the document.'
            });
            return res.status(400).json({ error: 'Failed to extract text from the document' });
        }

        progressEmitter.emitProgress({
            progressId,
            stage: 'generating_job_titles',
            message: 'Generating suggested job titles from resume.'
        });

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

        progressEmitter.emitProgress({
            progressId,
            stage: 'job_titles_ready',
            message: 'Suggested job titles generated from resume analysis.',
            meta: { suggestedJobTitles }
        });

        progressEmitter.emitProgress({
            progressId,
            stage: 'scraping_started',
            message: 'Scraping job listings for suggested titles.',
            meta: { suggestedJobTitleCount: suggestedJobTitles.length }
        });

        const jobs: job[] | undefined = await getPostTitles(suggestedJobTitles, { progressId });

        if (!jobs || jobs.length === 0) {
            progressEmitter.emitProgress({
                progressId,
                stage: 'finalizing',
                message: 'No jobs found during scraping.'
            });
            progressEmitter.emitProgress({
                progressId,
                stage: 'completed',
                message: 'Job matching completed with no results.',
                meta: { totalJobs: 0, matchedJobs: 0 }
            });
            return res.json({ progressId, matches: [], message: 'No jobs found' });
        }

        // Analyze and rank jobs with strengths/weaknesses
        progressEmitter.emitProgress({
            progressId,
            stage: 'ai_filtering',
            message: 'Analyzing scraped jobs against resume.'
        });
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
            progressEmitter.emitProgress({
                progressId,
                stage: 'error',
                message: 'Failed to analyze job matches.'
            });
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
            progressEmitter.emitProgress({
                progressId,
                stage: 'error',
                message: 'Failed to parse job analysis response.'
            });
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

        progressEmitter.emitProgress({
            progressId,
            stage: 'analysis_ready',
            message: 'Job analysis completed. Ranking matches.'
        });

        // Sort by match score (highest first) and assign ranks
        jobMatches.sort((a, b) => b.matchScore - a.matchScore);
        jobMatches.forEach((match, index) => {
            match.rank = index + 1;
        });

        progressEmitter.emitProgress({
            progressId,
            stage: 'finalizing',
            message: 'Finalizing job matches for response.',
            meta: { matchedJobs: jobMatches.length }
        });

        progressEmitter.emitProgress({
            progressId,
            stage: 'completed',
            message: 'Job matching completed successfully.',
            meta: { totalJobs: jobs.length, matchedJobs: jobMatches.length }
        });

        res.json({
            progressId,
            totalJobs: jobs.length,
            matchedJobs: jobMatches.length,
            matches: jobMatches
        });

    } catch (error) {
        progressEmitter.emitProgress({
            progressId,
            stage: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred during job upload.'
        });
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
