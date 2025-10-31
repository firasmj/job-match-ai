import { openai } from '../utils/openAIHelper';
import { ParsedResume } from '../types/resumeInterfaces';
import { mockParsedResume } from '../utils/mockData';

// Check if testing mode is enabled
const TESTING_MODE = process.env.TESTING_MODE === 'true';

const RESUME_PARSING_SYSTEM_PROMPT = `You are an expert resume parser. Your task is to extract and organize information from resumes into a structured JSON format.

You MUST return a JSON object that EXACTLY matches this structure with these EXACT field names (case-sensitive):

{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "website": "string",
    "github": "string"
  },
  "summary": "string",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "current": boolean,
      "description": "string",
      "responsibilities": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "location": "string",
      "graduationDate": "string",
      "gpa": "string",
      "fieldOfStudy": "string"
    }
  ],
  "skills": {
    "technical": ["string"],
    "soft": ["string"],
    "languages": ["string"],
    "tools": ["string"]
  },
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string",
      "credentialId": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "link": "string"
    }
  ],
  "awards": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string",
      "description": "string"
    }
  ],
  "publications": [
    {
      "title": "string",
      "publisher": "string",
      "date": "string",
      "link": "string"
    }
  ],
  "volunteer": [
    {
      "organization": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string"
    }
  ],
  "additionalSections": [
    {
      "title": "string",
      "content": "string"
    }
  ]
}

CRITICAL RULES:
1. Use ONLY these exact field names (case-sensitive) - do NOT modify or add fields
2. If a section is not present in the resume, omit that field entirely from the JSON
3. All field names must match exactly: "personalInfo", "summary", "experience", "education", "skills", "certifications", "projects", "awards", "publications", "volunteer", "additionalSections"
4. For nested objects, use exact field names: "name", "email", "phone", "title", "company", "startDate", "endDate", "current", "responsibilities", "degree", "institution", "graduationDate", "fieldOfStudy", "technical", "soft", "languages", "tools", etc.
5. Arrays must contain objects with the exact field names shown above
6. Boolean fields like "current" should be true/false, not strings
7. Do not include any markdown formatting, code blocks, or additional text - ONLY the JSON object`;

const RESUME_PARSING_USER_PROMPT = `Parse the following resume and return a JSON object that EXACTLY matches the structure provided in the system prompt. Use the exact field names specified. Omit any sections that are not present in the resume.

Resume text:
`;

/**
 * Validates and normalizes the parsed resume to ensure it matches the expected structure
 */
