import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import dailyChallengeRoutes from './daily-challenge-routes.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Mount daily challenge routes
app.route('/make-server-fc8eb847/daily-challenge', dailyChallengeRoutes);

// Create Supabase client
const getSupabaseClient = (serviceRole = false) => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceRole ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! : Deno.env.get('SUPABASE_ANON_KEY')!
  );
};

// Helper to verify authentication
const verifyAuth = async (request: Request) => {
  // Log all auth-related headers for debugging
  console.log('[verifyAuth] === Authentication Debug ===');
  console.log('[verifyAuth] All headers:', Object.fromEntries(request.headers.entries()));
  
  // Check for admin token in custom header first (bypasses Supabase JWT validation)
  const adminToken = request.headers.get('X-Admin-Token');
  console.log(`[verifyAuth] X-Admin-Token header:`, adminToken?.substring(0, 30) + '...' || 'NOT PRESENT');
  
  if (adminToken && adminToken.startsWith('admin-token-')) {
    console.log(`[verifyAuth] ✓ Admin token detected in X-Admin-Token header, returning admin user`);
    // Return admin user
    return {
      id: 'admin-001',
      email: 'Alex.Attachey@gmail.com',
      user_metadata: {
        name: 'Admin',
        role: 'admin'
      }
    };
  }
  
  // Check Authorization header for regular Supabase JWTs
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  console.log(`[verifyAuth] Authorization token:`, accessToken?.substring(0, 30) + '...' || 'NOT PRESENT');
  
  if (!accessToken) {
    console.log(`[verifyAuth] ✗ No access token provided`);
    return null;
  }
  
  // Check for admin token in Authorization header (legacy support)
  if (accessToken.startsWith('admin-token-')) {
    console.log(`[verifyAuth] ✓ Admin token detected in Authorization header, returning admin user`);
    return {
      id: 'admin-001',
      email: 'Alex.Attachey@gmail.com',
      user_metadata: {
        name: 'Admin',
        role: 'admin'
      }
    };
  }
  
  console.log(`[verifyAuth] Verifying Supabase JWT...`);
  const supabase = getSupabaseClient(true);
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    console.log(`[verifyAuth] ✗ Supabase auth error:`, error?.message || 'User not found');
    return null;
  }
  
  console.log(`[verifyAuth] ✓ User authenticated:`, user.id);
  return user;
};

// ============= AUTHENTICATION ROUTES =============

// Generate unique organization code
function generateOrgCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'JOTM-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Validate organization code
app.post('/make-server-fc8eb847/validate-org-code', async (c) => {
  try {
    const { code } = await c.req.json();
    
    if (!code) {
      return c.json({ error: 'Organization code is required' }, 400);
    }

    const organization = await kv.get(`organization:${code}`);
    
    if (!organization) {
      return c.json({ valid: false, error: 'Invalid organization code' }, 200);
    }

    return c.json({ 
      valid: true, 
      organizationName: organization.name 
    });
  } catch (error) {
    console.log(`Error validating org code: ${error}`);
    return c.json({ error: 'Failed to validate organization code' }, 500);
  }
});

