# Job Match AI
Node.js app leveraging AI to analyze resumes and match job listings using the Cheerio library for web scraping.

Features:
- Resume Analysis: Uses AI to analyze the content of resumes and extract key information.
- Job Scraping: Utilizes the Cheerio library to scrape job listings from multiple websites.
- Job Matching: Matches job listings to the analyzed resume to find suitable opportunities.
Installation:
 1. Clone the repository: ```bash git clone https://github.com/firasmj/job-match-ai.git ```
 2. Navigate to the project directory: ```bash cd job-match-ai ```
 3. Install dependencies: ```bash npm install ```
Usage:
 1. Start the server: ```bash node server.js ```
 2. Use the provided API endpoints to upload resumes and retrieve suitable job listings.
API Endpoints:
 - **POST /upload**: Upload a resume file for analysis.
Example Request ```curl curl -X POST -F "file=@/path/to/your/resume.pdf" http://localhost:3000/upload
