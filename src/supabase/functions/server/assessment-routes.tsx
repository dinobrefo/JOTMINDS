import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { kolbQuestions, sternbergQuestions, dualProcessQuestions } from './full-question-bank.tsx';

const app = new Hono();

// Create Supabase client helper
const getSupabaseClient = (serviceRole = false) => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceRole ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! : Deno.env.get('SUPABASE_ANON_KEY')!
  );
};

// Helper to verify authentication
const verifyAuth = async (request: Request) => {
  // Check for admin token in custom header first
  const adminToken = request.headers.get('X-Admin-Token');
  
  if (adminToken && adminToken.startsWith('admin-token-')) {
    // Return admin user
    return {
      id: 'admin-001',
      email: 'admin@jotminds.com',
      user_metadata: {
        name: 'Admin User',
        role: 'admin'
      }
    };
  }
  
  // Otherwise verify Supabase JWT
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch (error) {
    console.log('[verifyAuth] Error verifying token:', error);
    return null;
  }
};

// ============= VERSIONED QUESTION SETS =============

// Initialize default question sets in KV store (run once)
const initializeQuestionSets = async () => {
  // Check if questions are already initialized
  const existingV1 = await kv.get('questions:kolb:v1');
  if (existingV1) {
    console.log('[Questions] Question sets already initialized');
    return;
  }

  console.log('[Questions] Initializing versioned question sets with full 300-question bank...');

  // Kolb Learning Styles v1 (100 Questions)
  await kv.set('questions:kolb:v1', {
    version: 'v1',
    framework: 'kolb',
    createdAt: '2024-12-01T00:00:00.000Z',
    description: 'Full Kolb Learning Styles Assessment - 100 Questions (25 per quadrant)',
    totalQuestions: 100,
    distribution: {
      Diverging: 25,
      Assimilating: 25,
      Converging: 25,
      Accommodating: 25
    },
    questions: kolbQuestions.map(q => ({
      id: `kolb-${q.id}`,
      question: q.question,
      options: [
        { text: 'Strongly Disagree', value: 1 },
        { text: 'Disagree', value: 2 },
        { text: 'Neutral', value: 3 },
        { text: 'Agree', value: 4 },
        { text: 'Strongly Agree', value: 5 }
      ],
      style: q.style,
      points: q.points
    }))
  });

  // Sternberg Thinking Styles v1 (100 Questions)
  await kv.set('questions:sternberg:v1', {
    version: 'v1',
    framework: 'sternberg',
    createdAt: '2024-12-01T00:00:00.000Z',
    description: 'Full Sternberg Thinking Styles Assessment - 100 Questions',
    totalQuestions: 100,
    distribution: {
      Analytical: 34,
      Creative: 33,
      Practical: 33
    },
    questions: sternbergQuestions.map(q => ({
      id: `sternberg-${q.id}`,
      question: q.question,
      options: [
        { text: 'Strongly Disagree', value: 1 },
        { text: 'Disagree', value: 2 },
        { text: 'Neutral', value: 3 },
        { text: 'Agree', value: 4 },
        { text: 'Strongly Agree', value: 5 }
      ],
      style: q.style,
      points: q.points
    }))
  });

  // Dual-Process Decision Making v1 (100 Questions)
  await kv.set('questions:dual-process:v1', {
    version: 'v1',
    framework: 'dual-process',
    createdAt: '2024-12-01T00:00:00.000Z',
    description: 'Full Dual-Process Decision Making Assessment - 100 Questions (50 per style)',
    totalQuestions: 100,
    distribution: {
      Intuitive: 50,
      Reflective: 50
    },
    questions: dualProcessQuestions.map(q => ({
      id: `dual-process-${q.id}`,
      question: q.question,
      options: [
        { text: 'Strongly Disagree', value: 1 },
        { text: 'Disagree', value: 2 },
        { text: 'Neutral', value: 3 },
        { text: 'Agree', value: 4 },
        { text: 'Strongly Agree', value: 5 }
      ],
      style: q.style,
      points: q.points
    }))
  });

  console.log('[Questions] Full 300-question bank initialized successfully:');
  console.log('[Questions] - Kolb: 100 questions (25 per quadrant)');
  console.log('[Questions] - Sternberg: 100 questions (34/33/33 distribution)');
  console.log('[Questions] - Dual-Process: 100 questions (50 per style)');
};

// ============= PROGRESS ROUTES (must come before generic :framework/:version route) =============

// Save assessment progress
app.post('/assessment/progress', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { assessmentType, currentQuestion, answers, completed } = await c.req.json();
    
    const progressKey = `progress:${user.id}:${assessmentType}`;
    await kv.set(progressKey, {
      userId: user.id,
      assessmentType,
      currentQuestion,
      answers,
      completed,
      lastUpdated: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error) {
    console.log(`[Progress] Error saving assessment progress: ${error}`);
    return c.json({ error: 'Failed to save progress' }, 500);
  }
});

