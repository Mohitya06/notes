export const personalInfo = {
  name: 'Mohitya Pratap Singh Parihar',
  shortName: 'Mohitya',
  title: 'Full Stack Developer',
  roles: [
    'Full Stack Developer',
    'React.js Engineer',
    'Node.js Developer',
    'NextJS Developer',
    'NestJS Developer',
    'GenAI Engineer',
  ],
  email: 'mohityapratapsingh@gmail.com',
  phone: '+91 9098169048',
  location: 'Delhi NCR, India',
  linkedin: 'https://linkedin.com/in/mohitya',
  github: 'https://github.com/Mohitya06',
  bio: "Full-Stack Developer with 4+ years of experience building scalable, production-grade applications using React.js, Next.js, Node.js, NestJS, and TypeScript. Specialized in integrating Generative AI solutions — OpenAI API, LangChain, RAG pipelines — into enterprise platforms. I build things that solve real problems, from AI-powered learning tools to complex multi-tenant systems.",
  availability: 'Open to Remote or Onsite Roles',
}

export const stats = [
  { value: '4+', label: 'Years of Experience' },
  { value: '50K+', label: 'Monthly Active Users' },
  { value: '1K+', label: 'AI Learners Served' },
  { value: '6+', label: 'Apps Delivered' },
]

export const skills = {
  Frontend: [
    'React.js', 'Next.js', 'TypeScript', 'JavaScript (ES6+)',
    'Redux', 'Tailwind CSS', 'Material UI',
  ],
  Backend: [
    'Node.js', 'NestJS', 'Express.js', 'REST APIs',
    'GraphQL', 'WebSockets', 'Microservices',
  ],
  'AI / GenAI': [
    'OpenAI API', 'LangChain', 'RAG Pipelines',
    'Conversational AI', 'SSE', 'Anam AI',
  ],
  Databases: [
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Query Optimization',
  ],
  'DevOps & Tools': [
    'Git', 'GitHub Actions', 'CI/CD', 'AWS', 'Docker', 'Vite',
  ],
  Integrations: [
    'Stripe', 'Mux', 'Zoom SDK', 'Google Maps API', 'OAuth 2.0',
  ],
}

export const experience = [
  {
    id: 1,
    role: 'Sr. Software Engineer II',
    company: 'NIIT MTS',
    duration: 'Jul 2025 – Present',
    location: 'Delhi NCR',
    current: true,
    highlights: [
      'Built an AI Interviewer platform using LangChain and OpenAI APIs with real-time SSE streaming for 1,000+ learners.',
      'Engineered an embeddable AI avatar module (Anam AI) adopted by 2+ partner teams via iframe — eliminating duplicate AI infrastructure.',
      'Led development of a Teaching Assistant platform with Zoom SDK, reducing manual instructor workload by ~25%.',
      'Architected scalable REST APIs, MongoDB schemas, and event-driven workflows for enterprise learning platforms.',
    ],
    tech: ['React.js', 'Next.js', 'NestJS', 'MongoDB', 'OpenAI API', 'LangChain', 'SSE', 'Zoom SDK'],
  },
  {
    id: 2,
    role: 'Full-Stack Developer',
    company: 'Freelance',
    duration: 'Jun 2024 – Jul 2025',
    location: 'Remote',
    current: false,
    highlights: [
      'Designed and delivered 6+ full-stack web applications end-to-end using React.js, Next.js, Node.js, NestJS, and TypeScript.',
      'Improved Core Web Vitals by 35% through SSR, lazy loading, code splitting, and image optimization.',
      'Integrated Stripe, Mux, Google Maps, and OAuth providers across multiple client projects.',
      'Built reusable component and utility libraries to accelerate development velocity across projects.',
    ],
    tech: ['Next.js', 'NestJS', 'TypeScript', 'Stripe', 'Mux', 'Google Maps API', 'OAuth'],
  },
  {
    id: 3,
    role: 'System Engineer',
    company: 'Infosys',
    duration: 'Feb 2022 – Jun 2024',
    location: 'Delhi NCR',
    current: false,
    highlights: [
      'Developed enterprise web apps using React.js, TypeScript, and NestJS serving 50,000+ monthly active users.',
      'Migrated legacy jQuery-based applications to React.js, reducing page load time by 30%.',
      'Raised WCAG accessibility compliance from 75% to 95%.',
      'Automated CI/CD pipelines with GitHub Actions, reducing deployment overhead by 40%.',
    ],
    tech: ['React.js', 'TypeScript', 'NestJS', 'Node.js', 'GitHub Actions', 'REST APIs'],
  },
  {
    id: 4,
    role: 'Associate Software Engineer',
    company: 'Digimonk Technologies',
    duration: 'Oct 2021 – Feb 2022',
    location: 'Indore, MP',
    current: false,
    highlights: [
      'Built responsive web applications using React.js, JavaScript, HTML5, and CSS3.',
      'Reduced API response time by 20% through query and asset optimization.',
      'Collaborated with backend teams to integrate APIs and deliver end-to-end business workflows.',
    ],
    tech: ['React.js', 'JavaScript', 'HTML5', 'CSS3', 'REST APIs'],
  },
]

