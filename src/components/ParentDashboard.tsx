import { linkChildByEmail, unlinkChild } from '../utils/api';
import { createAccessRequest, getMyAccessRequests, getLinkedChildrenWithAssessments } from '../utils/api';
import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { ParentChildCognitiveReport } from './ParentChildCognitiveReport';
import { ParentObservationAssessmentComponent } from './ParentObservationAssessment';
import { ParentObservationResults } from './ParentObservationResults';
import { DualViewIntegration } from './DualViewIntegration';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User, Assessment, UserRole, AccessRequest, ParentObservationAssessment } from '../types';
import { 
  getAllUsers, 
  getUserAssessments, 
  getLinkedChildren,
  saveUser,
  getParentObservationsByParent,
  hasChildGrantedAccess
} from '../utils/storage';
import { Users, Plus, UserCheck, Clock, CheckCircle2, XCircle, User as UserIcon, LogOut, Mail, Calendar, BookOpen, TrendingUp, Brain, Heart, Shield, Home, UserPlus, X, Eye, Lightbulb, MessageSquare, Sparkles, FileText, GitCompare } from 'lucide-react';
import { FrameworkInfo } from './FrameworkInfo';
import { getGhanaMapping } from '../utils/scoring';

interface ParentDashboardProps {
  user: User;
  onLogout: () => void;
}

