export const posts = [
  {
    id: "1",
    community: "TechEnthusiasts",
    author: "alex_j",
    timeAgo: "2h ago",
    title: "The future of local-first software and collaborative CRDTs",
    excerpt: "We've been exploring how to build apps that work seamlessly offline while maintaining high-performance real-time sync. The core challenge remains conflict...",
    votes: 1200,
    comments: 84,
  },
  {
    id: "2",
    community: "DesignSystems",
    author: "sarah_design",
    timeAgo: "5h ago",
    title: "New Tailwind UI patterns for high-density dashboards",
    excerpt: "After months of iterating on our internal tools, we've distilled our learnings into a set of reusable patterns for building dense, data-rich interfaces.",
    votes: 856,
    comments: 42,
  },
  {
    id: "3",
    community: "CyberSecurity",
    author: "sec_researcher",
    timeAgo: "8h ago",
    title: "Zero-day vulnerability discovered in popular npm package",
    excerpt: "A critical vulnerability has been found affecting over 2 million downloads. Here's what you need to know and how to protect your projects.",
    votes: 2340,
    comments: 156,
  },
  {
    id: "4",
    community: "WebPerformance",
    author: "perf_ninja",
    timeAgo: "12h ago",
    title: "How we reduced our LCP from 4.2s to 0.8s with streaming SSR",
    votes: 678,
    comments: 31,
  },
  {
    id: "5",
    community: "HardwareHacking",
    author: "maker_dave",
    timeAgo: "1d ago",
    title: "Building a custom mechanical keyboard from scratch with RP2040",
    excerpt: "Complete guide from PCB design to firmware. Includes KiCad files and QMK config.",
    votes: 445,
    comments: 67,
  },
];

export const comments = [
  {
    id: "c1",
    author: "Sarah Jenkins",
    timeAgo: "2h ago",
    content: "Great insights! I particularly agree with the point about intentional motion. Too many animations feel distracting rather than helpful lately.",
    likes: 12,
    replies: [
      {
        id: "c1-1",
        author: "Marcus Thorne",
        timeAgo: "1h ago",
        content: "Exactly. Linear ease-in-out is the new standard for a reason.",
        likes: 5,
        replies: [],
      },
    ],
  },
  {
    id: "c2",
    author: "David Chen",
    timeAgo: "3h ago",
    content: "The section on depth and layering resonates with what we've been doing at our company. Glassmorphism when done right adds so much perceived quality.",
    likes: 8,
    replies: [],
  },
  {
    id: "c3",
    author: "Emily Rodriguez",
    timeAgo: "4h ago",
    content: "Would love to see more concrete examples of the layering techniques mentioned. Any chance of a follow-up post with code samples?",
    likes: 15,
    replies: [
      {
        id: "c3-1",
        author: "Alex Rivera",
        timeAgo: "3h ago",
        content: "Absolutely! Working on a Part 2 with interactive demos. Stay tuned.",
        likes: 22,
        replies: [],
      },
    ],
  },
];

export const clusterData = {
  name: "Tech Cluster",
  description: "The premier hub for developers, architects, and visionaries to share breakthroughs in software engineering and cloud infrastructure.",
  members: "52.4k",
  active: "1.2k",
  joined: "Oct 2021",
  stats: {
    engineers: "52.4k",
    dailyPosts: "8.2k",
    engagementRate: "64%",
    verifiedExperts: 428,
  },
  rules: [
    { title: "Stay Technical", desc: "Focus on engineering, code, and system design. No off-topic politics or memes." },
    { title: "Cite Your Sources", desc: "Provide benchmarks or documentation links for claims about performance." },
    { title: "Constructive Feedback Only", desc: "Criticize code or architecture, not the person who wrote it." },
  ],
  moderators: [
    { name: "admin_prime", role: "FOUNDER" },
    { name: "cloud_wizard", role: "MOD" },
    { name: "rust_ace", role: "MOD" },
  ],
};

export const profileData = {
  name: "Alex Rivers",
  bio: "Cloud Architect & Open Source Contributor. Building scalable distributed systems and organizing local tech clusters.",
  joined: "January 2022",
  location: "San Francisco, CA",
  website: "alexrivers.dev",
  karma: 12450,
  accountAge: "2.4 Years",
  totalClusters: 18,
  activeWindows: 142,
};

export const moderationData = [
  { id: "m1", title: '"Summer Vibes" Window', user: "@alex_june", reason: "INAPPROPRIATE CONTENT", reporter: "@moderator_bot", time: "2m ago", reasonColor: "bg-destructive" },
  { id: "m2", title: '"This app is terrible..."', user: "@troll_king", reason: "SPAM/HARASSMENT", reporter: "@user_reports", time: "14m ago", reasonColor: "bg-destructive" },
  { id: "m3", title: "Project Workspace", user: "@design_lead", reason: "COPYRIGHT CLAIM", reporter: "@legal_dept", time: "45m ago", reasonColor: "bg-blue-500" },
  { id: "m4", title: '"Buy cheap crypto now!"', user: "@bot_4492", reason: "SPAM", reporter: "@moderator_bot", time: "1h ago", reasonColor: "bg-accent" },
];
