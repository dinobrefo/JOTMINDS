import { ParentAccessRequests } from './ParentAccessRequests';
import { DailyChallengeTab } from './DailyChallengeTab';
import { ChildrenDailyChallenges } from './ChildrenDailyChallenges';
import { MindMoodMeter } from './MindMoodMeter';
import { DiscoveryOfTheDay } from './DiscoveryOfTheDay';
import { ParentTeacherGuide } from './ParentTeacherGuide';
import { ChildrenThinkingContainer } from './ChildrenThinkingContainer';
import { JHSThinkingContainer } from './JHSThinkingContainer';
import { SHSThinkingContainer } from './SHSThinkingContainer';
import { AdultThinkingContainer } from './AdultThinkingContainer';
import { calculateAge } from '../utils/dateUtils';
import { useState, useEffect } from 'react';
import { User, Assessment } from '../types';
import { getUserAssessments, getUserReflections } from '../utils/storage';
import { getUserAssessmentResults } from '../utils/api';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BookOpen, 
  Eye, 
  LogOut, 
  TrendingUp, 
  FileText,
  Sparkles,
  GraduationCap,
  Home,
  BarChart3,
  UserPlus,
  MessageSquare
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AssessmentTaking } from './AssessmentTaking';
import { AssessmentReport } from './AssessmentReport';
import { CombinedCognitiveProfile } from './CombinedCognitiveProfile';
import { FrameworkInfo } from './FrameworkInfo';
import { AssessmentHistory } from './AssessmentHistory';
import { ReflectionsViewer } from './ReflectionsViewer';
import { AssessmentExecutiveSummary } from './AssessmentExecutiveSummary';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

