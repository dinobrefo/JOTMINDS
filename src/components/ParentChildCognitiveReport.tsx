import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { User, Assessment } from '../types';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ArrowLeft, Heart, Lightbulb, Brain, Target, BookOpen, MessageCircle, Users, Download, Sparkles, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface ParentChildCognitiveReportProps {
  child: User;
  assessments: Assessment[];
  onBack: () => void;
}

export function ParentChildCognitiveReport({ child, assessments, onBack }: ParentChildCognitiveReportProps) {
  const learningAssessment = assessments
    .filter(a => a.type === 'kolb' && a.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];
  
  const thinkingAssessment = assessments
    .filter(a => a.type === 'sternberg' && a.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];
  
  const decisionAssessment = assessments
    .filter(a => a.type === 'dual-process' && a.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

  const hasAllAssessments = learningAssessment && thinkingAssessment && decisionAssessment;

  if (!hasAllAssessments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button onClick={onBack} variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {child.name} needs to complete all three cognitive assessments before viewing the full parent report.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Completed: {assessments.filter(a => a.completedAt).length} of 3
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const learningStyle = learningAssessment.score.kolb?.style || '';
  const thinkingStyle = thinkingAssessment.score.sternberg?.style || '';
  const decisionStyle = decisionAssessment.score.dualProcess?.style || '';

  const getChildSummary = () => {
    const learningDesc = learningStyle.includes('Diverging') ? 'learning through experience and reflection' :
                        learningStyle.includes('Assimilating') ? 'learning through observation and organizing information' :
                        learningStyle.includes('Converging') ? 'learning through problem-solving and practical application' :
                        'learning through hands-on experimentation and action';
    
    const thinkingDesc = thinkingStyle.includes('Creative') ? 'thinks creatively and imaginatively' :
                        thinkingStyle.includes('Analytical') ? 'thinks logically and analytically' :
                        'thinks practically and applies knowledge to real situations';
    
    const decisionDesc = decisionStyle.includes('Intuitive') ? 'makes decisions based on instinct and gut feelings' :
                         decisionStyle.includes('Analytical') ? 'makes decisions through careful analysis and reasoning' :
                         'makes decisions using both intuition and logical thinking';

    return `Your child enjoys ${learningDesc}. They ${thinkingDesc} and ${decisionDesc}.`;
  };

  const getLearningStyleDescription = () => {
    switch (learningStyle) {
      case 'Diverging':
        return {
          title: 'Hands-On + Reflective Learner',
          description: 'Your child learns best by doing activities and then thinking about what worked well. They enjoy exploring new things, trying them out, and talking about what they learned.',
          icon: BookOpen
        };
      case 'Assimilating':
        return {
          title: 'Observer + Organizer',
          description: 'Your child learns best by watching first, then organizing information in their mind. They enjoy reading, listening, and understanding how things connect before trying them out.',
          icon: BookOpen
        };
      case 'Converging':
        return {
          title: 'Problem Solver + Doer',
          description: 'Your child learns best by solving real problems and applying what they know. They enjoy testing ideas, finding the best solution, and seeing practical results.',
          icon: BookOpen
        };
      case 'Accommodating':
        return {
          title: 'Action-Oriented + Adaptive',
          description: 'Your child learns best by jumping in and trying things. They enjoy hands-on activities, experiments, and learning by doing rather than just reading or listening.',
          icon: BookOpen
        };
      default:
        return {
          title: 'Active Learner',
          description: 'Your child has a unique learning approach that combines multiple styles.',
          icon: BookOpen
        };
    }
  };

  const getThinkingStyleDescription = () => {
    switch (thinkingStyle) {
      case 'Analytical':
        return {
          title: 'Logical + Detail-Oriented Thinker',
          description: 'Your child can analyze problems carefully and think through details. They enjoy figuring out why things work, comparing options, and finding answers through reasoning.',
          icon: Lightbulb
        };
      case 'Creative':
        return {
          title: 'Creative + Imaginative Thinker',
          description: 'Your child can come up with original ideas and think outside the box. They enjoy imagining possibilities, creating new things, and finding unique solutions to problems.',
          icon: Lightbulb
        };
      case 'Practical':
        return {
          title: 'Practical + Real-World Thinker',
          description: 'Your child can figure out how to make ideas work in real life. They enjoy finding solutions that are useful and effective, especially when they can see the results.',
          icon: Lightbulb
        };
      case 'Balanced':
        return {
          title: 'Balanced Thinker',
          description: 'Your child can think analytically, creatively, and practically depending on the situation. This balance helps them approach problems from multiple angles.',
          icon: Lightbulb
        };
      default:
        return {
          title: 'Thoughtful Thinker',
          description: 'Your child has a unique thinking style that combines multiple approaches.',
          icon: Lightbulb
        };
    }
  };

  const getDecisionStyleDescription = () => {
    switch (decisionStyle) {
      case 'Intuitive-Dominant':
        return {
          title: 'Quick & Instinctive',
          description: 'Your child often follows their intuition and makes decisions quickly based on gut feelings. They are confident with their choices but can benefit from talking decisions over with you first.',
          icon: Brain
        };
      case 'Analytical-Dominant':
        return {
          title: 'Thoughtful & Careful',
          description: 'Your child takes time to think through options before deciding. They like to consider different possibilities and can benefit from encouragement when quick decisions are needed.',
          icon: Brain
        };
      case 'Balanced':
        return {
          title: 'Quick but Thoughtful',
          description: 'Your child often follows their intuition but can also think things through when needed. They are confident when making choices but appreciate talking decisions over with you.',
          icon: Brain
        };
      default:
        return {
          title: 'Developing Decision-Maker',
          description: 'Your child is learning how to make good decisions using both instinct and reasoning.',
          icon: Brain
        };
    }
  };

  const getKeyTakeaways = () => {
    const takeaways: string[] = [];
    
    // Learning-based takeaways
    if (learningStyle.includes('Diverging')) {
      takeaways.push('Encourage your child to learn through real-world experiences (experiments, crafts, projects).');
      takeaways.push('Ask questions like "What did you learn from that?" or "How could we do it differently next time?"');
    } else if (learningStyle.includes('Assimilating')) {
      takeaways.push('Provide quiet time for reading, studying, and organizing their thoughts.');
      takeaways.push('Help them connect new information to what they already know.');
    } else if (learningStyle.includes('Converging')) {
      takeaways.push('Give them problems to solve and practical challenges to work through.');
      takeaways.push('Encourage them to test their ideas and find the best solutions.');
    } else {
      takeaways.push('Let them learn by doing—provide hands-on activities and experiences.');
      takeaways.push('Give them freedom to explore and try new things.');
    }

    // Thinking-based takeaways
    if (thinkingStyle.includes('Creative')) {
      takeaways.push('Celebrate creative ideas—even small ones—and encourage imagination.');
    } else if (thinkingStyle.includes('Analytical')) {
      takeaways.push('Support their curiosity with "why" and "how" questions that develop critical thinking.');
    } else {
      takeaways.push('Show them how learning applies to real life and everyday situations.');
    }

    // Decision-based takeaways
    if (decisionStyle.includes('Intuitive')) {
      takeaways.push('Gently guide them to pause and think before big decisions.');
    } else if (decisionStyle.includes('Analytical')) {
      takeaways.push('Encourage them to trust their instincts when quick decisions are needed.');
    } else {
      takeaways.push('Talk through important decisions together, balancing instinct with reasoning.');
    }

    return takeaways;
  };

  const getParentingTips = () => {
    return [
      {
        area: 'Learning',
        tip: 'Mix play and practice',
        example: learningStyle.includes('Diverging') || learningStyle.includes('Accommodating') 
          ? 'Cook, build, or experiment together'
          : learningStyle.includes('Assimilating')
          ? 'Read together and discuss what you learned'
          : 'Give them puzzles and problems to solve'
      },
      {
        area: 'Thinking',
        tip: 'Ask open-ended questions',
        example: thinkingStyle.includes('Creative')
          ? '"What else could we try?" or "What if we did it differently?"'
          : thinkingStyle.includes('Analytical')
          ? '"Why do you think that happened?" or "How does it work?"'
          : '"How can we use this at home?" or "What would work best?"'
      },
      {
        area: 'Decision-Making',
        tip: 'Talk through options',
        example: 'Discuss choices calmly and reflect together on what worked'
      },
      {
        area: 'Support',
        tip: 'Recognize their strengths',
        example: 'Point out when they use their natural abilities successfully'
      }
    ];
  };

  const getRadarData = () => {
    return [
      {
        dimension: 'Concrete Experience',
        score: learningAssessment.score.kolb?.scores.CE || 0,
      },
      {
        dimension: 'Reflective Observation',
        score: learningAssessment.score.kolb?.scores.RO || 0,
      },
      {
        dimension: 'Abstract Conceptualization',
        score: learningAssessment.score.kolb?.scores.AC || 0,
      },
      {
        dimension: 'Active Experimentation',
        score: learningAssessment.score.kolb?.scores.AE || 0,
      },
      {
        dimension: 'Analytical Thinking',
        score: thinkingAssessment.score.sternberg?.scores.analytical || 0,
      },
      {
        dimension: 'Creative Thinking',
        score: thinkingAssessment.score.sternberg?.scores.creative || 0,
      },
      {
        dimension: 'Practical Thinking',
        score: thinkingAssessment.score.sternberg?.scores.practical || 0,
      },
    ];
  };

  const learningDesc = getLearningStyleDescription();
  const thinkingDesc = getThinkingStyleDescription();
  const decisionDesc = getDecisionStyleDescription();
  const takeaways = getKeyTakeaways();
  const parentingTips = getParentingTips();
  const radarData = getRadarData();

  const mostRecentDate = new Date(
    Math.max(
      new Date(learningAssessment.completedAt!).getTime(),
      new Date(thinkingAssessment.completedAt!).getTime(),
      new Date(decisionAssessment.completedAt!).getTime()
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button onClick={onBack} variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>

        {/* Child Overview */}
        <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Heart className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{child.name}'s Cognitive Profile</CardTitle>
                <CardDescription className="text-base">
                  Understanding how your child learns, thinks, and makes decisions
                </CardDescription>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span>Age: {child.age || 'N/A'}</span>
                  <span>•</span>
                  <span>Last Assessment: {mostRecentDate.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-pink-200">
              <h4 className="flex items-center gap-2 mb-3 text-pink-900">
                <Sparkles className="h-5 w-5" />
                Summary
              </h4>
              <p className="text-gray-700 leading-relaxed">
                {getChildSummary()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cognitive Profile Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Learning Style */}
          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                <learningDesc.icon className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Learning Style</CardTitle>
              <Badge variant="outline" className="w-fit mt-2">{learningStyle}</Badge>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2">{learningDesc.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {learningDesc.description}
              </p>
            </CardContent>
          </Card>

          {/* Thinking Style */}
          <Card className="border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                <thinkingDesc.icon className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Thinking Style</CardTitle>
              <Badge variant="outline" className="w-fit mt-2">{thinkingStyle}</Badge>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2">{thinkingDesc.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {thinkingDesc.description}
              </p>
            </CardContent>
          </Card>

          {/* Decision-Making Style */}
          <Card className="border-orange-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
                <decisionDesc.icon className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-xl">Decision-Making Style</CardTitle>
              <Badge variant="outline" className="w-fit mt-2">{decisionStyle}</Badge>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2">{decisionDesc.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {decisionDesc.description}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Takeaways */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Key Takeaways for Parents
            </CardTitle>
            <CardDescription>
              Practical ways to support {child.name}'s learning and development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {takeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 flex-shrink-0">•</span>
                  <span className="text-sm leading-relaxed">{takeaway}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Child's Cognitive Strengths Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              {child.name}'s Cognitive Profile Overview
            </CardTitle>
            <CardDescription>
              Visual representation of how your child learns, thinks, and makes decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="dimension" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 40]} 
                  stroke="hsl(var(--border))"
                />
                <Radar 
                  name={`${child.name}'s Profile`}
                  dataKey="score" 
                  stroke="#ec4899" 
                  fill="#ec4899" 
                  fillOpacity={0.5}
                  strokeWidth={2}
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Understanding the Chart:</strong> This visualization shows {child.name}'s strengths across different cognitive dimensions. 
                Higher scores indicate stronger preferences or abilities in that area. These insights help you understand their natural learning style.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Parenting Tips Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Parenting Tips
            </CardTitle>
            <CardDescription>
              Specific strategies to help {child.name} thrive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Area</TableHead>
                  <TableHead className="w-[200px]">Tip</TableHead>
                  <TableHead>Example</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parentingTips.map((tip, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{tip.area}</TableCell>
                    <TableCell>{tip.tip}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tip.example}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Summary for Parents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {child.name} is {learningDesc.title.toLowerCase()} who {thinkingDesc.title.toLowerCase()}. 
              They {decisionDesc.description.split('.')[0].toLowerCase()} and learn best when you engage 
              with their ideas and experiences. By understanding their unique cognitive profile, you can 
              provide more targeted support that aligns with how they naturally think and learn.
            </p>
            <div className="mt-6 p-4 bg-indigo-100 rounded-lg border border-indigo-200">
              <p className="text-sm text-indigo-900">
                <strong>Remember:</strong> Every child is unique, and these insights are meant to guide—not limit—
                your understanding of {child.name}. Use these findings as a starting point for conversations 
                about learning and development.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Prompt */}
        <Card className="border-2 border-[#1FC8E1] bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#1FC8E1]" />
              Help Us Improve JotMinds
            </CardTitle>
            <CardDescription>
              Your feedback is invaluable! Share your experience to help us make JotMinds better for all parents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-[#1FC8E1]/30">
              <p className="text-sm text-gray-700 mb-4">
                We'd love to hear your thoughts about JotMinds and your child's cognitive profile report. 
                Your feedback helps us improve the platform and make it more valuable for parents supporting their children's learning journey.
              </p>
              <ul className="text-sm text-gray-600 space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-[#1FC8E1] mt-1">•</span>
                  <span>Were the insights and recommendations helpful?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1FC8E1] mt-1">•</span>
                  <span>Did the parenting tips align with your child's behavior?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1FC8E1] mt-1">•</span>
                  <span>What would make JotMinds more useful for you?</span>
                </li>
              </ul>
            </div>
            <Button 
              onClick={() => window.open('https://forms.gle/SXPFj29PxUbmYVQq7', '_blank')}
              className="w-full bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] hover:from-[#1AB5CC] hover:to-[#252770]"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Share Your Feedback
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Takes less than 3 minutes • Completely anonymous
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
