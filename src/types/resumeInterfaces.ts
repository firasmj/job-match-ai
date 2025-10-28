export interface ResumeSection {
    type: string;
    content: any;
}

export interface ParsedResume {
    personalInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        location?: string;
        linkedin?: string;
        website?: string;
        github?: string;
    };
    summary?: string;
    experience?: Array<{
        title?: string;
        company?: string;
        location?: string;
        startDate?: string;
        endDate?: string;
        current?: boolean;
        description?: string;
        responsibilities?: string[];
    }>;
    education?: Array<{
        degree?: string;
        institution?: string;
        location?: string;
        graduationDate?: string;
        gpa?: string;
        fieldOfStudy?: string;
    }>;
    skills?: {
        technical?: string[];
        soft?: string[];
        languages?: string[];
        tools?: string[];
    };
    certifications?: Array<{
        name?: string;
        issuer?: string;
        date?: string;
        credentialId?: string;
    }>;
    projects?: Array<{
        name?: string;
        description?: string;
        technologies?: string[];
        link?: string;
    }>;
    awards?: Array<{
        name?: string;
        issuer?: string;
        date?: string;
        description?: string;
    }>;
    publications?: Array<{
        title?: string;
        publisher?: string;
        date?: string;
        link?: string;
    }>;
    volunteer?: Array<{
        organization?: string;
        role?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
    }>;
    additionalSections?: Array<{
        title: string;
        content: string;
    }>;
}
