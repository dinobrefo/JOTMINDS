import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Assessment } from './components/Assessment';
import { AssessmentSummary } from './components/AssessmentSummary';
import { CognitiveProfile } from './components/CognitiveProfile';
import { AuthForm } from './components/AuthForm';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { AdminPanel } from './components/AdminPanel';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { ProfessionalDashboard } from './components/ProfessionalDashboard';
import { OrganizationApp } from './components/supervisor/OrganizationApp';
import { KidsModeWrapper } from './components/kids/KidsModeWrapper';
import { KidsModeDemo } from './components/kids/KidsModeDemo';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Toaster } from './components/ui/sonner';
import { createClient } from './utils/supabase/client';
import { setAuthToken, getUserData } from './utils/api';
import { UserConsentFlow } from './components/consent/UserConsentFlow';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { TermsOfUsePage } from './components/TermsOfUsePage';
import { ContactPage } from './components/ContactPage';

type ViewType = 
  | 'landing'
  | 'consent'
  | 'privacy-policy'
  | 'terms-of-use'
  | 'contact'
  | 'auth'
  | 'forgot-password'
  | 'reset-password'
  | 'organization'
  | 'dashboard' 
  | 'assessment' 
  | 'summary' 
  | 'profile' 
  | 'admin'
  | 'kids-demo';

type AssessmentType = 'learning' | 'thinking' | 'decision';

