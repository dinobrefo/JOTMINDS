// JHS Thinking Styles Assessment Data (Ages 11-14)

export interface JHSQuestion {
  id: number;
  section: 'creative' | 'analytical' | 'practical' | 'reflective';
  text: string;
}

export const JHS_QUESTIONS: JHSQuestion[] = [
  // 🎨 CREATIVE THINKING (1-6)
  {
    id: 1,
    section: 'creative',
    text: 'I like to think of new ways to do things — even if it\'s not the normal way.'
  },
  {
    id: 2,
    section: 'creative',
    text: 'I often have ideas that surprise people.'
  },
  {
    id: 3,
    section: 'creative',
    text: 'I enjoy drawing, building, writing, or designing something original.'
  },
  {
    id: 4,
    section: 'creative',
    text: 'I can turn a small idea into a bigger one.'
  },
  {
    id: 5,
    section: 'creative',
    text: 'When I see a problem, I like to ask, "What if we tried this instead?"'
  },
  {
    id: 6,
    section: 'creative',
    text: 'I love to mix imagination with real-life stuff — like creating, inventing, or dreaming.'
  },

  // 🔍 ANALYTICAL THINKING (7-12)
  {
    id: 7,
    section: 'analytical',
    text: 'I enjoy puzzles, riddles, or brain games that make me think deeply.'
  },
  {
    id: 8,
    section: 'analytical',
    text: 'I like to find out why or how something works.'
  },
  {
    id: 9,
    section: 'analytical',
    text: 'I notice small details that others often miss.'
  },
  {
    id: 10,
    section: 'analytical',
    text: 'I like when facts and reasons help me understand something clearly.'
  },
  {
    id: 11,
    section: 'analytical',
    text: 'Before I decide, I like to look at all sides of a situation.'
  },
  {
    id: 12,
    section: 'analytical',
    text: 'I get excited when I find the right answer after thinking hard.'
  },

  // 🛠️ PRACTICAL THINKING (13-18)
  {
    id: 13,
    section: 'practical',
    text: 'I like using what I\'ve learned to fix or improve things.'
  },
  {
    id: 14,
    section: 'practical',
    text: 'I enjoy helping others solve real-life problems.'
  },
  {
    id: 15,
    section: 'practical',
    text: 'I remember lessons better when I can try them in real life.'
  },
  {
    id: 16,
    section: 'practical',
    text: 'I can find a simple way to solve tricky problems.'
  },
  {
    id: 17,
    section: 'practical',
    text: 'I prefer doing things that have visible results (like building, organizing, or planning).'
  },
  {
    id: 18,
    section: 'practical',
    text: 'I like seeing how my ideas work outside the classroom.'
  },

  // 💭 REFLECTIVE THINKING (19-24)
  {
    id: 19,
    section: 'reflective',
    text: 'After I finish something, I like to think about what went well and what didn\'t.'
  },
  {
    id: 20,
    section: 'reflective',
    text: 'I try to understand other people\'s ideas or feelings, even when I don\'t agree.'
  },
  {
    id: 21,
    section: 'reflective',
    text: 'When I make a mistake, I learn from it and try again.'
  },
  {
    id: 22,
    section: 'reflective',
    text: 'I sometimes stop and ask myself, "Why did I choose that?"'
  },
  {
    id: 23,
    section: 'reflective',
    text: 'I notice how my feelings affect my choices.'
  },
  {
    id: 24,
    section: 'reflective',
    text: 'I like talking about what I learned from a situation or activity.'
  }
];

export interface ThinkingStyle {
  name: string;
  emoji: string;
  friendlyName: string;
  description: string;
  color: string;
}