export function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const { impersonatedUser } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<'kolb' | 'sternberg' | 'dual-process' | null>(null);
  const [showJHSAssessment, setShowJHSAssessment] = useState(false);
  const [showSHSAssessment, setShowSHSAssessment] = useState(false);
  const [showAdultAssessment, setShowAdultAssessment] = useState(false);
  const [showChildrenAssessment, setShowChildrenAssessment] = useState(false);
  const [viewingReport, setViewingReport] = useState<Assessment | null>(null);
  const [viewingCombinedProfile, setViewingCombinedProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [challengeKey, setChallengeKey] = useState(0);
  const [moodMeterKey, setMoodMeterKey] = useState(0);

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

  const hasCompletedAtLeastOne = () => {
    return assessments.length > 0;
  };

  const hasCompletedAllThree = () => {
    return hasCompletedAssessment('kolb') && 
           hasCompletedAssessment('sternberg') && 
           hasCompletedAssessment('dual-process');
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

  // Determine which Thinking Styles assessment to show based on education level (primary) and age (secondary)
  const getThinkingStylesAssessment = () => {
    // Calculate age from dateOfBirth if available
    let userAge = user.age;
    if (!userAge && user.dateOfBirth) {
      userAge = calculateAge(user.dateOfBirth);
    }

    // PRIMARY: Use education level as the main determinant
    // This accounts for students who might be younger/older than typical for their grade
    if (user.educationLevel) {
      switch (user.educationLevel) {
        case 'Elementary':
          return 'Children'; // Ages 6-10 typically
        case 'JHS':
          return 'JHS'; // Ages 11-14 typically
        case 'SHS':
          return 'SHS'; // Ages 15-18 typically
        case 'Tertiary':
          return 'Adult'; // Ages 19+ typically
      }
    }

    // SECONDARY: Fall back to age-based determination if no education level
    if (userAge) {
      if (userAge >= 6 && userAge <= 10) return 'Children';
      if (userAge >= 11 && userAge <= 14) return 'JHS';
      if (userAge >= 15 && userAge <= 18) return 'SHS';
      if (userAge >= 19) return 'Adult';
      
      // User is too young (under 6)
      return null;
    }

    // DEFAULT: If neither education level nor age is available, default to Adult
    return 'Adult';
  };

  const thinkingStylesAssessment = getThinkingStylesAssessment();

  // Helper to check if user should see children's features (ages 6-10)
  const isChildrenUser = () => {
    return user.educationLevel === 'Elementary' || thinkingStylesAssessment === 'Children';
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

  if (showJHSAssessment) {
    return (
      <JHSThinkingContainer
        userId={user.id}
        userName={user.name}
        onComplete={() => {
          loadAssessments();
          setShowJHSAssessment(false);
        }}
        onCancel={() => setShowJHSAssessment(false)}
      />
    );
  }

  if (showSHSAssessment) {
    return (
      <SHSThinkingContainer
        userId={user.id}
        userName={user.name}
        onComplete={() => {
          loadAssessments();
          setShowSHSAssessment(false);
        }}
        onCancel={() => setShowSHSAssessment(false)}
      />
    );
  }

  if (showAdultAssessment) {
    return (
      <AdultThinkingContainer
        userId={user.id}
        userName={user.name}
        onComplete={() => {
          loadAssessments();
          setShowAdultAssessment(false);
        }}
        onCancel={() => setShowAdultAssessment(false)}
      />
    );
  }

  if (showChildrenAssessment) {
    return (
      <ChildrenThinkingContainer
        userId={user.id}
        userName={user.name}
        onComplete={() => {
          loadAssessments();
          setShowChildrenAssessment(false);
        }}
        onCancel={() => setShowChildrenAssessment(false)}
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

  if (viewingCombinedProfile) {
    return (
      <CombinedCognitiveProfile
        userId={user.id}
        userName={user.name}
        onBack={() => setViewingCombinedProfile(false)}
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
        <Tabs 
          defaultValue="dashboard" 
          className="w-full"
          onValueChange={(value) => {
            setActiveTab(value);
            // Force reload when switching to specific tabs
            if (value === 'daily-challenges') {
              setChallengeKey(prev => prev + 1);
            }
            if (value === 'mood-meter') {
              setMoodMeterKey(prev => prev + 1);
            }
          }}
        >
          {/* Different tabs based on education level (primary) or age (secondary) */}
          {isChildrenUser() ? (
            <TabsList className="grid w-full max-w-5xl mx-auto grid-cols-6 mb-6">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="daily-challenges" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Mind Play
              </TabsTrigger>
              <TabsTrigger value="mood-meter" className="flex items-center gap-2">
                🌞
                Mood Meter
              </TabsTrigger>
              <TabsTrigger value="discoveries" className="flex items-center gap-2">
                💡
                Discoveries
              </TabsTrigger>
              <TabsTrigger value="parent-guide" className="flex items-center gap-2">
                📘
                Parent Guide
              </TabsTrigger>
              <TabsTrigger value="track-record" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                My Progress
              </TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full max-w-5xl mx-auto grid-cols-6 mb-6">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="daily-challenges" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Mind Booster
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
          )}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Executive Summary Section */}
            <AssessmentExecutiveSummary 
              userId={user.id}
            />

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

            {/* NEW: Thinking Styles Adventure - Show ONLY after completing ALL THREE core assessments */}
            {hasCompletedAllThree() && (
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-green-900">🎉 Great Progress!</CardTitle>
                      <CardDescription>
                        Ready for your next adventure? Discover your Thinking Style!
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4">
                    Congratulations on completing all three core assessments! Now take the next step to discover your unique thinking patterns and unlock personalized program recommendations!
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md"
                    onClick={() => {
                      // Scroll down to thinking styles assessment
                      const element = document.getElementById('thinking-styles-section');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Explore Thinking Styles Adventure →
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* NEW: JHS Thinking Styles Adventure - For JHS Students (Ages 11-14) */}
            {thinkingStylesAssessment === 'JHS' && hasCompletedAllThree() && (
            <div id="thinking-styles-section">
            <Card className="border-4 border-[#FF715B] bg-gradient-to-br from-white via-pink-50 to-purple-50 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 text-xs">
                    🎉 NEW: For JHS Students
                  </Badge>
                  <Badge variant="outline" className="border-[#FF715B] text-[#FF715B]">
                    Ages 11-14
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF715B] to-[#2C2E83] flex items-center justify-center shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl bg-gradient-to-r from-[#FF715B] via-[#1FC8E1] to-[#2C2E83] bg-clip-text text-transparent">
                      🧠 Thinking Styles Adventure
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Discover how your mind learns, solves, and creates!
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border-2 border-[#FF715B]/30">
                  <p className="text-sm text-gray-700 mb-3">
                    👋 <strong>Hey there, Thinker!</strong> Take a fun journey to discover:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">🎨</span>
                      <span>Creative Thinking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">🔍</span>
                      <span>Analytical Thinking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">🛠️</span>
                      <span>Practical Thinking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">💭</span>
                      <span>Reflective Thinking</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <span className="text-lg">🎓</span>
                    Get SHS Program Recommendations!
                  </p>
                  <p className="text-xs text-gray-700">
                    Find out which Senior High School programs match your unique thinking powers
                  </p>
                </div>

                <Button 
                  onClick={() => setShowJHSAssessment(true)}
                  className="w-full bg-gradient-to-r from-[#FF715B] via-[#1FC8E1] to-[#2C2E83] hover:from-[#E6644F] hover:via-[#1AB5CC] hover:to-[#252770] text-white shadow-lg hover:shadow-xl transition-all text-base py-6"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Your Thinking Adventure! 🚀
                </Button>

                <p className="text-xs text-center text-gray-500">
                  ⏱️ Takes about 5-7 minutes • 24 fun questions with emoji responses 😕😐🙂😃🤩
                </p>
              </CardContent>
            </Card>
            </div>
            )}

            {/* NEW: SHS Thinking Styles Adventure - For SHS Students (Ages 15-18) */}
            {thinkingStylesAssessment === 'SHS' && hasCompletedAllThree() && (
            <div id="thinking-styles-section">
            <Card className="border-4 border-indigo-300 bg-gradient-to-br from-white via-indigo-50 to-cyan-50 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-3 py-1 text-xs">
                    🎯 NEW: For SHS Students
                  </Badge>
                  <Badge variant="outline" className="border-indigo-500 text-indigo-700">
                    Ages 15-18
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                      🎓 SHS Thinking Styles Assessment
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Discover your thinking profile and find the perfect university program
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border-2 border-indigo-200">
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Understand your unique thinking patterns across four dimensions:</strong>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">🎨</span>
                      <span>Creative Thinking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">🔍</span>
                      <span>Analytical Thinking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">🛠️</span>
                      <span>Practical Thinking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">💭</span>
                      <span>Reflective Thinking</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-yellow-700" />
                    Get University & College Program Recommendations!
                  </p>
                  <p className="text-xs text-gray-700">
                    Find tertiary programs that align with your thinking style, plus career pathways and top Philippine universities
                  </p>
                </div>

                <Button 
                  onClick={() => setShowSHSAssessment(true)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all text-base py-6"
                  size="lg"
                >
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Begin Assessment →
                </Button>

                <p className="text-xs text-center text-gray-500">
                  ⏱️ Takes 6-8 minutes • 24 questions with 5-point rating scale
                </p>
              </CardContent>
            </Card>
            </div>
            )}

            {/* NEW: Adult Thinking Styles Adventure - For Adults */}
            {thinkingStylesAssessment === 'Adult' && hasCompletedAllThree() && (
            <div id="thinking-styles-section">
            <Card className="border-4 border-slate-300 bg-gradient-to-br from-white via-slate-50 to-zinc-50 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-3 py-1 text-xs">
                    💼 NEW: Professional Assessment
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-700">
                    Ages 19+
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                      💼 Professional Thinking Styles
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Discover your thinking profile for career development and growth
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border-2 border-slate-200">
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Unlock your professional potential across four thinking dimensions:</strong>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">🎨</span>
                      <span>Creative Thinking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">🔍</span>
                      <span>Analytical Thinking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">🛠️</span>
                      <span>Practical Thinking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">💭</span>
                      <span>Reflective Thinking</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <span className="text-lg">💼</span>
                    Get Personalized Career Path Recommendations!
                  </p>
                  <p className="text-xs text-gray-700">
                    Discover 20+ career paths aligned with your thinking style, including entrepreneurship, leadership roles, and professional development opportunities
                  </p>
                </div>

                <Button 
                  onClick={() => setShowAdultAssessment(true)}
                  className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white shadow-lg hover:shadow-xl transition-all text-base py-6"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Begin Professional Assessment →
                </Button>

                <p className="text-xs text-center text-gray-500">
                  ⏱️ Takes 8-10 minutes • 24 questions with professional Likert scale
                </p>
              </CardContent>
            </Card>
            </div>
            )}

            {/* NEW: Children Thinking Styles Adventure - For Children (Ages 6-10) */}
            {thinkingStylesAssessment === 'Children' && hasCompletedAllThree() && (
            <div id="thinking-styles-section">
            <Card className="border-4 border-[#FF715B] bg-gradient-to-br from-white via-pink-50 to-purple-50 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 text-xs">
                    🎉 NEW: For Children
                  </Badge>
                  <Badge variant="outline" className="border-[#FF715B] text-[#FF715B]">
                    Ages 6-10
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF715B] to-[#2C2E83] flex items-center justify-center shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl bg-gradient-to-r from-[#FF715B] via-[#1FC8E1] to-[#2C2E83] bg-clip-text text-transparent">
                      🧠 Thinking Styles Adventure
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Discover how your mind learns, solves, and creates!
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border-2 border-[#FF715B]/30">
                  <p className="text-sm text-gray-700 mb-3">
                    👋 <strong>Hey there, Thinker!</strong> Take a fun journey to discover:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">🎨</span>
                      <span>Creative Thinking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">🔍</span>
                      <span>Analytical Thinking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">🛠️</span>
                      <span>Practical Thinking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xl">💭</span>
                      <span>Reflective Thinking</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <span className="text-lg">🎓</span>
                    Get SHS Program Recommendations!
                  </p>
                  <p className="text-xs text-gray-700">
                    Find out which Senior High School programs match your unique thinking powers
                  </p>
                </div>

                <Button 
                  onClick={() => setShowChildrenAssessment(true)}
                  className="w-full bg-gradient-to-r from-[#FF715B] via-[#1FC8E1] to-[#2C2E83] hover:from-[#E6644F] hover:via-[#1AB5CC] hover:to-[#252770] text-white shadow-lg hover:shadow-xl transition-all text-base py-6"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Your Thinking Adventure! 🚀
                </Button>

                <p className="text-xs text-center text-gray-500">
                  ⏱️ Takes about 5-7 minutes • 24 fun questions with emoji responses 😕😐🙂😃🤩
                </p>
              </CardContent>
            </Card>
            </div>
            )}

            {trendData.length > 1 && (
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-white via-purple-50 to-pink-50 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    Your Learning Style Trends
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Track how your learning preferences change over time
                  </CardDescription>
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
                  {trendData.length} Assessments
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={trendData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="colorCE" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorRO" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorAC" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorAE" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#e5e7eb" 
                      strokeOpacity={0.5}
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                      tick={{ fill: '#6b7280' }}
                      domain={[0, 'dataMax + 10']}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                      }}
                      labelStyle={{ 
                        fontWeight: 600, 
                        color: '#1f2937',
                        marginBottom: '8px',
                        fontSize: '14px'
                      }}
                      itemStyle={{ 
                        padding: '4px 0',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                      iconType="circle"
                      iconSize={10}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="CE" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      name="Concrete Experience" 
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 5, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 3, stroke: '#fff' }}
                      fill="url(#colorCE)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="RO" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Reflective Observation" 
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 3, stroke: '#fff' }}
                      fill="url(#colorRO)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="AC" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Abstract Conceptualization" 
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 5, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 3, stroke: '#fff' }}
                      fill="url(#colorAC)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="AE" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      name="Active Experimentation" 
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 3, stroke: '#fff' }}
                      fill="url(#colorAE)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend with descriptions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <div className="p-3 bg-red-50 rounded-lg border-2 border-red-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="font-semibold text-sm text-red-900">CE</span>
                  </div>
                  <p className="text-xs text-red-700">Learning through feelings & experiences</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="font-semibold text-sm text-blue-900">RO</span>
                  </div>
                  <p className="text-xs text-blue-700">Learning by watching & listening</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-semibold text-sm text-green-900">AC</span>
                  </div>
                  <p className="text-xs text-green-700">Learning through thinking & analyzing</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="font-semibold text-sm text-yellow-900">AE</span>
                  </div>
                  <p className="text-xs text-yellow-700">Learning by doing & experimenting</p>
                </div>
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

          <TabsContent value="daily-challenges" className="space-y-6">
            {isChildrenUser() ? (
              <ChildrenDailyChallenges 
                key={challengeKey}
                userId={user.id}
                userName={user.name}
              />
            ) : (
              <DailyChallengeTab 
                key={challengeKey}
                userId={user.id}
                userName={user.name}
                userAge={user.age || 18}
              />
            )}
          </TabsContent>

          {/* Children-specific tabs based on education level or age */}
          {isChildrenUser() && (
            <>
              <TabsContent value="mood-meter" className="space-y-6">
                <MindMoodMeter 
                  key={moodMeterKey}
                  userId={user.id}
                  userName={user.name}
                />
              </TabsContent>

              <TabsContent value="discoveries" className="space-y-6">
                <DiscoveryOfTheDay 
                  userId={user.id}
                  userName={user.name}
                />
              </TabsContent>

              <TabsContent value="parent-guide" className="space-y-6">
                <ParentTeacherGuide 
                  childName={user.name}
                />
              </TabsContent>
            </>
          )}

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