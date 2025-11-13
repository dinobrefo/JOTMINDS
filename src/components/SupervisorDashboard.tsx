import { useState, useEffect } from 'react';
import { User, SupervisorReviewData } from '../types';
import { getAllUsers, getAssessmentsByUserId, saveReview, getReviewsByProfessional, getReviewsBySupervisor } from '../utils/storage';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { SupervisorReview } from './SupervisorReview';
import { 
  Building2, 
  LogOut, 
  Users, 
  FileText, 
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  UserCheck,
  BarChart3,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';

interface SupervisorDashboardProps {
  user: User;
  onLogout: () => void;
}

export function SupervisorDashboard({ user, onLogout }: SupervisorDashboardProps) {
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [organizationCode, setOrganizationCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    loadProfessionals();
  }, [user.organizationName]);

  const loadProfessionals = async () => {
    try {
      // Get the current Supabase session
      const supabase = createClient(projectId, publicAnonKey);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('[SupervisorDashboard] No active session');
        toast.error('Session expired. Please log in again.');
        return;
      }

      const token = session.access_token;
      
      console.log('[SupervisorDashboard] Loading professionals and organization code...');
      console.log('[SupervisorDashboard] Using token:', token ? token.substring(0, 30) + '...' : 'NO TOKEN');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-fc8eb847/supervisor/employees`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('[SupervisorDashboard] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[SupervisorDashboard] Received data:', data);
        setProfessionals(data.employees || []);
        setOrganizationCode(data.organizationCode || '');
        console.log('[SupervisorDashboard] Organization code:', data.organizationCode);
        
        if (data.organizationCode) {
          toast.success('Organization code loaded successfully!');
        }
      } else {
        const errorData = await response.json();
        console.error('[SupervisorDashboard] Error response:', errorData);
        console.error('[SupervisorDashboard] Status:', response.status);
        toast.error(`Failed to load team members: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[SupervisorDashboard] Error loading professionals:', error);
      toast.error('Error loading team members');
    }
  };

  const copyOrgCode = async () => {
    if (!organizationCode) return;
    
    try {
      await navigator.clipboard.writeText(organizationCode);
      setCopiedCode(true);
      toast.success('Organization code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast.error('Failed to copy code');
    }
  };

  const getProfessionalStats = (professional: User) => {
    const assessments = getAssessmentsByUserId(professional.id);
    const reviews = getReviewsByProfessional(professional.id);
    
    const completedAssessments = assessments.filter(a => a.completedAt);
    const latestReview = reviews.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return {
      totalAssessments: assessments.length,
      completedAssessments: completedAssessments.length,
      totalReviews: reviews.length,
      latestReview,
      hasAllThreeAssessments: completedAssessments.filter(a => a.type === 'kolb').length > 0 &&
                              completedAssessments.filter(a => a.type === 'sternberg').length > 0 &&
                              completedAssessments.filter(a => a.type === 'dual-process').length > 0
    };
  };

  const filteredProfessionals = professionals.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const organizationStats = {
    totalProfessionals: professionals.length,
    assessedProfessionals: professionals.filter(p => {
      const assessments = getAssessmentsByUserId(p.id);
      return assessments.some(a => a.completedAt);
    }).length,
    totalReviews: professionals.reduce((sum, p) => {
      const reviews = getReviewsByProfessional(p.id);
      return sum + reviews.length;
    }, 0),
    fullyAssessed: professionals.filter(p => {
      const stats = getProfessionalStats(p);
      return stats.hasAllThreeAssessments;
    }).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Supervisor Portal
                </h1>
                <p className="text-sm text-muted-foreground">
                  {user.organizationName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.position}</p>
              </div>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="professionals">
              <Users className="h-4 w-4 mr-2" />
              Professionals
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Organization Code Card - PROMINENT */}
            {organizationCode && (
              <Card className="border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                    Organization Code
                  </CardTitle>
                  <CardDescription>
                    Share this code with team members to join your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white border-2 border-indigo-200 rounded-lg px-4 py-3">
                      <code className="text-2xl tracking-wider" style={{ color: '#2C2E83' }}>
                        {organizationCode}
                      </code>
                    </div>
                    <Button 
                      size="lg" 
                      onClick={copyOrgCode}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <Alert className="bg-white/50 border-indigo-200">
                    <AlertDescription className="text-sm">
                      💡 Team members need to select "Professional/Organization" during signup and enter this code to join your organization
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Professionals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl">{organizationStats.totalProfessionals}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Assessed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl">{organizationStats.assessedProfessionals}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {organizationStats.totalProfessionals > 0 
                      ? Math.round((organizationStats.assessedProfessionals / organizationStats.totalProfessionals) * 100)
                      : 0}% completion
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Fully Assessed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl">{organizationStats.fullyAssessed}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All 3 assessments complete
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Total Reviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl">{organizationStats.totalReviews}</div>
                </CardContent>
              </Card>
            </div>

            {/* Welcome Card */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  Welcome to Your Organization Dashboard
                </CardTitle>
                <CardDescription>
                  Review and manage cognitive assessments for professionals in {user.organizationName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span>•</span>
                    <span>View all professionals from your organization who have completed assessments</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span>•</span>
                    <span>Review their cognitive profiles to understand strengths and development areas</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span>•</span>
                    <span>Provide structured feedback to align roles with cognitive capabilities</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span>•</span>
                    <span>Track performance reviews and development plans over time</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Access */}
            {professionals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Access</CardTitle>
                  <CardDescription>Recently active professionals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {professionals.slice(0, 5).map(prof => {
                      const stats = getProfessionalStats(prof);
                      return (
                        <div
                          key={prof.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedProfessional(prof);
                            setActiveTab('professionals');
                          }}
                        >
                          <div>
                            <p>{prof.name}</p>
                            <p className="text-sm text-muted-foreground">{prof.position}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {stats.completedAssessments}/3 assessments
                            </Badge>
                            {stats.totalReviews > 0 && (
                              <Badge variant="secondary">
                                {stats.totalReviews} review{stats.totalReviews > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Professionals Tab */}
          <TabsContent value="professionals" className="space-y-6">
            {professionals.length === 0 ? (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  No professionals from {user.organizationName} have registered yet. 
                  Invite your team members to complete their cognitive assessments.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Professional List */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-24">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                      </CardTitle>
                      <div className="pt-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search professionals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[600px]">
                        <div className="space-y-1 p-4 pt-0">
                          {filteredProfessionals.map((prof) => {
                            const stats = getProfessionalStats(prof);
                            const isSelected = selectedProfessional?.id === prof.id;
                            
                            return (
                              <button
                                key={prof.id}
                                onClick={() => setSelectedProfessional(prof)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                  isSelected
                                    ? 'bg-purple-50 border-purple-300 shadow-sm'
                                    : 'hover:bg-accent border-transparent'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{prof.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {prof.position}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      {stats.completedAssessments > 0 ? (
                                        <Badge variant="outline" className="text-xs">
                                          {stats.completedAssessments}/3
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          No assessments
                                        </Badge>
                                      )}
                                      {stats.totalReviews > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          <FileText className="h-3 w-3 mr-1" />
                                          {stats.totalReviews}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {stats.hasAllThreeAssessments && (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Professional Details & Review */}
                <div className="lg:col-span-2">
                  {selectedProfessional ? (
                    <ProfessionalReviewSection
                      professional={selectedProfessional}
                      supervisor={user}
                    />
                  ) : (
                    <Card className="h-full flex items-center justify-center p-12">
                      <div className="text-center text-muted-foreground">
                        <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a professional to view their assessments and add reviews</p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Separate component for professional review section
function ProfessionalReviewSection({ 
  professional, 
  supervisor 
}: { 
  professional: User; 
  supervisor: User;
}) {
  const [showNewReview, setShowNewReview] = useState(false);
  const assessments = getAssessmentsByUserId(professional.id);
  const completedAssessments = assessments.filter(a => a.completedAt);
  const reviews = getReviewsByProfessional(professional.id);

  if (completedAssessments.length === 0) {
    return (
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          {professional.name} hasn't completed any assessments yet. 
          Reviews can be added once they complete at least one cognitive assessment.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Professional Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{professional.name}</CardTitle>
              <CardDescription className="mt-1">
                {professional.position} • {professional.email}
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowNewReview(!showNewReview)}
              variant={showNewReview ? "outline" : "default"}
            >
              {showNewReview ? 'Cancel Review' : 'New Review'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{completedAssessments.length} assessment{completedAssessments.length > 1 ? 's' : ''} completed</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span>{reviews.length} review{reviews.length > 1 ? 's' : ''} on file</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Review Form */}
      {showNewReview && (
        <SupervisorReview
          employeeName={professional.name}
          assessments={completedAssessments}
          supervisorId={supervisor.id}
          professionalId={professional.id}
          onReviewSubmitted={() => setShowNewReview(false)}
        />
      )}

      {/* Previous Reviews */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Review History</CardTitle>
            <CardDescription>
              {reviews.length} review{reviews.length > 1 ? 's' : ''} completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge>{review.performanceRating}</Badge>
                        <Badge variant="outline">{review.roleAlignment}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.reviewDate).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {review.strengths && (
                      <div>
                        <p className="text-sm font-medium mb-1">Strengths:</p>
                        <p className="text-sm text-muted-foreground">{review.strengths}</p>
                      </div>
                    )}
                    
                    {review.developmentAreas && (
                      <div>
                        <p className="text-sm font-medium mb-1">Development Areas:</p>
                        <p className="text-sm text-muted-foreground">{review.developmentAreas}</p>
                      </div>
                    )}

                    {review.supervisorComments && (
                      <div>
                        <p className="text-sm font-medium mb-1">Comments:</p>
                        <p className="text-sm text-muted-foreground">{review.supervisorComments}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}