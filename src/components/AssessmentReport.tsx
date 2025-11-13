import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Assessment, UserRole } from '../types';
import { getGhanaMapping, getStyleDescription } from '../utils/scoring';
import { saveReflection, generateId } from '../utils/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Cell, LabelList } from 'recharts';
import { BookOpen, Briefcase, Lightbulb, FileText, Download, ArrowLeft, TrendingUp, AlertTriangle, Target, Users, BarChart3, Share2, Eye, Brain } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { getAssessmentInsights } from '../utils/insights';
import { toast } from 'sonner@2.0.3';

interface AssessmentReportProps {
  assessment: Assessment;
  userName: string;
  onBack: () => void;
  isOrganizational?: boolean;
  userRole?: UserRole;
}

export function AssessmentReport({ assessment, userName, onBack, isOrganizational = false, userRole }: AssessmentReportProps) {
  const [reflection, setReflection] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const ghanaMapping = !isOrganizational ? getGhanaMapping(assessment.score) : null;

  const getReflectionPlaceholder = () => {
    switch (userRole) {
      case 'student':
        return "What insights have you gained? How will you use this information in your studies? How does this help you understand how you learn best?";
      case 'teacher':
        return "How will these insights help you understand your teaching approach? How can you use this knowledge to better support diverse learners in your classroom?";
      case 'parent':
        return "What have you learned about your own thinking patterns? How might this help you better understand and support your child's learning journey?";
      case 'professional':
        return "How do these results align with your work experiences? What insights can you apply to your professional development and team collaboration?";
      default:
        return "What insights have you gained from these results? How do they align with your experiences?";
    }
  };

  const getReflectionDescription = () => {
    switch (userRole) {
      case 'student':
        return "Write down your thoughts about these results. How do they align with your learning experiences?";
      case 'teacher':
        return "Reflect on how these insights relate to your teaching practice and professional development.";
      case 'parent':
        return "Share your thoughts on these results and how they might help you support your child better.";
      case 'professional':
        return "Document your insights and how you plan to apply them in your professional role.";
      default:
        return "Write down your thoughts about these results. How do they align with your experiences?";
    }
  };

  const handleSaveReflection = () => {
    if (reflection.trim()) {
      saveReflection({
        id: generateId(),
        userId: assessment.userId,
        assessmentId: assessment.id,
        content: reflection,
        createdAt: new Date().toISOString(),
      });
      setReflectionSaved(true);
      setTimeout(() => setReflectionSaved(false), 3000);
    }
  };

  const handleDownloadPDF = () => {
    generatePDF(assessment, userName, ghanaMapping, isOrganizational);
    toast.success('PDF downloaded successfully!');
  };

  const handleShareResults = async () => {
    const mainStyle = getMainStyle();
    const shareText = `I've completed my ${assessment.type === 'kolb' ? 'Learning Style' : assessment.type === 'sternberg' ? 'Thinking Style' : 'Decision Making Style'} assessment on JotMinds. My profile: ${mainStyle}`;
    
    // Check if Web Share API is available and supported
    if (navigator.share && navigator.canShare) {
      const shareData = {
        title: `${userName}'s Thinking Style Assessment`,
        text: shareText
      };
      
      // Check if the data can be shared
      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          toast.success('Shared successfully!');
          return;
        } catch (error: any) {
          // User cancelled or permission denied
          if (error.name === 'AbortError') {
            // User cancelled, do nothing
            return;
          }
          // For other errors, fall back to clipboard
          console.log('Share API error, using fallback:', error.name);
        }
      }
    }
    
    // Fallback for browsers that don't support Web Share API or if sharing failed
    fallbackShare(shareText);
  };

  const fallbackShare = (shareText?: string) => {
    const textToShare = shareText || `Check out my Thinking Style Assessment on JotMinds - Discover How You Think`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToShare).then(() => {
        toast.success('Assessment summary copied to clipboard!');
      }).catch((err) => {
        console.error('Clipboard error:', err);
        showShareDialog(textToShare);
      });
    } else {
      showShareDialog(textToShare);
    }
  };

  const showShareDialog = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      toast.success('Assessment summary ready to share!');
    } catch (err) {
      toast.info('Share text: ' + text);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const getChartData = () => {
    if (assessment.score.kolb) {
      return [
        { 
          name: 'Concrete Experience', 
          shortName: 'CE',
          value: assessment.score.kolb.scores.CE || 0,
          color: 'hsl(var(--chart-1))',
          description: 'Learning through feeling and experience'
        },
        { 
          name: 'Reflective Observation', 
          shortName: 'RO',
          value: assessment.score.kolb.scores.RO || 0,
          color: 'hsl(var(--chart-2))',
          description: 'Learning through watching and reflecting'
        },
        { 
          name: 'Abstract Conceptualization', 
          shortName: 'AC',
          value: assessment.score.kolb.scores.AC || 0,
          color: 'hsl(var(--chart-3))',
          description: 'Learning through thinking and analyzing'
        },
        { 
          name: 'Active Experimentation', 
          shortName: 'AE',
          value: assessment.score.kolb.scores.AE || 0,
          color: 'hsl(var(--chart-4))',
          description: 'Learning through doing and testing'
        },
      ];
    } else if (assessment.score.sternberg) {
      return [
        { 
          name: 'Analytical', 
          value: assessment.score.sternberg.scores.analytical || 0,
          color: 'hsl(var(--chart-1))',
          description: 'Critical thinking and problem analysis'
        },
        { 
          name: 'Creative', 
          value: assessment.score.sternberg.scores.creative || 0,
          color: 'hsl(var(--chart-2))',
          description: 'Innovation and imaginative thinking'
        },
        { 
          name: 'Practical', 
          value: assessment.score.sternberg.scores.practical || 0,
          color: 'hsl(var(--chart-3))',
          description: 'Real-world application and common sense'
        },
      ];
    } else if (assessment.score.dualProcess) {
      return [
        { 
          name: 'Intuitive (System 1)', 
          value: assessment.score.dualProcess.scores.system1 || 0,
          color: 'hsl(var(--chart-1))',
          description: 'Fast, automatic, intuitive decisions'
        },
        { 
          name: 'Reflective (System 2)', 
          value: assessment.score.dualProcess.scores.system2 || 0,
          color: 'hsl(var(--chart-2))',
          description: 'Slow, deliberate, analytical decisions'
        },
      ];
    }
    return [];
  };

  const getMainStyle = () => {
    if (assessment.score.kolb) return assessment.score.kolb.style;
    if (assessment.score.sternberg) return assessment.score.sternberg.style;
    if (assessment.score.dualProcess) return assessment.score.dualProcess.style;
    return '';
  };

  const getReportTitle = () => {
    if (isOrganizational) {
      if (assessment.type === 'kolb') return 'Learning Agility Profile';
      if (assessment.type === 'sternberg') return 'Thinking Diversity Profile';
      if (assessment.type === 'dual-process') return 'Decision Intelligence Profile';
    } else {
      if (assessment.type === 'kolb') return 'Your Learning Style Profile';
      if (assessment.type === 'sternberg') return 'Your Thinking Style Profile';
      if (assessment.type === 'dual-process') return 'Your Decision Style Profile';
    }
    return 'Assessment Profile';
  };

  const mainStyle = getMainStyle();
  const styleDescription = getStyleDescription(assessment.type, mainStyle);
  const chartData = getChartData().filter(item => {
    // Filter out any items with NaN or undefined values
    return item.value !== undefined && !isNaN(item.value) && isFinite(item.value);
  });
  const reportTitle = getReportTitle();
  const insights = getAssessmentInsights(assessment);
  
  // Calculate max value for proper chart scaling
  const maxValue = Math.max(...chartData.map(item => item.value), 15); // minimum of 15 for visibility

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-border">
          <p className="font-semibold text-foreground mb-1">{payload[0].payload.name}</p>
          <p className="text-sm text-muted-foreground mb-2">{payload[0].payload.description}</p>
          <p className="text-lg font-bold" style={{ color: payload[0].payload.color }}>
            Score: {payload[0].value}
          </p>
          <div className="mt-2 pt-2 border-t border-border">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all" 
                style={{ 
                  width: `${(payload[0].value / 100) * 100}%`,
                  backgroundColor: payload[0].payload.color 
                }}
              />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom label for radar chart
  const CustomRadarLabel = ({ cx, cy, midAngle, outerRadius, payload }: any) => {
    // Ensure all values are valid numbers
    if (typeof cx !== 'number' || typeof cy !== 'number' || 
        typeof midAngle !== 'number' || typeof outerRadius !== 'number' ||
        isNaN(cx) || isNaN(cy) || isNaN(midAngle) || isNaN(outerRadius)) {
      return null;
    }

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {payload.shortName || payload.name}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-violet-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={handleShareResults}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Results
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{reportTitle}</CardTitle>
                <CardDescription>
                  Assessment completed on {new Date(assessment.completedAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge className="text-lg px-4 py-2">{mainStyle}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-muted-foreground">{styleDescription}</p>
            </div>

            <div>
              <h3 className="flex items-center gap-2 mb-6">
                <BarChart className="h-5 w-5" />
                Your Scores
              </h3>
              <div className="space-y-6">
                {assessment.type === 'kolb' ? (
                  <>
                    {/* Radar Chart */}
                    <div className="h-80 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={chartData}
                          layout="vertical"
                          margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
                        >
                          <defs>
                            {chartData.map((item: any, index: number) => (
                              <linearGradient key={index} id={`kolb-gradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor={item.color} stopOpacity={0.8} />
                                <stop offset="100%" stopColor={item.color} stopOpacity={0.4} />
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="hsl(var(--border))"
                            strokeOpacity={0.3}
                            horizontal={false}
                          />
                          <XAxis 
                            type="number"
                            domain={[0, Math.ceil(maxValue * 1.2)]}
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            stroke="hsl(var(--border))"
                          />
                          <YAxis 
                            type="category"
                            dataKey="name"
                            width={180}
                            tick={{ fill: 'hsl(var(--foreground))' }}
                            stroke="hsl(var(--border))"
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
                          <Bar 
                            dataKey="value" 
                            radius={[0, 8, 8, 0]}
                            animationDuration={1500}
                            animationBegin={0}
                          >
                            {chartData.map((item: any, index: number) => (
                              <Cell key={index} fill={`url(#kolb-gradient-${index})`} />
                            ))}
                            <LabelList 
                              dataKey="value" 
                              position="right" 
                              style={{ fill: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Score bars with labels */}
                    <div className="grid grid-cols-1 gap-3">
                      {chartData.map((item: any, index: number) => {
                        const percentage = (item.value / maxValue) * 100;
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{item.name}</span>
                              <span className="text-sm font-bold" style={{ color: item.color }}>
                                {item.value}
                              </span>
                            </div>
                            <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                              <div
                                className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                  width: `${percentage}%`,
                                  background: `linear-gradient(to right, ${item.color}, ${item.color}dd)`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Modern Bar Chart */}
                    <div className="h-80 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <defs>
                            {chartData.map((item: any, index: number) => (
                              <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={item.color} stopOpacity={0.9} />
                                <stop offset="100%" stopColor={item.color} stopOpacity={0.6} />
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="hsl(var(--border))"
                            strokeOpacity={0.3}
                          />
                          <XAxis 
                            dataKey="name" 
                            angle={-15}
                            textAnchor="end"
                            height={80}
                            tick={{ fill: 'hsl(var(--foreground))' }}
                            stroke="hsl(var(--border))"
                          />
                          <YAxis 
                            domain={[0, Math.ceil(maxValue * 1.2)]}
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            stroke="hsl(var(--border))"
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
                          <Bar 
                            dataKey="value" 
                            radius={[8, 8, 0, 0]}
                            animationDuration={1500}
                            animationBegin={0}
                          >
                            {chartData.map((item: any, index: number) => (
                              <Cell key={index} fill={`url(#gradient-${index})`} />
                            ))}
                            <LabelList 
                              dataKey="value" 
                              position="top" 
                              style={{ fill: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Score cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {chartData.map((item: any, index: number) => (
                        <Card key={index} className="border-2 transition-all hover:shadow-md">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${item.color}20` }}
                              >
                                <span 
                                  className="text-xl font-bold"
                                  style={{ color: item.color }}
                                >
                                  {item.value}
                                </span>
                              </div>
                              <h4 className="font-semibold">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${(item.value / 100) * 100}%`,
                                    backgroundColor: item.color,
                                  }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary */}
        <Card className="border-2 border-indigo-200 shadow-large bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg gradient-purple flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2 text-indigo-900">
                  Executive Summary
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
                  {isOrganizational 
                    ? 'At-a-glance overview for organizational assessment and talent development'
                    : 'Quick overview of your cognitive profile and key insights'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primary Profile */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="flex items-center gap-2 text-indigo-900">
                  <Target className="h-4 w-4" />
                  Primary Cognitive Profile
                </h4>
                <Badge variant="default" className="text-base px-3 py-1 bg-indigo-600">
                  {mainStyle}
                </Badge>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {styleDescription}
              </p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Top Strength */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-green-900">Top Strength</span>
                </div>
                <p className="text-sm text-green-800">
                  {insights.strengths[0]}
                </p>
              </div>

              {/* Priority Development */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-orange-900">Priority Area</span>
                </div>
                <p className="text-sm text-orange-800">
                  {insights.weaknesses[0]}
                </p>
              </div>

              {/* Key Action */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-blue-900">Key Action</span>
                </div>
                <p className="text-sm text-blue-800">
                  {insights.improvements[0]}
                </p>
              </div>
            </div>

            {isOrganizational && (
              <>
                {/* Organizational Fit Summary */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="flex items-center gap-2 mb-3 text-purple-900">
                    <Users className="h-4 w-4" />
                    Organizational Fit Assessment
                  </h4>
                  <div className="space-y-2">
                    {insights.organizationalFit.slice(0, 2).map((fit, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <p className="text-sm text-purple-800 flex-1">
                          {fit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overall Recommendation */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-4 text-white">
                  <h4 className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4" />
                    Overall Assessment
                  </h4>
                  <p className="text-sm opacity-95">
                    {assessment.type === 'kolb' && `This individual demonstrates ${mainStyle.toLowerCase()} learning agility, making them well-suited for roles requiring ${insights.organizationalFit[0]?.split(':')[1]?.trim().toLowerCase() || 'diverse capabilities'}. Focus on leveraging their natural strengths while developing complementary skills for maximum organizational value.`}
                    {assessment.type === 'sternberg' && `With a ${mainStyle.toLowerCase()} thinking orientation, this profile indicates strong capabilities in ${insights.organizationalFit[0]?.split(':')[1]?.trim().toLowerCase() || 'diverse areas'}. Strategic placement in appropriate roles and targeted development can maximize both individual and organizational performance.`}
                    {assessment.type === 'dual-process' && `The ${mainStyle.toLowerCase()} decision-making profile suggests effective performance in ${insights.organizationalFit[0]?.split(':')[1]?.trim().toLowerCase() || 'various contexts'}. Consider role alignment and training to optimize decision quality across different business scenarios.`}
                  </p>
                </div>
              </>
            )}

            {!isOrganizational && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 text-white">
                <h4 className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4" />
                  Your Development Path
                </h4>
                <p className="text-sm opacity-95">
                  Your {mainStyle} profile is a strength to build upon. Focus on {insights.improvements[0]?.toLowerCase()} while leveraging your natural abilities. The detailed analysis below provides specific strategies for your growth journey.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights and Analysis Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {isOrganizational ? 'Professional Analysis' : 'Your Profile Analysis'}
            </CardTitle>
            <CardDescription>
              {isOrganizational 
                ? 'Comprehensive insights for talent assessment and development'
                : 'Understanding your strengths, areas for growth, and development path'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Strengths */}
            <div>
              <h4 className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-700">Key Strengths</span>
              </h4>
              <ul className="space-y-2">
                {insights.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="pt-4 border-t">
              <h4 className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-orange-700">Areas for Development</span>
              </h4>
              <ul className="space-y-2">
                {insights.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">!</span>
                    <span className="text-sm">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvement Recommendations */}
            <div className="pt-4 border-t">
              <h4 className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700">Recommended Actions for Improvement</span>
              </h4>
              <ul className="space-y-2">
                {insights.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">→</span>
                    <span className="text-sm">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {isOrganizational && (
              <>
                {/* Organizational Fit */}
                <div className="pt-4 border-t">
                  <h4 className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-purple-700">Organizational Fit & Role Alignment</span>
                  </h4>
                  <div className="bg-purple-50 p-4 rounded-lg space-y-2">
                    {insights.organizationalFit.map((fit, index) => (
                      <p key={index} className="text-sm">
                        <strong>{fit.split(':')[0]}:</strong>
                        {fit.split(':')[1]}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Use this information to match candidates with appropriate roles or to optimize team composition 
                    based on cognitive diversity.
                  </p>
                </div>

                {/* Continuous Review Points */}
                <div className="pt-4 border-t">
                  <h4 className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-indigo-600" />
                    <span className="text-indigo-700">Continuous Performance Review Indicators</span>
                  </h4>
                  <div className="bg-indigo-50 p-4 rounded-lg space-y-2">
                    {insights.continuousReview.map((review, index) => (
                      <p key={index} className="text-sm">
                        <strong>{review.split(':')[0]}:</strong>
                        {review.split(':')[1]}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Regular assessment helps track development progress, identify training needs, and ensure 
                    continued alignment with organizational goals.
                  </p>
                </div>
              </>
            )}

            {!isOrganizational && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h4 className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <span>Personal Development Tip</span>
                </h4>
                <p className="text-sm">
                  Focus on leveraging your strengths while gradually working on your areas for development. 
                  Remember that cognitive styles aren't fixed – you can develop new capabilities over time through 
                  deliberate practice and diverse experiences.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {!isOrganizational && ghanaMapping && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Ghana Education Guidance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="mb-2">Recommended SHS Tracks</h4>
                <div className="flex flex-wrap gap-2">
                  {ghanaMapping.shsTrack.map((track) => (
                    <Badge key={track} variant="secondary">
                      {track}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2">Suggested Tertiary Focus Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {ghanaMapping.tertiaryFocus.map((area) => (
                    <Badge key={area} variant="outline">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4" />
                  Career Suggestions
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {ghanaMapping.careerSuggestions.map((career) => (
                    <li key={career}>{career}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  Decision-Making Tip
                </h4>
                <p className="text-sm">{ghanaMapping.decisionTip}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isOrganizational && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Organizational Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="mb-2">Learning Agility Applications</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Apply your learning style to team collaboration and project management</li>
                  <li>Leverage your strengths when adapting to organizational changes</li>
                  <li>Develop strategies for continuous professional development</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2">Thinking Diversity Strengths</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Use your cognitive profile to contribute unique perspectives</li>
                  <li>Balance analytical, creative, and practical approaches in decision-making</li>
                  <li>Build complementary teams based on cognitive diversity</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  Professional Development Tip
                </h4>
                <p className="text-sm">
                  Understanding your cognitive profile can help you communicate more effectively with colleagues who think differently, 
                  make better decisions under pressure, and create more innovative solutions to organizational challenges.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Personal Reflection
            </CardTitle>
            <CardDescription>
              Write down your thoughts about these results. How do they align with your experiences?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reflection">Your Reflection</Label>
              <Textarea
                id="reflection"
                placeholder={getReflectionPlaceholder()}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={6}
              />
            </div>
            <Button onClick={handleSaveReflection} disabled={!reflection.trim()}>
              {reflectionSaved ? 'Saved!' : 'Save Reflection'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}