// Sign up
app.post('/make-server-fc8eb847/signup', async (c) => {
  try {
    const { email, password, name, role, organizationName, organizationType, position, phone, school, educationLevel, dateOfBirth, organizationCode, hasConsented, consentType, consentDate } = await c.req.json();
    
    if (!email || !password || !name || !role) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    let finalOrgCode = null;
    let finalOrgName = organizationName || null;

    // Handle organization code for Organizations and Professionals
    if (role === 'organization') {
      // Organization creates a new organization and gets a code
      finalOrgCode = generateOrgCode();
      
      // Store organization
      await kv.set(`organization:${finalOrgCode}`, {
        code: finalOrgCode,
        name: organizationName,
        type: organizationType,
        createdAt: new Date().toISOString(),
        createdBy: email
      });
    } else if (role === 'professional' && organizationCode) {
      // Professional can optionally provide an organization code
      const organization = await kv.get(`organization:${organizationCode}`);
      if (!organization) {
        return c.json({ error: 'Invalid organization code' }, 400);
      }

      finalOrgCode = organizationCode;
      finalOrgName = organization.name;
    }

    const supabase = getSupabaseClient(true);
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since email server isn't configured
      user_metadata: { name, role, organizationName: finalOrgName, organizationType, position, phone, school, educationLevel, dateOfBirth, organizationCode: finalOrgCode, hasConsented, consentType, consentDate }
    });

    if (error) {
      console.log(`Error creating user during signup: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role,
      organizationName: finalOrgName,
      organizationCode: finalOrgCode,
      organizationType: organizationType || null,
      position: position || null,
      phone: phone || null,
      school: school || null,
      educationLevel: educationLevel || null,
      dateOfBirth: dateOfBirth || null,
      hasConsented: hasConsented || false,
      consentType: consentType || null,
      consentDate: consentDate || null,
      createdAt: new Date().toISOString(),
      assessmentsCompleted: [],
      cognitiveProfile: null
    });

    // If admin, add to admin list
    if (email === 'Alex.Attachey@gmail.com') {
      await kv.set('admin:user', data.user.id);
    }

    return c.json({ 
      success: true, 
      userId: data.user.id,
      user: data.user,
      organizationCode: finalOrgCode // Return the code for Supervisors to share
    });
  } catch (error) {
    console.log(`Unexpected error during signup: ${error}`);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Sign in
app.post('/make-server-fc8eb847/signin', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log(`Error during sign in: ${error.message}`);
      return c.json({ error: error.message }, 401);
    }

    // Get user profile from KV store
    const profile = await kv.get(`user:${data.user.id}`);
    
    // Build complete user data with profile from KV store
    const userData = {
      id: data.user.id,
      email: data.user.email,
      ...data.user.user_metadata,
      ...profile
    };

    return c.json({ 
      success: true,
      session: data.session,
      user: userData
    });
  } catch (error) {
    console.log(`Unexpected error during signin: ${error}`);
    return c.json({ error: 'Internal server error during signin' }, 500);
  }
});

// Get current session
app.get('/make-server-fc8eb847/session', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user profile from KV store
    const profile = await kv.get(`user:${user.id}`);
    
    console.log('[Session] User metadata:', user.user_metadata);
    console.log('[Session] KV profile:', profile);
    
    // Build user data - KV store profile takes precedence over user_metadata
    const userData = {
      id: user.id,
      email: user.email,
      ...user.user_metadata,
      ...profile // Profile from KV store overrides metadata
    };
    
    console.log('[Session] Merged userData before normalization:', { role: userData.role });
    
    // Fix capitalized roles and migrate old role names
    if (userData.role) {
      const originalRole = userData.role;
      const normalizedRole = userData.role === 'Professional/Organization' ? 'professional' : 
                            userData.role === 'Supervisor' ? 'organization' :
                            userData.role === 'Teacher' ? 'teacher' :
                            userData.role === 'Student' ? 'student' :
                            userData.role === 'Parent' ? 'parent' :
                            userData.role === 'Educator' ? 'teacher' :
                            userData.role.toLowerCase();
      userData.role = normalizedRole;
      console.log('[Session] Role normalization:', originalRole, '->', normalizedRole);
    }
    
    return c.json({ 
      success: true,
      user: userData
    });
  } catch (error) {
    console.log(`Error fetching session: ${error}`);
    return c.json({ error: 'Internal server error fetching session' }, 500);
  }
});

// ============= ASSESSMENT ROUTES =============

// Save assessment progress
app.post('/make-server-fc8eb847/assessment/progress', async (c) => {
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
    console.log(`Error saving assessment progress: ${error}`);
    return c.json({ error: 'Failed to save progress' }, 500);
  }
});

// Get assessment progress
app.get('/make-server-fc8eb847/assessment/progress/:assessmentType', async (c) => {
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
    console.log(`Error fetching assessment progress: ${error}`);
    return c.json({ error: 'Failed to fetch progress' }, 500);
  }
});

// Submit assessment results
app.post('/make-server-fc8eb847/assessment/submit', async (c) => {
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
    console.log(`Error submitting assessment results: ${error}`);
    return c.json({ error: 'Failed to submit results' }, 500);
  }
});

// Get assessment results
app.get('/make-server-fc8eb847/assessment/results/:assessmentType', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const assessmentType = c.req.param('assessmentType');
    const resultKey = `result:${user.id}:${assessmentType}`;
    console.log(`[Assessment Results] Fetching ${assessmentType} for user ${user.id}, key: ${resultKey}`);
    
    const results = await kv.get(resultKey);
    console.log(`[Assessment Results] Retrieved data:`, results);
    console.log(`[Assessment Results] Data type:`, typeof results);
    console.log(`[Assessment Results] Is null?`, results === null);
    console.log(`[Assessment Results] Is undefined?`, results === undefined);
    
    // Let's also check if there are ANY keys for this user
    const allUserKeys = await kv.getByPrefix(`result:${user.id}:`);
    console.log(`[Assessment Results] All keys for user ${user.id}:`, allUserKeys);
    console.log(`[Assessment Results] Number of results found:`, allUserKeys?.length || 0);

    // TEMPORARY DEBUG: Include debug info in response
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
    console.log(`Error fetching assessment results: ${error}`);
    return c.json({ error: 'Failed to fetch results' }, 500);
  }
});

// Get all assessment results for user
app.get('/make-server-fc8eb847/assessment/results', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const resultKeys = await kv.getByPrefix(`result:${user.id}:`);
    
    return c.json({ success: true, results: resultKeys });
  } catch (error) {
    console.log(`Error fetching all assessment results: ${error}`);
    return c.json({ error: 'Failed to fetch results' }, 500);
  }
});

// Admin: Get assessment results for any user
app.get('/make-server-fc8eb847/admin/user/:userId/results', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify admin access
    if (user.id !== 'admin-001' && user.user_metadata?.role !== 'admin') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const userId = c.req.param('userId');
    const resultKeys = await kv.getByPrefix(`result:${userId}:`);
    
    return c.json({ success: true, results: resultKeys });
  } catch (error) {
    console.log(`Error fetching user assessment results: ${error}`);
    return c.json({ error: 'Failed to fetch results' }, 500);
  }
});

// Save cognitive profile
app.post('/make-server-fc8eb847/cognitive-profile', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { profile } = await c.req.json();
    
    // Update user profile with cognitive data
    const userProfile = await kv.get(`user:${user.id}`) || {};
    await kv.set(`user:${user.id}`, {
      ...userProfile,
      cognitiveProfile: profile,
      profileUpdatedAt: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error saving cognitive profile: ${error}`);
    return c.json({ error: 'Failed to save cognitive profile' }, 500);
  }
});

// JHS Thinking Styles Assessment - Save results
app.post('/make-server-fc8eb847/jhs-thinking/submit', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { responses, results } = await c.req.json();
    
    // Save JHS assessment results
    const resultKey = `result:${user.id}:jhs-thinking`;
    await kv.set(resultKey, {
      id: resultKey,
      userId: user.id,
      assessmentType: 'jhs-thinking',
      responses,
      results,
      completedAt: new Date().toISOString()
    });

    // Update user profile
    const userProfile = await kv.get(`user:${user.id}`) || {};
    const assessmentsCompleted = userProfile.assessmentsCompleted || [];
    if (!assessmentsCompleted.includes('jhs-thinking')) {
      assessmentsCompleted.push('jhs-thinking');
    }
    
    await kv.set(`user:${user.id}`, {
      ...userProfile,
      assessmentsCompleted,
      lastJHSAssessment: new Date().toISOString()
    });

    return c.json({ success: true, resultId: resultKey });
  } catch (error) {
    console.log(`Error submitting JHS Thinking assessment: ${error}`);
    return c.json({ error: 'Failed to submit JHS results' }, 500);
  }
});

