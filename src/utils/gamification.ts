// JotMinds Gamification System - Ages 11-14
// Features: Badges, Levels, Weekly Challenges, XP Streak Insurance

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: number;
  requirement: number;
}

export interface Level {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  rewards: string[];
  color: string;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'streak' | 'assessments' | 'brain-gym' | 'total-xp';
  target: number;
  reward: number;
  icon: string;
  progress: number;
  completed: boolean;
  expiresAt: string;
}

export interface StreakInsurance {
  available: number;
  total: number;
  lastUsed?: string;
}

export interface GamificationProfile {
  userId: string;
  xp: number;
  level: number;
  badges: Badge[];
  weekChallenges: WeeklyChallenge[];
  streakInsurance: StreakInsurance;
  themesUnlocked: string[];
  totalAssessments: number;
  totalBrainGymChallenges: number;
  longestStreak: number;
  updatedAt: string;
}

// Badge Definitions
export const BADGE_LIBRARY: Omit<Badge, 'unlockedAt' | 'progress'>[] = [
  // Streak Badges
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Complete a 3-day streak',
    icon: '🔥',
    rarity: 'common',
    requirement: 3
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Complete a 7-day streak',
    icon: '⚡',
    rarity: 'rare',
    requirement: 7
  },
  {
    id: 'streak_14',
    name: 'Fortnight Fighter',
    description: 'Complete a 14-day streak',
    icon: '💎',
    rarity: 'epic',
    requirement: 14
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Complete a 30-day streak',
    icon: '👑',
    rarity: 'legendary',
    requirement: 30
  },
  
  // Assessment Badges
  {
    id: 'assessments_1',
    name: 'Self-Discoverer',
    description: 'Complete your first assessment',
    icon: '🌱',
    rarity: 'common',
    requirement: 1
  },
  {
    id: 'assessments_3',
    name: 'Profile Builder',
    description: 'Complete 3 assessments',
    icon: '🧩',
    rarity: 'rare',
    requirement: 3
  },
  {
    id: 'assessments_5',
    name: 'Mind Mapper',
    description: 'Complete 5 assessments',
    icon: '🧠',
    rarity: 'epic',
    requirement: 5
  },
  
  // Brain Gym Badges
  {
    id: 'brain_gym_10',
    name: 'Mental Athlete',
    description: 'Complete 10 Brain Gym challenges',
    icon: '💪',
    rarity: 'common',
    requirement: 10
  },
  {
    id: 'brain_gym_25',
    name: 'Cognitive Champion',
    description: 'Complete 25 Brain Gym challenges',
    icon: '🏅',
    rarity: 'rare',
    requirement: 25
  },
  {
    id: 'brain_gym_50',
    name: 'Brain Gym Legend',
    description: 'Complete 50 Brain Gym challenges',
    icon: '🏆',
    rarity: 'legendary',
    requirement: 50
  },
  
  // XP Badges
  {
    id: 'xp_500',
    name: 'Rising Star',
    description: 'Earn 500 XP',
    icon: '⭐',
    rarity: 'common',
    requirement: 500
  },
  {
    id: 'xp_1000',
    name: 'Shining Star',
    description: 'Earn 1,000 XP',
    icon: '🌟',
    rarity: 'rare',
    requirement: 1000
  },
  {
    id: 'xp_2500',
    name: 'Super Star',
    description: 'Earn 2,500 XP',
    icon: '💫',
    rarity: 'epic',
    requirement: 2500
  },
  {
    id: 'xp_5000',
    name: 'Mega Star',
    description: 'Earn 5,000 XP',
    icon: '✨',
    rarity: 'legendary',
    requirement: 5000
  },
];

