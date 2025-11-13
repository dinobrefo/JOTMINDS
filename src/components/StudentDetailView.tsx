import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User, Assessment } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { ArrowLeft, TrendingUp, BookOpen, Brain, Target, Lightbulb, FileText } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Textarea } from './ui/textarea';

interface StudentDetailViewProps {
  student: User;
  assessments: Assessment[];
  onBack: () => void;
}

export function StudentDetailView({ student, assessments, onBack }: StudentDetailViewProps) {
  const [teacherNotes, setTeacherNotes] = useState('');

  // Get student's assessments
  const studentAssessments = assessments.filter(a => a.userId === student.id && a.completed);
  
  const latestLearning = studentAssessments
    .filter(a => a.type === 'kolb')
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];
  
  const latestThinking = studentAssessments
    .filter(a => a.type === 'sternberg')
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];
  
  const latestDecision = studentAssessments
    .filter(a => a.type === 'dual-process')
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

  // Prepare radar chart data for cognitive profile
  const cognitiveProfile = [
    {
      dimension: 'Concrete Experience',
      score: latestLearning?.score.kolb?.concreteExperience || 0,
      fullMark: 48
    },
    {
      dimension: 'Reflective Observation',
      score: latestLearning?.score.kolb?.reflectiveObservation || 0,
      fullMark: 48
    },
    {
      dimension: 'Abstract Concept',
      score: latestLearning?.score.kolb?.abstractConceptualization || 0,
      fullMark: 48
    },
    {
      dimension: 'Active Experiment',
      score: latestLearning?.score.kolb?.activeExperimentation || 0,
      fullMark: 48
    }
  ];

  // Get personalized teaching recommendations
  const getTeachingStrategies = () => {
    const strategies: string[] = [];
    
    if (latestLearning) {
      const style = latestLearning.score.kolb?.style;
      switch (style) {
        case 'Diverging':
          strategies.push(
            'Encourage group discussions and collaborative projects',
            'Use brainstorming sessions to explore multiple perspectives',
            'Provide opportunities for reflection through journals or discussions',
            'Connect learning to personal experiences and emotions',
            'Allow time for observation before asking for action'
          );
          break;
        case 'Assimilating':
          strategies.push(
            'Present information in logical, organized frameworks',
            'Provide reading materials and time for independent study',
            'Use diagrams, models, and theoretical explanations',
            'Encourage note-taking and systematic organization',
            'Allow time for deep thinking and analysis'
          );
          break;
        case 'Converging':
          strategies.push(
            'Focus on practical applications and problem-solving',
            'Use simulations, experiments, and technical tasks',
            'Provide clear objectives and step-by-step processes',
            'Encourage hypothesis testing and logical reasoning',
            'Offer opportunities to apply theories to real situations'
          );
          break;
        case 'Accommodating':
          strategies.push(
            'Incorporate hands-on activities and experiments',
            'Allow learning through trial and error',
            'Use real-world examples and practical demonstrations',
            'Encourage active participation and movement',
            'Provide immediate feedback and opportunities to adjust'
          );
          break;
      }
    }

    if (latestThinking) {
      const style = latestThinking.score.sternberg?.style;
      switch (style) {
        case 'Analytical':
          strategies.push(
            'Present challenging analytical problems to solve',
            'Encourage critical evaluation and comparison',
            'Use debates and structured arguments'
          );
          break;
        case 'Creative':
          strategies.push(
            'Offer open-ended projects with creative freedom',
            'Encourage innovative solutions and imagination',
            'Value novel approaches even if unconventional'
          );
          break;
        case 'Practical':
          strategies.push(
            'Connect lessons to everyday life applications',
            'Use case studies and real-world scenarios',
            'Emphasize practical skills and useful knowledge'
          );
          break;
      }
    }

    return strategies;
  };

  // Get areas for support
  const getAreasForSupport = () => {
    const areas: string[] = [];
    
    if (latestLearning) {
      const scores = latestLearning.score.kolb;
      const dimensions = [
        { name: 'Concrete Experience', score: scores?.concreteExperience || 0 },
        { name: 'Reflective Observation', score: scores?.reflectiveObservation || 0 },
        { name: 'Abstract Conceptualization', score: scores?.abstractConceptualization || 0 },
        { name: 'Active Experimentation', score: scores?.activeExperimentation || 0 }
      ];
      
      const weakest = dimensions.sort((a, b) => a.score - b.score)[0];
      
      if (weakest.score < 25) {
        switch (weakest.name) {
          case 'Concrete Experience':
            areas.push('May need more connection to real-world experiences and emotional engagement');
            break;
          case 'Reflective Observation':
            areas.push('Could benefit from more time to reflect and observe before acting');
            break;
          case 'Abstract Conceptualization':
            areas.push('May need support with theoretical thinking and systematic analysis');
            break;
          case 'Active Experimentation':
            areas.push('Could use more hands-on practice and active application opportunities');
            break;
        }
      }
    }

    if (latestDecision) {
      const style = latestDecision.score.dualProcess?.style;
      if (style === 'Intuitive Dominant') {
        areas.push('Encourage more analytical reasoning and evidence-based decision-making');
      } else if (style === 'Reflective Dominant') {
        areas.push('Help develop confidence in intuitive responses when quick decisions are needed');
      }
    }

    return areas.length > 0 ? areas : ['Continue supporting balanced cognitive development across all areas'];
  };

  const teachingStrategies = getTeachingStrategies();
  const areasForSupport = getAreasForSupport();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Students
        </Button>
      </div>

      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{student.name}</CardTitle>
              <CardDescription className="text-base mt-1">
                Individual Learning Profile & Teaching Recommendations
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-base px-4 py-2">
              {studentAssessments.length} Assessment{studentAssessments.length !== 1 ? 's' : ''} Completed
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Cognitive Profile</TabsTrigger>
          <TabsTrigger value="strategies">Teaching Strategies</TabsTrigger>
          <TabsTrigger value="progress">Progress & Notes</TabsTrigger>
        </TabsList>

        {/* Cognitive Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  Learning Style
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestLearning ? (
                  <div className="space-y-2">
                    <Badge className="text-base px-3 py-1">
                      {latestLearning.score.kolb?.style}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Assessed on {new Date(latestLearning.completedAt!).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not yet assessed</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Thinking Style
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestThinking ? (
                  <div className="space-y-2">
                    <Badge className="text-base px-3 py-1">
                      {latestThinking.score.sternberg?.style}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Assessed on {new Date(latestThinking.completedAt!).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not yet assessed</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Decision Style
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestDecision ? (
                  <div className="space-y-2">
                    <Badge className="text-base px-3 py-1">
                      {latestDecision.score.dualProcess?.style}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Assessed on {new Date(latestDecision.completedAt!).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not yet assessed</p>
                )}
              </CardContent>
            </Card>
          </div>

          {latestLearning && (
            <Card>
              <CardHeader>
                <CardTitle>Learning Dimensions Radar</CardTitle>
                <CardDescription>
                  Visual representation of {student.name}'s learning preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={cognitiveProfile}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dimension" />
                    <PolarRadiusAxis angle={90} domain={[0, 48]} />
                    <Radar
                      name={student.name}
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Teaching Strategies Tab */}
        <TabsContent value="strategies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Personalized Teaching Strategies
              </CardTitle>
              <CardDescription>
                Evidence-based strategies tailored to {student.name}'s cognitive profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teachingStrategies.length > 0 ? (
                <div className="space-y-3">
                  {teachingStrategies.map((strategy, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </div>
                      </div>
                      <p className="text-sm">{strategy}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Complete assessments to receive personalized teaching strategies for {student.name}.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Areas for Additional Support
              </CardTitle>
              <CardDescription>
                Dimensions where {student.name} may need extra guidance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {areasForSupport.map((area, index) => (
                  <li key={index} className="flex gap-2 text-sm">
                    <span className="text-orange-600">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress & Notes Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Assessment History
              </CardTitle>
              <CardDescription>
                Track {student.name}'s assessment journey over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentAssessments.length > 0 ? (
                <div className="space-y-3">
                  {studentAssessments
                    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
                    .map((assessment) => (
                      <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {assessment.type === 'kolb' ? 'Learning Style' : 
                             assessment.type === 'sternberg' ? 'Thinking Style' : 
                             'Decision Style'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(assessment.completedAt!).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <Badge>
                          {assessment.score.kolb?.style || 
                           assessment.score.sternberg?.style || 
                           assessment.score.dualProcess?.style}
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No assessments completed yet
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Teacher Notes & Observations
              </CardTitle>
              <CardDescription>
                Record your observations and notes about {student.name}'s progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your observations, notes, or strategies that have worked well..."
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                rows={6}
              />
              <Button>Save Notes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