export const projects = [
  {
    id: 1,
    title: 'Zoom Meeting + AI Chatbot',
    description:
      'Zoom SDK-powered in-app meeting module with pre-session password authentication and an in-session AI chatbot for real-time learner query resolution during live video sessions.',
    tech: ['React.js', 'Node.js', 'MongoDB', 'Zoom SDK'],
    type: 'Professional',
    status: 'Live',
    github: null,
    demo: null,
  },
  {
    id: 2,
    title: 'AI English Assessment Platform',
    description:
      'Multi-role LMS (Admin / Faculty / Learner) for email writing practice. Admin builds day-wise batch journeys, learners complete AI-graded tasks with streamed feedback, faculty and admin access individual and batch analytics. Includes custom prompt engineering for AI evaluation.',
    tech: ['React.js', 'Node.js', 'MongoDB', 'SSE', 'OpenAI', 'Prompt Engineering'],
    type: 'Professional',
    status: 'Live',
    github: null,
    demo: null,
  },
  {
    id: 3,
    title: 'Performance Analytics Dashboard',
    description:
      'Multi-tab admin dashboard for monitoring user performance metrics across product tools. Real-time data updates via SSE streaming with drill-down views for cross-tool analysis.',
    tech: ['React.js', 'Node.js', 'MongoDB', 'SSE'],
    type: 'Professional',
    status: 'Live',
    github: null,
    demo: null,
  },
  {
    id: 4,
    title: 'AI Avatar Practice App',
    description:
      'Scenario-based AI avatar practice platform using Anam AI. Users interact with a human-like avatar that asks questions and runs activities based on their profile. Daily skill progression is tracked and strengthened across sessions. Adopted by 2+ partner teams via iframe.',
    tech: ['React.js', 'Node.js', 'MongoDB', 'SSE', 'Anam AI'],
    type: 'Professional',
    status: 'Live',
    github: null,
    demo: null,
  },
  {
    id: 5,
    title: 'AI Portfolio Chatbot',
    description:
      'Interactive portfolio where visitors chat with an AI trained on resume and projects via RAG + streaming responses.',
    tech: ['Next.js', 'OpenAI', 'LangChain', 'RAG', 'Vercel AI SDK'],
    type: 'Personal',
    status: 'In Progress',
    github: '#',
    demo: null,
  },
  {
    id: 6,
    title: 'Webhook Gateway Service',
    description:
      'Event-driven backend that receives, validates, queues, and retries webhooks with exponential backoff and a log dashboard.',
    tech: ['NestJS', 'BullMQ', 'Redis', 'PostgreSQL', 'Next.js'],
    type: 'Personal',
    status: 'Planned',
    github: null,
    demo: null,
  },
  {
    id: 7,
    title: 'Real-Time Collaborative Notes',
    description:
      'Multi-user document editor with conflict resolution, nested workspaces, and role-based access control.',
    tech: ['Next.js', 'NestJS', 'WebSockets', 'MongoDB', 'Redis'],
    type: 'Personal',
    status: 'Planned',
    github: null,
    demo: null,
  },
]