// Level System (15 levels)
export const LEVELS: Level[] = [
  { level: 1, title: 'Curious Beginner', minXP: 0, maxXP: 100, rewards: ['Profile customization'], color: '#94a3b8' },
  { level: 2, title: 'Eager Learner', minXP: 100, maxXP: 250, rewards: ['Ocean theme'], color: '#60a5fa' },
  { level: 3, title: 'Quick Thinker', minXP: 250, maxXP: 450, rewards: ['Streak insurance x1'], color: '#3b82f6' },
  { level: 4, title: 'Mind Explorer', minXP: 450, maxXP: 700, rewards: ['Forest theme'], color: '#10b981' },
  { level: 5, title: 'Pattern Finder', minXP: 700, maxXP: 1000, rewards: ['Streak insurance x2'], color: '#059669' },
  { level: 6, title: 'Problem Solver', minXP: 1000, maxXP: 1400, rewards: ['Sunset theme'], color: '#f59e0b' },
  { level: 7, title: 'Creative Thinker', minXP: 1400, maxXP: 1850, rewards: ['Streak insurance x3'], color: '#d97706' },
  { level: 8, title: 'Sharp Mind', minXP: 1850, maxXP: 2400, rewards: ['Galaxy theme'], color: '#8b5cf6' },
  { level: 9, title: 'Insight Seeker', minXP: 2400, maxXP: 3000, rewards: ['Streak insurance x4'], color: '#7c3aed' },
  { level: 10, title: 'Wisdom Builder', minXP: 3000, maxXP: 3700, rewards: ['Aurora theme'], color: '#ec4899' },
  { level: 11, title: 'Master Learner', minXP: 3700, maxXP: 4500, rewards: ['Streak insurance x5'], color: '#db2777' },
  { level: 12, title: 'Cognitive Expert', minXP: 4500, maxXP: 5400, rewards: ['Neon theme'], color: '#06b6d4' },
  { level: 13, title: 'Mental Olympian', minXP: 5400, maxXP: 6500, rewards: ['Streak insurance x6'], color: '#0891b2' },
  { level: 14, title: 'Mind Master', minXP: 6500, maxXP: 8000, rewards: ['Diamond theme'], color: '#6366f1' },
  { level: 15, title: 'Legendary Thinker', minXP: 8000, maxXP: 10000, rewards: ['All themes unlocked', 'Unlimited streak insurance'], color: '#f59e0b' },
];

// Theme Library
export const THEMES = {
  default: { name: 'Default', unlockLevel: 1, gradient: 'from-cyan-50 via-violet-50 to-indigo-50' },
  ocean: { name: 'Ocean', unlockLevel: 2, gradient: 'from-blue-100 via-cyan-100 to-teal-100' },
  forest: { name: 'Forest', unlockLevel: 4, gradient: 'from-green-100 via-emerald-100 to-teal-100' },
  sunset: { name: 'Sunset', unlockLevel: 6, gradient: 'from-orange-100 via-pink-100 to-purple-100' },
  galaxy: { name: 'Galaxy', unlockLevel: 8, gradient: 'from-purple-100 via-violet-100 to-indigo-100' },
  aurora: { name: 'Aurora', unlockLevel: 10, gradient: 'from-pink-100 via-purple-100 to-blue-100' },
  neon: { name: 'Neon', unlockLevel: 12, gradient: 'from-cyan-100 via-fuchsia-100 to-yellow-100' },
  diamond: { name: 'Diamond', unlockLevel: 14, gradient: 'from-gray-100 via-blue-100 to-purple-100' },
};

const STORAGE_KEY = 'jotminds_gamification';

// Get or create gamification profile
export function getGamificationProfile(userId: string): GamificationProfile {
  const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
  
  if (!stored) {
    const newProfile: GamificationProfile = {
      userId,
      xp: 0,
      level: 1,
      badges: [],
      weekChallenges: generateWeeklyChallenges(),
      streakInsurance: { available: 0, total: 0 },
      themesUnlocked: ['default'],
      totalAssessments: 0,
      totalBrainGymChallenges: 0,
      longestStreak: 0,
      updatedAt: new Date().toISOString(),
    };
    saveGamificationProfile(newProfile);
    return newProfile;
  }
  
  const profile = JSON.parse(stored);
  
  // CRITICAL: Recalculate level from XP to ensure it's always correct
  const correctLevel = LEVELS.findIndex(l => profile.xp < l.maxXP) + 1 || LEVELS.length;
  if (profile.level !== correctLevel) {
    console.log(`[Gamification] Level mismatch detected! Stored: ${profile.level}, Calculated: ${correctLevel}. Fixing...`);
    profile.level = correctLevel;
    saveGamificationProfile(profile);
  }
  
  return profile;
}