// SHS Thinking Styles Assessment - Save results
app.post('/make-server-fc8eb847/shs-thinking/submit', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { results } = await c.req.json();
    
    // Save SHS assessment results
    const resultKey = `result:${user.id}:shs-thinking`;
    await kv.set(resultKey, {
      id: resultKey,
      userId: user.id,
      assessmentType: 'shs-thinking',
      results,
      completedAt: new Date().toISOString()
    });

    // Update user profile
    const userProfile = await kv.get(`user:${user.id}`) || {};
    const assessmentsCompleted = userProfile.assessmentsCompleted || [];
    if (!assessmentsCompleted.includes('shs-thinking')) {
      assessmentsCompleted.push('shs-thinking');
    }
    
    await kv.set(`user:${user.id}`, {
      ...userProfile,
      assessmentsCompleted,
      lastSHSAssessment: new Date().toISOString()
    });

    return c.json({ success: true, resultId: resultKey });
  } catch (error) {
    console.log(`Error submitting SHS Thinking assessment: ${error}`);
    return c.json({ error: 'Failed to submit SHS results' }, 500);
  }
});

// Get JHS Thinking Styles results
app.get('/make-server-fc8eb847/jhs-thinking/results', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const resultKey = `result:${user.id}:jhs-thinking`;
    const results = await kv.get(resultKey);

    return c.json({ success: true, results });
  } catch (error) {
    console.log(`Error fetching JHS Thinking results: ${error}`);
    return c.json({ error: 'Failed to fetch JHS results' }, 500);
  }
});

// Get SHS Thinking Styles results
app.get('/make-server-fc8eb847/shs-thinking/results', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const resultKey = `result:${user.id}:shs-thinking`;
    const results = await kv.get(resultKey);

    if (!results) {
      return c.json({ error: 'No SHS assessment results found' }, 404);
    }

    return c.json(results);
  } catch (error) {
    console.log(`Error fetching SHS Thinking results: ${error}`);
    return c.json({ error: 'Failed to fetch SHS results' }, 500);
  }
});

// Adult Thinking Styles Assessment - Save results
app.post('/make-server-fc8eb847/adult-thinking/submit', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { results } = await c.req.json();
    
    // Save Adult assessment results
    const resultKey = `result:${user.id}:adult-thinking`;
    await kv.set(resultKey, {
      id: resultKey,
      userId: user.id,
      assessmentType: 'adult-thinking',
      results,
      completedAt: new Date().toISOString()
    });

    // Update user profile
    const userProfile = await kv.get(`user:${user.id}`) || {};
    const assessmentsCompleted = userProfile.assessmentsCompleted || [];
    if (!assessmentsCompleted.includes('adult-thinking')) {
      assessmentsCompleted.push('adult-thinking');
    }
    
    await kv.set(`user:${user.id}`, {
      ...userProfile,
      assessmentsCompleted,
      lastAdultAssessment: new Date().toISOString()
    });

    return c.json({ success: true, resultId: resultKey });
  } catch (error) {
    console.log(`Error submitting Adult Thinking assessment: ${error}`);
    return c.json({ error: 'Failed to submit Adult results' }, 500);
  }
});

// Get Adult Thinking Styles results
app.get('/make-server-fc8eb847/adult-thinking/results', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const resultKey = `result:${user.id}:adult-thinking`;
    const results = await kv.get(resultKey);

    if (!results) {
      return c.json({ error: 'No Adult assessment results found' }, 404);
    }

    return c.json(results);
  } catch (error) {
    console.log(`Error fetching Adult Thinking results: ${error}`);
    return c.json({ error: 'Failed to fetch Adult results' }, 500);
  }
});

// ============= REFLECTION ROUTES =============

// Save a reflection
app.post('/make-server-fc8eb847/reflection', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { content, assessmentResultId } = await c.req.json();
    
    if (!content || !content.trim()) {
      return c.json({ error: 'Reflection content is required' }, 400);
    }

    const reflectionId = `reflection:${user.id}:${Date.now()}`;
    const reflection = {
      id: reflectionId,
      userId: user.id,
      content: content.trim(),
      assessmentResultId: assessmentResultId || null,
      createdAt: new Date().toISOString()
    };

    await kv.set(reflectionId, reflection);

    return c.json({ success: true, reflection });
  } catch (error) {
    console.log(`Error saving reflection: ${error}`);
    return c.json({ error: 'Failed to save reflection' }, 500);
  }
});

// Get user's reflections
app.get('/make-server-fc8eb847/reflection', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const reflections = await kv.getByPrefix(`reflection:${user.id}:`);
    
    // Sort by createdAt descending
    const sortedReflections = reflections.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ success: true, reflections: sortedReflections });
  } catch (error) {
    console.log(`Error fetching reflections: ${error}`);
    return c.json({ error: 'Failed to fetch reflections' }, 500);
  }
});

// Admin: Get user's reflections
app.get('/make-server-fc8eb847/admin/user/:userId/reflections', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify admin access
    if (user.id !== 'admin-001' && user.user_metadata?.role !== 'admin') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const userId = c.req.param('userId');
    const reflections = await kv.getByPrefix(`reflection:${userId}:`);
    
    // Sort by createdAt descending
    const sortedReflections = reflections.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ success: true, reflections: sortedReflections });
  } catch (error) {
    console.log(`Error fetching user reflections: ${error}`);
    return c.json({ error: 'Failed to fetch reflections' }, 500);
  }
});

// ============= ADMIN ROUTES =============

// Get all users (admin only)
app.get('/make-server-fc8eb847/admin/users', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    if (user.email !== 'Alex.Attachey@gmail.com') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const users = await kv.getByPrefix('user:');
    
    return c.json({ success: true, users });
  } catch (error) {
    console.log(`Error fetching users for admin: ${error}`);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Get user statistics (admin only)
app.get('/make-server-fc8eb847/admin/stats', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    if (user.email !== 'Alex.Attachey@gmail.com') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const users = await kv.getByPrefix('user:');
    const results = await kv.getByPrefix('result:');
    
    const stats = {
      totalUsers: users.length,
      usersByRole: {},
      totalAssessments: results.length,
      assessmentsByType: {}
    };

    users.forEach((userData: any) => {
      // Normalize role to handle case variations and old formats
      let role = userData.role || 'Unknown';
      
      // Convert to lowercase first for normalization
      const normalizedRole = role.toLowerCase();
      
      // Map normalized roles to display names
      const roleMap: { [key: string]: string } = {
        'student': 'Student',
        'teacher': 'Teacher',
        'parent': 'Parent',
        'professional': 'Professional',
        'professional/organization': 'Professional',
        'admin': 'Admin',
        'supervisor': 'Organization',
        'organization': 'Organization'
      };
      
      // Get the properly formatted role name
      const displayRole = roleMap[normalizedRole] || 'Unknown';
      
      stats.usersByRole[displayRole] = (stats.usersByRole[displayRole] || 0) + 1;
    });

    results.forEach((resultData: any) => {
      const type = resultData.assessmentType || 'Unknown';
      stats.assessmentsByType[type] = (stats.assessmentsByType[type] || 0) + 1;
    });

    return c.json({ success: true, stats });
  } catch (error) {
    console.log(`Error fetching admin statistics: ${error}`);
    return c.json({ error: 'Failed to fetch statistics' }, 500);
  }
});

