import { Request, Response, NextFunction } from 'express';
import { parseResumeWithAI, extractTextFromFile } from '../services/resumeParsingService';
import { ParsedResume } from '../types/resumeInterfaces';
const fs = require('fs');

/**
 * Controller to parse a resume file and return structured JSON
 * @route POST /api/resume/parse
 */
export const parseResume = async (req: any, res: Response, next: NextFunction) => {
    try {
        // Validate file upload
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!req.file.path || !fs.existsSync(req.file.path)) {
            return res.status(400).json({ error: 'Uploaded file not found on server' });
        }

        // Extract text from the uploaded file
        const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);

        if (!extractedText) {
            return res.status(400).json({ error: 'Failed to extract text from the document' });
        }

        // Parse the resume text using AI
        const parsedResume: ParsedResume = await parseResumeWithAI(extractedText);

        // Return the structured resume data
        res.json({
            success: true,
            data: parsedResume,
            metadata: {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                processedAt: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('Error parsing resume:', error);
        res.status(500).json({ 
            error: 'Failed to parse resume',
            message: error.message 
        });
    } finally {
        // Clean up uploaded file
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError);
            }
        }
    }
};

/**
 * Controller to parse resume text directly (without file upload)
 * @route POST /api/resume/parse-text
 */
export const parseResumeText = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { resumeText } = req.body;

        if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length === 0) {
            return res.status(400).json({ error: 'Resume text is required' });
        }

        // Parse the resume text using AI
        const parsedResume: ParsedResume = await parseResumeWithAI(resumeText);

        // Return the structured resume data
        res.json({
            success: true,
            data: parsedResume,
            metadata: {
                processedAt: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('Error parsing resume text:', error);
        res.status(500).json({ 
            error: 'Failed to parse resume text',
            message: error.message 
        });
    }
};