// Get assessment progress
app.get('/assessment/progress/:assessmentType', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const assessmentType = c.req.param('assessmentType');
    const progressKey = `progress:${user.id}:${assessmentType}`;
    const progress = await kv.get(progressKey);

    return c.json({ success: true, progress });
  } catch (error) {
    console.log(`[Progress] Error fetching assessment progress: ${error}`);
    return c.json({ error: 'Failed to fetch progress' }, 500);
  }
});

// Submit assessment results
app.post('/assessment/submit', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { assessmentType, answers, results, strengths, weaknesses, recommendations } = await c.req.json();
    
    // Save results
    const resultKey = `result:${user.id}:${assessmentType}`;
    await kv.set(resultKey, {
      id: resultKey,  // Include the ID in the stored data
      userId: user.id,
      assessmentType,
      answers,
      results,
      strengths,
      weaknesses,
      recommendations,
      completedAt: new Date().toISOString()
    });

    // Update user profile
    const userProfile = await kv.get(`user:${user.id}`) || {};
    const assessmentsCompleted = userProfile.assessmentsCompleted || [];
    if (!assessmentsCompleted.includes(assessmentType)) {
      assessmentsCompleted.push(assessmentType);
    }
    
    await kv.set(`user:${user.id}`, {
      ...userProfile,
      assessmentsCompleted
    });

    // Clear progress
    await kv.del(`progress:${user.id}:${assessmentType}`);

    return c.json({ success: true, resultId: resultKey });
  } catch (error) {
    console.log(`[Submit] Error submitting assessment: ${error}`);
    return c.json({ error: 'Failed to submit assessment' }, 500);
  }
});

// Get assessment results for a specific type
app.get('/assessment/results/:assessmentType', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const assessmentType = c.req.param('assessmentType');
    const resultKey = `result:${user.id}:${assessmentType}`;
    console.log(`[Results] Fetching ${assessmentType} for user ${user.id}, key: ${resultKey}`);
    
    const results = await kv.get(resultKey);
    console.log(`[Results] Retrieved data:`, results);
    console.log(`[Results] Data type:`, typeof results);
    console.log(`[Results] Is null?`, results === null);
    console.log(`[Results] Is undefined?`, results === undefined);
    
    // Let's also check if there are ANY keys for this user
    const allUserKeys = await kv.getByPrefix(`result:${user.id}:`);
    console.log(`[Results] All keys for user ${user.id}:`, allUserKeys);
    console.log(`[Results] Number of results found:`, allUserKeys?.length || 0);

    // Include debug info in response
    return c.json({ 
      success: true, 
      results,
      _debug: {
        key: resultKey,
        dataType: typeof results,
        isNull: results === null,
        isUndefined: results === undefined,
        allKeysCount: allUserKeys?.length || 0,
        allKeys: allUserKeys?.map((k: any) => k.id || k.key || JSON.stringify(k))
      }
    });
  } catch (error) {
    console.log(`[Results] Error fetching assessment results: ${error}`);
    return c.json({ error: 'Failed to fetch results' }, 500);
  }
});

// Get all assessment results for user
app.get('/assessment/results', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const resultKeys = await kv.getByPrefix(`result:${user.id}:`);
    
    return c.json({ success: true, results: resultKeys });
  } catch (error) {
    console.log(`[Results] Error fetching all assessment results: ${error}`);
    return c.json({ error: 'Failed to fetch results' }, 500);
  }
});

// ============= QUESTION ROUTES =============

// Get assessment questions by framework and version
app.get('/assessment/:framework/:version', async (c) => {
  try {
    const framework = c.req.param('framework');
    const version = c.req.param('version');

    // Validate framework
    const validFrameworks = ['kolb', 'sternberg', 'dual-process'];
    if (!validFrameworks.includes(framework)) {
      return c.json({ error: `Invalid framework. Must be one of: ${validFrameworks.join(', ')}` }, 400);
    }

    // Validate version format
    if (!version.match(/^v\d+$/)) {
      return c.json({ error: 'Invalid version format. Must be v1, v2, v3, etc.' }, 400);
    }

    const questionSet = await kv.get(`questions:${framework}:${version}`);

    if (!questionSet) {
      return c.json({ error: `Question set not found for ${framework} ${version}` }, 404);
    }

    console.log(`[Questions] Retrieved ${framework} ${version} with ${questionSet.questions.length} questions`);

    return c.json({
      success: true,
      framework,
      version,
      description: questionSet.description,
      questionCount: questionSet.questions.length,
      createdAt: questionSet.createdAt,
      questions: questionSet.questions
    });
  } catch (error) {
    console.log(`Error fetching assessment questions: ${error}`);
    return c.json({ error: 'Failed to fetch assessment questions' }, 500);
  }
});

