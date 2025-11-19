import { useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { authenticateAdmin, createAdminUser } from '../utils/storage';
import { setAuthToken } from '../utils/api';
import { signup } from '../utils/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PasswordStrengthIndicator, checkPasswordStrength } from './PasswordStrengthIndicator';
import { Checkbox } from './ui/checkbox';

interface AuthFormProps {
  onLogin: () => void;
  onBack?: () => void;
}

export function AuthForm({ onLogin, onBack }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');
  const [role, setRole] = useState('Student');
  const [educationLevel, setEducationLevel] = useState('JHS');
  const [dateOfBirth, setDateOfBirth] = useState(''); // Changed from age to dateOfBirth
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('Corporate');
  const [position, setPosition] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
  const [verifiedOrgName, setVerifiedOrgName] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Determine if user is a minor (under 18)
  const isMinor = role === 'student' && dateOfBirth && calculateAge(dateOfBirth) < 18;

  const validateOrgCode = async () => {
    if (!organizationCode.trim()) {
      setError('Please enter an organization code');
      return;
    }

    setVerifyingCode(true);
    setError('');
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-fc8eb847/validate-org-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ code: organizationCode.toUpperCase() })
      });

      const data = await response.json();
      
      if (data.valid) {
        setVerifiedOrgName(data.organizationName);
        setOrganizationName(data.organizationName);
      } else {
        setError(data.error || 'Invalid organization code');
        setVerifiedOrgName('');
      }
    } catch (error) {
      console.error('Error validating org code:', error);
      setError('Failed to validate organization code');
      setVerifiedOrgName('');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('[AuthForm] ===== SUBMIT STARTED =====');
    console.log('[AuthForm] isLogin:', isLogin);
    console.log('[AuthForm] Email:', email);
    console.log('[AuthForm] Password length:', password.length);

    try {
      if (isLogin) {
        // Check for admin login first using the multi-admin system
        console.log('[AuthForm] Checking if admin login...');
        
        if (authenticateAdmin(email, password)) {
          console.log('[AuthForm] ✓ ADMIN LOGIN DETECTED');
          
          // Admin login - bypass Supabase using multi-admin system
          const adminUser = createAdminUser(email);
          
          // Create a mock session for admin
          const adminToken = 'admin-token-' + Date.now();
          console.log('[AuthForm] Generated admin token:', adminToken);
          
          // Store admin user and token in localStorage
          console.log('[AuthForm] Saving to localStorage...');
          localStorage.setItem('admin_user', JSON.stringify(adminUser));
          localStorage.setItem('admin_token', adminToken);
          
          // Verify it was saved
          const savedUser = localStorage.getItem('admin_user');
          const savedToken = localStorage.getItem('admin_token');
          console.log('[AuthForm] Verification - Saved user:', savedUser);
          console.log('[AuthForm] Verification - Saved token:', savedToken);
          
          if (!savedUser || !savedToken) {
            console.error('[AuthForm] ❌ CRITICAL: Failed to save admin credentials to localStorage!');
            setError('Failed to save admin session. Please try again.');
            setLoading(false);
            return;
          }
          
          console.log('[AuthForm] Calling setAuthToken...');
          setAuthToken(adminToken);
          
          console.log('[AuthForm] Waiting 100ms for token to propagate...');
          // Give the token time to propagate through the system
          await new Promise(resolve => setTimeout(resolve, 100));
          
          console.log('[AuthForm] Calling onLogin...');
          onLogin();
          
          setLoading(false);
          console.log('[AuthForm] ✓ ADMIN LOGIN COMPLETE');
          return;
        }

        console.log('[AuthForm] Not admin login, using Supabase...');
        // Regular sign in through Supabase
        const supabase = createClient();
        console.log('[AuthForm] Attempting Supabase signInWithPassword...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log('[AuthForm] Supabase response - data:', !!data, 'error:', error?.message || 'none');

        if (error) {
          console.error('[AuthForm] Supabase login error:', error.message);
          
          // Provide user-friendly error messages
          if (error.message.includes('Invalid login credentials')) {
            setError('Incorrect email or password. Please check your credentials and try again, or create a new account if you don\'t have one.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please confirm your email address before logging in.');
          } else {
            setError(error.message);
          }
          
          setLoading(false);
          return;
        }

        console.log('[AuthForm] Supabase login successful');
        if (data.session?.access_token) {
          // MIGRATION FIX: Ensure role is lowercase
          // This fixes users who registered with capitalized roles
          const userMetadata = data.user?.user_metadata;
          if (userMetadata?.role) {
            const role = userMetadata.role;
            const normalizedRole = role === 'Professional/Organization' ? 'professional' : role.toLowerCase();
            
            // If role was capitalized or "Professional/Organization", fix it
            if (role !== normalizedRole) {
              console.log(`[AuthForm] Migrating role from "${role}" to "${normalizedRole}"`);
              try {
                await supabase.auth.updateUser({
                  data: { 
                    ...userMetadata,
                    role: normalizedRole
                  }
                });
                console.log('[AuthForm] ✓ Role migrated successfully');
              } catch (migrationError) {
                console.error('[AuthForm] Failed to migrate role:', migrationError);
              }
            }
          }
          
          setAuthToken(data.session.access_token);
          onLogin();
        }
      } else {
        // Sign up - keep roles lowercase for consistency
        console.log('[AuthForm] Attempting signup...');
        
        // Validate consent for registration
        if (!hasConsented) {
          setError('Please provide consent to proceed with registration.');
          setLoading(false);
          return;
        }
        
        // Validate password strength for new signups
        const passwordCheck = checkPasswordStrength(password);
        if (!passwordCheck.isValid) {
          setError('Please create a stronger password. Meet at least 4 out of 5 password requirements.');
          setLoading(false);
          return;
        }
        
        const signupData = {
          email,
          password,
          name,
          role: role, // Use lowercase role directly
          organizationName: role === 'professional' ? organizationName : undefined,
          organizationType: role === 'professional' ? organizationType : undefined,
          position: role === 'professional' ? position : undefined,
          organizationCode: role === 'professional' && organizationCode ? organizationCode.toUpperCase() : undefined,
          phone,
          school: role === 'student' || role === 'teacher' ? school : undefined,
          educationLevel: role === 'student' ? educationLevel : undefined,
          dateOfBirth: role === 'student' && dateOfBirth ? dateOfBirth : undefined,
          hasConsented: true,
          consentType: isMinor ? 'parental' : 'individual',
          consentDate: new Date().toISOString()
        };
        
        console.log('[AuthForm] Signup data:', { ...signupData, password: '[REDACTED]' });
        
        try {
          const result = await signup(signupData);
          console.log('[AuthForm] Signup successful:', result);
        } catch (signupError: any) {
          console.error('[AuthForm] Signup error:', signupError);
          
          // Provide user-friendly error messages for signup errors
          if (signupError.message?.includes('already registered')) {
            setError('This email is already registered. Please login instead or use a different email.');
          } else if (signupError.message?.includes('invalid email')) {
            setError('Please enter a valid email address.');
          } else if (signupError.message?.includes('Password')) {
            setError('Password must be at least 6 characters long.');
          } else {
            setError(signupError.message || 'Failed to create account. Please try again.');
          }
          setLoading(false);
          return;
        }

        // Auto sign in after signup
        console.log('[AuthForm] Signup complete, attempting auto-login...');
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('[AuthForm] Auto-login after signup failed:', error.message);
          setError('Account created successfully, but auto-login failed. Please login manually.');
          setLoading(false);
          return;
        }

        if (data.session?.access_token) {
          console.log('[AuthForm] Auto-login successful');
          setAuthToken(data.session.access_token);
          onLogin();
        }
      }
    } catch (err: any) {
      console.error('[AuthForm] Unexpected error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-cyan-50 via-violet-50 to-indigo-50">
      <div className="w-full max-w-md">
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        )}
        <Card className="w-full border-2 shadow-large">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1FC8E1] via-[#7B61FF] to-[#2C2E83] bg-clip-text text-transparent mb-2">
                JotMinds
              </h1>
              <p className="text-sm text-muted-foreground">Discover How You Think</p>
            </div>
            <CardDescription className="text-center text-base">
              {isLogin ? 'Welcome back to your cognitive journey' : 'Begin understanding how your mind works'}
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              {/* Only show password strength indicator during registration */}
              {!isLogin && <PasswordStrengthIndicator password={password} />}
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+233 XX XXX XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">I am a...</Label>
                  <Select value={role} onValueChange={(val) => {
                    setRole(val);
                    // Reset consent when role changes as consent text may change
                    setHasConsented(false);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(role === 'student' || role === 'teacher') && (
                  <div className="space-y-2">
                    <Label htmlFor="school">School Name</Label>
                    <Input
                      id="school"
                      type="text"
                      placeholder="Name of your school"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      required
                    />
                  </div>
                )}

                {role === 'student' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="level">Education Level</Label>
                      <Select value={educationLevel} onValueChange={(val) => setEducationLevel(val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Elementary">Elementary (Primary School)</SelectItem>
                          <SelectItem value="JHS">JHS (Junior High School)</SelectItem>
                          <SelectItem value="SHS">SHS (Senior High School)</SelectItem>
                          <SelectItem value="Tertiary">Tertiary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        placeholder="Your date of birth"
                        value={dateOfBirth}
                        onChange={(e) => {
                          setDateOfBirth(e.target.value);
                          // Reset consent when date of birth changes as it may affect consent type (parental vs individual)
                          setHasConsented(false);
                        }}
                      />
                    </div>
                  </>
                )}

                {(role === 'professional' || role === 'supervisor') && (
                  <>
                    {role === 'professional' && (
                      <div className="space-y-2">
                        <Label htmlFor="organizationCode">Organization Code (Optional)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="organizationCode"
                            type="text"
                            placeholder="JOTM-XXXXXX"
                            value={organizationCode}
                            onChange={(e) => {
                              setOrganizationCode(e.target.value.toUpperCase());
                              setVerifiedOrgName(''); // Clear verification when code changes
                            }}
                            disabled={!!verifiedOrgName}
                          />
                          <Button
                            type="button"
                            onClick={validateOrgCode}
                            disabled={verifyingCode || !!verifiedOrgName || !organizationCode}
                            className="whitespace-nowrap"
                          >
                            {verifyingCode ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : verifiedOrgName ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              'Verify'
                            )}
                          </Button>
                        </div>
                        {verifiedOrgName && (
                          <Alert>
                            <CheckCircle2 className="h-4 w-4" style={{ color: '#10B981' }} />
                            <AlertDescription>
                              Verified: <strong>{verifiedOrgName}</strong>
                            </AlertDescription>
                          </Alert>
                        )}
                        <p className="text-xs text-muted-foreground">
                          If you have an organization code from your supervisor, enter it here. Otherwise, you can skip this field.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="organizationName">Organization Name</Label>
                      <Input
                        id="organizationName"
                        type="text"
                        placeholder="Your organization"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        disabled={role === 'professional' && !!verifiedOrgName}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organizationType">Organization Type</Label>
                      <Select value={organizationType} onValueChange={(val) => setOrganizationType(val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Corporate">Corporate</SelectItem>
                          <SelectItem value="NGO">NGO</SelectItem>
                          <SelectItem value="Government">Government</SelectItem>
                          <SelectItem value="Startup">Startup</SelectItem>
                          <SelectItem value="Educational Institution">Educational Institution</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position">Position/Role</Label>
                      <Input
                        id="position"
                        type="text"
                        placeholder="Your position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Consent Section - Only show during registration */}
            {!isLogin && (
              <div className="space-y-3 pt-2">
                <Alert className="border-purple-200 bg-purple-50">
                  <AlertCircle className="h-4 w-4" style={{ color: '#7B61FF' }} />
                  <AlertDescription className="text-sm">
                    {isMinor ? (
                      <div className="space-y-2">
                        <p className="font-semibold" style={{ color: '#2C2E83' }}>Parental Consent Required</p>
                        <p className="text-gray-700">
                          As you are under 18 years old, a parent or legal guardian must provide consent for you to use JotMinds. 
                          By checking the box below, your parent/guardian confirms they have read and agree to our terms.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="font-semibold" style={{ color: '#2C2E83' }}>Terms and Consent</p>
                        <p className="text-gray-700">
                          By registering, you agree to the collection and use of your assessment data to provide personalized insights 
                          and recommendations. Your data will be stored securely and used only for improving your learning experience.
                        </p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="flex items-start gap-3 p-3 border-2 border-purple-200 rounded-lg bg-white">
                  <Checkbox 
                    id="consent" 
                    checked={hasConsented}
                    onCheckedChange={(checked) => setHasConsented(checked as boolean)}
                    className="mt-1"
                  />
                  <label 
                    htmlFor="consent" 
                    className="text-sm cursor-pointer leading-relaxed"
                  >
                    {isMinor ? (
                      <>
                        I am a parent/legal guardian and I consent to my child's participation in JotMinds assessments. 
                        I understand that assessment data will be collected and used to provide educational insights.
                      </>
                    ) : (
                      <>
                        I agree to participate in JotMinds assessments and consent to the collection and use of my assessment data 
                        for the purpose of providing personalized learning insights and recommendations.
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {isLogin ? 'Login' : 'Register'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}