function AppContent() {
  const { user, loading, refreshUser, impersonatedUser, setImpersonatedUser, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentType | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [consentData, setConsentData] = useState<any>(null);

  // Set document title
  useEffect(() => {
    document.title = 'JotMinds - Discover How You Think';
  }, []);

  useEffect(() => {
    // Set up auth token on mount
    console.log('[App] ===== MOUNT - Setting up auth =====');
    const setupAuth = async () => {
      // Check if this is a password reset callback
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check for password recovery in the URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (type === 'recovery') {
        console.log('[App] Password recovery detected, showing reset password page');
        setCurrentView('reset-password');
        return;
      }
      
      // Check for admin session first - don't override with Supabase session
      const adminToken = localStorage.getItem('admin_token');
      const adminUser = localStorage.getItem('admin_user');
      
      console.log('[App] Checking localStorage...');
      console.log('[App] admin_token:', adminToken ? adminToken.substring(0, 30) + '...' : 'NOT FOUND');
      console.log('[App] admin_user:', adminUser ? 'FOUND' : 'NOT FOUND');
      
      if (adminToken) {
        console.log('[App] ✓ Admin token found in localStorage, using it');
        setAuthToken(adminToken);
        return;
      }

      console.log('[App] No admin token, checking Supabase session...');
      console.log('[App] Supabase session:', session ? 'FOUND' : 'NOT FOUND');
      
      if (session?.access_token) {
        console.log('[App] ✓ Supabase session found, using access token');
        setAuthToken(session.access_token);
      } else {
        console.log('[App] No authentication found');
      }
    };
    setupAuth();
  }, []);

  // Check if user is admin and set correct view
  useEffect(() => {
    console.log('[App] useEffect - Checking user role:', user?.role, 'currentView:', currentView, 'impersonatedUser:', impersonatedUser?.id);
    
    if (user?.role === 'admin' && (currentView === 'landing' || currentView === 'auth')) {
      console.log('[App] Admin detected, routing to admin panel');
      setCurrentView('admin');
    } else if (user?.role === 'admin' && currentView === 'dashboard' && !impersonatedUser) {
      // Force admins to admin panel if they somehow get to dashboard WITHOUT impersonation
      // BUT allow them to view dashboard when impersonating a user
      console.log('[App] ⚠️ Admin in dashboard view without impersonation! Redirecting to admin panel');
      setCurrentView('admin');
    } else if (user?.role === 'supervisor' || user?.role === 'Supervisor' || user?.role === 'organization' || user?.role === 'Organization') {
      // Supervisors should only use the Supervisor Portal, not the main app
      console.log('[App] ⚠️ Supervisor detected in main app, redirecting to supervisor portal');
      setCurrentView('organization');
    } else if (user && user.role !== 'admin' && user.role !== 'supervisor' && user.role !== 'Supervisor' && user.role !== 'organization' && user.role !== 'Organization' && (currentView === 'landing' || currentView === 'auth')) {
      console.log('[App] Regular user detected, routing to dashboard');
      setCurrentView('dashboard');
    }
  }, [user, currentView, impersonatedUser]);

  const handleAuthSuccess = async () => {
    console.log('[App] ===== handleAuthSuccess CALLED =====');
    
    // Check if admin user logged in FIRST, before refreshing
    const adminToken = localStorage.getItem('admin_token');
    const adminUser = localStorage.getItem('admin_user');
    
    console.log('[App] Checking admin credentials in handleAuthSuccess...');
    console.log('[App] admin_token:', adminToken ? adminToken.substring(0, 30) + '...' : 'NOT FOUND');
    console.log('[App] admin_user:', adminUser ? 'FOUND' : 'NOT FOUND');
    
    if (adminUser && adminToken) {
      const user = JSON.parse(adminUser);
      console.log('[App] Admin user detected:', user);
      if (user.role === 'admin') {
        console.log('[App] ✓ Setting auth token before navigating to admin panel...');
        setAuthToken(adminToken);
        console.log('[App] ✓ Refreshing user to load admin into state...');
        // Refresh user to ensure admin is loaded into state before navigating
        await refreshUser();
        console.log('[App] ✓ Navigating to admin panel...');
        setCurrentView('admin');
        console.log('[App] ===== Admin login flow complete =====');
        return;
      }
    }
    
    console.log('[App] Regular user login, refreshing user data...');
    // Refresh user first to get the latest user data
    await refreshUser();

    console.log('[App] ===== Auth success complete, user loaded into context =====');
    // For regular users, show the dashboard
    setCurrentView('dashboard');
  };

  const handleGetStarted = () => {
    setCurrentView('auth');
  };

  const handleSupervisorPortal = () => {
    setCurrentView('organization');
  };

  const handleKidsDemo = () => {
    console.log('[App] 🎨 Kids Mode Demo clicked! Switching to kids-demo view...');
    setCurrentView('kids-demo');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  const handleStartAssessment = (type: AssessmentType) => {
    setCurrentAssessment(type);
    setAssessmentResults(null);
    setCurrentView('assessment');
  };

  const handleAssessmentComplete = (results: any) => {
    setAssessmentResults(results);
    setCurrentView('summary');
  };

  const handleLogout = async () => {
    console.log('[App] Logout requested');
    await signOut();
    setCurrentView('landing');
    setCurrentAssessment(null);
    setAssessmentResults(null);
  };

  const handleBackToDashboard = () => {
    // Check if admin is viewing impersonated user
    if (user?.role === 'admin' && impersonatedUser) {
      // Return to admin panel
      setImpersonatedUser(null);
      setCurrentView('admin');
      return;
    }
    
    // For regular users, go to dashboard
    setCurrentView('dashboard');
    setCurrentAssessment(null);
    setAssessmentResults(null);
    
    // If we were viewing someone else's dashboard, clear impersonation
    if (impersonatedUser) {
      setImpersonatedUser(null);
    }
    refreshUser();
  };

  const handleStartNextAssessment = (type: AssessmentType) => {
    setCurrentAssessment(type);
    setAssessmentResults(null);
    setCurrentView('assessment');
    // Refresh user data to ensure we have latest assessment status
    refreshUser();
  };

  const handleViewProfile = () => {
    setCurrentView('profile');
  };

  const handleViewAdmin = () => {
    // Ensure admin token is set before navigating to admin panel
    const adminToken = localStorage.getItem('admin_token');
    const adminUser = localStorage.getItem('admin_user');
    
    console.log('[App] handleViewAdmin called');
    console.log('[App] admin_token in localStorage:', adminToken ? adminToken.substring(0, 30) + '...' : 'NOT FOUND');
    console.log('[App] admin_user in localStorage:', adminUser ? 'FOUND' : 'NOT FOUND');
    
    if (adminToken) {
      console.log('[App] Setting admin token in API before navigating to admin panel');
      setAuthToken(adminToken);
    } else {
      console.error('[App] ⚠️  CRITICAL: No admin token found when trying to view admin panel!');
      console.error('[App] User should be logged in as admin first');
    }
    
    setCurrentView('admin');
  };

  const handleViewUserDashboard = async (userId: string) => {
    try {
      const { user: userData } = await getUserData(userId);
      setImpersonatedUser(userData);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error loading user data:', error);
      alert('Failed to load user dashboard');
    }
  };

  const handleViewChildProfile = async (childId: string) => {
    try {
      const { user: childData } = await getUserData(childId);
      setImpersonatedUser(childData);
      setCurrentView('profile');
    } catch (error) {
      console.error('Error loading child profile:', error);
      alert('Failed to load child profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#2C2E83' }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Show landing page or auth form based on current view
    if (currentView === 'consent') {
      return (
        <UserConsentFlow
          onConsent={(data) => {
            console.log('[App] User consent collected:', data);
            setConsentData(data);
            // Store consent in localStorage (backend should also store it)
            localStorage.setItem('jotminds_consent', JSON.stringify(data));
            // Proceed to auth form
            setCurrentView('auth');
          }}
          onCancel={handleBackToLanding}
        />
      );
    }
    
    if (currentView === 'privacy-policy') {
      return <PrivacyPolicyPage onBack={handleBackToLanding} />;
    }
    
    if (currentView === 'terms-of-use') {
      return <TermsOfUsePage onBack={handleBackToLanding} />;
    }
    
    if (currentView === 'contact') {
      return <ContactPage onBack={handleBackToLanding} />;
    }
    
    if (currentView === 'auth') {
      return <AuthForm onLogin={handleAuthSuccess} onBack={handleBackToLanding} onForgotPassword={() => setCurrentView('forgot-password')} />;
    }
    
    if (currentView === 'forgot-password') {
      return <ForgotPasswordForm onBack={() => setCurrentView('auth')} />;
    }
    
    if (currentView === 'reset-password') {
      return <ResetPasswordForm onSuccess={() => setCurrentView('auth')} onBack={() => setCurrentView('auth')} />;
    }
    
    if (currentView === 'organization') {
      return <OrganizationApp onBackToMain={handleBackToLanding} initialUser={user} />;
    }
    
    if (currentView === 'kids-demo') {
      return <KidsModeDemo onBack={handleBackToLanding} />;
    }
    
    return (
      <LandingPage 
        onGetStarted={handleGetStarted}
        onSupervisorPortal={handleSupervisorPortal}
        onKidsDemo={handleKidsDemo}
        onViewPrivacyPolicy={() => setCurrentView('privacy-policy')}
        onViewTermsOfUse={() => setCurrentView('terms-of-use')}
        onViewContact={() => setCurrentView('contact')}
      />
    );
  }

  // Render based on current view
  switch (currentView) {
    case 'landing':
      return (
        <LandingPage 
          onGetStarted={handleGetStarted}
          onSupervisorPortal={handleSupervisorPortal}
          onKidsDemo={handleKidsDemo}
          onViewPrivacyPolicy={() => setCurrentView('privacy-policy')}
          onViewTermsOfUse={() => setCurrentView('terms-of-use')}
          onViewContact={() => setCurrentView('contact')}
        />
      );

    case 'kids-demo':
      return <KidsModeDemo onBack={handleBackToLanding} />;

    case 'organization':
      return (
        <OrganizationApp 
          onBackToMain={handleBackToLanding} 
          initialUser={user} 
          onLogout={handleLogout}
        />
      );

    case 'assessment':
      return currentAssessment ? (
        <Assessment
          type={currentAssessment}
          onComplete={handleAssessmentComplete}
          onBack={handleBackToDashboard}
        />
      ) : null;

    case 'summary':
      return assessmentResults && currentAssessment ? (
        <AssessmentSummary
          type={currentAssessment}
          results={assessmentResults.results}
          insights={assessmentResults.insights}
          onBackToDashboard={handleBackToDashboard}
          onStartNextAssessment={handleStartNextAssessment}
        />
      ) : null;

    case 'profile':
      return (
        <CognitiveProfile onBack={handleBackToDashboard} />
      );

    case 'admin':
      return (
        <AdminPanel 
          onBack={handleBackToDashboard}
          onLogout={handleLogout}
          onViewUserDashboard={handleViewUserDashboard}
        />
      );

    case 'dashboard':
    default:
      // Route to role-specific dashboards
      const displayUser = impersonatedUser || user;
      
      // Determine if we should logout or go back
      const logoutHandler = impersonatedUser ? handleBackToDashboard : handleLogout;
      
      // Normalize role to lowercase for comparison (handles old accounts with capitalized roles)
      const normalizedRole = displayUser.role?.toLowerCase();
      
      // Supervisors should not access dashboards - redirect to supervisor portal
      if (normalizedRole === 'supervisor' || normalizedRole === 'organization') {
        console.log('[App] Supervisor trying to access dashboard, redirecting to supervisor portal');
        return (
          <OrganizationApp 
            onBackToMain={handleBackToLanding} 
            initialUser={displayUser} 
            onLogout={logoutHandler}
          />
        );
      }
      
      if (normalizedRole === 'teacher') {
        return (
          <TeacherDashboard
            user={displayUser}
            onLogout={logoutHandler}
          />
        );
      }
      
      if (normalizedRole === 'student') {
        // Check if student should use Kids Mode (ages 6-10)
        // Calculate age if not already present
        let age = displayUser.age;
        if (!age && displayUser.dateOfBirth) {
          const birthDate = new Date(displayUser.dateOfBirth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }
        
        const shouldUseKidsMode = age && age >= 6 && age <= 10;
        console.log('[App] Student age check:', { age, dateOfBirth: displayUser.dateOfBirth, shouldUseKidsMode });
        
        if (shouldUseKidsMode) {
          return (
            <KidsModeWrapper
              user={displayUser}
              onLogout={logoutHandler}
            />
          );
        }
        
        return (
          <StudentDashboard
            user={displayUser}
            onLogout={logoutHandler}
          />
        );
      }
      
      if (normalizedRole === 'parent') {
        return (
          <ParentDashboard
            user={displayUser}
            onLogout={logoutHandler}
          />
        );
      }
      
      if (normalizedRole === 'professional' || normalizedRole === 'professional/organization') {
        return (
          <ProfessionalDashboard
            user={displayUser}
            onLogout={logoutHandler}
          />
        );
      }
      
      // Fallback to general dashboard for other roles
      return (
        <Dashboard
          onStartAssessment={handleStartAssessment}
          onViewProfile={handleViewProfile}
          onViewAdmin={user.role === 'admin' ? handleViewAdmin : undefined}
          onViewChildProfile={handleViewChildProfile}
        />
      );
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}