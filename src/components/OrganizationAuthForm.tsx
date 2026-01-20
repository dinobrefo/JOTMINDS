import { ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, Building2, Mail, Lock, User, Phone, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User as UserType, OrganizationType, IndustrySector } from '../types';
import { signup, setAuthToken } from '../utils/api';
import { Alert, AlertDescription } from './ui/alert';
import { createClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { PasswordStrengthIndicator, checkPasswordStrength } from './PasswordStrengthIndicator';
import { Checkbox } from './ui/checkbox';

interface OrganizationAuthFormProps {
  onLogin: (user: UserType) => void;
  onBackToMain: () => void;
}

export function OrganizationAuthForm({ onLogin, onBackToMain }: OrganizationAuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [registrationStep, setRegistrationStep] = useState(1); // Step 1-3 for multi-step registration
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState<OrganizationType>('Corporate');
  const [industrySector, setIndustrySector] = useState<IndustrySector>('Technology');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  // Step validation functions
  const validateStep1 = (): boolean => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return false;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    const passwordCheck = checkPasswordStrength(password);
    if (!passwordCheck.isValid) {
      setError('Please create a stronger password. Meet at least 4 out of 5 password requirements.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!name || !phone) {
      setError('Please fill in all fields');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!organizationName || !position) {
      setError('Please fill in all organization fields');
      return false;
    }
    if (!hasConsented) {
      setError('Please provide consent to proceed with registration');
      return false;
    }
    return true;
  };

  // Handle step navigation
  const handleNextStep = () => {
    setError('');
    
    if (registrationStep === 1 && !validateStep1()) {
      return;
    }
    if (registrationStep === 2 && !validateStep2()) {
      return;
    }
    
    setRegistrationStep(registrationStep + 1);
  };

  const handlePreviousStep = () => {
    setError('');
    setRegistrationStep(registrationStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For login, submit immediately
    if (isLogin) {
      await processLogin();
      return;
    }

    // For registration on step 3, validate and submit
    if (registrationStep === 3) {
      if (!validateStep3()) {
        return;
      }
      await processRegistration();
    }
  };

  const processLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      
      console.log('[OrganizationAuth] Signing in with email:', email);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        console.error('[OrganizationAuth] Sign in error:', signInError);
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        console.error('[OrganizationAuth] No session returned after sign in');
        setError('Failed to create session. Please try again.');
        setLoading(false);
        return;
      }

      console.log('[OrganizationAuth] Sign in successful, session created');
      
      // Store the access token for API requests
      console.log('[OrganizationAuth] Setting auth token for API requests');
      setAuthToken(data.session.access_token);
      
      // Fetch user profile from backend
      let userData;
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-fc8eb847/session`,
          {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[OrganizationAuth] Profile fetch error:', errorData);
          setError(errorData.error || 'Failed to fetch user profile');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        const responseData = await response.json();
        userData = responseData.user || responseData;
      } catch (fetchError: any) {
        console.error('[OrganizationAuth] Network error fetching profile:', fetchError);
        
        // Backend not available - use Supabase metadata as fallback
        userData = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || '',
          role: data.user.user_metadata?.role || '',
          organizationName: data.user.user_metadata?.organizationName || '',
          organizationType: data.user.user_metadata?.organizationType,
          position: data.user.user_metadata?.position,
          phone: data.user.user_metadata?.phone || ''
        };
      }
      
      // Verify the user is an organization/supervisor
      const userRole = (userData.role || '').toLowerCase();
      const isOrgAccount = userRole === 'organization' || userRole === 'supervisor';
      
      if (!isOrgAccount) {
        setError(`This account is not registered as an organization. Your role is: "${userData.role}". Please use the main application.`);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      
      onLogin({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: 'organization',
        organizationName: userData.organizationName,
        organizationType: userData.organizationType,
        position: userData.position,
        phone: userData.phone || '',
        school: '',
        createdAt: userData.createdAt
      });
    } catch (err: any) {
      console.error('[OrganizationAuth] Error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processRegistration = async () => {
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      const result = await signup({
        email,
        password,
        name,
        role: 'organization',
        organizationName,
        organizationType,
        industrySector,
        position,
        phone,
        hasConsented: true,
        consentType: 'organizational',
        consentDate: new Date().toISOString()
      });

      // Show organization code
      if (result.organizationCode) {
        alert(`✅ Account created successfully!\n\nYour Organization Code: ${result.organizationCode}\n\nShare this code with your team members so they can join your organization.\n\nYou can also find this code in your dashboard after logging in.`);
      }

      // Auto-login after signup
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        console.error('[OrganizationAuth] Auto-login error:', signInError);
        setError('Account created but auto-login failed. Please log in manually.');
        setLoading(false);
        return;
      }

      // Fetch user profile
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-fc8eb847/session`,
        {
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch user profile');
        setLoading(false);
        return;
      }

      const responseData = await response.json();
      const userData = responseData.user || responseData;
      
      onLogin({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: 'organization',
        organizationName: userData.organizationName,
        organizationType: userData.organizationType,
        position: userData.position,
        phone: userData.phone || '',
        school: '',
        createdAt: userData.createdAt
      });
    } catch (err: any) {
      console.error('[OrganizationAuth] Error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md">
        {onBackToMain && (
          <Button
            variant="ghost"
            onClick={onBackToMain}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Main App
          </Button>
        )}
        
        <Card className="w-full border-2 shadow-large">
          <CardHeader className="space-y-3 text-center pb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                JotMinds Organization Portal
              </h1>
              <p className="text-sm text-muted-foreground">Organizational Assessment Management</p>
            </div>
            <CardDescription className="text-center text-base text-foreground/80 dark:text-foreground/90">
              {isLogin 
                ? 'Welcome back to your organizational dashboard' 
                : 'Your organizational journey begins here'}
            </CardDescription>
            
            {/* Progress Indicator - Only show during registration */}
            {!isLogin && (
              <div className="pt-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-2 rounded-full transition-all ${
                        step === registrationStep
                          ? 'w-8 bg-gradient-to-r from-purple-600 to-indigo-600'
                          : step < registrationStep
                          ? 'w-2 bg-purple-600'
                          : 'w-2 bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Step {registrationStep} of 3
                </p>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* LOGIN FORM */}
              {isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@organization.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* REGISTRATION FORM - STEP 1: Email + Password */}
              {!isLogin && registrationStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@organization.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <PasswordStrengthIndicator password={password} />
                  </div>
                </>
              )}

              {/* REGISTRATION FORM - STEP 2: Full Name + Phone */}
              {!isLogin && registrationStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="pl-10 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pb-2">
                    <Label htmlFor="phone">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+233 XX XXX XXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="pl-10 shadow-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Include country code (e.g., +1 for US, +233 for Ghana, +44 for UK)
                    </p>
                  </div>
                </>
              )}

              {/* REGISTRATION FORM - STEP 3: Organization Details + Consent */}
              {!isLogin && registrationStep === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">
                      Organization Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="organizationName"
                        type="text"
                        placeholder="Your organization"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        required
                        className="pl-10 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizationType">Organization Type</Label>
                    <Select value={organizationType} onValueChange={(val) => setOrganizationType(val as OrganizationType)}>
                      <SelectTrigger className="shadow-sm">
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
                    <Label htmlFor="industrySector">Industry Sector</Label>
                    <Select value={industrySector} onValueChange={(val) => setIndustrySector(val as IndustrySector)}>
                      <SelectTrigger className="shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Educational Institutions">Educational Institutions</SelectItem>
                        <SelectItem value="Agriculture">Agriculture</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Financial Services">Financial Services</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                        <SelectItem value="Retail & Distribution">Retail & Distribution</SelectItem>
                        <SelectItem value="Logistics & Transport">Logistics & Transport</SelectItem>
                        <SelectItem value="Hospitality & Tourism">Hospitality & Tourism</SelectItem>
                        <SelectItem value="Energy & Utilities">Energy & Utilities</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">
                      Position/Role <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="position"
                        type="text"
                        placeholder="e.g., HR Manager, Team Lead"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        required
                        className="pl-10 shadow-sm"
                      />
                    </div>
                  </div>

                  <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
                    <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <AlertDescription className="text-purple-900 dark:text-purple-200 text-sm">
                      ✨ Upon registration, you'll receive a unique <strong>Organization Code</strong> to share with your team members.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3 pt-2">
                    <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
                      <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <AlertDescription className="text-sm">
                        <div className="space-y-2">
                          <p className="font-semibold text-purple-900 dark:text-purple-200">Organizational Terms and Consent</p>
                          <p className="text-gray-700 dark:text-gray-300">
                            By registering your organization, you agree to the collection and use of assessment data from your team members 
                            to provide organizational insights and team analytics.
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-start gap-3 p-3 border-2 border-purple-200 rounded-lg bg-white dark:bg-gray-900 dark:border-purple-800">
                      <Checkbox 
                        id="orgConsent" 
                        checked={hasConsented}
                        onCheckedChange={(checked) => setHasConsented(checked as boolean)}
                        className="mt-1"
                      />
                      <label 
                        htmlFor="orgConsent" 
                        className="text-sm cursor-pointer leading-relaxed dark:text-gray-300"
                      >
                        I agree to register this organization for JotMinds cognitive assessments and consent to the collection 
                        and use of organizational assessment data for team insights and analytics.
                      </label>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Navigation Buttons - For registration steps 1-2 */}
              {!isLogin && registrationStep < 3 && (
                <div className="flex gap-2">
                  {registrationStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="flex-1"
                      aria-label="Go back to previous step"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1"
                    aria-label="Continue to next step"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Submit Button - For login and final registration step */}
              {(isLogin || registrationStep === 3) && (
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Processing...' : (
                    isLogin ? 'Login to Portal' : 'Register Organization'
                  )}
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setRegistrationStep(1);
                  setError('');
                }}
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