// Get specific user data (admin only)
app.get('/make-server-fc8eb847/admin/user/:userId', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    if (user.email !== 'Alex.Attachey@gmail.com') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const userId = c.req.param('userId');
    const userProfile = await kv.get(`user:${userId}`);
    const userResults = await kv.getByPrefix(`result:${userId}:`);

    return c.json({ 
      success: true, 
      user: userProfile,
      results: userResults
    });
  } catch (error) {
    console.log(`Error fetching user data for admin: ${error}`);
    return c.json({ error: 'Failed to fetch user data' }, 500);
  }
});

// ============= PARENT-CHILD LINKING ROUTES =============

// Get linked children for parent
app.get('/make-server-fc8eb847/parent/children', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'parent') {
      return c.json({ error: 'Forbidden - Parent access required' }, 403);
    }

    const linkedChildIds = userProfile.linkedChildren || [];
    const allUsers = await kv.getByPrefix('user:');
    
    // Filter to get only the linked children
    const children = allUsers.filter((u: any) => 
      linkedChildIds.includes(u.id) && (u.role === 'student' || u.role === 'Student')
    );

    return c.json({ success: true, children });
  } catch (error) {
    console.log(`Error fetching linked children: ${error}`);
    return c.json({ error: 'Failed to fetch linked children' }, 500);
  }
});

// Link a child to parent by email
app.post('/make-server-fc8eb847/parent/link-child', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { childEmail } = await c.req.json();
    
    const parentProfile = await kv.get(`user:${user.id}`);
    if (parentProfile?.role !== 'parent') {
      return c.json({ error: 'Forbidden - Parent access required' }, 403);
    }

    // Find child by email
    const allUsers = await kv.getByPrefix('user:');
    const child = allUsers.find((u: any) => 
      u.email.toLowerCase() === childEmail.toLowerCase()
    );

    if (!child) {
      return c.json({ error: 'Student not found. Please check the email address.' }, 404);
    }

    if (child.role !== 'student') {
      return c.json({ error: 'The account found is not a student account.' }, 400);
    }

    const linkedChildren = parentProfile.linkedChildren || [];
    
    if (linkedChildren.includes(child.id)) {
      return c.json({ error: 'This child is already linked to your account.' }, 400);
    }

    // Update parent profile
    const updatedParent = {
      ...parentProfile,
      linkedChildren: [...linkedChildren, child.id]
    };

    await kv.set(`user:${user.id}`, updatedParent);

    return c.json({ 
      success: true, 
      message: `${child.name} has been successfully linked to your account!`,
      parent: updatedParent
    });
  } catch (error) {
    console.log(`Error linking child to parent: ${error}`);
    return c.json({ error: 'Failed to link child' }, 500);
  }
});

// Unlink a child from parent
app.post('/make-server-fc8eb847/parent/unlink-child', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { childId } = await c.req.json();
    
    const parentProfile = await kv.get(`user:${user.id}`);
    if (parentProfile?.role !== 'parent') {
      return c.json({ error: 'Forbidden - Parent access required' }, 403);
    }

    const linkedChildren = parentProfile.linkedChildren || [];
    
    if (!linkedChildren.includes(childId)) {
      return c.json({ error: 'This child is not linked to your account.' }, 400);
    }

    // Update parent profile
    const updatedParent = {
      ...parentProfile,
      linkedChildren: linkedChildren.filter((id: string) => id !== childId)
    };

    await kv.set(`user:${user.id}`, updatedParent);

    return c.json({ 
      success: true, 
      message: 'Child has been unlinked successfully.',
      parent: updatedParent
    });
  } catch (error) {
    console.log(`Error unlinking child from parent: ${error}`);
    return c.json({ error: 'Failed to unlink child' }, 500);
  }
});

// Get assessments for linked children
app.get('/make-server-fc8eb847/parent/children/assessments', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const parentProfile = await kv.get(`user:${user.id}`);
    if (parentProfile?.role !== 'parent') {
      return c.json({ error: 'Forbidden - Parent access required' }, 403);
    }

    const linkedChildIds = parentProfile.linkedChildren || [];
    const assessments: any = {};

    // Get assessments for each child
    for (const childId of linkedChildIds) {
      const childResults = await kv.getByPrefix(`result:${childId}:`);
      assessments[childId] = childResults;
    }

    return c.json({ success: true, assessments });
  } catch (error) {
    console.log(`Error fetching children assessments: ${error}`);
    return c.json({ error: 'Failed to fetch assessments' }, 500);
  }
});

// Get parent's pending requests (for parent to see status)
app.get('/make-server-fc8eb847/access-request/my-requests', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'parent') {
      return c.json({ error: 'Forbidden - Parent access required' }, 403);
    }

    // Get all access requests by this parent
    const allRequests = await kv.getByPrefix('access_request:');
    const parentRequests = allRequests.filter((req: any) => req.parentId === user.id);

    return c.json({ success: true, requests: parentRequests });
  } catch (error) {
    console.log(`Error fetching parent requests: ${error}`);
    return c.json({ error: 'Failed to fetch requests' }, 500);
  }
});

