import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User, OrganizationType } from '../types';
import { signup } from '../utils/api';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Building2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { PasswordStrengthIndicator, checkPasswordStrength } from './PasswordStrengthIndicator';
import { Checkbox } from './ui/checkbox';

interface OrganizationAuthFormProps {
  onLogin: (user: User) => void;
  onBackToMain: () => void;
}

export function OrganizationAuthForm({ onLogin, onBackToMain }: OrganizationAuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState<OrganizationType>('Corporate');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('Weak');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      if (isLogin) {
        // Sign in using Supabase client
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
        console.log('[OrganizationAuth] Access token:', data.session.access_token.substring(0, 30) + '...');
        console.log('[OrganizationAuth] User ID:', data.user.id);
        
        // Fetch user profile from backend
        console.log('[OrganizationAuth] Fetching user profile from backend...');
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

          console.log('[OrganizationAuth] Profile fetch response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json();
            console.error('[OrganizationAuth] Profile fetch error:', errorData);
            setError(errorData.error || 'Failed to fetch user profile');
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }

          const responseData = await response.json();
          console.log('[OrganizationAuth] Full response data:', responseData);
          
          // The backend returns { success: true, user: {...} }
          userData = responseData.user || responseData;
        } catch (fetchError: any) {
          console.error('[OrganizationAuth] Network error fetching profile:', fetchError);
          
          // Backend not available - use Supabase metadata as fallback
          console.log('[OrganizationAuth] ⚠️  Backend not available, using Supabase metadata');
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
        console.log('[OrganizationAuth] User profile received:', { 
          id: userData.id, 
          email: userData.email, 
          role: userData.role,
          organizationName: userData.organizationName,
          fullUserData: userData
        });
        
        // Verify the user is an organization/supervisor (not a professional or other role)
        const userRole = (userData.role || '').toLowerCase();
        const isOrgAccount = userRole === 'organization' || userRole === 'supervisor';
        
        if (!isOrgAccount) {
          console.error('[OrganizationAuth] User is not an organization account');
          console.error('[OrganizationAuth] Role received:', userData.role);
          console.error('[OrganizationAuth] Normalized role:', userRole);
          setError(`This account is not registered as an organization. Your role is: "${userData.role}". Please use the main application.`);
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
        
        console.log('[OrganizationAuth] ✓ Organization verified, calling onLogin');
        
        // Call onLogin with the user data
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
      } else {
        // Sign up
        if (!organizationName || !position) {
          setError('Organization name and position are required.');
          setLoading(false);
          return;
        }

        // Validate consent
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

        const result = await signup({
          email,
          password,
          name,
          role: 'organization',
          organizationName,
          organizationType,
          position,
          phone,
          hasConsented: true,
          consentType: 'organizational',
          consentDate: new Date().toISOString()
        });

        // Show organization code to organization admin
        if (result.organizationCode) {
          alert(`✅ Account created successfully!\n\nYour Organization Code: ${result.organizationCode}\n\nShare this code with your team members so they can join your organization.\n\nYou can also find this code in your dashboard after logging in.`);
        }

        // Auto-login after signup using Supabase client
        console.log('[OrganizationAuth] Auto-login after signup...');
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

        console.log('[OrganizationAuth] Auto-login successful, fetching profile...');
        console.log('[OrganizationAuth] Access token:', data.session.access_token.substring(0, 30) + '...');

        // Fetch user profile
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-fc8eb847/session`,
          {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`
            }
          }
        );

        console.log('[OrganizationAuth] Profile fetch response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[OrganizationAuth] Profile fetch failed:', errorData);
          setError(errorData.error || 'Failed to fetch user profile');
          setLoading(false);
          return;
        }

        const responseData = await response.json();
        console.log('[OrganizationAuth] Profile data received:', responseData);
        
        // The backend returns { success: true, user: {...} }
        const userData = responseData.user || responseData;
        
        console.log('[OrganizationAuth] User role from backend:', userData.role);
        
        // Verify this is an organization account
        const userRole = userData.role?.toLowerCase();
        if (userRole !== 'organization') {
          console.error('[OrganizationAuth] ⚠️ WARNING: User registered as organization but role is:', userData.role);
          console.error('[OrganizationAuth] This may indicate a backend data issue');
          // Still proceed to login but log the warning
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
      }
    } catch (err: any) {
      console.error('[OrganizationAuth] Error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-100">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={onBackToMain}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Main App
        </Button>
        
        <Card className="w-full border-2 shadow-large">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                JotMinds Organization Portal
              </h1>
              <p className="text-sm text-muted-foreground">Organizational Assessment Management</p>
            </div>
            <CardDescription className="text-center text-base">
              {isLogin 
                ? 'Access your organizational dashboard' 
                : 'Register your organization for cognitive assessment management'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@organization.com"
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
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input
                      id="organizationName"
                      type="text"
                      placeholder="Your organization"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizationType">Organization Type</Label>
                    <Select value={organizationType} onValueChange={(val) => setOrganizationType(val as OrganizationType)}>
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
                      placeholder="e.g., HR Manager, Team Lead"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      required
                    />
                  </div>

                  <Alert className="border-purple-200 bg-purple-50">
                    <AlertCircle className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-900 text-sm">
                      ✨ Upon registration, you'll receive a unique <strong>Organization Code</strong> to share with your team members. They can use this code to join your organization when signing up as a Professional.
                    </AlertDescription>
                  </Alert>

                  {/* Consent Section */}
                  <div className="space-y-3 pt-2">
                    <Alert className="border-purple-200 bg-purple-50">
                      <AlertCircle className="h-4 w-4" style={{ color: '#7B61FF' }} />
                      <AlertDescription className="text-sm">
                        <div className="space-y-2">
                          <p className="font-semibold" style={{ color: '#2C2E83' }}>Organizational Terms and Consent</p>
                          <p className="text-gray-700">
                            By registering your organization, you agree to the collection and use of assessment data from your team members 
                            to provide organizational insights and team analytics. All data will be stored securely and used only for 
                            providing cognitive assessment services.
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-start gap-3 p-3 border-2 border-purple-200 rounded-lg bg-white">
                      <Checkbox 
                        id="orgConsent" 
                        checked={hasConsented}
                        onCheckedChange={(checked) => setHasConsented(checked as boolean)}
                        className="mt-1"
                      />
                      <label 
                        htmlFor="orgConsent" 
                        className="text-sm cursor-pointer leading-relaxed"
                      >
                        I agree to register this organization for JotMinds cognitive assessments and consent to the collection 
                        and use of organizational assessment data for the purpose of providing team insights and analytics.
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

              <Button type="submit" className="w-full" disabled={loading}>
                {isLogin ? 'Login to Portal' : 'Register Organization'}
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