// List all available versions for a framework
app.get('/assessment/:framework/versions', async (c) => {
  try {
    const framework = c.req.param('framework');

    // Get all versions for this framework
    const allVersions = await kv.getByPrefix(`questions:${framework}:`);

    const versions = allVersions.map((q: any) => ({
      version: q.version,
      description: q.description,
      questionCount: q.questions?.length || 0,
      createdAt: q.createdAt
    }));

    return c.json({
      success: true,
      framework,
      versions
    });
  } catch (error) {
    console.log(`Error listing versions: ${error}`);
    return c.json({ error: 'Failed to list versions' }, 500);
  }
});

// ============= SERVER-SIDE SCORING =============

// Calculate Kolb scores with Likert scale (1-5)
const calculateKolbScores = (answers: any[]) => {
  const scores: Record<string, number> = {
    Accommodating: 0,
    Diverging: 0,
    Assimilating: 0,
    Converging: 0
  };

  // Sum up Likert scale values (1-5) for each style
  answers.forEach(answer => {
    if (answer.selectedStyle && scores.hasOwnProperty(answer.selectedStyle)) {
      const value = answer.selectedValue || 3; // Default to neutral if not provided
      scores[answer.selectedStyle] += value;
    }
  });

  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const percentages: Record<string, number> = {};

  Object.keys(scores).forEach(style => {
    percentages[style] = total > 0 ? Math.round((scores[style] / total) * 100) : 0;
  });

  const dominantStyle = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  );

  return {
    scores,
    percentages,
    dominantStyle,
    totalQuestions: answers.length,
    maxPossibleScore: answers.length * 5
  };
};

// Calculate Sternberg scores with Likert scale (1-5)
const calculateSternbergScores = (answers: any[]) => {
  const scores: Record<string, number> = {
    Analytical: 0,
    Creative: 0,
    Practical: 0
  };

  // Sum up Likert scale values (1-5) for each style
  answers.forEach(answer => {
    if (answer.selectedStyle && scores.hasOwnProperty(answer.selectedStyle)) {
      const value = answer.selectedValue || 3; // Default to neutral if not provided
      scores[answer.selectedStyle] += value;
    }
  });

  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const percentages: Record<string, number> = {};

  Object.keys(scores).forEach(style => {
    percentages[style] = total > 0 ? Math.round((scores[style] / total) * 100) : 0;
  });

  const dominantStyle = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  );

  return {
    scores,
    percentages,
    dominantStyle,
    totalQuestions: answers.length,
    maxPossibleScore: answers.length * 5
  };
};

// Calculate Dual-Process scores with Likert scale (1-5)
const calculateDualProcessScores = (answers: any[]) => {
  const tempScores: Record<string, number> = {
    Intuitive: 0,
    Reflective: 0
  };

  // Sum up Likert scale values (1-5) for each style
  answers.forEach(answer => {
    if (answer.selectedStyle && tempScores.hasOwnProperty(answer.selectedStyle)) {
      const value = answer.selectedValue || 3; // Default to neutral if not provided
      tempScores[answer.selectedStyle] += value;
    }
  });

  // Normalize to system1/system2 format to match frontend expectations
  const scores = {
    system1: tempScores.Intuitive,
    system2: tempScores.Reflective
  };

  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const percentages: Record<string, number> = {};

  Object.keys(scores).forEach(style => {
    percentages[style] = total > 0 ? Math.round((scores[style] / total) * 100) : 0;
  });

  const dominantStyle = scores.system1 > scores.system2 ? 'Intuitive' : 'Reflective';

  return {
    scores,
    percentages,
    dominantStyle,
    totalQuestions: answers.length,
    maxPossibleScore: answers.length * 5
  };
};

// Server-side scoring endpoint
app.post('/assessment/:framework/score', async (c) => {
  try {
    const framework = c.req.param('framework');
    const { answers, version } = await c.req.json();

    if (!answers || !Array.isArray(answers)) {
      return c.json({ error: 'Answers array is required' }, 400);
    }

    let results;
    switch (framework) {
      case 'kolb':
        results = calculateKolbScores(answers);
        break;
      case 'sternberg':
        results = calculateSternbergScores(answers);
        break;
      case 'dual-process':
        results = calculateDualProcessScores(answers);
        break;
      default:
        return c.json({ error: 'Invalid framework' }, 400);
    }

    console.log(`[Scoring] Calculated ${framework} scores:`, results);

    return c.json({
      success: true,
      framework,
      version: version || 'v1',
      results,
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.log(`Error calculating scores: ${error}`);
    return c.json({ error: 'Failed to calculate scores' }, 500);
  }
});

// Initialize questions on server start (non-blocking)
initializeQuestionSets().catch(err => {
  console.error('[Questions] Failed to initialize question sets:', err);
});

export default app;