// Get linked children with their assessments (for parent dashboard)
app.get('/make-server-fc8eb847/parent/linked-children', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'parent') {
      return c.json({ error: 'Forbidden - Parent access required' }, 403);
    }

    console.log('[Backend] Fetching linked children for parent:', user.id);
    const linkedChildrenIds = userProfile.linkedChildren || [];
    console.log('[Backend] Linked children IDs:', linkedChildrenIds);
    
    // Helper function to determine primary style from scores
    const determinePrimaryStyle = (scores: any, type: string) => {
      if (type === 'kolb') {
        const { CE = 0, RO = 0, AC = 0, AE = 0 } = scores;
        const acCE = AC - CE;
        const aeRO = AE - RO;
        
        if (acCE > 0 && aeRO > 0) return 'Converging';
        if (acCE > 0 && aeRO < 0) return 'Assimilating';
        if (acCE < 0 && aeRO < 0) return 'Diverging';
        return 'Accommodating';
      } else if (type === 'sternberg') {
        const { analytical = 0, creative = 0, practical = 0 } = scores;
        if (analytical >= creative && analytical >= practical) return 'Analytical';
        if (creative >= analytical && creative >= practical) return 'Creative';
        return 'Practical';
      } else if (type === 'dual-process') {
        const { system1 = 0, system2 = 0 } = scores;
        return system1 > system2 ? 'Intuitive' : 'Reflective';
      }
      return 'Unknown';
    };
    
    // Get each child's profile and assessments
    const childrenData = await Promise.all(
      linkedChildrenIds.map(async (childId: string) => {
        const childProfile = await kv.get(`user:${childId}`);
        if (!childProfile) {
          console.log('[Backend] Child profile not found:', childId);
          return null;
        }
        
        console.log('[Backend] Found child profile:', childProfile.name);
        
        // Get child's assessments (using result: prefix)
        const allAssessments = await kv.getByPrefix(`result:${childId}:`);
        console.log('[Backend] Raw assessments for child', childId, ':', allAssessments);
        console.log('[Backend] Number of raw assessments:', allAssessments.length);
        console.log('[Backend] Assessment keys being searched with prefix:', `result:${childId}:`);
        
        const completedAssessments = allAssessments.filter((a: any) => a.completedAt);
        console.log('[Backend] Completed assessments:', completedAssessments.length);
        console.log('[Backend] Completed assessment details:', JSON.stringify(completedAssessments, null, 2));
        
        // Transform assessments to match frontend format
        const transformedAssessments = completedAssessments.map((assessment: any) => {
          const assessmentType = assessment.assessmentType;
          const results = assessment.results || {};
          
          console.log('[Backend] Transforming assessment:', {
            type: assessmentType,
            results,
            hasResults: Object.keys(results).length > 0
          });
          
          // Build the score object with proper structure
          let score: any = {};
          
          if (assessmentType === 'kolb') {
            const style = determinePrimaryStyle(results, 'kolb');
            score.kolb = {
              style,
              scores: results
            };
          } else if (assessmentType === 'sternberg') {
            const style = determinePrimaryStyle(results, 'sternberg');
            score.sternberg = {
              style,
              scores: results
            };
          } else if (assessmentType === 'dual-process') {
            const style = determinePrimaryStyle(results, 'dual-process');
            score.dualProcess = {
              style,
              scores: results
            };
          }
          
          console.log('[Backend] Built score object:', score);
          
          return {
            id: assessment.id || `result:${childId}:${assessmentType}`,
            userId: childId,
            type: assessmentType,
            completed: true,
            completedAt: assessment.completedAt,
            responses: assessment.answers || [],
            score: score  // Now includes both style and scores
          };
        });
        
        console.log('[Backend] Transformed assessments for child', childProfile.name, ':', transformedAssessments);
        
        return {
          child: childProfile,
          assessments: transformedAssessments
        };
      })
    );

    // Filter out null values
    const validChildren = childrenData.filter(c => c !== null);
    
    console.log('[Backend] Returning data for', validChildren.length, 'children');

    return c.json({ success: true, children: validChildren });
  } catch (error) {
    console.log(`Error fetching linked children: ${error}`);
    return c.json({ error: 'Failed to fetch linked children' }, 500);
  }
});

// ============= ACCESS REQUEST ROUTES =============

// Create access request (parent requests access to child's data)
app.post('/make-server-fc8eb847/access-request/create', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { childEmail } = await c.req.json();
    
    const parentProfile = await kv.get(`user:${user.id}`);
    if (parentProfile?.role !== 'parent') {
      return c.json({ error: 'Forbidden - Parent access required' }, 403);
    }

    // Find child by email
    const allUsers = await kv.getByPrefix('user:');
    const child = allUsers.find((u: any) => 
      u.email.toLowerCase() === childEmail.toLowerCase()
    );

    if (!child) {
      return c.json({ error: 'Student not found. Please check the email address.' }, 404);
    }

    if (child.role !== 'student') {
      return c.json({ error: 'The account found is not a student account.' }, 400);
    }

    // Check if already linked (from old system or approved request)
    const linkedChildren = parentProfile.linkedChildren || [];
    if (linkedChildren.includes(child.id)) {
      // Check if there's an access request record
      const allRequests = await kv.getByPrefix('access_request:');
      const existingRequest = allRequests.find((req: any) => 
        req.parentId === user.id && req.childId === child.id && req.status === 'approved'
      );
      
      if (!existingRequest) {
        // Child was linked via old system - create an approved request retroactively
        const requestId = `access_request:${user.id}:${child.id}:${Date.now()}`;
        const accessRequest = {
          id: requestId,
          parentId: user.id,
          parentName: parentProfile.name,
          parentEmail: parentProfile.email,
          childId: child.id,
          childName: child.name,
          childEmail: child.email,
          status: 'approved',
          requestedAt: new Date().toISOString(),
          respondedAt: new Date().toISOString(),
          note: 'Auto-approved from legacy linking system'
        };
        await kv.set(requestId, accessRequest);
      }
      
      return c.json({ 
        error: `${child.name} is already linked to your account. You can view their assessments in your dashboard.` 
      }, 400);
    }

    // Check if request already exists
    const existingRequests = await kv.getByPrefix(`access_request:${user.id}:${child.id}:`);
    const pendingRequest = existingRequests.find((req: any) => req.status === 'pending');
    
    if (pendingRequest) {
      return c.json({ error: 'You already have a pending access request for this student.' }, 400);
    }

    // Create access request
    const requestId = `access_request:${user.id}:${child.id}:${Date.now()}`;
    const accessRequest = {
      id: requestId,
      parentId: user.id,
      parentName: parentProfile.name,
      parentEmail: parentProfile.email,
      childId: child.id,
      childName: child.name,
      childEmail: child.email,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    await kv.set(requestId, accessRequest);

    return c.json({ 
      success: true, 
      message: `Access request sent to ${child.name}. They will need to approve it before you can view their data.`,
      request: accessRequest
    });
  } catch (error) {
    console.log(`Error creating access request: ${error}`);
    return c.json({ error: 'Failed to create access request' }, 500);
  }
});

