import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BookOpen, FileText, TrendingUp, LogOut, Eye, Info, BarChart3, Home, Sparkles, MessageSquare, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AssessmentTaking } from './AssessmentTaking';
import { AssessmentReport } from './AssessmentReport';
import { FrameworkInfo } from './FrameworkInfo';
import { AssessmentHistory } from './AssessmentHistory';
import { ReflectionsViewer } from './ReflectionsViewer';
import { CombinedCognitiveProfile } from './CombinedCognitiveProfile';
import { ParentAccessRequests } from './ParentAccessRequests';
import { useAuth } from './AuthContext';
import { User, Assessment } from '../types';
import { getUserAssessments, getUserReflections } from '../utils/storage';
import { getUserAssessmentResults } from '../utils/api';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

export function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const { impersonatedUser } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<'kolb' | 'sternberg' | 'dual-process' | null>(null);
  const [viewingReport, setViewingReport] = useState<Assessment | null>(null);
  const [viewingCombinedProfile, setViewingCombinedProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
  }, [user.id, impersonatedUser]);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      // If viewing as admin (impersonated user), fetch from API
      if (impersonatedUser) {
        const { results } = await getUserAssessmentResults(user.id);
        // Convert API results to Assessment format
        const convertedAssessments: Assessment[] = (results || []).map((result: any) => ({
          id: result.id,
          userId: user.id,
          type: result.assessmentType === 'learning' ? 'kolb' : 
                result.assessmentType === 'thinking' ? 'sternberg' : 'dual-process',
          score: {
            kolb: result.assessmentType === 'learning' ? {
              primaryStyle: Object.keys(result.results).reduce((a, b) => 
                result.results[a] > result.results[b] ? a : b
              ),
              scores: result.results
            } : undefined,
            sternberg: result.assessmentType === 'thinking' ? {
              primaryStyle: Object.keys(result.results).reduce((a, b) => 
                result.results[a] > result.results[b] ? a : b
              ),
              scores: result.results
            } : undefined,
            dualProcess: result.assessmentType === 'decision' ? {
              primaryStyle: Object.keys(result.results).reduce((a, b) => 
                result.results[a] > result.results[b] ? a : b
              ),
              scores: result.results
            } : undefined
          },
          completedAt: result.completedAt || new Date().toISOString(),
          responses: []
        }));
        setAssessments(convertedAssessments);
      } else {
        // Regular user viewing their own data - use localStorage for now
        const userAssessments = getUserAssessments(user.id);
        setAssessments(userAssessments);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const hasCompletedAssessment = (type: 'kolb' | 'sternberg' | 'dual-process') => {
    return assessments.some(a => a.type === type);
  };

  const getLatestAssessment = (type: 'kolb' | 'sternberg' | 'dual-process') => {
    return assessments.filter(a => a.type === type).sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )[0];
  };

  const handleAssessmentComplete = (assessment: Assessment) => {
    loadAssessments();
    setActiveAssessment(null);
    setViewingReport(assessment);
  };

  const getTrendData = () => {
    const kolbAssessments = assessments.filter(a => a.type === 'kolb').sort((a, b) => 
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

    return kolbAssessments.map(a => ({
      date: new Date(a.completedAt).toLocaleDateString(),
      CE: a.score.kolb?.scores.CE || 0,
      RO: a.score.kolb?.scores.RO || 0,
      AC: a.score.kolb?.scores.AC || 0,
      AE: a.score.kolb?.scores.AE || 0,
    }));
  };

  if (activeAssessment) {
    return (
      <AssessmentTaking
        userId={user.id}
        assessmentType={activeAssessment}
        onComplete={handleAssessmentComplete}
        onCancel={() => setActiveAssessment(null)}
      />
    );
  }

  if (viewingCombinedProfile) {
    return (
      <CombinedCognitiveProfile
        assessments={assessments}
        userName={user.name}
        onBack={() => setViewingCombinedProfile(false)}
      />
    );
  }

  if (viewingReport) {
    return (
      <AssessmentReport
        assessment={viewingReport}
        userName={user.name}
        onBack={() => setViewingReport(null)}
        userRole={user.role}
      />
    );
  }

  const trendData = getTrendData();
  const reflections = getUserReflections(user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-violet-50 to-indigo-50">
      <div className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#1FC8E1] via-[#7B61FF] to-[#2C2E83] bg-clip-text text-transparent mb-2">JotMinds</h1>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-aqua-violet flex items-center justify-center text-white text-xl font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl text-gray-900">Welcome, {user.name}!</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {user.educationLevel} Student
                  </Badge>
                  {user.school && (
                    <Badge variant="secondary" className="text-xs">
                      {user.school}
                    </Badge>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FrameworkInfo userRole="student" />
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-5 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="track-record" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Track Record
            </TabsTrigger>
            <TabsTrigger value="reflections" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reflections
            </TabsTrigger>
            <TabsTrigger value="parent-access" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Parent Access
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-2 border-blue-200 hover:shadow-large transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-blue-50">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-blue-900">Your Learning Style</CardTitle>
              </div>
              <CardDescription>
                Discover how you learn best
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasCompletedAssessment('kolb') ? (
                <>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    ✓ Completed
                  </Badge>
                  <div className="space-y-2">
                    <Button 
                      className="w-full gradient-primary text-white shadow-md hover:shadow-lg" 
                      onClick={() => setViewingReport(getLatestAssessment('kolb'))}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={() => setActiveAssessment('kolb')}
                    >
                      Retake Assessment
                    </Button>
                  </div>
                </>
              ) : (
                <Button 
                  className="w-full gradient-primary text-white shadow-md hover:shadow-lg"
                  onClick={() => setActiveAssessment('kolb')}
                >
                  Start Assessment →
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 hover:shadow-large transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-purple-50">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-purple-900">Your Thinking Style</CardTitle>
              </div>
              <CardDescription>
                Understand how you think
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasCompletedAssessment('sternberg') ? (
                <>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    ✓ Completed
                  </Badge>
                  <div className="space-y-2">
                    <Button 
                      className="w-full gradient-purple text-white shadow-md hover:shadow-lg" 
                      onClick={() => setViewingReport(getLatestAssessment('sternberg'))}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={() => setActiveAssessment('sternberg')}
                    >
                      Retake Assessment
                    </Button>
                  </div>
                </>
              ) : (
                <Button 
                  className="w-full gradient-purple text-white shadow-md hover:shadow-lg"
                  onClick={() => setActiveAssessment('sternberg')}
                >
                  Start Assessment →
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 hover:shadow-large transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-orange-50">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                </div>
                <CardTitle className="text-orange-900">Your Decision Style</CardTitle>
              </div>
              <CardDescription>
                Learn how you make decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasCompletedAssessment('dual-process') ? (
                <>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    ✓ Completed
                  </Badge>
                  <div className="space-y-2">
                    <Button 
                      className="w-full gradient-warning text-white shadow-md hover:shadow-lg" 
                      onClick={() => setViewingReport(getLatestAssessment('dual-process'))}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={() => setActiveAssessment('dual-process')}
                    >
                      Retake Assessment
                    </Button>
                  </div>
                </>
              ) : (
                <Button 
                  className="w-full gradient-warning text-white shadow-md hover:shadow-lg"
                  onClick={() => setActiveAssessment('dual-process')}
                >
                  Start Assessment →
                </Button>
              )}
            </CardContent>
          </Card>
            </div>

            {/* Combined Profile Card - Show when all three assessments complete */}
            {hasCompletedAssessment('kolb') && hasCompletedAssessment('sternberg') && hasCompletedAssessment('dual-process') && (
              <Card className="border-2 border-[#1FC8E1] bg-gradient-to-br from-white via-cyan-50 to-indigo-50 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] bg-clip-text text-transparent">
                      Your Complete Cognitive Profile
                    </CardTitle>
                    <CardDescription className="text-sm">
                      View your comprehensive results with detailed insights and visualizations
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200 text-sm px-3 py-1">
                  ✓ All Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-4 border border-[#1FC8E1]/30">
                <p className="text-sm text-gray-700 mb-3">
                  🎉 Congratulations! You've completed all three assessments. View your complete cognitive profile to see:
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-[#1FC8E1]">•</span>
                    <span>360° radar chart of all your cognitive dimensions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#1FC8E1]">•</span>
                    <span>Detailed breakdown of your strengths and growth areas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#1FC8E1]">•</span>
                    <span>Personalized recommendations for academic success</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#1FC8E1]">•</span>
                    <span>Visual balance charts across learning, thinking, and decision-making</span>
                  </li>
                </ul>
              </div>
              <Button 
                onClick={() => setViewingCombinedProfile(true)}
                className="w-full bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] hover:from-[#1AB5CC] hover:to-[#252770] text-white shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                View Your Complete Profile
                <Eye className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
              </Card>
            )}

            {trendData.length > 1 && (
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Learning Style Trends
              </CardTitle>
              <CardDescription>
                Track how your learning preferences change over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="CE" stroke="#ef4444" name="Concrete Experience" />
                    <Line type="monotone" dataKey="RO" stroke="#3b82f6" name="Reflective Observation" />
                    <Line type="monotone" dataKey="AC" stroke="#10b981" name="Abstract Conceptualization" />
                    <Line type="monotone" dataKey="AE" stroke="#f59e0b" name="Active Experimentation" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
              </Card>
            )}

            {reflections.length > 0 && (
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Reflections
              </CardTitle>
              <CardDescription>
                Review your past reflections and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reflections.slice(0, 3).map(reflection => (
                  <div key={reflection.id} className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      {new Date(reflection.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm">{reflection.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="track-record" className="space-y-6">
            <AssessmentHistory 
              assessments={assessments}
              onViewReport={(assessment) => setViewingReport(assessment)}
            />
          </TabsContent>

          <TabsContent value="reflections" className="space-y-6">
            <ReflectionsViewer 
              userId={user.id}
              onViewAssessment={(assessment) => setViewingReport(assessment)}
            />
          </TabsContent>

          <TabsContent value="parent-access" className="space-y-6">
            <ParentAccessRequests 
              userId={user.id}
            />
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <div className="max-w-3xl mx-auto">
              <Card className="border-2 border-[#1FC8E1] bg-gradient-to-br from-cyan-50 to-blue-50">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">Share Your Experience with JotMinds</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Your feedback helps us improve the platform for students, teachers, parents, and professionals across Ghana
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#1FC8E1]" />
                      We'd love to hear from you about:
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                        <span className="text-[#1FC8E1] font-bold text-lg">•</span>
                        <span className="text-sm">Your overall experience using JotMinds</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-[#2C2E83] font-bold text-lg">•</span>
                        <span className="text-sm">How accurate your assessment results were</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                        <span className="text-[#1FC8E1] font-bold text-lg">•</span>
                        <span className="text-sm">What features you found most helpful</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-[#2C2E83] font-bold text-lg">•</span>
                        <span className="text-sm">Suggestions for improvement</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                        <span className="text-[#1FC8E1] font-bold text-lg">•</span>
                        <span className="text-sm">How JotMinds has helped your learning</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-[#2C2E83] font-bold text-lg">•</span>
                        <span className="text-sm">Any challenges you encountered</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-[#1FC8E1]/10 to-[#2C2E83]/10 rounded-lg p-4 border border-[#1FC8E1]/30">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">✓</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Your Feedback is Valuable</p>
                        <p className="text-sm text-gray-600">
                          Every response helps us understand how to better serve and make JotMinds more effective for everyone.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 pt-4">
                    <Button
                      onClick={() => window.open('https://forms.gle/SXPFj29PxUbmYVQq7', '_blank')}
                      size="lg"
                      className="w-full max-w-md bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] hover:from-[#1AB5CC] hover:to-[#252770] text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Complete Feedback Form
                      <Sparkles className="ml-2 h-5 w-5" />
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                      Takes 2-3 minutes • Your responses are confidential
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 pt-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-2xl font-bold text-[#1FC8E1]">2-3</p>
                      <p className="text-xs text-gray-600">Minutes to complete</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-2xl font-bold text-[#2C2E83]">100%</p>
                      <p className="text-xs text-gray-600">Confidential</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}