export const THINKING_STYLES: Record<string, ThinkingStyle> = {
  creative: {
    name: 'Creative',
    emoji: '🎨',
    friendlyName: 'The Idea Explorer',
    description: 'Loves imagination, innovation, and bold new thoughts.',
    color: '#FF715B'
  },
  analytical: {
    name: 'Analytical',
    emoji: '🔍',
    friendlyName: 'The Smart Detective',
    description: 'Solves problems with logic, patterns, and facts.',
    color: '#1FC8E1'
  },
  practical: {
    name: 'Practical',
    emoji: '🛠️',
    friendlyName: 'The Real-World Builder',
    description: 'Turns ideas into real results; loves to make things work.',
    color: '#2C2E83'
  },
  reflective: {
    name: 'Reflective',
    emoji: '💭',
    friendlyName: 'The Wise Observer',
    description: 'Thinks deeply, learns from experiences, and understands others.',
    color: '#9B59B6'
  }
};

export interface SHSProgram {
  rank: number;
  icon: string;
  name: string;
  matchingStyles: string[];
  whyItFits: string;
  futureCareersDid you know: string;
  miniChallenge?: string;
}

export const SHS_PROGRAMS: Record<string, SHSProgram[]> = {
  // Creative dominant
  creative: [
    {
      rank: 1,
      icon: '🎨',
      name: 'Visual Arts',
      matchingStyles: ['creative', 'reflective'],
      whyItFits: 'You express your ideas through color, shapes, and emotions — Visual Arts helps you share how you see the world!',
      futureCareers: 'Graphic designer, writer, fashion designer, media producer, architect',
      didYouKnow: 'Artists use both sides of their brain — the creative AND the logical side!'
    },
    {
      rank: 2,
      icon: '🏠',
      name: 'Home Economics (Creative Design)',
      matchingStyles: ['creative', 'practical'],
      whyItFits: 'You love creating beautiful, useful things — Home Economics lets you design fashion, décor, and culinary masterpieces!',
      futureCareers: 'Fashion designer, interior decorator, chef, event planner',
      didYouKnow: 'Fashion designers sketch over 100 designs before choosing the perfect one!'
    },
    {
      rank: 3,
      icon: '💬',
      name: 'General Arts (Communication)',
      matchingStyles: ['creative', 'reflective'],
      whyItFits: 'You\'re thoughtful and expressive — Arts help you explore people, culture, and stories that inspire change!',
      futureCareers: 'Writer, journalist, teacher, public speaker, content creator',
      didYouKnow: 'Great communicators can change the world with just their words!'
    }
  ],

  // Analytical dominant
  analytical: [
    {
      rank: 1,
      icon: '⚗️',
      name: 'General Science',
      matchingStyles: ['analytical', 'practical'],
      whyItFits: 'You enjoy asking "why" and love figuring out how things work — Science helps you explore the world through discovery and problem-solving!',
      futureCareers: 'Engineer, researcher, accountant, computer programmer, scientist',
      didYouKnow: 'Scientists make discoveries that change millions of lives!',
      miniChallenge: 'Predict which will melt faster—ice cube in salt vs. sugar. Test + explain.'
    },
    {
      rank: 2,
      icon: '💻',
      name: 'ICT / Computer Science',
      matchingStyles: ['analytical', 'creative'],
      whyItFits: 'You like patterns and design — ICT lets you use logic and imagination to create apps, games, and new technology!',
      futureCareers: 'Software developer, game designer, data analyst, cybersecurity specialist',
      didYouKnow: 'Every app you use was created by someone who loves solving puzzles!',
      miniChallenge: 'Write "pseudocode" for making tea (step-by-step).'
    },
    {
      rank: 3,
      icon: '💼',
      name: 'Business',
      matchingStyles: ['analytical', 'practical'],
      whyItFits: 'You love structure, logic, and seeing results — Business teaches you how to manage money, people, and ideas!',
      futureCareers: 'Accountant, entrepreneur, banker, business analyst',
      didYouKnow: 'Business skills help you turn any idea into reality!',
      miniChallenge: 'Set a price for 12 cupcakes if 4 cost ¢10. What discount for 12?'
    }
  ],

  // Practical dominant
  practical: [
    {
      rank: 1,
      icon: '🔧',
      name: 'Technical / Vocational',
      matchingStyles: ['practical', 'analytical'],
      whyItFits: 'You enjoy working with your hands and seeing results — this track helps you build, create, and solve real-world problems!',
      futureCareers: 'Technician, entrepreneur, builder, mechanic, electrician',
      didYouKnow: 'Skilled workers build everything from bridges to phones!',
      miniChallenge: 'Sketch a shelf that uses exactly 6 screws; label lengths.'
    },
    {
      rank: 2,
      icon: '🌾',
      name: 'Agricultural Science',
      matchingStyles: ['practical', 'reflective'],
      whyItFits: 'You love nature and solving real problems — Agriculture helps you grow food, protect the environment, and feed the world!',
      futureCareers: 'Agricultural scientist, farmer, environmental specialist',
      didYouKnow: 'Farmers feed everyone on Earth — that\'s a superpower!'
    },
    {
      rank: 3,
      icon: '🏪',
      name: 'Business (Entrepreneurship)',
      matchingStyles: ['practical', 'creative'],
      whyItFits: 'You love turning ideas into action — Business helps you start your own projects and make them successful!',
      futureCareers: 'Entrepreneur, shop owner, business manager',
      didYouKnow: 'Some of the world\'s biggest companies started in garages!'
    }
  ],

  // Reflective dominant
  reflective: [
    {
      rank: 1,
      icon: '❤️',
      name: 'Health Science / Home Economics',
      matchingStyles: ['reflective', 'practical'],
      whyItFits: 'You care about people and love helping — Health or Home Economics lets you use your skills to improve lives!',
      futureCareers: 'Nurse, counselor, nutritionist, social worker',
      didYouKnow: 'Healthcare workers are everyday heroes who save lives!',
      miniChallenge: 'Plan a balanced snack: carb, protein, fruit/veg—explain choice.'
    },
    {
      rank: 2,
      icon: '📚',
      name: 'General Arts (Social Studies)',
      matchingStyles: ['reflective', 'creative'],
      whyItFits: 'You\'re thoughtful and love understanding people — Arts help you explore history, culture, and human behavior!',
      futureCareers: 'Teacher, psychologist, social worker, historian',
      didYouKnow: 'Understanding people is the first step to making the world better!'
    },
    {
      rank: 3,
      icon: '🎓',
      name: 'Education',
      matchingStyles: ['reflective', 'practical'],
      whyItFits: 'You love helping others learn and grow — Education lets you inspire the next generation!',
      futureCareers: 'Teacher, education officer, school counselor',
      didYouKnow: 'Great teachers change lives forever!'
    }
  ]
};