// Get pending access requests for a student
app.get('/make-server-fc8eb847/access-request/pending', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'student') {
      return c.json({ error: 'Forbidden - Student access required' }, 403);
    }

    // Get all access requests for this student
    const allRequests = await kv.getByPrefix('access_request:');
    const studentRequests = allRequests.filter((req: any) => 
      req.childId === user.id && req.status === 'pending'
    );

    return c.json({ success: true, requests: studentRequests });
  } catch (error) {
    console.log(`Error fetching pending requests: ${error}`);
    return c.json({ error: 'Failed to fetch pending requests' }, 500);
  }
});

// Get all access requests for a student (including approved/denied)
app.get('/make-server-fc8eb847/access-request/all', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'student') {
      return c.json({ error: 'Forbidden - Student access required' }, 403);
    }

    // Get all access requests for this student
    const allRequests = await kv.getByPrefix('access_request:');
    const studentRequests = allRequests.filter((req: any) => req.childId === user.id);

    return c.json({ success: true, requests: studentRequests });
  } catch (error) {
    console.log(`Error fetching access requests: ${error}`);
    return c.json({ error: 'Failed to fetch access requests' }, 500);
  }
});

// Approve access request
app.post('/make-server-fc8eb847/access-request/approve', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { requestId } = await c.req.json();
    
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'student') {
      return c.json({ error: 'Forbidden - Student access required' }, 403);
    }

    // Get the request
    const request = await kv.get(requestId);
    if (!request) {
      return c.json({ error: 'Access request not found' }, 404);
    }

    // Verify this request is for this student
    if (request.childId !== user.id) {
      return c.json({ error: 'Unauthorized - This request is not for you' }, 403);
    }

    if (request.status !== 'pending') {
      return c.json({ error: 'This request has already been responded to' }, 400);
    }

    // Update request status
    const updatedRequest = {
      ...request,
      status: 'approved',
      respondedAt: new Date().toISOString()
    };
    await kv.set(requestId, updatedRequest);

    // Add child to parent's linkedChildren
    const parentProfile = await kv.get(`user:${request.parentId}`);
    const updatedParent = {
      ...parentProfile,
      linkedChildren: [...(parentProfile.linkedChildren || []), user.id]
    };
    await kv.set(`user:${request.parentId}`, updatedParent);

    return c.json({ 
      success: true, 
      message: `Access granted to ${request.parentName}`,
      request: updatedRequest
    });
  } catch (error) {
    console.log(`Error approving access request: ${error}`);
    return c.json({ error: 'Failed to approve access request' }, 500);
  }
});

// Deny access request
app.post('/make-server-fc8eb847/access-request/deny', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { requestId } = await c.req.json();
    
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'student') {
      return c.json({ error: 'Forbidden - Student access required' }, 403);
    }

    // Get the request
    const request = await kv.get(requestId);
    if (!request) {
      return c.json({ error: 'Access request not found' }, 404);
    }

    // Verify this request is for this student
    if (request.childId !== user.id) {
      return c.json({ error: 'Unauthorized - This request is not for you' }, 403);
    }

    if (request.status !== 'pending') {
      return c.json({ error: 'This request has already been responded to' }, 400);
    }

    // Update request status
    const updatedRequest = {
      ...request,
      status: 'denied',
      respondedAt: new Date().toISOString()
    };
    await kv.set(requestId, updatedRequest);

    return c.json({ 
      success: true, 
      message: `Access denied to ${request.parentName}`,
      request: updatedRequest
    });
  } catch (error) {
    console.log(`Error denying access request: ${error}`);
    return c.json({ error: 'Failed to deny access request' }, 500);
  }
});

// Revoke parent access (student removes parent's access)
app.post('/make-server-fc8eb847/access-request/revoke', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { parentId } = await c.req.json();
    
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'student') {
      return c.json({ error: 'Forbidden - Student access required' }, 403);
    }

    // Get parent profile and remove child from linkedChildren
    const parentProfile = await kv.get(`user:${parentId}`);
    if (!parentProfile) {
      return c.json({ error: 'Parent not found' }, 404);
    }

    const linkedChildren = parentProfile.linkedChildren || [];
    if (!linkedChildren.includes(user.id)) {
      return c.json({ error: 'This parent does not have access to your data' }, 400);
    }

    // Update parent profile
    const updatedParent = {
      ...parentProfile,
      linkedChildren: linkedChildren.filter((id: string) => id !== user.id)
    };
    await kv.set(`user:${parentId}`, updatedParent);

    // Update the approved request to revoked status
    const allRequests = await kv.getByPrefix('access_request:');
    const approvedRequest = allRequests.find((req: any) => 
      req.parentId === parentId && req.childId === user.id && req.status === 'approved'
    );
    
    if (approvedRequest) {
      const updatedRequest = {
        ...approvedRequest,
        status: 'revoked',
        revokedAt: new Date().toISOString()
      };
      await kv.set(approvedRequest.id, updatedRequest);
    }

    return c.json({ 
      success: true, 
      message: `Access revoked from ${parentProfile.name}`
    });
  } catch (error) {
    console.log(`Error revoking access: ${error}`);
    return c.json({ error: 'Failed to revoke access' }, 500);
  }
});

// ============= SUPERVISOR ROUTES =============

