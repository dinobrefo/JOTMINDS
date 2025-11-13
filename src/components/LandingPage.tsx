import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { BookOpen, Brain, Target, Users, GraduationCap, School, Briefcase, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { FeedbackPrompt } from './FeedbackPrompt';

interface LandingPageProps {
  onGetStarted: () => void;
  onSupervisorPortal?: () => void;
}

export function LandingPage({ onGetStarted, onSupervisorPortal }: LandingPageProps) {
  const frameworks = [
    {
      name: 'Your Learning Style',
      icon: BookOpen,
      color: 'from-[#1FC8E1] to-[#7B61FF]',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/20',
      borderColor: 'border-cyan-200 dark:border-cyan-800',
      iconColor: 'text-[#1FC8E1]',
      description: 'Discover how you learn best',
      details: 'Your thoughts make you unique — understand whether you learn through experience, reflection, analysis, or experimentation'
    },
    {
      name: 'Your Thinking Style',
      icon: Brain,
      color: 'from-[#7B61FF] to-[#2C2E83]',
      bgColor: 'bg-violet-50 dark:bg-violet-950/20',
      borderColor: 'border-violet-200 dark:border-violet-800',
      iconColor: 'text-[#7B61FF]',
      description: 'Understand how you think',
      details: 'Explore your unique cognitive strengths in analytical, creative, or practical thinking'
    },
    {
      name: 'Your Decision Style',
      icon: Target,
      color: 'from-[#2C2E83] to-[#FF715B]',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      iconColor: 'text-[#2C2E83]',
      description: 'Learn how you make decisions',
      details: 'Discover whether you rely on intuition or analytical thinking when making choices'
    }
  ];

  const userTypes = [
    {
      role: 'Students',
      icon: GraduationCap,
      color: 'text-[#1FC8E1]',
      benefits: [
        'Get personalized SHS track recommendations',
        'Discover your optimal learning methods',
        'Receive career guidance based on your profile',
        'Build self-awareness for academic success'
      ]
    },
    {
      role: 'Teachers',
      icon: School,
      color: 'text-[#7B61FF]',
      benefits: [
        'Understand each student\'s learning style',
        'Differentiate instruction effectively',
        'Provide data-driven guidance',
        'Track student cognitive development'
      ]
    },
    {
      role: 'Parents',
      icon: Users,
      color: 'text-[#2C2E83]',
      benefits: [
        'Support your child\'s unique strengths',
        'Choose appropriate school programs',
        'Guide career path decisions',
        'Improve parent-child communication'
      ]
    },
    {
      role: 'Professionals',
      icon: Briefcase,
      color: 'text-[#FF715B]',
      benefits: [
        'Build high-performing teams',
        'Foster cognitive diversity',
        'Enhance decision-making',
        'Drive organizational innovation'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-violet-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Supervisor Portal Link */}
      {onSupervisorPortal && (
        <div className="absolute top-4 right-4">
          <Button variant="outline" onClick={onSupervisorPortal} className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Supervisor Portal
          </Button>
        </div>
      )}
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-4 bg-gradient-aqua-violet text-white border-0">
            Discover How You Think
          </Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-[#1FC8E1] via-[#7B61FF] to-[#2C2E83] bg-clip-text text-transparent">
            JotMinds
          </h1>
          <p className="text-2xl text-gray-700 dark:text-gray-300 mb-4 font-medium">
            Every mind works differently.
          </p>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            JotMinds helps you understand yours — so you can learn, grow, and lead better.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={onGetStarted} className="group">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              const element = document.getElementById('learn-more');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Learn More
            </Button>
          </div>
        </div>

        {/* Three Frameworks */}
        <div id="learn-more" className="grid md:grid-cols-3 gap-6 mb-16">
          {frameworks.map((framework, index) => {
            const Icon = framework.icon;
            return (
              <Card key={index} className={`border-2 ${framework.borderColor} ${framework.bgColor} transition-all hover:shadow-lg hover:-translate-y-1`}>
                <CardHeader>
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${framework.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>{framework.name}</CardTitle>
                  <CardDescription className="text-base">{framework.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{framework.details}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* The Cognitive Cycle */}
        <Card className="mb-16 border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">The Complete Cognitive Cycle</CardTitle>
            <CardDescription>How the three frameworks work together</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1FC8E1] to-[#7B61FF] flex items-center justify-center text-white mb-3">
                  <BookOpen className="h-10 w-10" />
                </div>
                <h4 className="font-semibold mb-1">Input</h4>
                <p className="text-sm text-muted-foreground">How you learn</p>
              </div>
              
              <ArrowRight className="h-8 w-8 text-muted-foreground rotate-90 md:rotate-0" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#2C2E83] flex items-center justify-center text-white mb-3">
                  <Brain className="h-10 w-10" />
                </div>
                <h4 className="font-semibold mb-1">Processing</h4>
                <p className="text-sm text-muted-foreground">How you think</p>
              </div>
              
              <ArrowRight className="h-8 w-8 text-muted-foreground rotate-90 md:rotate-0" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2C2E83] to-[#FF715B] flex items-center justify-center text-white mb-3">
                  <Target className="h-10 w-10" />
                </div>
                <h4 className="font-semibold mb-1">Output</h4>
                <p className="text-sm text-muted-foreground">How you decide</p>
              </div>
            </div>
            
            <div className="mt-8 text-center p-4 bg-gradient-to-r from-cyan-50 via-violet-50 to-indigo-50 dark:from-cyan-950/20 dark:to-indigo-950/20 rounded-lg border border-violet-200">
              <p className="text-sm text-muted-foreground">
                <strong>Learn</strong> → <strong>Think</strong> → <strong>Decide</strong> → <strong>Act</strong> → <strong>Relearn</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* For Different Users */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Who Is This For?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userTypes.map((userType, index) => {
              const Icon = userType.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Icon className={`h-12 w-12 mb-3 ${userType.color}`} />
                    <CardTitle className="text-xl">{userType.role}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {userType.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Feedback Prompt */}
        <FeedbackPrompt variant="full" className="mb-8" />

        {/* Call to Action */}
        <Card className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Ready to Discover Your Cognitive Profile?</CardTitle>
            <CardDescription className="text-blue-100">
              Join thousands of students, teachers, parents, and professionals in Ghana who are unlocking their potential
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" variant="secondary" onClick={onGetStarted} className="group">
              Start Your Assessment
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 Thinking Styles Assessment Platform - Ghana Education System</p>
            <p className="mt-2">Empowering learners through cognitive awareness</p>
          </div>
        </div>
      </div>
    </div>
  );
}