export function ParentDashboard({ user, onLogout }: ParentDashboardProps) {
  const [children, setChildren] = useState<User[]>([]);
  const [childrenData, setChildrenData] = useState<Map<string, Assessment[]>>(new Map());
  const [childEmail, setChildEmail] = useState('');
  const [linkMessage, setLinkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [viewingChildReport, setViewingChildReport] = useState<{ child: User; assessments: Assessment[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [parentObservations, setParentObservations] = useState<ParentObservationAssessment[]>([]);
  const [takingObservation, setTakingObservation] = useState<{ child: User } | null>(null);
  const [viewingObservationResult, setViewingObservationResult] = useState<{ assessment: ParentObservationAssessment; child: User } | null>(null);
  const [viewingDualView, setViewingDualView] = useState<{ child: User; parentObservation: ParentObservationAssessment } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadChildrenData();
    loadParentObservations();
  }, []);

  const loadChildrenData = async () => {
    try {
      setLoading(true);
      
      // Get linked children with assessments from backend
      const result = await getLinkedChildrenWithAssessments();
      
      console.log('[ParentDashboard] Loaded children data:', result);
      
      if (result.success && result.children) {
        // Extract child profiles
        const childProfiles = result.children.map((item: any) => item.child);
        setChildren(childProfiles);

        // Build assessments map
        const dataMap = new Map();
        result.children.forEach((item: any) => {
          console.log(`[ParentDashboard] Child ${item.child.name} has ${item.assessments.length} assessments:`, item.assessments);
          dataMap.set(item.child.id, item.assessments || []);
        });
        
        setChildrenData(dataMap);
      } else {
        console.log('[ParentDashboard] No children found or error:', result);
        setChildren([]);
        setChildrenData(new Map());
      }
    } catch (error) {
      console.error('[ParentDashboard] Error loading children data:', error);
      setLinkMessage({ type: 'error', text: 'Failed to load children data. Please refresh the page.' });
      setChildren([]);
      setChildrenData(new Map());
    } finally {
      setLoading(false);
    }
  };
  
  const handleLinkChild = async () => {
    if (!childEmail.trim()) {
      setLinkMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    
    try {
      const result = await createAccessRequest(childEmail.trim());
      
      if (result.success) {
        setLinkMessage({ type: 'success', text: result.message });
        setChildEmail('');
        
        // Clear success message after 5 seconds
        setTimeout(() => setLinkMessage(null), 5000);
      } else {
        setLinkMessage({ type: 'error', text: result.error || 'Failed to send access request.' });
      }
    } catch (error: any) {
      setLinkMessage({ type: 'error', text: error.message || 'Failed to send access request.' });
    }
  };
  
  const handleUnlinkChild = async (childId: string, childName: string) => {
    if (confirm(`Are you sure you want to unlink ${childName}? You can always link them again later.`)) {
      try {
        const result = await unlinkChild(childId);
        if (result.success) {
          loadChildrenData();
          setLinkMessage({ type: 'success', text: `${childName} has been unlinked.` });
          setTimeout(() => setLinkMessage(null), 3000);
        } else {
          setLinkMessage({ type: 'error', text: result.error || 'Failed to unlink child.' });
        }
      } catch (error: any) {
        setLinkMessage({ type: 'error', text: error.message || 'Failed to unlink child.' });
      }
    }
  };

  const getLatestAssessment = (childId: string, type: 'kolb' | 'sternberg' | 'dual-process') => {
    const assessments = childrenData.get(childId) || [];
    return assessments.filter(a => a.type === type).sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )[0];
  };

  const getSupportTips = (assessment: Assessment | undefined) => {
    if (!assessment) return [];

    const tips: string[] = [];

    if (assessment.score.kolb) {
      const style = assessment.score.kolb.style;
      switch (style) {
        case 'Diverging':
          tips.push('Encourage group study sessions and discussions');
          tips.push('Ask them to explain what they\'re learning in their own words');
          tips.push('Support their creative approaches to problem-solving');
          break;
        case 'Assimilating':
          tips.push('Provide quiet study time and organized materials');
          tips.push('Help them create structured study schedules');
          tips.push('Encourage them to make notes and summaries');
          break;
        case 'Converging':
          tips.push('Support hands-on learning activities and experiments');
          tips.push('Help them apply concepts to real-world problems');
          tips.push('Encourage practical application of knowledge');
          break;
        case 'Accommodating':
          tips.push('Provide opportunities for active learning');
          tips.push('Support their adaptability and flexibility');
          tips.push('Encourage trial-and-error learning approaches');
          break;
      }
    }

    if (assessment.score.sternberg) {
      const style = assessment.score.sternberg.style;
      switch (style) {
        case 'Analytical':
          tips.push('Provide resources for deeper analysis and research');
          tips.push('Encourage critical thinking about topics');
          tips.push('Support systematic problem-solving approaches');
          break;
        case 'Creative':
          tips.push('Allow time for creative projects and exploration');
          tips.push('Encourage unique approaches to assignments');
          tips.push('Support their imaginative thinking');
          break;
        case 'Practical':
          tips.push('Help them see real-world applications of learning');
          tips.push('Support hands-on projects and activities');
          tips.push('Encourage practical skill development');
          break;
      }
    }

    if (assessment.score.dualProcess) {
      const style = assessment.score.dualProcess.style;
      if (style === 'Intuitive') {
        tips.push('Remind them to slow down and check their work');
        tips.push('Encourage them to plan before acting on instinct');
      } else if (style === 'Reflective') {
        tips.push('Help them trust their preparation');
        tips.push('Encourage timely decision-making');
      }
    }

    return tips;
  };

  const loadParentObservations = async () => {
    try {
      const observations = await getParentObservationsByParent(user.id);
      setParentObservations(observations);
    } catch (error) {
      console.error('Error loading parent observations:', error);
    }
  };

  // If viewing detailed child report
  if (viewingChildReport) {
    return (
      <ParentChildCognitiveReport
        child={viewingChildReport.child}
        assessments={viewingChildReport.assessments}
        onBack={() => setViewingChildReport(null)}
      />
    );
  }

  // If taking observation assessment
  if (takingObservation) {
    return (
      <ParentObservationAssessmentComponent
        parent={user}
        child={takingObservation.child}
        onComplete={(assessment) => {
          setTakingObservation(null);
          loadParentObservations();
          setViewingObservationResult({ assessment, child: takingObservation.child });
        }}
        onCancel={() => setTakingObservation(null)}
      />
    );
  }

  // If viewing observation result
  if (viewingObservationResult) {
    return (
      <ParentObservationResults
        assessment={viewingObservationResult.assessment}
        child={viewingObservationResult.child}
        onBack={() => {
          setViewingObservationResult(null);
          loadParentObservations();
        }}
      />
    );
  }

  // If viewing dual view integration
  if (viewingDualView) {
    return (
      <DualViewIntegration
        child={viewingDualView.child}
        childAssessments={childrenData.get(viewingDualView.child.id) || []}
        parentObservation={viewingDualView.parentObservation}
        onBack={() => setViewingDualView(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-violet-50 to-indigo-50">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1FC8E1] via-[#7B61FF] to-[#2C2E83] bg-clip-text text-transparent mb-1">JotMinds</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user.name}
            </p>
            {children.length > 0 && (
              <div className="mt-1">
                <span className="text-xs text-muted-foreground">
                  {children.length} {children.length === 1 ? 'child' : 'children'} linked
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FrameworkInfo userRole="parent" />
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="children" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Children
            </TabsTrigger>
            <TabsTrigger value="observations" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observations
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Link Child Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Request Access to Child's Account
                </CardTitle>
                <CardDescription>
                  Enter your child's email address to send an access request. They will need to approve it before you can view their assessments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {children.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Already linked:</strong> {children.map(c => c.name).join(', ')}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="child@example.com"
                    value={childEmail}
                    onChange={(e) => setChildEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLinkChild()}
                  />
                  <Button onClick={handleLinkChild}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Request
                  </Button>
                </div>
                {linkMessage && (
                  <Alert className={`mt-4 ${linkMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <AlertDescription className={linkMessage.type === 'success' ? 'text-green-800' : 'text-amber-800'}>
                      {linkMessage.text}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {children.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Children Linked Yet</CardTitle>
                  <CardDescription>
                    Once you link your child's account above, you'll be able to view their assessment results and get personalized support tips.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Linked Children Overview</CardTitle>
                  <CardDescription>
                    You have {children.length} {children.length === 1 ? 'child' : 'children'} linked to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {children.map(child => {
                      const childAssessments = childrenData.get(child.id) || [];
                      const completedCount = childAssessments.filter(a => a.completed).length;
                      
                      return (
                        <Card key={child.id} className="border-2 border-[#1FC8E1]/30">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] flex items-center justify-center text-white text-lg font-bold">
                                  {child.name.charAt(0)}
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{child.name}</CardTitle>
                                  <CardDescription>{child.email}</CardDescription>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Assessments Completed:</span>
                                <Badge>{completedCount}/3</Badge>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => setActiveTab('children')}
                              >
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="children" className="space-y-6">
            {children.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Children Linked Yet</CardTitle>
                  <CardDescription>
                    Link your child's account in the Overview tab to view their detailed assessments and progress.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Tabs defaultValue={children[0]?.id} className="space-y-6">
                <TabsList>
                  {children.map(child => (
                    <TabsTrigger key={child.id} value={child.id}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      {child.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {children.map(child => {
              const kolbAssessment = getLatestAssessment(child.id, 'kolb');
              const sternbergAssessment = getLatestAssessment(child.id, 'sternberg');
              const dualProcessAssessment = getLatestAssessment(child.id, 'dual-process');
              const ghanaMapping = kolbAssessment || sternbergAssessment 
                ? getGhanaMapping({
                    kolb: kolbAssessment?.score.kolb,
                    sternberg: sternbergAssessment?.score.sternberg,
                    dualProcess: dualProcessAssessment?.score.dualProcess,
                  })
                : null;

              return (
                <TabsContent key={child.id} value={child.id} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            {child.name}'s Profile
                          </CardTitle>
                          <CardDescription>
                            {child.educationLevel} Student • Age {child.age || 'N/A'}
                            {child.school && (
                              <>
                                {' • '}
                                <Badge variant="secondary" className="text-xs ml-1">
                                  {child.school}
                                </Badge>
                              </>
                            )}
                          </CardDescription>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleUnlinkChild(child.id, child.name)}
                          className="text-muted-foreground hover:text-red-600"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Unlink
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="text-sm mb-2">Learning Style</h4>
                            {kolbAssessment ? (
                              <Badge>{kolbAssessment.score.kolb?.style}</Badge>
                            ) : (
                              <p className="text-sm text-muted-foreground">Not assessed yet</p>
                            )}
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="text-sm mb-2">Thinking Style</h4>
                            {sternbergAssessment ? (
                              <Badge>{sternbergAssessment.score.sternberg?.style}</Badge>
                            ) : (
                              <p className="text-sm text-muted-foreground">Not assessed yet</p>
                            )}
                          </div>
                          <div className="p-4 bg-amber-50 rounded-lg">
                            <h4 className="text-sm mb-2">Decision Style</h4>
                            {dualProcessAssessment ? (
                              <Badge>{dualProcessAssessment.score.dualProcess?.style}</Badge>
                            ) : (
                              <p className="text-sm text-muted-foreground">Not assessed yet</p>
                            )}
                          </div>
                        </div>
                        
                        {kolbAssessment && sternbergAssessment && dualProcessAssessment && (
                          <div className="pt-2">
                            <Button 
                              onClick={() => setViewingChildReport({ 
                                child, 
                                assessments: childrenData.get(child.id) || [] 
                              })}
                              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Complete Cognitive Profile
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {ghanaMapping && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Education Guidance for Ghana
                        </CardTitle>
                        <CardDescription>
                          Recommended paths based on {child.name}'s thinking styles
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="mb-2">Recommended SHS Tracks</h4>
                          <div className="flex flex-wrap gap-2">
                            {ghanaMapping.shsTrack.map(track => (
                              <Badge key={track} variant="secondary">{track}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2">Suggested Tertiary Focus</h4>
                          <div className="flex flex-wrap gap-2">
                            {ghanaMapping.tertiaryFocus.map(area => (
                              <Badge key={area} variant="outline">{area}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2">Career Suggestions</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {ghanaMapping.careerSuggestions.map(career => (
                              <li key={career}>{career}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        How You Can Support {child.name}
                      </CardTitle>
                      <CardDescription>
                        Personalized tips based on their thinking styles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {kolbAssessment || sternbergAssessment || dualProcessAssessment ? (
                        <div className="space-y-4">
                          {kolbAssessment && (
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <h4 className="mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4" />
                                Learning Style Support
                              </h4>
                              <ul className="space-y-2 text-sm">
                                {getSupportTips(kolbAssessment).slice(0, 3).map((tip, idx) => (
                                  <li key={idx}>• {tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {sternbergAssessment && (
                            <div className="p-4 bg-green-50 rounded-lg">
                              <h4 className="mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4" />
                                Thinking Style Support
                              </h4>
                              <ul className="space-y-2 text-sm">
                                {getSupportTips(sternbergAssessment).map((tip, idx) => (
                                  <li key={idx}>• {tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {dualProcessAssessment && (
                            <div className="p-4 bg-amber-50 rounded-lg">
                              <h4 className="mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4" />
                                Decision-Making Support
                              </h4>
                              <ul className="space-y-2 text-sm">
                                {getSupportTips(dualProcessAssessment).map((tip, idx) => (
                                  <li key={idx}>• {tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <h4 className="mb-2">General Support Tips</h4>
                            <ul className="space-y-2 text-sm">
                              <li>• Create a consistent study environment and routine</li>
                              <li>• Celebrate their unique strengths and approaches</li>
                              <li>• Communicate regularly with their teachers</li>
                              <li>• Encourage self-reflection on their learning</li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Encourage {child.name} to complete the assessments to receive personalized support recommendations.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                </TabsContent>
              );
                })}
              </Tabs>
            )}
          </TabsContent>

          <TabsContent value="observations" className="space-y-6">
            {children.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Children Linked Yet</CardTitle>
                  <CardDescription>
                    Link your child's account in the Overview tab to complete observation assessments.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-[#1FC8E1]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Parent Observation Assessment
                    </CardTitle>
                    <CardDescription>
                      Provide your perspective on your child's learning habits, thinking patterns, and decision-making behaviors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      The Parent Observation Assessment helps you understand your child's cognitive profile from your perspective as a parent. Complete this 24-question assessment to gain insights into how your child learns, thinks, and makes decisions.
                    </p>
                  </CardContent>
                </Card>

                <div className="grid gap-4">
                  {children.map(child => {
                    const childObservations = parentObservations.filter(o => o.childId === child.id);
                    const latestObservation = childObservations.sort((a, b) => 
                      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
                    )[0];

                    return (
                      <Card key={child.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] flex items-center justify-center text-white text-lg font-bold">
                                {child.name.charAt(0)}
                              </div>
                              <div>
                                <CardTitle>{child.name}</CardTitle>
                                <CardDescription>
                                  {childObservations.length} observation{childObservations.length !== 1 ? 's' : ''} completed
                                </CardDescription>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button
                            onClick={() => setTakingObservation({ child })}
                            className="w-full bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] hover:opacity-90"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            {childObservations.length > 0 ? 'Complete New Observation' : 'Start Observation Assessment'}
                          </Button>

                          {latestObservation && (
                            <>
                              <div className="pt-3 border-t">
                                <h4 className="text-sm font-medium mb-2">Latest Observation</h4>
                                <div className="text-xs text-muted-foreground mb-3">
                                  Completed on {new Date(latestObservation.completedAt).toLocaleDateString()}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div className="p-2 bg-blue-50 rounded text-xs">
                                    <div className="text-muted-foreground mb-1">Learning</div>
                                    <Badge variant="outline" className="text-xs">
                                      {latestObservation.score.sectionA.style}
                                    </Badge>
                                  </div>
                                  <div className="p-2 bg-purple-50 rounded text-xs">
                                    <div className="text-muted-foreground mb-1">Thinking</div>
                                    <Badge variant="outline" className="text-xs">
                                      {latestObservation.score.sectionB.style}
                                    </Badge>
                                  </div>
                                  <div className="p-2 bg-green-50 rounded text-xs">
                                    <div className="text-muted-foreground mb-1">Decision</div>
                                    <Badge variant="outline" className="text-xs">
                                      {latestObservation.score.sectionC.style}
                                    </Badge>
                                  </div>
                                  <div className="p-2 bg-orange-50 rounded text-xs">
                                    <div className="text-muted-foreground mb-1">Motivation</div>
                                    <Badge variant="outline" className="text-xs">
                                      {latestObservation.score.sectionD.style}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setViewingObservationResult({ assessment: latestObservation, child })}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Results
                                  </Button>
                                  {hasChildGrantedAccess(child.id, user.id) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => setViewingDualView({ child, parentObservation: latestObservation })}
                                    >
                                      <GitCompare className="mr-2 h-4 w-4" />
                                      Compare Views
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {childObservations.length > 1 && (
                                <details className="pt-2">
                                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                                    View all {childObservations.length} observations
                                  </summary>
                                  <div className="mt-2 space-y-2">
                                    {childObservations.map((obs, idx) => (
                                      <div key={obs.id} className="p-2 bg-gray-50 rounded text-xs flex items-center justify-between">
                                        <span>
                                          {new Date(obs.completedAt).toLocaleDateString()}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 text-xs"
                                          onClick={() => setViewingObservationResult({ assessment: obs, child })}
                                        >
                                          View
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
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
                    Your feedback helps us improve the platform for parents, students, teachers, and professionals across Ghana
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
                        <span className="text-sm">How JotMinds helps you support your child</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-[#2C2E83] font-bold text-lg">•</span>
                        <span className="text-sm">Insights gained about your child's learning</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                        <span className="text-[#1FC8E1] font-bold text-lg">•</span>
                        <span className="text-sm">Usefulness of parenting tips and resources</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-[#2C2E83] font-bold text-lg">•</span>
                        <span className="text-sm">How well it fits your family's needs</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                        <span className="text-[#1FC8E1] font-bold text-lg">•</span>
                        <span className="text-sm">Communication with teachers/school</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-[#2C2E83] font-bold text-lg">•</span>
                        <span className="text-sm">Suggestions for improvement</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-[#1FC8E1]/10 to-[#2C2E83]/10 rounded-lg p-4 border border-[#1FC8E1]/30">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">✓</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Your Feedback Matters</p>
                        <p className="text-sm text-gray-600">
                          As a parent, your perspective helps us create better tools to support families and children's educational development across Ghana.
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