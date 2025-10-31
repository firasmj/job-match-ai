import { job, JobMatch } from '../types/interfaces';
import { ParsedResume } from '../types/resumeInterfaces';

/**
 * Mock job data for testing
 */
export const mockJobs: job[] = [
    {
        id: 1,
        name: 'Senior Full Stack Developer',
        link: 'https://example.com/job/1',
        description: 'We are seeking an experienced Full Stack Developer to join our growing team. You will be responsible for developing and maintaining web applications using modern technologies including React, Node.js, and TypeScript. Strong problem-solving skills and ability to work in an agile environment are essential.',
        company: 'Tech Innovations Inc.',
        location: 'Beirut, Lebanon',
        datePosted: '2025-10-28'
    },
    {
        id: 2,
        name: 'Frontend Developer - React',
        link: 'https://example.com/job/2',
        description: 'Join our dynamic team as a Frontend Developer specializing in React. You will create responsive, user-friendly interfaces and work closely with our design and backend teams. Experience with TypeScript, Redux, and modern CSS frameworks is required.',
        company: 'Digital Solutions Ltd.',
        location: 'Remote',
        datePosted: '2025-10-27'
    },
    {
        id: 3,
        name: 'Backend Node.js Engineer',
        link: 'https://example.com/job/3',
        description: 'Looking for a talented Backend Engineer with strong Node.js and Express experience. You will design and implement RESTful APIs, optimize database queries, and ensure high performance and scalability. Experience with MongoDB and PostgreSQL preferred.',
        company: 'StartupXYZ',
        location: 'Beirut, Lebanon',
        datePosted: '2025-10-26'
    },
    {
        id: 4,
        name: 'Software Engineer - JavaScript',
        link: 'https://example.com/job/4',
        description: 'Seeking a versatile Software Engineer with expertise in JavaScript/TypeScript. You will work on various projects involving both frontend and backend development. Strong understanding of software design patterns and clean code principles required.',
        company: 'Global Tech Corp',
        location: 'Hybrid - Beirut',
        datePosted: '2025-10-25'
    },
    {
        id: 5,
        name: 'DevOps Engineer',
        link: 'https://example.com/job/5',
        description: 'We need a DevOps Engineer to streamline our development and deployment processes. Experience with Docker, Kubernetes, CI/CD pipelines, and cloud platforms (AWS/Azure) is essential. You will work on automating infrastructure and improving system reliability.',
        company: 'CloudTech Solutions',
        location: 'Remote',
        datePosted: '2025-10-24'
    },
    {
        id: 6,
        name: 'Full Stack Developer - MERN Stack',
        link: 'https://example.com/job/6',
        description: 'Join our team as a Full Stack Developer working with the MERN stack (MongoDB, Express, React, Node.js). You will build and maintain web applications from scratch, implement new features, and optimize performance. 3+ years experience required.',
        company: 'WebDev Agency',
        location: 'Beirut, Lebanon',
        datePosted: '2025-10-23'
    },
    {
        id: 7,
        name: 'Software Developer - TypeScript',
        link: 'https://example.com/job/7',
        description: 'Looking for a Software Developer with strong TypeScript skills to work on enterprise applications. You will develop scalable solutions, write clean code, and collaborate with cross-functional teams. Experience with modern frameworks and testing is a plus.',
        company: 'Enterprise Systems Inc.',
        location: 'Remote',
        datePosted: '2025-10-22'
    },
    {
        id: 8,
        name: 'Junior Web Developer',
        link: 'https://example.com/job/8',
        description: 'Great opportunity for a Junior Web Developer to grow their career. You will work with HTML, CSS, JavaScript, and modern frameworks under the guidance of senior developers. Fresh graduates with a passion for web development are encouraged to apply.',
        company: 'TechStart Lebanon',
        location: 'Beirut, Lebanon',
        datePosted: '2025-10-21'
    }
];

/**
 * Mock parsed resume data for testing
 */
