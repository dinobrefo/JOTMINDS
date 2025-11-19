export type UserRole = 'student' | 'teacher' | 'parent' | 'professional' | 'organization';

export type EducationLevel = 'Elementary' | 'JHS' | 'SHS' | 'Tertiary';

export type OrganizationType = 'Corporate' | 'NGO' | 'Government' | 'Startup' | 'Educational Institution' | 'Other';

export type KolbStyle = 'Diverging' | 'Assimilating' | 'Converging' | 'Accommodating';
export type SternbergStyle = 'Analytical' | 'Creative' | 'Practical';
export type DualProcessStyle = 'Intuitive' | 'Reflective' | 'Balanced';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  school?: string; // Optional - not applicable for supervisors
  role: UserRole;
  educationLevel?: EducationLevel;
  dateOfBirth?: string; // Changed from age to dateOfBirth (ISO format: YYYY-MM-DD)
  age?: number; // Computed property - calculated from dateOfBirth
  parentId?: string;
  teacherId?: string;
  students?: string[]; // For teachers and parents
  organizationName?: string; // For professionals and supervisors
  organizationType?: OrganizationType; // For professionals and supervisors
  position?: string; // For professionals and supervisors
  createdAt: string;
}

export interface Assessment {
  id: string;
  userId: string;
  type: 'kolb' | 'sternberg' | 'dual-process';
  responses: number[];
  questions?: Question[]; // Store the specific questions used for this assessment
  score: AssessmentScore;
  completedAt: string;
}

export interface AssessmentScore {
  kolb?: {
    style: KolbStyle;
    scores: {
      CE: number; // Concrete Experience
      RO: number; // Reflective Observation
      AC: number; // Abstract Conceptualization
      AE: number; // Active Experimentation
    };
  };
  sternberg?: {
    style: SternbergStyle;
    scores: {
      analytical: number;
      creative: number;
      practical: number;
    };
  };
  dualProcess?: {
    style: DualProcessStyle;
    scores: {
      system1: number; // Intuitive/Fast
      system2: number; // Reflective/Slow
    };
  };
}

export interface GhanaMapping {
  shsTrack: string[];
  tertiaryFocus: string[];
  decisionTip: string;
  careerSuggestions: string[];
}

export interface Reflection {
  id: string;
  userId: string;
  assessmentId: string;
  content: string;
  createdAt: string;
}

export interface Question {
  id: number;
  text: string;
  dimension: string;
}

export interface AssessmentProgress {
  userId: string;
  assessmentType: 'kolb' | 'sternberg' | 'dual-process';
  isOrganizational: boolean;
  currentQuestion: number;
  responses: number[];
  questions: Question[]; // Store the specific questions shown to this user
  lastSaved: string;
}

export interface SupervisorReviewData {
  id: string;
  supervisorId: string;
  professionalId: string;
  roleAlignment: string;
  performanceRating: string;
  strengths: string;
  developmentAreas: string;
  recommendedActions: string;
  goals: string;
  supervisorComments: string;
  reviewDate: string;
  createdAt: string;
}

export interface ParentObservationAssessment {
  id: string;
  parentId: string;
  childId: string;
  responses: number[];
  score: {
    sectionA: {
      total: number;
      style: string;
      interpretation: string;
      insights: string;
      tags: string[];
    };
    sectionB: {
      total: number;
      style: string;
      interpretation: string;
      insights: string;
      tags: string[];
    };
    sectionC: {
      total: number;
      style: string;
      interpretation: string;
      insights: string;
      tags: string[];
    };
    sectionD: {
      total: number;
      style: string;
      interpretation: string;
      insights: string;
      tags: string[];
    };
    overallSummary: string;
    harmonyScore?: number;
  };
  completedAt: string;
}

export interface ChildSharingConsent {
  childId: string;
  parentId: string;
  consentGiven: boolean;
  consentDate: string;
}

export interface AccessRequest {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  childId: string;
  childName: string;
  childEmail: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
  respondedAt?: string;
}