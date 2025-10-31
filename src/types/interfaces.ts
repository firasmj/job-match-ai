export interface job{
    id: number;
    name: string;
    link: string;
    description: string;
    company?: string;
    location?: string;
    datePosted?: string;
}

export interface JobMatch {
    job: job;
    matchScore: number;
    matchPercentage: number;
    rank: number;
    strengths: string[];
    weaknesses: string[];
    missingRequirements: string[];
    recommendations: string[];
}

export interface site {
    name: string;
    link: string;
    jobsLink: string;
    location: string;
    jobs: job[];
}