// Save gamification profile
export function saveGamificationProfile(profile: GamificationProfile): void {
  profile.updatedAt = new Date().toISOString();
  localStorage.setItem(`${STORAGE_KEY}_${profile.userId}`, JSON.stringify(profile));
}

// Add XP and check for level up
export function addXP(userId: string, amount: number, reason: string): { 
  newXP: number; 
  leveledUp: boolean; 
  newLevel?: number;
  newBadges: Badge[];
  message: string;
} {
  const profile = getGamificationProfile(userId);
  const oldXP = profile.xp;
  const oldLevel = profile.level;
  
  profile.xp += amount;
  
  // Check for level up
  const newLevel = LEVELS.findIndex(l => profile.xp < l.maxXP) + 1 || LEVELS.length;
  const leveledUp = newLevel > oldLevel;
  
  if (leveledUp) {
    profile.level = newLevel;
    
    // Unlock new themes
    Object.entries(THEMES).forEach(([key, theme]) => {
      if (theme.unlockLevel === newLevel && !profile.themesUnlocked.includes(key)) {
        profile.themesUnlocked.push(key);
      }
    });
    
    // Add streak insurance based on level
    const levelInfo = LEVELS[newLevel - 1];
    if (levelInfo.rewards.some(r => r.includes('Streak insurance'))) {
      profile.streakInsurance.available += 1;
      profile.streakInsurance.total += 1;
    }
  }
  
  // Check for new badges
  const newBadges = checkForNewBadges(profile);
  
  saveGamificationProfile(profile);
  
  return {
    newXP: profile.xp,
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
    newBadges,
    message: `+${amount} XP for ${reason}!`
  };
}

// Check for newly earned badges
function checkForNewBadges(profile: GamificationProfile): Badge[] {
  const newBadges: Badge[] = [];
  const earnedBadgeIds = profile.badges.map(b => b.id);
  
  BADGE_LIBRARY.forEach(badge => {
    if (earnedBadgeIds.includes(badge.id)) return;
    
    let earned = false;
    
    // Streak badges
    if (badge.id.startsWith('streak_') && profile.longestStreak >= badge.requirement) {
      earned = true;
    }
    
    // Assessment badges
    if (badge.id.startsWith('assessments_') && profile.totalAssessments >= badge.requirement) {
      earned = true;
    }
    
    // Brain Gym badges
    if (badge.id.startsWith('brain_gym_') && profile.totalBrainGymChallenges >= badge.requirement) {
      earned = true;
    }
    
    // XP badges
    if (badge.id.startsWith('xp_') && profile.xp >= badge.requirement) {
      earned = true;
    }
    
    if (earned) {
      const earnedBadge: Badge = {
        ...badge,
        unlockedAt: new Date().toISOString(),
        progress: badge.requirement,
      };
      profile.badges.push(earnedBadge);
      newBadges.push(earnedBadge);
    }
  });
  
  return newBadges;
}

