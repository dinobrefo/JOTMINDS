import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LogOut, Brain, Target, Lightbulb, CheckCircle2, Lock, TrendingUp, Users, ArrowLeft, UserPlus, X, Eye } from 'lucide-react';
import { getAllAssessmentResults, getOrganizationMembers, getUserAssessmentResults, getLinkedChildren, linkChildByEmail, unlinkChild } from '../utils/api';
import { Input } from './ui/input';

interface DashboardProps {
  onStartAssessment: (type: 'learning' | 'thinking' | 'decision') => void;
  onViewProfile: () => void;
  onViewAdmin?: () => void;
  onViewChildProfile?: (childId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onStartAssessment, 
  onViewProfile,
  onViewAdmin,
  onViewChildProfile
}) => {
  const { user, signOut, impersonatedUser } = useAuth();
  const [assessmentResults, setAssessmentResults] = useState<any[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<any[]>([]);
  const [linkedChildren, setLinkedChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkChildEmail, setLinkChildEmail] = useState('');
  const [linkChildError, setLinkChildError] = useState('');

  const displayUser = impersonatedUser || user;
  
  // Note: Admins can view this dashboard when impersonating users
  // The App.tsx routing logic handles redirecting admins who aren't impersonating

  useEffect(() => {
    const fetchData = async () => {
      try {
        // If viewing impersonated user (admin viewing someone's dashboard)
        if (impersonatedUser) {
          const { results } = await getUserAssessmentResults(impersonatedUser.id);
          setAssessmentResults(results || []);
        } else {
          // Regular user viewing their own dashboard
          const { results } = await getAllAssessmentResults();
          setAssessmentResults(results || []);
        }

        // If organization user, fetch members
        if (displayUser?.role === 'professional' && !impersonatedUser) {
          try {
            const { members } = await getOrganizationMembers();
            setOrganizationMembers(members || []);
          } catch (error) {
            console.error('Error fetching organization members:', error);
          }
        }

        // If parent user, fetch linked children
        if (displayUser?.role === 'Parent' && !impersonatedUser) {
          try {
            const { children } = await getLinkedChildren();
            setLinkedChildren(children || []);
          } catch (error) {
            console.error('Error fetching linked children:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching assessment results:', error);
      } finally {
        setLoading(false);
      }
    };

    if (displayUser) {
      fetchData();
    }
  }, [displayUser, impersonatedUser]);

  if (!displayUser) return null;

  const assessments = [
    {
      type: 'learning' as const,
      title: 'Your Learning Style',
      description: 'Discover how you learn best',
      icon: Brain,
      color: '#2C2E83',
      bgColor: '#F0F0FF'
    },
    {
      type: 'thinking' as const,
      title: 'Your Thinking Style',
      description: 'Understand your cognitive approach',
      icon: Lightbulb,
      color: '#1FC8E1',
      bgColor: '#E0F9FF'
    },
    {
      type: 'decision' as const,
      title: 'Your Decision Style',
      description: 'Learn how you make choices',
      icon: Target,
      color: '#FF715B',
      bgColor: '#FFF0EE'
    }
  ];

  const isAssessmentCompleted = (type: string) => {
    return assessmentResults.some(result => result.assessmentType === type);
  };

  const allAssessmentsCompleted = assessments.every(a => isAssessmentCompleted(a.type));

  const getRoleMessage = () => {
    switch (displayUser.role) {
      case 'student':
        return 'Complete assessments to understand your unique cognitive profile and optimize your learning journey.';
      case 'teacher':
        return 'Use these insights to better understand your teaching approach and support diverse learners.';
      case 'parent':
        return 'Discover your thinking patterns to better support your child\'s educational development.';
      case 'professional':
        return 'Assess cognitive profiles for employee fit and continuous professional development.';
      default:
        return 'Complete all three assessments to unlock your comprehensive cognitive profile.';
    }
  };

  const handleLinkChild = async () => {
    if (!linkChildEmail) {
      setLinkChildError('Please enter a valid email address.');
      return;
    }

    try {
      const { success, message } = await linkChildByEmail(linkChildEmail);
      if (success) {
        setLinkChildEmail('');
        setLinkChildError('');
        const { children } = await getLinkedChildren();
        setLinkedChildren(children || []);
      } else {
        setLinkChildError(message);
      }
    } catch (error) {
      console.error('Error linking child:', error);
      setLinkChildError('An error occurred while linking the child. Please try again.');
    }
  };

  const handleUnlinkChild = async (childId: string) => {
    try {
      const { success, message } = await unlinkChild(childId);
      if (success) {
        const { children } = await getLinkedChildren();
        setLinkedChildren(children || []);
      } else {
        setLinkChildError(message);
      }
    } catch (error) {
      console.error('Error unlinking child:', error);
      setLinkChildError('An error occurred while unlinking the child. Please try again.');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #F8F9FA 0%, #FFFFFF 100%)' }}>
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl mb-1" style={{ color: '#2C2E83' }}>JotMinds</h1>
              <p className="text-sm" style={{ color: '#1FC8E1' }}>Discover How You Think</p>
            </div>
            <div className="flex items-center gap-3">
              {!impersonatedUser && user?.role === 'admin' && (
                <Button
                  variant="outline"
                  onClick={onViewAdmin}
                >
                  Admin Panel
                </Button>
              )}
              {allAssessmentsCompleted && (
                <Button
                  variant="outline"
                  onClick={onViewProfile}
                  style={{ borderColor: '#1FC8E1', color: '#1FC8E1' }}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Cognitive Profile
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back to Admin Button (when viewing as admin) */}
        {impersonatedUser && (
          <Button
            variant="ghost"
            onClick={onViewAdmin}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl mb-2">Welcome back, {displayUser.name}!</h2>
              <Badge variant="secondary" className="text-sm">{displayUser.role}</Badge>
            </div>
          </div>
          <p className="text-lg" style={{ color: '#6B7280' }}>
            {getRoleMessage()}
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8 shadow-md" style={{ borderLeft: '4px solid #1FC8E1' }}>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Track your assessment completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Assessments Completed</span>
                  <span className="text-sm">
                    {assessmentResults.length} of {assessments.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(assessmentResults.length / assessments.length) * 100}%`,
                      background: 'linear-gradient(90deg, #2C2E83 0%, #1FC8E1 100%)'
                    }}
                  />
                </div>
              </div>
              {allAssessmentsCompleted && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#D1FAE5' }}>
                  <CheckCircle2 className="w-5 h-5" style={{ color: '#10B981' }} />
                  <span className="text-sm" style={{ color: '#10B981' }}>Complete</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assessment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {assessments.map((assessment) => {
            const completed = isAssessmentCompleted(assessment.type);
            const Icon = assessment.icon;

            return (
              <Card
                key={assessment.type}
                className={`shadow-lg transition-all hover:shadow-xl ${
                  completed ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: assessment.bgColor }}
                    >
                      <Icon className="w-6 h-6" style={{ color: assessment.color }} />
                    </div>
                    {completed && (
                      <CheckCircle2 className="w-6 h-6" style={{ color: '#10B981' }} />
                    )}
                  </div>
                  <CardTitle>{assessment.title}</CardTitle>
                  <CardDescription>{assessment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant={completed ? 'outline' : 'default'}
                    onClick={() => onStartAssessment(assessment.type)}
                    style={{
                      backgroundColor: completed ? 'transparent' : assessment.color,
                      borderColor: completed ? assessment.color : undefined,
                      color: completed ? assessment.color : 'white'
                    }}
                  >
                    {completed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Retake Assessment
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Start Assessment
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Role-Specific Sections */}
        {displayUser.role === 'professional' && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Organization Overview
              </CardTitle>
              <CardDescription>
                {displayUser.organizationName || 'Your Organization'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#F0F9FF' }}>
                    <p className="text-sm text-gray-600 mb-1">Team Members</p>
                    <p className="text-2xl" style={{ color: '#2C2E83' }}>
                      {organizationMembers.length}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF0EE' }}>
                    <p className="text-sm text-gray-600 mb-1">Assessments</p>
                    <p className="text-2xl" style={{ color: '#FF715B' }}>
                      {assessmentResults.length}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Use cognitive assessments to understand your team's diverse thinking styles, 
                  improve hiring decisions, and support continuous professional development.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {displayUser.role === 'teacher' && allAssessmentsCompleted && (
          <Card className="shadow-md" style={{ borderLeft: '4px solid #10B981' }}>
            <CardHeader>
              <CardTitle>Teaching Insights</CardTitle>
              <CardDescription>How your cognitive profile enhances your teaching</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Understanding your own learning, thinking, and decision-making styles helps you recognize 
                and accommodate diverse student needs. Use your cognitive profile to create more inclusive 
                and effective learning environments.
              </p>
            </CardContent>
          </Card>
        )}

        {displayUser.role === 'parent' && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Link Child
              </CardTitle>
              <CardDescription>
                Link a child's account to your parent account to view their assessment results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#F0F9FF' }}>
                    <p className="text-sm text-gray-600 mb-1">Linked Children</p>
                    <p className="text-2xl" style={{ color: '#2C2E83' }}>
                      {linkedChildren.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    type="email"
                    placeholder="Enter child's email"
                    value={linkChildEmail}
                    onChange={(e) => setLinkChildEmail(e.target.value)}
                    className="w-full"
                  />
                  <Button
                    variant="default"
                    onClick={handleLinkChild}
                  >
                    Link Child
                  </Button>
                </div>
                {linkChildError && (
                  <p className="text-sm text-red-500">
                    {linkChildError}
                  </p>
                )}
                <div className="space-y-2">
                  {linkedChildren.map(child => (
                    <div key={child.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: '#F0F9FF', borderColor: '#2C2E83' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2C2E83' }}>
                          <span className="text-white text-sm">{child.name?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm" style={{ color: '#2C2E83' }}>{child.name}</p>
                          <p className="text-xs text-gray-500">{child.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {onViewChildProfile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewChildProfile(child.id)}
                            style={{ borderColor: '#1FC8E1', color: '#1FC8E1' }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlinkChild(child.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};