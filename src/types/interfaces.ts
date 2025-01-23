export interface job{
    id: number;
    name: string;
    description: string;
    company?: string;
    location?: string;
    datePosted?: string;
}

export interface site {
    name: string;
    link: string;
    jobsLink: string;
    location: string;
    jobs: job[];
}
