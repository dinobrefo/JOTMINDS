import { useState, useEffect, useMemo } from 'react';
import { User, Assessment } from '../types';
import { useAuth } from './AuthContext';
import { getUserAssessmentResults, getStudentsForTeacher } from '../utils/api';
import { getStudentsBySchool, getAllUsers, getAllAssessments, getAssessmentsByUserId, saveAssessment, generateId, saveAssessmentProgress, getAssessmentProgress, clearAssessmentProgress } from '../utils/storage';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { ArrowRight, History, RefreshCcw, Calendar, AlertCircle, Eye, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { 
  TeacherAppHeader, 
  TeacherTabBar, 
  TeacherClassOverview, 
  TeacherIndividualStudentView 
} from './teacher';
import { TeachingStyleAssessment } from './TeachingStyleAssessment';
import { TeachingStyleResults } from './TeachingStyleResults';
import { calculateTeachingStyleScore } from '../utils/teachingStyleScoring';
import { teachingStyleQuestions } from '../utils/teachingStyleQuestions';
import { generateDeepDiveQuestions } from '../utils/teachingStyleData';

interface TeacherDashboardNewProps {
  user: User;
  onLogout: () => void;
}

export function TeacherDashboardNew({ user, onLogout }: TeacherDashboardNewProps) {
  const { impersonatedUser } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [allAssessments, setAllAssessments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'individual' | 'my-style'>('individual');
  const [loading, setLoading] = useState(true);
  const [myAssessments, setMyAssessments] = useState<Assessment[]>([]);
  const [isTakingAssessment, setIsTakingAssessment] = useState(false);
  const [initialResponses, setInitialResponses] = useState<number[]>([]);
  const [initialQuestions, setInitialQuestions] = useState<any[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    loadClassData();
    loadMyAssessments();
  }, [user.id, impersonatedUser]);

  const loadMyAssessments = () => {
    const assessments = getAssessmentsByUserId(user.id);
    setMyAssessments(assessments);
  };

  const startAssessment = () => {
      // Check for saved progress
      const progress = getAssessmentProgress(user.id, 'teaching-style', !!user.organizationName);
      if (progress && progress.responses) {
          setInitialResponses(progress.responses);
          if (progress.questions && progress.questions.length > 0) {
              setInitialQuestions(progress.questions);
          }
          toast.info("Resuming from your last saved session.");
      } else {
          setInitialResponses([]);
          setInitialQuestions([]);
      }
      setIsTakingAssessment(true);
  };

  const handleSaveProgress = (responses: number[], currentSection: number, questions?: any[]) => {
      saveAssessmentProgress({
          userId: user.id,
          assessmentType: 'teaching-style',
          isOrganizational: !!user.organizationName,
          currentQuestion: currentSection, // Roughly maps to section index here
          responses,
          questions: questions || [], 
          lastSaved: new Date().toISOString()
      });
  };

  const loadClassData = async () => {
    setLoading(true);
    let studentUsers: User[] = [];
    let assessmentsForStats: any[] = [];
    
    try {
      // If viewing as admin (impersonated user), fetch from API
      if (impersonatedUser) {
        const { results: assessmentResults } = await getUserAssessmentResults(user.id);
        assessmentsForStats = assessmentResults || [];
        
        if (user.school) {
          studentUsers = getStudentsBySchool(user.school);
        } else {
          const allUsers = getAllUsers();
          studentUsers = allUsers.filter(u => u.role === 'student');
        }
      } else {
        // Regular teacher viewing their own data
        try {
          const response = await getStudentsForTeacher();
          if (response.success && response.students) {
            studentUsers = response.students;
            assessmentsForStats = studentUsers.flatMap((s: any) => s.assessments || []);
          } else {
            throw new Error('API unsuccessful');
          }
        } catch (err) {
          console.log('Falling back to local storage for students', err);
          
          assessmentsForStats = getAllAssessments();
          
          if (user.school) {
            studentUsers = getStudentsBySchool(user.school);
          } else {
            const allUsers = getAllUsers();
            studentUsers = allUsers.filter(u => u.role === 'student');
          }
        }
      }

      setStudents(studentUsers);
      setAllAssessments(assessmentsForStats);
    } catch (error) {
      console.error('Error loading class data:', error);
      // Don't show toast for JSON error to avoid spamming user if LS is messy
      // toast.error('Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentComplete = (responses: number[]) => {
    const score = calculateTeachingStyleScore(responses);
    
    const newAssessment: Assessment = {
      id: generateId(),
      userId: user.id,
      type: 'teaching-style',
      responses,
      score: {
        'teaching-style': score
      },
      completedAt: new Date().toISOString(),
      completed: true
    };

    saveAssessment(newAssessment);
    clearAssessmentProgress(user.id, 'teaching-style', !!user.organizationName);
    setMyAssessments([...myAssessments, newAssessment]);
    setIsTakingAssessment(false);
    toast.success('Assessment completed successfully!');
  };

  const teachingStyleAssessments = useMemo(() => 
    myAssessments
      .filter(a => a.type === 'teaching-style')
      .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0)),
    [myAssessments]
  );

  const displayedAssessment = useMemo(() => {
    if (selectedHistoryId) {
        return teachingStyleAssessments.find(a => a.id === selectedHistoryId) || teachingStyleAssessments[0];
    }
    return teachingStyleAssessments[0];
  }, [teachingStyleAssessments, selectedHistoryId]);

  const handleDeepDive = () => {
    if (displayedAssessment) {
        setInitialResponses(displayedAssessment.responses);
        // Generate a smart subset of ~48 questions for deep dive instead of full 140
        const deepDiveQuestions = generateDeepDiveQuestions(8);
        setInitialQuestions(deepDiveQuestions);
        setIsTakingAssessment(true);
    }
  };

  const handleRetakeAssessment = () => {
    if (window.confirm("Are you sure you want to start a new assessment? Your previous results will be saved in your history.")) {
        // Clear any saved progress to start fresh
        clearAssessmentProgress(user.id, 'teaching-style', !!user.organizationName);
        setInitialResponses([]);
        setInitialQuestions([]);
        setIsTakingAssessment(true);
        setSelectedHistoryId(null); // Ensure we aren't viewing history when retaking
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading class data...</p>
        </div>
      </div>
    );
  }

  // If taking assessment, show it full screen or within layout
  if (activeTab === 'my-style' && isTakingAssessment) {
    return (
      <TeachingStyleAssessment 
        onComplete={handleAssessmentComplete}
        onBack={() => setIsTakingAssessment(false)}
        initialResponses={initialResponses}
        initialQuestions={initialQuestions}
        onSaveProgress={handleSaveProgress}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FF]">
      <TeacherAppHeader user={user} onLogout={onLogout} />
      <TeacherTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Onboarding Info for New Teachers */}
      {students.length === 0 && activeTab !== 'my-style' && (
        <div className="px-4 lg:px-6 py-4 max-w-[960px] mx-auto">
          <Alert className="border-[#2563EB] bg-blue-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Welcome to JotMinds Teacher Portal!</AlertTitle>
            <AlertDescription>
              Students from <strong>{user.school}</strong> will automatically appear here once they register and complete their assessments. 
              Students must select the same school name during registration to be linked to your class.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {activeTab === 'overview' && (
        <TeacherClassOverview students={students} assessments={allAssessments} />
      )}
      
      {activeTab === 'individual' && (
        <TeacherIndividualStudentView students={students} assessments={allAssessments} />
      )}

      {activeTab === 'my-style' && (
        <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-8">
          {displayedAssessment ? (
            <div className="space-y-8">
                {selectedHistoryId && (
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => setSelectedHistoryId(null)}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Latest Result
                        </Button>
                        <Badge variant="outline" className="text-sm">
                            Viewing Historical Result: {new Date(displayedAssessment.completedAt || "").toLocaleDateString()}
                        </Badge>
                    </div>
                )}

                <TeachingStyleResults 
                    score={displayedAssessment.score['teaching-style']} 
                    onDeepDive={
                        // Only show Deep Dive for LATEST assessment and if incomplete
                        (!selectedHistoryId && displayedAssessment.responses.filter(r => r > 0).length < 40)
                        ? handleDeepDive
                        : undefined
                    }
                />
                
                {!selectedHistoryId && (
                    <div className="flex justify-center">
                        <Button 
                            onClick={handleRetakeAssessment} 
                            size="lg" 
                            variant="outline"
                            className="gap-2 border-indigo-200 hover:bg-indigo-50 text-indigo-700"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Retake Teaching Style Assessment
                        </Button>
                    </div>
                )}

                {teachingStyleAssessments.length > 1 && !selectedHistoryId && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5 text-muted-foreground" />
                                Assessment History
                            </CardTitle>
                            <CardDescription>
                                Track how your teaching style has evolved over time.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {teachingStyleAssessments.slice(1).map((assessment) => (
                                    <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                <Calendar className="h-5 w-5 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {assessment.score['teaching-style'].primaryStyle}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Completed on {new Date(assessment.completedAt || "").toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">
                                                {new Date(assessment.completedAt || "").toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </Badge>
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedHistoryId(assessment.id)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Report
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
          ) : (
             <div className="text-center py-12 bg-white rounded-xl shadow-sm border p-8">
                <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎓</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Discover Your Teaching Style</h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                    Take the JotMinds Teaching Style Assessment to uncover your dominant teaching engines, strengths, and areas for growth. This 64-question assessment maps your authority, motivation, and instructional preferences.
                </p>
                <button 
                    onClick={startAssessment}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
                >
                    {getAssessmentProgress(user.id, 'teaching-style', !!user.organizationName) ? 'Resume Assessment' : 'Start Assessment'}
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