export const MIXED_STYLES: Record<string, { personalityType: string; programs: string[] }> = {
  'creative-analytical': {
    personalityType: 'Inventive Thinker',
    programs: ['General Science', 'ICT / Computer Science', 'Design Technology']
  },
  'analytical-reflective': {
    personalityType: 'Insightful Thinker',
    programs: ['General Arts', 'Education', 'Health Science']
  },
  'practical-creative': {
    personalityType: 'Innovator / Builder',
    programs: ['Visual Arts', 'Technical / Vocational', 'Entrepreneurship']
  },
  'reflective-creative': {
    personalityType: 'Empathetic Creator',
    programs: ['General Arts', 'Languages', 'Home Economics']
  },
  'practical-analytical': {
    personalityType: 'Logical Problem Solver',
    programs: ['Engineering', 'Technical Science', 'ICT']
  }
};

export const MOTIVATION_MESSAGES = [
  "Your brain loves challenges — feed it a puzzle today!",
  "Big ideas start with small questions — keep asking why!",
  "You learn faster when you share what you know!",
  "One smart thought today can spark a great idea tomorrow!",
  "Every question you ask makes your brain stronger!",
  "Mistakes are just steps on the road to success!",
  "Your unique thinking style is your superpower!",
  "Great minds think differently — just like you!"
];