export const mockParsedResume: ParsedResume = {
    personalInfo: {
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+961-123-4567',
        location: 'Beirut, Lebanon',
        linkedin: 'linkedin.com/in/johndoe',
        github: 'github.com/johndoe',
        website: 'johndoe.dev'
    },
    summary: 'Experienced Full Stack Developer with 5+ years of expertise in building scalable web applications. Proficient in JavaScript, TypeScript, React, Node.js, and cloud technologies. Passionate about writing clean code and solving complex problems.',
    experience: [
        {
            title: 'Senior Software Engineer',
            company: 'Tech Innovations Inc.',
            location: 'Beirut, Lebanon',
            startDate: 'January 2020',
            endDate: 'Present',
            current: true,
            description: 'Leading development of microservices architecture serving 1M+ users',
            responsibilities: [
                'Led development of microservices architecture serving 1M+ users',
                'Mentored team of 5 junior developers',
                'Implemented CI/CD pipelines reducing deployment time by 60%',
                'Architected scalable solutions using React, Node.js, and AWS'
            ]
        },
        {
            title: 'Software Engineer',
            company: 'StartupXYZ',
            location: 'Beirut, Lebanon',
            startDate: 'June 2018',
            endDate: 'December 2019',
            current: false,
            description: 'Full-stack development using modern web technologies',
            responsibilities: [
                'Developed RESTful APIs using Node.js and Express',
                'Built responsive frontend using React and Redux',
                'Optimized database queries improving performance by 40%',
                'Collaborated with cross-functional teams in agile environment'
            ]
        }
    ],
    education: [
        {
            degree: 'Bachelor of Science in Computer Science',
            institution: 'American University of Beirut',
            location: 'Beirut, Lebanon',
            graduationDate: 'May 2018',
            gpa: '3.8',
            fieldOfStudy: 'Computer Science'
        }
    ],
    skills: {
        technical: [
            'JavaScript',
            'TypeScript',
            'Python',
            'React',
            'Node.js',
            'Express',
            'MongoDB',
            'PostgreSQL',
            'Redis'
        ],
        soft: [
            'Leadership',
            'Communication',
            'Problem Solving',
            'Team Collaboration',
            'Agile/Scrum'
        ],
        languages: [
            'English (Fluent)',
            'Arabic (Native)',
            'French (Intermediate)'
        ],
        tools: [
            'Git',
            'Docker',
            'Kubernetes',
            'AWS',
            'Jenkins',
            'GitHub Actions',
            'VS Code'
        ]
    },
    certifications: [
        {
            name: 'AWS Certified Solutions Architect - Associate',
            issuer: 'Amazon Web Services',
            date: '2021',
            credentialId: 'AWS-ASA-123456'
        },
        {
            name: 'Professional Scrum Master I',
            issuer: 'Scrum.org',
            date: '2020',
            credentialId: 'PSM1-789012'
        }
    ],
    projects: [
        {
            name: 'E-commerce Platform',
            description: 'Built a full-stack e-commerce solution handling 10K+ daily transactions with payment integration and real-time inventory management',
            technologies: ['React', 'Node.js', 'MongoDB', 'Stripe API', 'AWS', 'Redis'],
            link: 'github.com/johndoe/ecommerce-platform'
        },
        {
            name: 'Task Management App',
            description: 'Developed a real-time task management application with team collaboration features and notifications',
            technologies: ['React', 'Firebase', 'Material-UI', 'WebSockets'],
            link: 'github.com/johndoe/task-manager'
        }
    ],
    awards: [
        {
            name: 'Best Innovation Award',
            issuer: 'Tech Innovations Inc.',
            date: '2022',
            description: 'Recognized for developing innovative microservices architecture'
        }
    ]
};

/**
 * Mock resume text for testing
 */
export const mockResumeText = `
John Doe
Email: john.doe@email.com
Phone: +961-123-4567
Location: Beirut, Lebanon
LinkedIn: linkedin.com/in/johndoe
GitHub: github.com/johndoe

PROFESSIONAL SUMMARY
Experienced Full Stack Developer with 5+ years of expertise in building scalable web applications.
Proficient in JavaScript, TypeScript, React, Node.js, and cloud technologies.

WORK EXPERIENCE

Senior Software Engineer
Tech Innovations Inc., Beirut, Lebanon
January 2020 - Present
- Led development of microservices architecture serving 1M+ users
- Mentored team of 5 junior developers
- Implemented CI/CD pipelines reducing deployment time by 60%
- Technologies: React, Node.js, TypeScript, AWS, Docker, Kubernetes

Software Engineer
StartupXYZ, Beirut, Lebanon
June 2018 - December 2019
- Developed RESTful APIs using Node.js and Express
- Built responsive frontend using React and Redux
- Optimized database queries improving performance by 40%

EDUCATION

Bachelor of Science in Computer Science
American University of Beirut
Graduated: May 2018
GPA: 3.8/4.0

SKILLS

Technical Skills: JavaScript, TypeScript, Python, React, Node.js, Express, MongoDB, PostgreSQL, Redis
Tools: Git, Docker, Kubernetes, AWS, Jenkins, GitHub Actions
Soft Skills: Leadership, Communication, Problem Solving, Team Collaboration
Languages: English (Fluent), Arabic (Native), French (Intermediate)

CERTIFICATIONS

AWS Certified Solutions Architect - Associate
Amazon Web Services, 2021

PROJECTS

E-commerce Platform
- Built a full-stack e-commerce solution handling 10K+ daily transactions
- Technologies: React, Node.js, MongoDB, Stripe API, AWS
- Link: github.com/johndoe/ecommerce-platform
`;