// Generate weekly challenges (resets every Monday)
export function generateWeeklyChallenges(): WeeklyChallenge[] {
  const nextMonday = getNextMonday();
  
  return [
    {
      id: 'week_streak',
      title: 'Streak Champion',
      description: 'Maintain a 7-day streak',
      type: 'streak',
      target: 7,
      reward: 150,
      icon: '🔥',
      progress: 0,
      completed: false,
      expiresAt: nextMonday.toISOString(),
    },
    {
      id: 'week_assessments',
      title: 'Self-Discovery Week',
      description: 'Complete 2 assessments this week',
      type: 'assessments',
      target: 2,
      reward: 200,
      icon: '🧠',
      progress: 0,
      completed: false,
      expiresAt: nextMonday.toISOString(),
    },
    {
      id: 'week_brain_gym',
      title: 'Mental Workout',
      description: 'Complete 10 Brain Gym challenges',
      type: 'brain-gym',
      target: 10,
      reward: 250,
      icon: '💪',
      progress: 0,
      completed: false,
      expiresAt: nextMonday.toISOString(),
    },
    {
      id: 'week_xp',
      title: 'XP Master',
      description: 'Earn 500 XP this week',
      type: 'total-xp',
      target: 500,
      reward: 100,
      icon: '⭐',
      progress: 0,
      completed: false,
      expiresAt: nextMonday.toISOString(),
    },
  ];
}

// Get next Monday
function getNextMonday(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

// Update weekly challenge progress
export function updateWeeklyChallengeProgress(
  userId: string,
  type: WeeklyChallenge['type'],
  increment: number = 1
): WeeklyChallenge | null {
  const profile = getGamificationProfile(userId);
  
  // Check if challenges need reset
  const now = new Date();
  const shouldReset = profile.weekChallenges.some(
    c => new Date(c.expiresAt) < now
  );
  
  if (shouldReset) {
    profile.weekChallenges = generateWeeklyChallenges();
  }
  
  const challenge = profile.weekChallenges.find(c => c.type === type && !c.completed);
  if (!challenge) return null;
  
  challenge.progress += increment;
  
  if (challenge.progress >= challenge.target) {
    challenge.completed = true;
    addXP(userId, challenge.reward, `completing "${challenge.title}"`);
  }
  
  saveGamificationProfile(profile);
  return challenge;
}

// Use streak insurance
export function useStreakInsurance(userId: string): boolean {
  const profile = getGamificationProfile(userId);
  
  if (profile.streakInsurance.available <= 0) {
    return false;
  }
  
  profile.streakInsurance.available -= 1;
  profile.streakInsurance.lastUsed = new Date().toISOString();
  saveGamificationProfile(profile);
  
  return true;
}

// Get current level info
export function getCurrentLevel(xp: number): Level {
  const levelIndex = LEVELS.findIndex(l => xp < l.maxXP);
  return LEVELS[levelIndex !== -1 ? levelIndex : LEVELS.length - 1];
}

// Get XP progress to next level
export function getXPProgress(xp: number): { current: number; needed: number; percentage: number } {
  const currentLevel = getCurrentLevel(xp);
  const current = xp - currentLevel.minXP;
  const needed = currentLevel.maxXP - currentLevel.minXP;
  const percentage = (current / needed) * 100;
  
  return { current, needed, percentage };
}

// Record assessment completion
export function recordAssessmentCompletion(userId: string): void {
  const profile = getGamificationProfile(userId);
  profile.totalAssessments += 1;
  
  const xpReward = addXP(userId, 100, 'completing an assessment');
  updateWeeklyChallengeProgress(userId, 'assessments', 1);
  
  saveGamificationProfile(profile);
}

// Record Brain Gym completion
export function recordBrainGymCompletion(userId: string, points: number): void {
  const profile = getGamificationProfile(userId);
  profile.totalBrainGymChallenges += 1;
  
  addXP(userId, points, 'Brain Gym challenge');
  updateWeeklyChallengeProgress(userId, 'brain-gym', 1);
  updateWeeklyChallengeProgress(userId, 'total-xp', points);
  
  saveGamificationProfile(profile);
}

// Update streak
export function updateStreak(userId: string, currentStreak: number): void {
  const profile = getGamificationProfile(userId);
  
  if (currentStreak > profile.longestStreak) {
    profile.longestStreak = currentStreak;
  }
  
  updateWeeklyChallengeProgress(userId, 'streak', 0); // Just check, don't increment
  const challenge = profile.weekChallenges.find(c => c.type === 'streak');
  if (challenge) {
    challenge.progress = currentStreak;
  }
  
  saveGamificationProfile(profile);
}
