import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Assessment } from '../types';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Brain, TrendingUp, Target, Lightbulb, BookOpen, Zap, ArrowLeft, Download, Sparkles } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { FeedbackPrompt } from './FeedbackPrompt';

interface CombinedCognitiveProfileProps {
  assessments: Assessment[];
  userName: string;
  onBack: () => void;
}

export function CombinedCognitiveProfile({ assessments, userName, onBack }: CombinedCognitiveProfileProps) {
  // Get latest assessment of each type
  const latestKolb = assessments.filter(a => a.type === 'kolb').sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )[0];
  
  const latestSternberg = assessments.filter(a => a.type === 'sternberg').sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )[0];
  
  const latestDualProcess = assessments.filter(a => a.type === 'dual-process').sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )[0];

  if (!latestKolb || !latestSternberg || !latestDualProcess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-violet-50 to-indigo-50 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Complete all three assessments to view your comprehensive cognitive profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBack}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kolbStyle = latestKolb.score.kolb?.style || '';
  const sternbergStyle = latestSternberg.score.sternberg?.style || '';
  const dualProcessStyle = latestDualProcess.score.dualProcess?.style || '';

  // Get style descriptions
  const getStyleDescription = (style: string) => {
    const descriptions: Record<string, string> = {
      // Kolb
      'Diverging': 'You learn best through concrete experiences and reflective observation, like participating in group discussions or analyzing case studies.',
      'Assimilating': 'You excel at understanding theories and logical models, similar to mastering concepts in mathematics or science.',
      'Converging': 'You learn by applying theories to practical problems, like using scientific methods to solve real-world issues.',
      'Accommodating': 'You learn through hands-on experiences and active experimentation, such as lab work or practical projects.',
      
      // Sternberg
      'Analytical': 'You excel at critical analysis and problem-solving, breaking down complex issues into manageable parts.',
      'Creative': 'You thrive when generating new ideas and innovative solutions, thinking outside the box.',
      'Practical': 'You excel at applying knowledge to everyday situations, finding what works in the real world.',
      
      // Dual Process
      'Intuitive': 'You make quick decisions based on gut feelings and pattern recognition.',
      'Reflective': 'You think carefully and systematically, analyzing all options before deciding.',
      'Balanced': 'You effectively use both quick intuition and careful analysis depending on the situation.',
    };
    return descriptions[style] || 'Understanding how you learn and think.';
  };

  // Prepare radar chart data
  const radarData = [
    {
      dimension: 'Concrete Experience',
      value: latestKolb.score.kolb?.scores.CE || 0,
      fullMark: 48,
    },
    {
      dimension: 'Reflective Observation',
      value: latestKolb.score.kolb?.scores.RO || 0,
      fullMark: 48,
    },
    {
      dimension: 'Abstract Conceptualization',
      value: latestKolb.score.kolb?.scores.AC || 0,
      fullMark: 48,
    },
    {
      dimension: 'Active Experimentation',
      value: latestKolb.score.kolb?.scores.AE || 0,
      fullMark: 48,
    },
    {
      dimension: 'Analytical Thinking',
      value: latestSternberg.score.sternberg?.scores.analytical || 0,
      fullMark: 35,
    },
    {
      dimension: 'Creative Thinking',
      value: latestSternberg.score.sternberg?.scores.creative || 0,
      fullMark: 35,
    },
    {
      dimension: 'Practical Thinking',
      value: latestSternberg.score.sternberg?.scores.practical || 0,
      fullMark: 35,
    },
    {
      dimension: 'Intuitive Processing',
      value: latestDualProcess.score.dualProcess?.scores.system1 || 0,
      fullMark: 25,
    },
    {
      dimension: 'Analytical Processing',
      value: latestDualProcess.score.dualProcess?.scores.system2 || 0,
      fullMark: 25,
    },
  ];

  // Prepare comparison bar chart
  const comparisonData = [
    {
      framework: 'Learning',
      CE: latestKolb.score.kolb?.scores.CE || 0,
      RO: latestKolb.score.kolb?.scores.RO || 0,
      AC: latestKolb.score.kolb?.scores.AC || 0,
      AE: latestKolb.score.kolb?.scores.AE || 0,
    },
    {
      framework: 'Thinking',
      Analytical: latestSternberg.score.sternberg?.scores.analytical || 0,
      Creative: latestSternberg.score.sternberg?.scores.creative || 0,
      Practical: latestSternberg.score.sternberg?.scores.practical || 0,
    },
    {
      framework: 'Decision',
      Intuitive: latestDualProcess.score['dual-process']?.scores.System1 || 0,
      Analytical: latestDualProcess.score['dual-process']?.scores.System2 || 0,
    },
  ];

  // Balance visualization data
  const balanceData = [
    {
      name: 'Learning Balance',
      abstract: latestKolb.score.kolb?.scores.AC || 0,
      concrete: latestKolb.score.kolb?.scores.CE || 0,
    },
    {
      name: 'Action Balance',
      active: latestKolb.score.kolb?.scores.AE || 0,
      reflective: latestKolb.score.kolb?.scores.RO || 0,
    },
    {
      name: 'Decision Balance',
      analytical: latestDualProcess.score.dualProcess?.scores.system2 || 0,
      intuitive: latestDualProcess.score.dualProcess?.scores.system1 || 0,
    },
  ];

  // Generate strengths and recommendations
  const generateInsights = () => {
    const insights = {
      strengths: [] as string[],
      growthAreas: [] as string[],
      recommendations: [] as string[],
    };

    // Analyze Learning Style
    const kolbScores = latestKolb.score.kolb?.scores;
    if (kolbScores) {
      const maxKolb = Math.max(kolbScores.CE, kolbScores.RO, kolbScores.AC, kolbScores.AE);
      if (kolbScores.CE === maxKolb) {
        insights.strengths.push('You excel at learning through hands-on experiences and real-world applications');
      }
      if (kolbScores.RO === maxKolb) {
        insights.strengths.push('You have a strong ability to observe, reflect, and understand different perspectives');
      }
      if (kolbScores.AC === maxKolb) {
        insights.strengths.push('You thrive when working with theories, models, and abstract concepts');
      }
      if (kolbScores.AE === maxKolb) {
        insights.strengths.push('You learn best by actively experimenting and testing ideas');
      }

      const minKolb = Math.min(kolbScores.CE, kolbScores.RO, kolbScores.AC, kolbScores.AE);
      if (kolbScores.CE === minKolb && minKolb < 20) {
        insights.growthAreas.push('Consider engaging more with hands-on, practical experiences');
        insights.recommendations.push('Join clubs or activities that involve real-world problem-solving');
      }
      if (kolbScores.RO === minKolb && minKolb < 20) {
        insights.growthAreas.push('Practice taking time to reflect before acting on decisions');
        insights.recommendations.push('Keep a learning journal to reflect on your experiences');
      }
      if (kolbScores.AC === minKolb && minKolb < 20) {
        insights.growthAreas.push('Work on connecting practical experiences to theoretical concepts');
        insights.recommendations.push('Ask "why" questions to understand the theory behind what you learn');
      }
      if (kolbScores.AE === minKolb && minKolb < 20) {
        insights.growthAreas.push('Try experimenting more with new approaches and ideas');
        insights.recommendations.push('Set small goals to test new study techniques each week');
      }
    }

    // Analyze Thinking Style
    const sternbergScores = latestSternberg.score.sternberg?.scores;
    if (sternbergScores) {
      const maxSternberg = Math.max(sternbergScores.analytical, sternbergScores.creative, sternbergScores.practical);
      if (sternbergScores.analytical === maxSternberg) {
        insights.strengths.push('You have excellent analytical and critical thinking abilities');
      }
      if (sternbergScores.creative === maxSternberg) {
        insights.strengths.push('You demonstrate strong creative and innovative thinking');
      }
      if (sternbergScores.practical === maxSternberg) {
        insights.strengths.push('You excel at applying knowledge to solve real-world problems');
      }

      const minSternberg = Math.min(sternbergScores.analytical, sternbergScores.creative, sternbergScores.practical);
      if (sternbergScores.analytical === minSternberg && minSternberg < 15) {
        insights.recommendations.push('Practice breaking down complex problems into smaller parts');
      }
      if (sternbergScores.creative === minSternberg && minSternberg < 15) {
        insights.recommendations.push('Engage in creative activities like art, writing, or design projects');
      }
      if (sternbergScores.practical === minSternberg && minSternberg < 15) {
        insights.recommendations.push('Look for opportunities to apply what you learn in practical situations');
      }
    }

    // Analyze Decision Style
    const dualProcessScores = latestDualProcess.score.dualProcess?.scores;
    if (dualProcessScores) {
      if (dualProcessScores.system1 > dualProcessScores.system2) {
        insights.strengths.push('You make quick, intuitive decisions based on patterns and experience');
        insights.recommendations.push('For important decisions, take time to verify your intuition with analysis');
      } else {
        insights.strengths.push('You make careful, well-reasoned decisions through systematic analysis');
        insights.recommendations.push('Trust your intuition more in familiar situations to save time');
      }

      const difference = Math.abs(dualProcessScores.system1 - dualProcessScores.system2);
      if (difference < 5) {
        insights.strengths.push('You have a well-balanced approach to decision-making');
      }
    }

    return insights;
  };

  const insights = generateInsights();

  const handleDownloadPDF = () => {
    // Create a combined assessment object for PDF generation
    const combinedAssessment: Assessment = {
      ...latestKolb,
      type: 'combined',
      score: {
        kolb: latestKolb.score.kolb,
        sternberg: latestSternberg.score.sternberg,
        dualProcess: latestDualProcess.score.dualProcess,
      },
    };
    generatePDF(combinedAssessment, userName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-violet-50 to-indigo-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#1FC8E1] via-[#7B61FF] to-[#2C2E83] bg-clip-text text-transparent mb-1">
                Your Complete Cognitive Profile
              </h1>
              <p className="text-sm text-muted-foreground">
                {userName} • Comprehensive Assessment Results
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-blue-900">Learning Style</CardTitle>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  {kolbStyle}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-2">
                {getStyleDescription(kolbStyle)}
              </p>
              <div className="text-xs text-muted-foreground">
                Completed: {new Date(latestKolb.completedAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-purple-900">Thinking Style</CardTitle>
                </div>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  {sternbergStyle}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-2">
                {getStyleDescription(sternbergStyle)}
              </p>
              <div className="text-xs text-muted-foreground">
                Completed: {new Date(latestSternberg.completedAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-white to-orange-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-orange-900">Decision Style</CardTitle>
                </div>
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  {dualProcessStyle}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-2">
                {getStyleDescription(dualProcessStyle)}
              </p>
              <div className="text-xs text-muted-foreground">
                Completed: {new Date(latestDualProcess.completedAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comprehensive Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#1FC8E1]" />
              Your Complete Cognitive Map
            </CardTitle>
            <CardDescription>
              A 360° view of your learning, thinking, and decision-making patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e0e0e0" />
                  <PolarAngleAxis 
                    dataKey="dimension" 
                    tick={{ fill: '#666', fontSize: 12 }}
                    stroke="#999"
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
                  <Radar
                    name="Your Profile"
                    dataKey="value"
                    stroke="#1FC8E1"
                    fill="#1FC8E1"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #1FC8E1',
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Balance Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#2C2E83]" />
              Your Cognitive Balance
            </CardTitle>
            <CardDescription>
              How you balance different aspects of learning, thinking, and decision-making
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={balanceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #2C2E83',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="abstract" fill="#3b82f6" name="Abstract/Analytical" stackId="a" />
                  <Bar dataKey="concrete" fill="#10b981" name="Concrete/Intuitive" stackId="a" />
                  <Bar dataKey="active" fill="#f59e0b" name="Active" stackId="b" />
                  <Bar dataKey="reflective" fill="#8b5cf6" name="Reflective" stackId="b" />
                  <Bar dataKey="analytical" fill="#06b6d4" name="Analytical" stackId="c" />
                  <Bar dataKey="intuitive" fill="#ec4899" name="Intuitive" stackId="c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Scores Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-[#FF715B]" />
              Detailed Score Breakdown
            </CardTitle>
            <CardDescription>
              Compare your scores across all dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Learning Style Scores */}
              <div>
                <h4 className="font-semibold mb-3 text-blue-900">Learning Style Dimensions</h4>
                <div className="space-y-3">
                  {[
                    { name: 'Concrete Experience', value: latestKolb.score.kolb?.scores.CE || 0, max: 48, color: '#ef4444' },
                    { name: 'Reflective Observation', value: latestKolb.score.kolb?.scores.RO || 0, max: 48, color: '#3b82f6' },
                    { name: 'Abstract Conceptualization', value: latestKolb.score.kolb?.scores.AC || 0, max: 48, color: '#10b981' },
                    { name: 'Active Experimentation', value: latestKolb.score.kolb?.scores.AE || 0, max: 48, color: '#f59e0b' },
                  ].map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.name}</span>
                        <span className="font-semibold">{item.value}/{item.max}</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(item.value / item.max) * 100}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thinking Style Scores */}
              <div>
                <h4 className="font-semibold mb-3 text-purple-900">Thinking Style Dimensions</h4>
                <div className="space-y-3">
                  {[
                    { name: 'Analytical Thinking', value: latestSternberg.score.sternberg?.scores.analytical || 0, max: 35, color: '#3b82f6' },
                    { name: 'Creative Thinking', value: latestSternberg.score.sternberg?.scores.creative || 0, max: 35, color: '#8b5cf6' },
                    { name: 'Practical Thinking', value: latestSternberg.score.sternberg?.scores.practical || 0, max: 35, color: '#10b981' },
                  ].map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.name}</span>
                        <span className="font-semibold">{item.value}/{item.max}</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(item.value / item.max) * 100}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision Style Scores */}
              <div>
                <h4 className="font-semibold mb-3 text-orange-900">Decision Style Dimensions</h4>
                <div className="space-y-3">
                  {[
                    { name: 'Intuitive Processing', value: latestDualProcess.score.dualProcess?.scores.system1 || 0, max: 25, color: '#ec4899' },
                    { name: 'Analytical Processing', value: latestDualProcess.score.dualProcess?.scores.system2 || 0, max: 25, color: '#06b6d4' },
                  ].map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.name}</span>
                        <span className="font-semibold">{item.value}/{item.max}</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(item.value / item.max) * 100}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Strengths */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-white to-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Target className="h-5 w-5 text-green-600" />
                Your Cognitive Strengths
              </CardTitle>
              <CardDescription>
                Areas where you naturally excel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {insights.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-sm text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Growth Areas */}
          {insights.growthAreas.length > 0 && (
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Areas for Growth
                </CardTitle>
                <CardDescription>
                  Opportunities to develop new skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {insights.growthAreas.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">→</span>
                      <span className="text-sm text-gray-700">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommendations */}
        <Card className="border-2 border-[#1FC8E1] bg-gradient-to-br from-white to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[#1FC8E1]" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>
              Actionable steps to enhance your learning and thinking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {insights.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-cyan-200">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card className="border-2 border-[#FF715B] bg-gradient-to-br from-white to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#FF715B]">
              <Sparkles className="h-5 w-5" />
              Next Steps for Success
            </CardTitle>
            <CardDescription>
              How to use your cognitive profile for better learning outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-blue-900 mb-2">Optimize Your Study Environment</h4>
                <p className="text-sm text-gray-700">
                  Based on your {kolbStyle} learning style, create a study space that allows you to {
                    kolbStyle.includes('Diverging') ? 'observe and reflect quietly' :
                    kolbStyle.includes('Assimilating') ? 'organize information systematically' :
                    kolbStyle.includes('Converging') ? 'test ideas and solve problems' :
                    'engage actively with materials'
                  }.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border-l-4 border-purple-500">
                <h4 className="font-semibold text-purple-900 mb-2">Leverage Your Thinking Strengths</h4>
                <p className="text-sm text-gray-700">
                  Your {sternbergStyle} thinking style means you excel at {
                    sternbergStyle.includes('Analytical') ? 'breaking down complex problems and critical analysis' :
                    sternbergStyle.includes('Creative') ? 'generating innovative ideas and new approaches' :
                    'applying knowledge to real-world situations'
                  }. Use this in group projects and class discussions.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border-l-4 border-orange-500">
                <h4 className="font-semibold text-orange-900 mb-2">Improve Your Decision-Making</h4>
                <p className="text-sm text-gray-700">
                  As a {dualProcessStyle} decision-maker, {
                    dualProcessStyle.includes('Balanced') ? 'you can flex between quick intuition and careful analysis - use this advantage by matching your approach to the situation' :
                    dualProcessStyle.includes('Intuitive') ? 'trust your gut feelings but double-check important decisions with analysis' :
                    'your thorough analysis is valuable, but practice making quicker decisions in low-stakes situations'
                  }.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Prompt */}
        <FeedbackPrompt />
      </div>
    </div>
  );
}