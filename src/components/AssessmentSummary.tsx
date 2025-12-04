import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle2, AlertCircle, Lightbulb, TrendingUp, ArrowRight } from 'lucide-react';
import { useAuth } from './AuthContext';
import { FeedbackPrompt } from './FeedbackPrompt';

interface AssessmentSummaryProps {
  type: 'learning' | 'thinking' | 'decision';
  results: { [key: string]: number };
  insights: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    dominantStyle: string;
    secondaryStyle: string | null;
  };
  onBackToDashboard: () => void;
  onStartNextAssessment?: (type: 'learning' | 'thinking' | 'decision') => void;
}

export const AssessmentSummary: React.FC<AssessmentSummaryProps> = ({
  type,
  results,
  insights,
  onBackToDashboard,
  onStartNextAssessment
}) => {
  const { user } = useAuth();

  const getAssessmentTitle = () => {
    switch (type) {
      case 'learning': return 'Your Learning Style';
      case 'thinking': return 'Your Thinking Style';
      case 'decision': return 'Your Decision Style';
    }
  };

  // Determine which assessments are incomplete
  const getNextAssessment = () => {
    if (!user?.assessmentsCompleted) return null;

    const assessmentMapping = {
      'learning': 'kolb',
      'thinking': 'sternberg',
      'decision': 'dual-process'
    };

    const typeMapping = {
      'kolb': 'learning',
      'sternberg': 'thinking',
      'dual-process': 'decision'
    };

    const completed = user.assessmentsCompleted;

    // Check each assessment type
    const assessmentOrder: ('learning' | 'thinking' | 'decision')[] = ['learning', 'thinking', 'decision'];
    
    for (const assessmentType of assessmentOrder) {
      const internalType = assessmentMapping[assessmentType as keyof typeof assessmentMapping];
      if (!completed.includes(internalType)) {
        return {
          type: assessmentType,
          title: assessmentType === 'learning' ? 'Your Learning Style' :
                 assessmentType === 'thinking' ? 'Your Thinking Style' :
                 'Your Decision Style'
        };
      }
    }

    return null; // All assessments completed
  };

  const nextAssessment = getNextAssessment();

  const sortedResults = Object.entries(results).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(to bottom, #F8F9FA 0%, #FFFFFF 100%)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#E8F9FF' }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: '#1FC8E1' }} />
          </div>
          <h1 className="text-3xl mb-2" style={{ color: '#2C2E83' }}>Assessment Complete!</h1>
          <p className="text-lg" style={{ color: '#6B7280' }}>{getAssessmentTitle()}</p>
        </div>

        {/* Dominant Style */}
        <Card className="mb-6 shadow-lg" style={{ borderTop: '4px solid #2C2E83' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: '#2C2E83' }} />
              Your Primary Style: {insights.dominantStyle}
            </CardTitle>
            <CardDescription>
              {insights.secondaryStyle && `Secondary: ${insights.secondaryStyle}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedResults.map(([style, percentage]) => (
                <div key={style} className="flex items-center gap-3">
                  <div className="w-32 flex-shrink-0">{style}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: style === insights.dominantStyle 
                          ? 'linear-gradient(90deg, #2C2E83 0%, #1FC8E1 100%)'
                          : '#E5E7EB'
                      }}
                    />
                  </div>
                  <div className="w-12 text-right">
                    <Badge variant={style === insights.dominantStyle ? 'default' : 'secondary'}>
                      {percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#10B981' }}>
              <CheckCircle2 className="w-5 h-5" />
              Your Strengths
            </CardTitle>
            <CardDescription>Based on your {insights.dominantStyle} style</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#D1FAE5' }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                  </div>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Areas for Growth */}
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#FF715B' }}>
              <AlertCircle className="w-5 h-5" />
              Areas for Growth
            </CardTitle>
            <CardDescription>Potential challenges to be aware of</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#FEE2E2' }}>
                    <AlertCircle className="w-4 h-4" style={{ color: '#FF715B' }} />
                  </div>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#1FC8E1' }}>
              <Lightbulb className="w-5 h-5" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>Strategies to maximize your potential</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#E0F2FE' }}>
                    <Lightbulb className="w-4 h-4" style={{ color: '#1FC8E1' }} />
                  </div>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* For Organizations */}
        <Card className="mb-6 shadow-md" style={{ borderLeft: '4px solid #10B981' }}>
          <CardHeader>
            <CardTitle>For Educators & Organizations</CardTitle>
            <CardDescription>How to support this cognitive profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              <strong>Best Fit Roles:</strong> This {insights.dominantStyle} profile excels in environments that value their natural 
              {type === 'learning' && ' preferred learning modality'}
              {type === 'thinking' && ' cognitive approach'}
              {type === 'decision' && ' decision-making process'}.
            </p>
            <p>
              <strong>Team Contribution:</strong> They bring unique perspectives that complement other styles and contribute to diverse, 
              well-rounded teams.
            </p>
            <p>
              <strong>Continuous Development:</strong> Regular assessment and feedback help track growth and identify evolving needs 
              for professional development.
            </p>
          </CardContent>
        </Card>

        {/* Feedback Prompt - Show only when all assessments are completed */}
        {!nextAssessment && (
          <FeedbackPrompt className="mb-6" />
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={onBackToDashboard}
            size="lg"
            style={{ backgroundColor: '#2C2E83' }}
          >
            Back to Dashboard
          </Button>
          {nextAssessment && onStartNextAssessment && (
            <Button
              onClick={() => onStartNextAssessment(nextAssessment.type)}
              size="lg"
              style={{ backgroundColor: '#1FC8E1' }}
            >
              Take {nextAssessment.title} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};