/**
 * Test file for Resume Parser API endpoints
 * 
 * To run these tests:
 * 1. Make sure your server is running
 * 2. Update the SERVER_URL if needed
 * 3. Update the file path to point to a real resume file
 * 4. Run: ts-node src/test/resumeParserTest.ts (or use your preferred method)
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const SERVER_URL = 'http://localhost:3000/api';

// Define response types
interface ResumeParseResponse {
    success: boolean;
    data: any;
    metadata?: {
        fileName?: string;
        fileSize?: number;
        mimeType?: string;
        processedAt?: string;
    };
}

interface ErrorResponse {
    error: string;
    message?: string;
}

/**
 * Test 1: Parse Resume from File Upload
 */
async function testParseResumeFile() {
    console.log('\n=== Test 1: Parse Resume from File ===\n');
    
    try {
        // Update this path to point to your actual resume file
        const resumePath = path.join(__dirname, '../../test-resume.docx');
        
        if (!fs.existsSync(resumePath)) {
            console.error('❌ Test file not found at:', resumePath);
            console.log('Please create a test resume file or update the path');
            return;
        }

        const formData = new FormData();
        formData.append('resume', fs.createReadStream(resumePath));

        const response = await axios.post<ResumeParseResponse>(`${SERVER_URL}/resume/parse`, formData, {
            headers: formData.getHeaders(),
        });

        console.log('✅ Status:', response.status);
        console.log('✅ Success:', response.data.success);
        console.log('\n📄 Parsed Resume Data:');
        console.log(JSON.stringify(response.data.data, null, 2));
        console.log('\n📊 Metadata:');
        console.log(JSON.stringify(response.data.metadata, null, 2));
        
    } catch (error: any) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

/**
 * Test 2: Parse Resume from Text
 */
async function testParseResumeText() {
    console.log('\n=== Test 2: Parse Resume from Text ===\n');
    
    const sampleResumeText = `
    John Doe
    Email: john.doe@email.com
    Phone: +1-234-567-8900
    Location: San Francisco, CA
    LinkedIn: linkedin.com/in/johndoe
    GitHub: github.com/johndoe
    
    PROFESSIONAL SUMMARY
    Experienced Full Stack Developer with 5+ years of experience in building scalable web applications.
    Proficient in JavaScript, TypeScript, React, Node.js, and cloud technologies.
    
    WORK EXPERIENCE
    
    Senior Software Engineer
    TechCorp Inc., San Francisco, CA
    January 2020 - Present
    - Led development of microservices architecture serving 1M+ users
    - Mentored team of 5 junior developers
    - Implemented CI/CD pipelines reducing deployment time by 60%
    - Technologies: React, Node.js, TypeScript, AWS, Docker, Kubernetes
    
    Software Engineer
    StartupXYZ, San Francisco, CA
    June 2018 - December 2019
    - Developed RESTful APIs using Node.js and Express
    - Built responsive frontend using React and Redux
    - Optimized database queries improving performance by 40%
    
    EDUCATION
    
    Bachelor of Science in Computer Science
    University of California, Berkeley
    Graduated: May 2018
    GPA: 3.8/4.0
    
    SKILLS
    
    Technical Skills: JavaScript, TypeScript, Python, React, Node.js, Express, MongoDB, PostgreSQL, Redis
    Tools: Git, Docker, Kubernetes, AWS, Jenkins, GitHub Actions
    Soft Skills: Leadership, Communication, Problem Solving, Team Collaboration
    Languages: English (Native), Spanish (Intermediate)
    
    CERTIFICATIONS
    
    AWS Certified Solutions Architect - Associate
    Amazon Web Services, 2021
    
    PROJECTS
    
    E-commerce Platform
    - Built a full-stack e-commerce solution handling 10K+ daily transactions
    - Technologies: React, Node.js, MongoDB, Stripe API, AWS
    - Link: github.com/johndoe/ecommerce-platform
    
    Task Management App
    - Developed a real-time task management application with team collaboration features
    - Technologies: React, Firebase, Material-UI
    `;
    
    try {
        const response = await axios.post<ResumeParseResponse>(`${SERVER_URL}/resume/parse-text`, {
            resumeText: sampleResumeText
        });

        console.log('✅ Status:', response.status);
        console.log('✅ Success:', response.data.success);
        console.log('\n📄 Parsed Resume Data:');
        console.log(JSON.stringify(response.data.data, null, 2));
        
    } catch (error: any) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

/**
 * Test 3: Error handling - No file uploaded
 */
async function testErrorNoFile() {
    console.log('\n=== Test 3: Error Handling - No File ===\n');
    
    try {
        const formData = new FormData();
        const response = await axios.post<ErrorResponse>(`${SERVER_URL}/resume/parse`, formData, {
            headers: formData.getHeaders(),
        });
        console.log('Response:', response.data);
    } catch (error: any) {
        console.log('✅ Expected error caught:');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data);
    }
}

/**
 * Test 4: Error handling - Empty text
 */
async function testErrorEmptyText() {
    console.log('\n=== Test 4: Error Handling - Empty Text ===\n');
    
    try {
        const response = await axios.post<ErrorResponse>(`${SERVER_URL}/resume/parse-text`, {
            resumeText: ''
        });
        console.log('Response:', response.data);
    } catch (error: any) {
        console.log('✅ Expected error caught:');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data);
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('\n🚀 Starting Resume Parser API Tests...\n');
    console.log('Server URL:', SERVER_URL);
    console.log('Make sure your server is running!\n');
    
    await testParseResumeFile();
    await testParseResumeText();
    await testErrorNoFile();
    await testErrorEmptyText();
    
    console.log('\n✅ All tests completed!\n');
}

// Run the tests
runAllTests();
