import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { getPersonalizedQuestions } from '../utils/assessmentQuestions';
import { calculateKolbScore, calculateSternbergScore, calculateDualProcessScore } from '../utils/scoring';
import { saveAssessment, generateId, saveAssessmentProgress, getAssessmentProgress, clearAssessmentProgress } from '../utils/storage';
import { Assessment, AssessmentScore } from '../types';
import { ArrowLeft, ArrowRight, CheckCircle, BookOpen, Brain, Target, Info, Clock, Save } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AssessmentTakingProps {
  userId: string;
  assessmentType: 'kolb' | 'sternberg' | 'dual-process';
  onComplete: (assessment: Assessment) => void;
  onCancel: () => void;
  isOrganizational?: boolean;
}

const assessmentTitles = {
  kolb: "Your Learning Style",
  sternberg: "Your Thinking Style",
  'dual-process': 'Your Decision Style',
};

const orgAssessmentTitles = {
  kolb: "Learning Agility Assessment",
  sternberg: "Thinking Diversity Assessment",
  'dual-process': 'Decision Intelligence Assessment',
};

const assessmentDescriptions = {
  kolb: 'Discover how you learn',
  sternberg: 'Understand how you think',
  'dual-process': 'Learn how you make decisions',
};

const orgAssessmentDescriptions = {
  kolb: 'Measure how you learn from experience, reflect, conceptualize, and apply ideas.',
  sternberg: 'Evaluate analytical, creative, and practical thinking capabilities.',
  'dual-process': 'Analyze your balance between intuitive and analytical decision-making.',
};