// Get supervised employees (for Supervisor role)
app.get('/make-server-fc8eb847/supervisor/employees', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      console.log('[supervisor/employees] ✗ No user from verifyAuth');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[supervisor/employees] ✓ User authenticated:', user.id);

    const userProfile = await kv.get(`user:${user.id}`);
    console.log('[supervisor/employees] User profile:', userProfile ? 'Found' : 'NOT FOUND');
    console.log('[supervisor/employees] User profile role:', userProfile?.role);
    
    if (!userProfile) {
      console.log('[supervisor/employees] ✗ User profile not found in KV store');
      return c.json({ error: 'User profile not found' }, 404);
    }
    
    // Accept both 'organization' and 'supervisor' roles (they're the same in this context)
    const normalizedRole = (userProfile?.role || '').toLowerCase();
    if (normalizedRole !== 'supervisor' && normalizedRole !== 'organization') {
      console.log('[supervisor/employees] ✗ User is not a supervisor/organization, role:', userProfile?.role);
      return c.json({ error: 'Forbidden - Organization/Supervisor access required' }, 403);
    }

    let orgCode = userProfile.organizationCode;
    console.log('[supervisor/employees] Organization code from profile:', orgCode);
    
    // MIGRATION FIX: If supervisor doesn't have an org code, generate one now
    if (!orgCode) {
      console.log(`[Migration] Supervisor ${user.id} has no organization code, generating one...`);
      orgCode = generateOrgCode();
      
      // Store organization
      await kv.set(`organization:${orgCode}`, {
        code: orgCode,
        name: userProfile.organizationName,
        type: userProfile.organizationType,
        createdAt: new Date().toISOString(),
        createdBy: userProfile.email
      });
      
      // Update user profile with the new code
      const updatedProfile = {
        ...userProfile,
        organizationCode: orgCode
      };
      await kv.set(`user:${user.id}`, updatedProfile);
      
      console.log(`[Migration] Generated organization code ${orgCode} for supervisor ${user.id}`);
    }

    console.log('[supervisor/employees] Fetching all users...');
    const allUsers = await kv.getByPrefix('user:');
    console.log('[supervisor/employees] Total users in KV:', allUsers.length);
    
    // Filter users by organization code who are professionals
    const employees = allUsers.filter((u: any) => {
      const matches = u.organizationCode === orgCode && 
        (u.role === 'Professional/Organization' || u.role === 'professional') && 
        u.id !== user.id;
      
      if (u.organizationCode === orgCode) {
        console.log(`[supervisor/employees] User ${u.email} - orgCode match: ${u.organizationCode}, role: ${u.role}, matches: ${matches}`);
      }
      
      return matches;
    });

    console.log('[supervisor/employees] ✓ Found', employees.length, 'employees for org code:', orgCode);
    return c.json({ success: true, employees, organizationCode: orgCode });
  } catch (error) {
    console.log(`Error fetching supervised employees: ${error}`);
    return c.json({ error: 'Failed to fetch employees' }, 500);
  }
});

// Save supervisor review
app.post('/make-server-fc8eb847/supervisor/review', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const reviewData = await c.req.json();
    
    const userProfile = await kv.get(`user:${user.id}`);
    const normalizedRole = (userProfile?.role || '').toLowerCase();
    if (normalizedRole !== 'supervisor' && normalizedRole !== 'organization') {
      return c.json({ error: 'Forbidden - Organization/Supervisor access required' }, 403);
    }

    // Save review with timestamp
    const reviewKey = `review:${reviewData.professionalId}:${user.id}:${Date.now()}`;
    await kv.set(reviewKey, {
      ...reviewData,
      supervisorId: user.id,
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true, reviewId: reviewKey });
  } catch (error) {
    console.log(`Error saving supervisor review: ${error}`);
    return c.json({ error: 'Failed to save review' }, 500);
  }
});

// Get reviews for a professional
app.get('/make-server-fc8eb847/supervisor/reviews/:professionalId', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const professionalId = c.req.param('professionalId');
    const reviews = await kv.getByPrefix(`review:${professionalId}:`);

    return c.json({ success: true, reviews });
  } catch (error) {
    console.log(`Error fetching reviews: ${error}`);
    return c.json({ error: 'Failed to fetch reviews' }, 500);
  }
});

// ============= ORGANIZATION ROUTES =============

// Get organization members (for Professional/Organization role)
app.get('/make-server-fc8eb847/organization/members', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'Professional/Organization') {
      return c.json({ error: 'Forbidden - Organization access required' }, 403);
    }

    const orgName = userProfile.organizationName;
    const allUsers = await kv.getByPrefix('user:');
    
    // Filter users by organization name
    const members = allUsers.filter((u: any) => 
      u.organizationName === orgName && u.id !== user.id
    );

    return c.json({ success: true, members });
  } catch (error) {
    console.log(`Error fetching organization members: ${error}`);
    return c.json({ error: 'Failed to fetch members' }, 500);
  }
});

// Debug endpoint - Get all results for a user (for debugging only)
app.get('/make-server-fc8eb847/debug/user-results/:userId', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const targetUserId = c.req.param('userId');
    
    // Get all results for this user
    const allResults = await kv.getByPrefix(`result:${targetUserId}:`);
    
    console.log(`[DEBUG] Found ${allResults.length} results for user ${targetUserId}`);
    console.log(`[DEBUG] Results:`, JSON.stringify(allResults, null, 2));
    
    return c.json({ 
      success: true, 
      userId: targetUserId,
      count: allResults.length,
      results: allResults 
    });
  } catch (error) {
    console.log(`Error in debug endpoint: ${error}`);
    return c.json({ error: 'Failed to fetch debug data' }, 500);
  }
});

