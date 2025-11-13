import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { setAuthToken, clearAuthToken, getSession } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationName?: string;
  assessmentsCompleted?: string[];
  cognitiveProfile?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  impersonatedUser: User | null;
  setImpersonatedUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      console.log('[AuthContext] ===== REFRESH USER STARTED =====');
      
      // Check for admin session first
      const adminUser = localStorage.getItem('admin_user');
      const adminToken = localStorage.getItem('admin_token');
      
      console.log('[AuthContext] Admin user in localStorage:', adminUser ? 'FOUND' : 'NOT FOUND');
      console.log('[AuthContext] Admin token in localStorage:', adminToken ? adminToken.substring(0, 30) + '...' : 'NOT FOUND');
      
      if (adminUser && adminToken) {
        const user = JSON.parse(adminUser);
        console.log('[AuthContext] ✓ Setting admin user:', user);
        setUser(user);
        
        console.log('[AuthContext] Calling setAuthToken with admin token...');
        setAuthToken(adminToken);
        console.log('[AuthContext] ✓ Admin user session established');
        
        setLoading(false);
        return;
      }

      console.log('[AuthContext] No admin session, checking Supabase...');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('[AuthContext] Supabase session:', session ? 'FOUND' : 'NOT FOUND');
      
      if (session?.access_token) {
        console.log('[AuthContext] Setting Supabase token...');
        setAuthToken(session.access_token);
        
        try {
          console.log('[AuthContext] Fetching user data from backend...');
          const userData = await getSession();
          console.log('[AuthContext] User data received:', userData.user);
          setUser(userData.user);
        } catch (sessionError: any) {
          // 401 errors are expected when the user is not authenticated - not a real error
          if (sessionError.message === 'Unauthorized') {
            console.log('[AuthContext] Session fetch returned 401 - no active session (expected for logged out users)');
          } else {
            console.error('[AuthContext] ✗ Error fetching session from backend:', sessionError);
          }
          // If backend session fetch fails, sign out to clear invalid state
          console.log('[AuthContext] Clearing invalid session...');
          await supabase.auth.signOut();
          setUser(null);
          setAuthToken(null);
        }
      } else {
        console.log('[AuthContext] No authentication, clearing user');
        setUser(null);
        setAuthToken(null);
      }
    } catch (error) {
      console.error('[AuthContext] ✗ Error refreshing user:', error);
      setUser(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
      console.log('[AuthContext] ===== REFRESH USER COMPLETE =====');
    }
  };

  useEffect(() => {
    refreshUser();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AuthContext] ===== AUTH STATE CHANGE =====');
      console.log('[AuthContext] Event:', _event);
      console.log('[AuthContext] Session:', session ? 'EXISTS' : 'NULL');
      
      // Don't update if we have an admin session
      const adminUser = localStorage.getItem('admin_user');
      const adminToken = localStorage.getItem('admin_token');
      
      console.log('[AuthContext] Admin user in localStorage:', adminUser ? 'FOUND' : 'NOT FOUND');
      console.log('[AuthContext] Admin token in localStorage:', adminToken ? 'FOUND' : 'NOT FOUND');
      
      if (adminUser && adminToken) {
        console.log('[AuthContext] 🛡️  Admin session active - ignoring Supabase auth state change');
        // Keep admin session active - don't let Supabase override it
        return;
      }
      
      console.log('[AuthContext] No admin session, processing Supabase auth change...');
      if (session?.access_token) {
        console.log('[AuthContext] Setting Supabase token from auth change');
        setAuthToken(session.access_token);
        refreshUser();
      } else {
        console.log('[AuthContext] No session, clearing user');
        setUser(null);
        setAuthToken(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Clear admin user from localStorage
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setImpersonatedUser(null);
    clearAuthToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser, impersonatedUser, setImpersonatedUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};