export function AssessmentTaking({ userId, assessmentType, onComplete, onCancel, isOrganizational = false }: AssessmentTakingProps) {
  // Get personalized questions for this user (12 questions, consistent per user)
  const [questions, setQuestions] = useState(() => getPersonalizedQuestions(assessmentType, userId, isOrganizational));
  const [showIntro, setShowIntro] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<number[]>(new Array(questions.length).fill(0));
  const [hasResumableProgress, setHasResumableProgress] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Check for saved progress on mount
  useEffect(() => {
    try {
      const savedProgress = getAssessmentProgress(userId, assessmentType, isOrganizational);
      console.log('Checking for saved progress:', { userId, assessmentType, isOrganizational, savedProgress });
      if (savedProgress && savedProgress.questions) {
        setHasResumableProgress(true);
        setLastSaveTime(savedProgress.lastSaved);
        // Use the saved questions to ensure consistency
        setQuestions(savedProgress.questions);
        console.log('Found saved progress from:', savedProgress.lastSaved);
      }
    } catch (error) {
      console.error('Failed to load saved progress:', error);
    }
  }, [userId, assessmentType, isOrganizational]);

  // Auto-save progress whenever responses or current question changes
  useEffect(() => {
    // Don't save if we're still on the intro screen
    if (showIntro) return;
    
    // Don't save if no answers have been given yet
    const hasAnyAnswers = responses.some(r => r > 0);
    if (!hasAnyAnswers) return;

    // Save progress including the questions
    const progress = {
      userId,
      assessmentType,
      isOrganizational,
      currentQuestion,
      responses,
      questions, // Save the specific questions shown to this user
      lastSaved: new Date().toISOString(),
    };
    
    try {
      setIsSaving(true);
      saveAssessmentProgress(progress);
      setLastSaveTime(progress.lastSaved);
      console.log('Progress saved:', progress);
      
      // Brief visual feedback
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast.error('Failed to save progress');
      setIsSaving(false);
    }
  }, [responses, currentQuestion, showIntro, userId, assessmentType, isOrganizational]);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleResponse = (value: string) => {
    const newResponses = [...responses];
    newResponses[currentQuestion] = parseInt(value);
    setResponses(newResponses);
    console.log('Response recorded:', { question: currentQuestion, value: parseInt(value), total: newResponses.filter(r => r > 0).length });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    let score: AssessmentScore = {};

    if (assessmentType === 'kolb') {
      score.kolb = calculateKolbScore(responses, questions);
    } else if (assessmentType === 'sternberg') {
      score.sternberg = calculateSternbergScore(responses, questions);
    } else {
      score.dualProcess = calculateDualProcessScore(responses, questions);
    }

    const assessment: Assessment = {
      id: generateId(),
      userId,
      type: assessmentType,
      responses,
      questions, // Save the questions used for this assessment
      score,
      completedAt: new Date().toISOString(),
    };

    saveAssessment(assessment);
    
    // Clear saved progress after successful submission
    clearAssessmentProgress(userId, assessmentType, isOrganizational);
    
    onComplete(assessment);
  };

  const handleCancel = () => {
    // Clear saved progress when cancelling
    clearAssessmentProgress(userId, assessmentType, isOrganizational);
    onCancel();
  };

  const handleResumeProgress = () => {
    const savedProgress = getAssessmentProgress(userId, assessmentType, isOrganizational);
    if (savedProgress) {
      // Restore the exact questions that were shown before
      if (savedProgress.questions) {
        setQuestions(savedProgress.questions);
      }
      setCurrentQuestion(savedProgress.currentQuestion);
      setResponses(savedProgress.responses);
      setShowIntro(false);
      toast.success('Progress restored! Continue where you left off.');
    }
  };

  const handleStartFresh = () => {
    // Clear any saved progress
    clearAssessmentProgress(userId, assessmentType, isOrganizational);
    setHasResumableProgress(false);
    setShowIntro(false);
  };

  const isLastQuestion = currentQuestion === questions.length - 1;
  const canProceed = responses[currentQuestion] > 0;

  // Get assessment-specific info
  const assessmentIcons: Record<typeof assessmentType, typeof BookOpen> = {
    kolb: BookOpen,
    sternberg: Brain,
    'dual-process': Target
  };
  
  const assessmentContexts: Record<typeof assessmentType, {
    stage: string;
    focus: string;
    questions: string;
    time: string;
  }> = {
    kolb: {
      stage: 'Input Stage',
      focus: 'How you absorb and process new experiences',
      questions: isOrganizational ? 
        'This assessment measures your learning agility through experience, reflection, conceptualization, and experimentation. You\'ll receive 12 personalized questions selected just for you.' :
        'Discover whether you learn best through hands-on experience, thoughtful reflection, theoretical analysis, or active testing. You\'ll receive 12 personalized questions selected just for you.',
      time: '3-5 minutes'
    },
    sternberg: {
      stage: 'Processing Stage',
      focus: 'How you analyze, create, and apply ideas',
      questions: isOrganizational ?
        'This assessment evaluates your balance of analytical, creative, and practical thinking approaches. You\'ll receive 12 personalized questions selected just for you.' :
        'Understand your dominant thinking strengths: critical analysis, creative innovation, or practical application. You\'ll receive 12 personalized questions selected just for you.',
      time: '3-5 minutes'
    },
    'dual-process': {
      stage: 'Output Stage',
      focus: 'How you choose or act based on thought or instinct',
      questions: isOrganizational ?
        'This assessment analyzes how you make decisions under different conditions and time pressures. You\'ll receive 12 personalized questions selected just for you.' :
        'Learn whether you tend to make quick intuitive decisions or prefer slower, more deliberate analysis. You\'ll receive 12 personalized questions selected just for you.',
      time: '3-5 minutes'
    }
  };

  const AssessmentIcon = assessmentIcons[assessmentType] || BookOpen;
  const assessmentInfo = assessmentContexts[assessmentType] || assessmentContexts.kolb;

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-3xl mx-auto py-8">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <AssessmentIcon className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{isOrganizational ? orgAssessmentTitles[assessmentType] : assessmentTitles[assessmentType]}</CardTitle>
                    <Badge variant="secondary">{assessmentInfo.stage}</Badge>
                  </div>
                  <CardDescription className="text-base">
                    {isOrganizational ? orgAssessmentDescriptions[assessmentType] : assessmentDescriptions[assessmentType]}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>What This Assessment Measures:</strong> {assessmentInfo.focus}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">About This Assessment</h4>
                  <p className="text-sm text-muted-foreground">{assessmentInfo.questions}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Number of Questions</p>
                      <p className="text-sm text-muted-foreground">{questions.length} questions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Estimated Time</p>
                      <p className="text-sm text-muted-foreground">{assessmentInfo.time}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Part of Your Complete Cognitive Profile
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    This is one of three assessments that together create your complete cognitive profile:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={assessmentType === 'kolb' ? 'default' : 'outline'}>
                      <BookOpen className="h-3 w-3 mr-1" /> Learning Style
                    </Badge>
                    <Badge variant={assessmentType === 'sternberg' ? 'default' : 'outline'}>
                      <Brain className="h-3 w-3 mr-1" /> Thinking Style
                    </Badge>
                    <Badge variant={assessmentType === 'dual-process' ? 'default' : 'outline'}>
                      <Target className="h-3 w-3 mr-1" /> Decision Style
                    </Badge>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Tips for Best Results</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Answer honestly based on how you naturally think and act</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Don't overthink your responses - go with your first instinct</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Complete all questions in one sitting for accurate results</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>There are no right or wrong answers - this is about understanding yourself</span>
                    </li>
                  </ul>
                </div>
              </div>

              {hasResumableProgress && (
                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <Save className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Progress Found!</strong> You have an incomplete assessment from {new Date(lastSaveTime).toLocaleString()}. Would you like to continue or start fresh?
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Cancel
                </Button>
                {hasResumableProgress ? (
                  <>
                    <Button variant="outline" onClick={handleStartFresh} className="flex-1">
                      Start Fresh
                    </Button>
                    <Button onClick={handleResumeProgress} className="flex-1">
                      Resume
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleStartFresh} className="flex-1">
                    Begin Assessment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle>{isOrganizational ? orgAssessmentTitles[assessmentType] : assessmentTitles[assessmentType]}</CardTitle>
                <CardDescription>{isOrganizational ? orgAssessmentDescriptions[assessmentType] : assessmentDescriptions[assessmentType]}</CardDescription>
              </div>
              {(lastSaveTime || isSaving) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Save className={`h-3 w-3 ${isSaving ? 'text-blue-600 animate-pulse' : 'text-green-600'}`} />
                  <span>{isSaving ? 'Saving...' : 'Saved'}</span>
                </div>
              )}
            </div>
            <div className="pt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <p className="text-lg">{questions[currentQuestion].text}</p>

              <RadioGroup
                value={responses[currentQuestion].toString()}
                onValueChange={handleResponse}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="1" id="r1" />
                  <Label htmlFor="r1" className="flex-1 cursor-pointer">
                    Strongly Disagree
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="2" id="r2" />
                  <Label htmlFor="r2" className="flex-1 cursor-pointer">
                    Disagree
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="3" id="r3" />
                  <Label htmlFor="r3" className="flex-1 cursor-pointer">
                    Neutral
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="4" id="r4" />
                  <Label htmlFor="r4" className="flex-1 cursor-pointer">
                    Agree
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="5" id="r5" />
                  <Label htmlFor="r5" className="flex-1 cursor-pointer">
                    Strongly Agree
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={currentQuestion === 0 ? handleCancel : handlePrevious}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {currentQuestion === 0 ? 'Cancel' : 'Previous'}
              </Button>

              {isLastQuestion ? (
                <Button onClick={handleSubmit} disabled={!canProceed}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!canProceed}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