export const mockJobMatches: JobMatch[] = [
  {
    job: mockJobs[0], // Senior Full Stack Developer
    matchScore: 92,
    matchPercentage: 92,
    rank: 1,
    strengths: [
      "5 years of full-stack development experience perfectly aligns with senior role requirements",
      "Strong TypeScript and React expertise matches primary tech stack",
      "Node.js and Express experience directly applicable to backend requirements",
      "AWS certification and cloud experience valuable for infrastructure work",
      "Leadership experience demonstrates ability to mentor team members"
    ],
    weaknesses: [
      "Limited GraphQL experience compared to job requirements",
      "No mention of microservices architecture experience"
    ],
    missingRequirements: [
      "GraphQL expertise",
      "Microservices architecture background"
    ],
    recommendations: [
      "Highlight your scalable system design work from the e-commerce platform project",
      "Complete a GraphQL course to address the knowledge gap",
      "Emphasize your AWS experience and how it relates to building distributed systems"
    ]
  },
  {
    job: mockJobs[3], // Backend Developer (Node.js)
    matchScore: 88,
    matchPercentage: 88,
    rank: 2,
    strengths: [
      "Extensive Node.js and Express experience is a perfect match",
      "PostgreSQL and MongoDB expertise covers both SQL and NoSQL requirements",
      "RESTful API development experience aligns with core responsibilities",
      "Docker and Kubernetes knowledge valuable for containerized deployments",
      "Strong problem-solving skills mentioned in profile"
    ],
    weaknesses: [
      "Role focuses primarily on backend, but candidate has significant frontend experience",
      "May be overqualified for mid-level position"
    ],
    missingRequirements: [
      "Nest.js framework experience"
    ],
    recommendations: [
      "Emphasize backend projects and minimize frontend focus in application",
      "Learn Nest.js basics as it builds on Express knowledge",
      "Highlight performance optimization achievements from previous roles"
    ]
  },
  {
    job: mockJobs[1], // Frontend React Developer
    matchScore: 85,
    matchPercentage: 85,
    rank: 3,
    strengths: [
      "Strong React expertise with modern hooks and state management",
      "TypeScript proficiency matches job requirements",
      "Experience with responsive design and modern UI development",
      "Redux knowledge applicable to state management needs"
    ],
    weaknesses: [
      "Backend skills won't be utilized in this frontend-focused role",
      "Position may not leverage full-stack capabilities",
      "Limited focus on UI/UX design mentioned in resume"
    ],
    missingRequirements: [
      "Next.js framework experience",
      "Design system creation experience"
    ],
    recommendations: [
      "Build a portfolio project using Next.js to demonstrate capability",
      "Emphasize any UI component library work from previous projects",
      "Consider if role fully utilizes your backend expertise"
    ]
  },
  {
    job: mockJobs[5], // DevOps Engineer
    matchScore: 72,
    matchPercentage: 72,
    rank: 4,
    strengths: [
      "Docker and Kubernetes experience demonstrates containerization knowledge",
      "AWS certification shows cloud platform expertise",
      "Jenkins and GitHub Actions experience covers CI/CD requirements",
      "Git proficiency essential for version control workflows"
    ],
    weaknesses: [
      "Primary background is software development, not DevOps operations",
      "Limited infrastructure-as-code experience mentioned",
      "No monitoring/observability tools experience highlighted"
    ],
    missingRequirements: [
      "Terraform or CloudFormation experience",
      "Prometheus/Grafana monitoring expertise",
      "Linux system administration background"
    ],
    recommendations: [
      "Complete Terraform certification to strengthen IaC credentials",
      "Set up monitoring for personal projects using Prometheus and Grafana",
      "Emphasize any production deployment and scaling experience",
      "Consider if DevOps is the desired career direction"
    ]
  },
  {
    job: mockJobs[2], // Mobile App Developer
    matchScore: 58,
    matchPercentage: 58,
    rank: 5,
    strengths: [
      "JavaScript/TypeScript knowledge transferable to React Native",
      "React experience provides foundation for React Native development",
      "API integration experience relevant for mobile backend connectivity",
      "Problem-solving and communication skills valuable for any development role"
    ],
    weaknesses: [
      "No mobile development experience mentioned in resume",
      "No React Native, iOS, or Android development background",
      "Missing mobile-specific design patterns knowledge",
      "No app store deployment experience"
    ],
    missingRequirements: [
      "React Native framework experience",
      "Mobile UI/UX design knowledge",
      "iOS and Android platform expertise",
      "App store deployment experience"
    ],
    recommendations: [
      "Build and deploy a personal mobile app project using React Native",
      "Complete React Native certification course",
      "This role requires significant reskilling - consider if mobile development is desired career path",
      "Focus on web development roles that better match current expertise"
    ]
  },
  {
    job: mockJobs[4], // Data Scientist
    matchScore: 45,
    matchPercentage: 45,
    rank: 6,
    strengths: [
      "Python programming experience provides foundation for data science tools",
      "Strong problem-solving skills applicable to data analysis",
      "Experience working with large datasets in e-commerce platform",
      "Technical background helpful for understanding ML concepts"
    ],
    weaknesses: [
      "No machine learning or data science experience",
      "Missing statistical analysis and modeling background",
      "No experience with data science frameworks (TensorFlow, PyTorch, scikit-learn)",
      "Limited Python usage compared to JavaScript/TypeScript focus"
    ],
    missingRequirements: [
      "Machine learning and deep learning expertise",
      "Statistical analysis and modeling skills",
      "Data science frameworks (TensorFlow, PyTorch, pandas)",
      "Data visualization tools experience",
      "Mathematics and statistics background"
    ],
    recommendations: [
      "This role requires extensive reskilling in a different domain",
      "Consider data engineering roles that leverage existing backend skills",
      "If interested in data science, pursue formal education or bootcamp",
      "Focus on software engineering positions that better align with experience"
    ]
  },
  {
    job: mockJobs[6], // UI/UX Designer
    matchScore: 38,
    matchPercentage: 38,
    rank: 7,
    strengths: [
      "Understanding of web development helps collaboration with designers",
      "Experience implementing UIs provides insight into design feasibility",
      "Communication skills valuable for stakeholder interactions"
    ],
    weaknesses: [
      "No design background or portfolio",
      "Missing design tool expertise (Figma, Sketch, Adobe XD)",
      "No user research or usability testing experience",
      "Primary expertise is in development, not design",
      "No visual design or typography background"
    ],
    missingRequirements: [
      "Design portfolio with UI/UX case studies",
      "Proficiency in design tools (Figma, Sketch, Adobe XD)",
      "User research and usability testing experience",
      "Visual design and typography skills",
      "Design systems creation experience"
    ],
    recommendations: [
      "This role requires a completely different skill set",
      "Not recommended unless pursuing career change to design",
      "Consider product management roles that bridge technical and design skills",
      "Focus on development positions that match technical background"
    ]
  },
  {
    job: mockJobs[7], // Marketing Manager
    matchScore: 25,
    matchPercentage: 25,
    rank: 8,
    strengths: [
      "Technical background useful for marketing tech products",
      "Communication and team collaboration skills transferable",
      "E-commerce platform experience provides product knowledge"
    ],
    weaknesses: [
      "No marketing experience or background",
      "Missing digital marketing and campaign management skills",
      "No SEO, content marketing, or social media expertise",
      "Background is entirely technical, not business/marketing focused",
      "No budget management or marketing analytics experience"
    ],
    missingRequirements: [
      "Digital marketing expertise (SEO, PPC, social media)",
      "Marketing campaign planning and execution",
      "Marketing analytics and reporting",
      "Content strategy and creation",
      "Budget management experience",
      "Brand management background"
    ],
    recommendations: [
      "This role is not aligned with technical software engineering background",
      "Not recommended unless making complete career pivot",
      "Consider technical product marketing roles if interested in marketing",
      "Focus on software engineering, DevOps, or technical leadership positions"
    ]
  }
];
