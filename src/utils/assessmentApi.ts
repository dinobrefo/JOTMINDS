import { projectId, publicAnonKey } from './supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-fc8eb847`;

// Get auth token from localStorage
const getAuthToken = () => {
  const session = localStorage.getItem('supabase.auth.token');
  if (session) {
    try {
      const parsedSession = JSON.parse(session);
      return parsedSession.currentSession?.access_token || publicAnonKey;
    } catch {
      return publicAnonKey;
    }
  }
  return publicAnonKey;
};

// Map assessment types to framework names
const getFrameworkName = (type: string): string => {
  switch (type) {
    case 'learning':
      return 'kolb';
    case 'thinking':
      return 'sternberg';
    case 'decision':
      return 'dual-process';
    default:
      return type;
  }
};

/**
 * Fetch versioned assessment questions from backend
 * @param framework - 'kolb', 'sternberg', or 'dual-process'
 * @param version - 'v1', 'v2', 'v3', etc.
 */
export const fetchAssessmentQuestions = async (
  framework: string,
  version: string = 'v1'
): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/assessment/${framework}/${version}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch assessment questions');
    }

    const data = await response.json();
    console.log(`[AssessmentAPI] Fetched ${framework} ${version} questions:`, data);
    
    return data;
  } catch (error) {
    console.error('[AssessmentAPI] Error fetching questions:', error);
    throw error;
  }
};

/**
 * List all available versions for a framework
 */
export const listAssessmentVersions = async (framework: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/assessment/${framework}/versions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to list assessment versions');
    }

    return await response.json();
  } catch (error) {
    console.error('[AssessmentAPI] Error listing versions:', error);
    throw error;
  }
};

/**
 * Calculate scores on the server side
 * @param framework - 'kolb', 'sternberg', or 'dual-process'
 * @param answers - Array of answer objects
 * @param version - Version of the question set used
 */
export const calculateScoresOnServer = async (
  framework: string,
  answers: any[],
  version: string = 'v1'
): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/assessment/${framework}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ answers, version })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to calculate scores');
    }

    const data = await response.json();
    console.log(`[AssessmentAPI] Server-calculated scores for ${framework}:`, data);
    
    return data;
  } catch (error) {
    console.error('[AssessmentAPI] Error calculating scores:', error);
    throw error;
  }
};

/**
 * Auto-save assessment progress (every 3 seconds)
 * @param assessmentType - 'learning', 'thinking', or 'decision'
 * @param currentQuestion - Current question index
 * @param answers - Array of answers so far
 * @param completed - Whether assessment is completed
 */
export const autoSaveProgress = async (
  assessmentType: string,
  currentQuestion: number,
  answers: any[],
  completed: boolean = false
): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/assessment/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        assessmentType,
        currentQuestion,
        answers,
        completed
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save progress');
    }

    console.log(`[AssessmentAPI] Progress auto-saved for ${assessmentType} at question ${currentQuestion}`);
  } catch (error) {
    console.error('[AssessmentAPI] Error saving progress:', error);
    throw error;
  }
};

/**
 * Submit completed assessment with server-side scoring
 * @param type - 'learning', 'thinking', or 'decision'
 * @param answers - All answers from the assessment
 * @param version - Version of questions used
 */
export const submitAssessmentWithServerScoring = async (
  type: string,
  answers: any[],
  version: string = 'v1'
): Promise<any> => {
  try {
    const framework = getFrameworkName(type);
    
    // Calculate scores on server
    const scoringResult = await calculateScoresOnServer(framework, answers, version);
    
    // Submit assessment results
    const response = await fetch(`${BASE_URL}/assessment/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        assessmentType: type,
        answers,
        results: scoringResult.results,
        version,
        scoredAt: scoringResult.calculatedAt,
        strengths: generateStrengthsFromResults(scoringResult.results),
        weaknesses: generateWeaknessesFromResults(scoringResult.results),
        recommendations: generateRecommendationsFromResults(scoringResult.results)
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit assessment');
    }

    const data = await response.json();
    console.log(`[AssessmentAPI] Assessment submitted successfully:`, data);
    
    return {
      ...data,
      results: scoringResult.results
    };
  } catch (error) {
    console.error('[AssessmentAPI] Error submitting assessment:', error);
    throw error;
  }
};

// Helper functions to generate insights from results
const generateStrengthsFromResults = (results: any): string[] => {
  const strengths: string[] = [];
  const { dominantStyle, percentages } = results;
  
  strengths.push(`Your dominant style is ${dominantStyle} (${percentages[dominantStyle]}%)`);
  
  // Add style-specific strengths
  if (percentages[dominantStyle] > 60) {
    strengths.push(`You show strong preference for ${dominantStyle.toLowerCase()} approaches`);
  }
  
  return strengths;
};

const generateWeaknessesFromResults = (results: any): string[] => {
  const weaknesses: string[] = [];
  const { percentages } = results;
  
  // Find styles with low percentages
  Object.entries(percentages).forEach(([style, percentage]) => {
    if ((percentage as number) < 20) {
      weaknesses.push(`Consider developing more ${style.toLowerCase()} skills`);
    }
  });
  
  return weaknesses;
};

const generateRecommendationsFromResults = (results: any): string[] => {
  const recommendations: string[] = [];
  const { dominantStyle } = results;
  
  recommendations.push(`Leverage your ${dominantStyle} style in learning and problem-solving`);
  recommendations.push('Try to balance your approaches by exploring other styles');
  recommendations.push('Reflect on situations where different styles might be more effective');
  
  return recommendations;
};
