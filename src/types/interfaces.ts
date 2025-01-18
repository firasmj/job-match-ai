export interface job{
    name: string;
    description: string;
    company?: string;
    location?: string;
    datePosted?: string;
}

export interface site {
    name: string;
    link: string;
    location: string;
    jobs: job[];
}
