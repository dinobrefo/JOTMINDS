import { useMemo } from 'react';
import { User } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Brain, Lightbulb, Scale, BookOpen, Info, TrendingUp, Users } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { getAssessmentsByUserId } from '../utils/storage';

interface SchoolInsightsProps {
  professionals: User[];
  organizationName: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

export function SchoolInsights({ professionals, organizationName }: SchoolInsightsProps) {
  
  const stats = useMemo(() => {
    const kolbDistribution: Record<string, number> = {};
    const sternbergDistribution: Record<string, number> = {};
    const dualProcessDistribution: Record<string, number> = {};
    const teachingStyleDistribution: Record<string, number> = {};
    const teachingAxesTotals = {
        authority: 0, knowledge: 0, motivation: 0, assessment: 0, adaptability: 0, climate: 0, count: 0
    };
    
    let totalKolb = 0;
    let totalSternberg = 0;
    let totalDual = 0;
    let totalTeaching = 0;

    professionals.forEach(prof => {
      // Use assessments from prop or storage
      const assessments = prof.assessments || getAssessmentsByUserId(prof.id);
      
      assessments.forEach(assessment => {
        if (!assessment.completedAt || !assessment.score) return;

        if (assessment.type === 'kolb' && assessment.score.kolb) {
          const style = assessment.score.kolb.style;
          kolbDistribution[style] = (kolbDistribution[style] || 0) + 1;
          totalKolb++;
        } else if (assessment.type === 'sternberg' && assessment.score.sternberg) {
          const style = assessment.score.sternberg.style;
          sternbergDistribution[style] = (sternbergDistribution[style] || 0) + 1;
          totalSternberg++;
        } else if (assessment.type === 'dual-process' && assessment.score.dualProcess) {
          const style = assessment.score.dualProcess.style;
          dualProcessDistribution[style] = (dualProcessDistribution[style] || 0) + 1;
          totalDual++;
        } else if (assessment.type === 'teaching-style' && assessment.score['teaching-style']) {
            const score = assessment.score['teaching-style'];
            teachingStyleDistribution[score.primaryStyle] = (teachingStyleDistribution[score.primaryStyle] || 0) + 1;
            totalTeaching++;
            
            teachingAxesTotals.authority += score.scores.axisAuthority;
            teachingAxesTotals.knowledge += score.scores.axisKnowledge;
            teachingAxesTotals.motivation += score.scores.axisMotivation;
            teachingAxesTotals.assessment += score.scores.axisAssessment;
            teachingAxesTotals.adaptability += score.scores.axisAdaptability;
            teachingAxesTotals.climate += score.scores.axisClimate;
            teachingAxesTotals.count++;
        }
      });
    });

    const averageAxes = teachingAxesTotals.count > 0 ? [
        { subject: 'Authority', A: Math.round(teachingAxesTotals.authority / teachingAxesTotals.count), fullMark: 100 },
        { subject: 'Construction', A: Math.round(teachingAxesTotals.knowledge / teachingAxesTotals.count), fullMark: 100 },
        { subject: 'Motivation', A: Math.round(teachingAxesTotals.motivation / teachingAxesTotals.count), fullMark: 100 },
        { subject: 'Growth', A: Math.round(teachingAxesTotals.assessment / teachingAxesTotals.count), fullMark: 100 },
        { subject: 'Adaptability', A: Math.round(teachingAxesTotals.adaptability / teachingAxesTotals.count), fullMark: 100 },
        { subject: 'Climate', A: Math.round(teachingAxesTotals.climate / teachingAxesTotals.count), fullMark: 100 },
    ] : [];

    return {
      kolb: Object.entries(kolbDistribution).map(([name, value]) => ({ name, value })),
      sternberg: Object.entries(sternbergDistribution).map(([name, value]) => ({ name, value })),
      dualProcess: Object.entries(dualProcessDistribution).map(([name, value]) => ({ name, value })),
      teachingStyle: Object.entries(teachingStyleDistribution).map(([name, value]) => ({ name, value })),
      averageAxes,
      totals: { kolb: totalKolb, sternberg: totalSternberg, dual: totalDual, teaching: totalTeaching }
    };
  }, [professionals]);

  if (professionals.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>
          Invite teachers to your organization to see aggregated insights here.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Teachers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{professionals.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered in {organizationName}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assessments Completed
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totals.kolb + stats.totals.sternberg + stats.totals.dual + stats.totals.teaching}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all frameworks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Participation Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {professionals.length > 0 
                ? Math.round(((stats.totals.kolb / professionals.length) * 100)) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on Learning Styles (Kolb)
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="thinking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teaching">Teaching Styles</TabsTrigger>
          <TabsTrigger value="thinking">Cognitive Styles</TabsTrigger>
          <TabsTrigger value="learning">Learning Approaches</TabsTrigger>
          <TabsTrigger value="decision">Decision Making</TabsTrigger>
        </TabsList>

        <TabsContent value="teaching" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  Teaching Style Distribution
                </CardTitle>
                <CardDescription>
                   Breakdown of dominant teaching styles across faculty.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.teachingStyle.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.teachingStyle}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {stats.teachingStyle.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No teaching style data available yet
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Average School Profile
                </CardTitle>
                <CardDescription>
                  Aggregate view of the school's teaching "engines" (Authority, Motivation, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.averageAxes.length > 0 ? (
                   <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.averageAxes}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="School Average"
                          dataKey="A"
                          stroke="#82ca9d"
                          strokeWidth={2}
                          fill="#82ca9d"
                          fillOpacity={0.6}
                        />
                        <Tooltip />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                   <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No data available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="thinking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-600" />
                Cognitive Style Distribution (Sternberg)
              </CardTitle>
              <CardDescription>
                Breakdown of Analytical, Creative, and Practical thinking styles across your teaching staff.
                Diverse thinking styles foster a more comprehensive problem-solving environment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.sternberg.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.sternberg}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.sternberg.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No data available yet
                </div>
              )}
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-3">
             <Card>
               <CardHeader>
                 <CardTitle className="text-sm">Analytical Impact</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-xs text-muted-foreground">
                   Teachers with this style excel at analyzing curriculum effectiveness and student performance data.
                 </p>
               </CardContent>
             </Card>
             <Card>
               <CardHeader>
                 <CardTitle className="text-sm">Creative Impact</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-xs text-muted-foreground">
                   These teachers bring innovation to lesson planning and find novel ways to engage students.
                 </p>
               </CardContent>
             </Card>
             <Card>
               <CardHeader>
                 <CardTitle className="text-sm">Practical Impact</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-xs text-muted-foreground">
                   Practical thinkers are great at classroom management and connecting lessons to real-world applications.
                 </p>
               </CardContent>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Learning & Teaching Styles (Kolb)
              </CardTitle>
              <CardDescription>
                How your teachers process information (Learning Style) often influences how they teach.
                A balanced mix ensures all student learning styles are catered to.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.kolb.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.kolb}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#82ca9d" name="Number of Teachers">
                        {stats.kolb.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                 <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decision" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-600" />
                Decision Making Patterns (Dual Process)
              </CardTitle>
              <CardDescription>
                Understanding the balance between Intuitive (System 1) and Reflective (System 2) decision making in your school.
              </CardDescription>
            </CardHeader>
            <CardContent>
               {stats.dualProcess.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.dualProcess}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                         {stats.dualProcess.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                 <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