const validateAndNormalizeResume = (data: any): ParsedResume => {
    const normalized: ParsedResume = {};

    // Validate and normalize personalInfo
    if (data.personalInfo && typeof data.personalInfo === 'object') {
        normalized.personalInfo = {
            name: data.personalInfo.name || undefined,
            email: data.personalInfo.email || undefined,
            phone: data.personalInfo.phone || undefined,
            location: data.personalInfo.location || undefined,
            linkedin: data.personalInfo.linkedin || undefined,
            website: data.personalInfo.website || undefined,
            github: data.personalInfo.github || undefined,
        };
    }

    // Validate summary
    if (data.summary && typeof data.summary === 'string') {
        normalized.summary = data.summary;
    }

    // Validate experience array
    if (Array.isArray(data.experience)) {
        normalized.experience = data.experience.map((exp: any) => ({
            title: exp.title || undefined,
            company: exp.company || undefined,
            location: exp.location || undefined,
            startDate: exp.startDate || undefined,
            endDate: exp.endDate || undefined,
            current: typeof exp.current === 'boolean' ? exp.current : undefined,
            description: exp.description || undefined,
            responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : undefined,
        }));
    }

    // Validate education array
    if (Array.isArray(data.education)) {
        normalized.education = data.education.map((edu: any) => ({
            degree: edu.degree || undefined,
            institution: edu.institution || undefined,
            location: edu.location || undefined,
            graduationDate: edu.graduationDate || undefined,
            gpa: edu.gpa || undefined,
            fieldOfStudy: edu.fieldOfStudy || undefined,
        }));
    }

    // Validate skills object
    if (data.skills && typeof data.skills === 'object') {
        normalized.skills = {
            technical: Array.isArray(data.skills.technical) ? data.skills.technical : undefined,
            soft: Array.isArray(data.skills.soft) ? data.skills.soft : undefined,
            languages: Array.isArray(data.skills.languages) ? data.skills.languages : undefined,
            tools: Array.isArray(data.skills.tools) ? data.skills.tools : undefined,
        };
    }

    // Validate certifications array
    if (Array.isArray(data.certifications)) {
        normalized.certifications = data.certifications.map((cert: any) => ({
            name: cert.name || undefined,
            issuer: cert.issuer || undefined,
            date: cert.date || undefined,
            credentialId: cert.credentialId || undefined,
        }));
    }

    // Validate projects array
    if (Array.isArray(data.projects)) {
        normalized.projects = data.projects.map((proj: any) => ({
            name: proj.name || undefined,
            description: proj.description || undefined,
            technologies: Array.isArray(proj.technologies) ? proj.technologies : undefined,
            link: proj.link || undefined,
        }));
    }

    // Validate awards array
    if (Array.isArray(data.awards)) {
        normalized.awards = data.awards.map((award: any) => ({
            name: award.name || undefined,
            issuer: award.issuer || undefined,
            date: award.date || undefined,
            description: award.description || undefined,
        }));
    }

    // Validate publications array
    if (Array.isArray(data.publications)) {
        normalized.publications = data.publications.map((pub: any) => ({
            title: pub.title || undefined,
            publisher: pub.publisher || undefined,
            date: pub.date || undefined,
            link: pub.link || undefined,
        }));
    }

    // Validate volunteer array
    if (Array.isArray(data.volunteer)) {
        normalized.volunteer = data.volunteer.map((vol: any) => ({
            organization: vol.organization || undefined,
            role: vol.role || undefined,
            startDate: vol.startDate || undefined,
            endDate: vol.endDate || undefined,
            description: vol.description || undefined,
        }));
    }

    // Validate additionalSections array
    if (Array.isArray(data.additionalSections)) {
        normalized.additionalSections = data.additionalSections.map((section: any) => ({
            title: section.title || '',
            content: section.content || '',
        }));
    }

    return normalized;
};

export const parseResumeWithAI = async (resumeText: string): Promise<ParsedResume> => {
    try {
        // Return mock data if testing mode is enabled
        if (TESTING_MODE) {
            console.log('🧪 TESTING MODE: Returning mock parsed resume');
            // Simulate AI processing delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return mockParsedResume;
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { 
                    role: 'system', 
                    content: RESUME_PARSING_SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: `${RESUME_PARSING_USER_PROMPT}\n\n${resumeText}`
                }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content?.trim();
        
        if (!content) {
            throw new Error('No content received from OpenAI');
        }

        const rawData = JSON.parse(content);
        
        // Log raw response for debugging (optional)
        console.log('Raw AI Response Keys:', Object.keys(rawData));
        
        // Validate and normalize the response
        const parsedResume = validateAndNormalizeResume(rawData);
        
        return parsedResume;
    } catch (error) {
        console.error('Error parsing resume with AI:', error);
        throw new Error('Failed to parse resume with AI');
    }
};

export const extractTextFromFile = async (filePath: string, mimeType: string): Promise<string> => {
    const mammoth = require('mammoth');
    const fs = require('fs');

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ path: filePath });
        if (!result || !result.value) {
            throw new Error('Failed to extract text from DOCX file');
        }
        return result.value;
    } else if (mimeType === 'application/pdf') {
        // PDF support can be added here in the future
        throw new Error('PDF files are not yet supported. Please upload a DOCX file.');
    } else {
        throw new Error('Unsupported file type');
    }
};