// MIGRATION: Fix professional's organization code
app.post('/make-server-fc8eb847/admin/fix-professional-org-code', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    if (user.email !== 'Alex.Attachey@gmail.com') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const { professionalEmail, organizationCode } = await c.req.json();
    
    if (!professionalEmail || !organizationCode) {
      return c.json({ error: 'Professional email and organization code are required' }, 400);
    }

    // Validate organization code exists
    const organization = await kv.get(`organization:${organizationCode}`);
    if (!organization) {
      return c.json({ error: 'Invalid organization code' }, 400);
    }

    // Find professional by email
    const allUsers = await kv.getByPrefix('user:');
    const professional = allUsers.find((u: any) => 
      u.email.toLowerCase() === professionalEmail.toLowerCase()
    );

    if (!professional) {
      return c.json({ error: 'Professional not found' }, 404);
    }

    if (professional.role !== 'professional' && professional.role !== 'Professional/Organization') {
      return c.json({ error: 'User is not a professional' }, 400);
    }

    // Update professional with organization code
    const updatedProfessional = {
      ...professional,
      organizationCode: organizationCode,
      organizationName: organization.name
    };

    await kv.set(`user:${professional.id}`, updatedProfessional);

    console.log(`[MIGRATION] Updated professional ${professionalEmail} with org code ${organizationCode}`);

    return c.json({ 
      success: true, 
      message: `Successfully linked ${professional.name} to organization ${organization.name}`,
      professional: updatedProfessional
    });
  } catch (error) {
    console.log(`Error fixing professional org code: ${error}`);
    return c.json({ error: 'Failed to fix organization code' }, 500);
  }
});

// ============= CHILDREN'S CHALLENGE ROUTES =============

// Get children's challenge progress
app.get('/make-server-fc8eb847/get-challenge-progress', async (c) => {
  try {
    const userId = c.req.query('userId');
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    const key = `children_challenge:${userId}`;
    const progressData = await kv.get(key);

    if (!progressData) {
      // Initialize new user progress
      const initialProgress = {
        completedChallenges: [],
        currentStreak: 0,
        totalStars: 0,
        lastCompletedDate: null,
      };

      await kv.set(key, initialProgress);
      
      return c.json({
        success: true,
        progress: initialProgress,
      });
    }

    return c.json({
      success: true,
      progress: progressData,
    });
  } catch (error) {
    console.error('Error getting children challenge progress:', error);
    return c.json({ 
      error: 'Failed to get challenge progress', 
      details: error instanceof Error ? error.message : String(error) 
    }, 500);
  }
});

// Save children's challenge progress
app.post('/make-server-fc8eb847/save-challenge-progress', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, challengeId, completedAt, currentStreak, totalStars } = body;

    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    const key = `children_challenge:${userId}`;
    const progressData = await kv.get(key) || {
      completedChallenges: [],
      currentStreak: 0,
      totalStars: 0,
      lastCompletedDate: null,
    };

    // Create challenge key
    const today = new Date().toDateString();
    const challengeKey = `${today}-${challengeId}`;
    
    // Check if already completed
    if (progressData.completedChallenges?.includes(challengeKey)) {
      return c.json({ error: 'Challenge already completed today' }, 400);
    }

    // Update progress
    const updatedProgress = {
      completedChallenges: [...(progressData.completedChallenges || []), challengeKey],
      currentStreak: currentStreak || (progressData.currentStreak || 0),
      totalStars: totalStars || (progressData.totalStars || 0),
      lastCompletedDate: completedAt,
    };

    await kv.set(key, updatedProgress);

    return c.json({
      success: true,
      progress: updatedProgress,
    });
  } catch (error) {
    console.error('Error saving children challenge progress:', error);
    return c.json({ 
      error: 'Failed to save challenge progress', 
      details: error instanceof Error ? error.message : String(error) 
    }, 500);
  }
});

// ============= MOOD METER ROUTES =============

// Get mood history
app.get('/make-server-fc8eb847/get-mood-history', async (c) => {
  try {
    const userId = c.req.query('userId');
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    const key = `mood_history:${userId}`;
    const historyData = await kv.get(key);

    if (!historyData) {
      // Initialize new user history
      const initialHistory = {
        history: [],
        currentStreak: 0,
      };

      await kv.set(key, initialHistory);
      
      return c.json({
        success: true,
        history: [],
        currentStreak: 0,
      });
    }

    return c.json({
      success: true,
      history: historyData.history || [],
      currentStreak: historyData.currentStreak || 0,
    });
  } catch (error) {
    console.error('Error getting mood history:', error);
    return c.json({ 
      error: 'Failed to get mood history', 
      details: error instanceof Error ? error.message : String(error) 
    }, 500);
  }
});

// Save mood
app.post('/make-server-fc8eb847/save-mood', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, mood, date, timestamp } = body;

    if (!userId || !mood) {
      return c.json({ error: 'User ID and mood are required' }, 400);
    }

    const key = `mood_history:${userId}`;
    const historyData = await kv.get(key) || {
      history: [],
      currentStreak: 0,
    };

    const today = new Date().toISOString().split('T')[0];
    const moodDate = date || timestamp ? new Date(date || timestamp).toISOString().split('T')[0] : today;

    // Check if mood already recorded for today
    const existingIndex = historyData.history?.findIndex((entry: any) => 
      entry.date.split('T')[0] === moodDate
    );

    let updatedHistory;
    if (existingIndex !== -1) {
      // Update existing mood
      updatedHistory = [...historyData.history];
      updatedHistory[existingIndex] = { mood, date: new Date().toISOString() };
    } else {
      // Add new mood
      updatedHistory = [...(historyData.history || []), { mood, date: new Date().toISOString() }];
    }

    // Calculate streak
    const sortedHistory = updatedHistory.sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 0;
    const oneDayMs = 24 * 60 * 60 * 1000;
    let checkDate = new Date(today);

    for (const entry of sortedHistory) {
      const entryDate = new Date(entry.date).toISOString().split('T')[0];
      const expectedDate = checkDate.toISOString().split('T')[0];
      
      if (entryDate === expectedDate) {
        streak++;
        checkDate = new Date(checkDate.getTime() - oneDayMs);
      } else {
        break;
      }
    }

    const updatedData = {
      history: updatedHistory,
      currentStreak: streak,
    };

    await kv.set(key, updatedData);

    return c.json({
      success: true,
      history: updatedHistory,
      currentStreak: streak,
    });
  } catch (error) {
    console.error('Error saving mood:', error);
    return c.json({ 
      error: 'Failed to save mood', 
      details: error instanceof Error ? error.message : String(error) 
    }, 500);
  }
});

console.log('JotMinds server starting...');

Deno.serve(app.fetch);