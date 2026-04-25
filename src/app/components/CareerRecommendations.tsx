import { useState } from 'react';
import { Briefcase, ExternalLink, BookOpen, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';

interface Career {
  title: string;
  description: string;
  whySuitsYou: string;
  skillsNeeded: string[];
  howToBuildSkills: string[];
  ghanaRelevance?: string;
}

interface CareerRecommendationsProps {
  cognitiveStyle: string;
  assessmentType: string;
}

export function CareerRecommendations({ cognitiveStyle, assessmentType }: CareerRecommendationsProps) {
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getCareers = (): Career[] => {
    // Kolb Learning Styles
    if (assessmentType === 'kolb') {
      switch (cognitiveStyle.toLowerCase()) {
        case 'diverging':
          return [
            {
              title: 'Counseling Psychologist',
              description: 'Help individuals understand their emotions and navigate life challenges',
              whySuitsYou: 'Your ability to see multiple perspectives and empathize with others makes you excellent at understanding people\'s experiences and guiding them toward solutions.',
              skillsNeeded: ['Active listening', 'Emotional intelligence', 'Communication', 'Patience'],
              howToBuildSkills: [
                'Take psychology courses',
                'Volunteer at student counseling centers',
                'Practice reflective journaling',
                'Join peer support groups'
              ],
              ghanaRelevance: 'Growing demand in schools, hospitals, and NGOs across Ghana'
            },
            {
              title: 'Human Resources Manager',
              description: 'Manage employee relations, recruitment, and organizational culture',
              whySuitsYou: 'Your reflective nature and people-centered approach help you understand diverse viewpoints and create inclusive workplace environments.',
              skillsNeeded: ['Interpersonal skills', 'Conflict resolution', 'Organizational skills', 'Empathy'],
              howToBuildSkills: [
                'Study organizational behavior',
                'Join student leadership roles',
                'Participate in mediation training',
                'Intern with HR departments'
              ],
              ghanaRelevance: 'Essential in all medium to large companies and government institutions'
            },
            {
              title: 'Social Worker',
              description: 'Support vulnerable communities and advocate for social justice',
              whySuitsYou: 'Your ability to listen deeply and understand complex human situations makes you naturally suited for community support work.',
              skillsNeeded: ['Empathy', 'Cultural awareness', 'Advocacy', 'Problem-solving'],
              howToBuildSkills: [
                'Volunteer with local NGOs',
                'Study social work or sociology',
                'Engage in community service',
                'Learn about social justice issues'
              ],
              ghanaRelevance: 'High demand in NGOs, government agencies, and community organizations'
            }
          ];
        
        case 'assimilating':
          return [
            {
              title: 'Research Scientist',
              description: 'Conduct systematic research to advance knowledge in your field',
              whySuitsYou: 'Your love for theories, logical thinking, and structured analysis makes you perfect for systematic research and discovery.',
              skillsNeeded: ['Analytical thinking', 'Research methodology', 'Data analysis', 'Technical writing'],
              howToBuildSkills: [
                'Engage in undergraduate research projects',
                'Learn statistical analysis tools',
                'Read academic journals regularly',
                'Present at student research conferences'
              ],
              ghanaRelevance: 'Opportunities in universities, research institutes like CSIR, and international organizations'
            },
            {
              title: 'Data Analyst',
              description: 'Transform complex data into actionable business insights',
              whySuitsYou: 'Your ability to organize information logically and identify patterns makes you excellent at extracting meaning from data.',
              skillsNeeded: ['Statistical analysis', 'Programming (Python/R)', 'Data visualization', 'Critical thinking'],
              howToBuildSkills: [
                'Learn Excel, Python, or R',
                'Take online courses in data science',
                'Practice with real datasets',
                'Build a portfolio of analysis projects'
              ],
              ghanaRelevance: 'Growing field in banks, telecom companies, and tech startups'
            },
            {
              title: 'University Lecturer',
              description: 'Teach and conduct research in academic institutions',
              whySuitsYou: 'Your preference for conceptual thinking and structured knowledge makes you ideal for academic teaching and scholarship.',
              skillsNeeded: ['Subject expertise', 'Presentation skills', 'Research abilities', 'Patience'],
              howToBuildSkills: [
                'Excel academically in your major',
                'Pursue graduate studies',
                'Assist professors with research',
                'Practice teaching peers'
              ],
              ghanaRelevance: 'Universities and polytechnics nationwide seek qualified lecturers'
            }
          ];

        case 'converging':
          return [
            {
              title: 'Software Engineer',
              description: 'Design, develop, and maintain software applications',
              whySuitsYou: 'Your practical problem-solving skills and love for applying technical knowledge make you perfect for building functional software solutions.',
              skillsNeeded: ['Programming', 'Problem-solving', 'Logical thinking', 'Testing'],
              howToBuildSkills: [
                'Learn programming languages (Python, JavaScript)',
                'Build personal coding projects',
                'Contribute to open-source projects',
                'Complete coding challenges on platforms like HackerRank'
              ],
              ghanaRelevance: 'Rapidly growing tech sector in Accra and Kumasi'
            },
            {
              title: 'Biomedical Engineer',
              description: 'Apply engineering principles to healthcare and medical devices',
              whySuitsYou: 'Your ability to solve practical problems using technical knowledge is ideal for developing medical solutions.',
              skillsNeeded: ['Engineering principles', 'Biology knowledge', 'Technical design', 'Innovation'],
              howToBuildSkills: [
                'Study biology and engineering',
                'Join innovation labs or maker spaces',
                'Participate in design competitions',
                'Intern at hospitals or medical companies'
              ],
              ghanaRelevance: 'Emerging field in teaching hospitals and medical equipment companies'
            },
            {
              title: 'Civil Engineer',
              description: 'Design and oversee construction of infrastructure projects',
              whySuitsYou: 'Your practical, results-oriented approach is perfect for creating tangible structures that solve real-world problems.',
              skillsNeeded: ['Technical drawing', 'Mathematics', 'Project management', 'Structural analysis'],
              howToBuildSkills: [
                'Study civil engineering',
                'Learn CAD software',
                'Visit construction sites',
                'Join engineering student associations'
              ],
              ghanaRelevance: 'High demand due to infrastructure development across Ghana'
            }
          ];

        case 'accommodating':
          return [
            {
              title: 'Entrepreneur',
              description: 'Start and grow your own business ventures',
              whySuitsYou: 'Your adaptability, risk-taking nature, and hands-on approach make you perfect for the dynamic world of entrepreneurship.',
              skillsNeeded: ['Initiative', 'Adaptability', 'Sales', 'Financial management'],
              howToBuildSkills: [
                'Start a small business while studying',
                'Join entrepreneurship clubs',
                'Learn basic accounting and marketing',
                'Network with local business owners'
              ],
              ghanaRelevance: 'Ghana\'s entrepreneurial ecosystem is vibrant with programs like NABCO and GEA'
            },
            {
              title: 'Event Coordinator',
              description: 'Plan and execute events, conferences, and celebrations',
              whySuitsYou: 'Your spontaneous, action-oriented nature and ability to adapt quickly make you excellent at managing dynamic event situations.',
              skillsNeeded: ['Organization', 'Creativity', 'Communication', 'Problem-solving under pressure'],
              howToBuildSkills: [
                'Volunteer to organize campus events',
                'Learn project management basics',
                'Build vendor relationships',
                'Practice multitasking'
              ],
              ghanaRelevance: 'Growing events industry for corporate, social, and cultural occasions'
            },
            {
              title: 'Sales Manager',
              description: 'Lead sales teams and drive revenue growth',
              whySuitsYou: 'Your people skills, adaptability, and action-oriented approach are perfect for the fast-paced world of sales.',
              skillsNeeded: ['Persuasion', 'Relationship building', 'Goal orientation', 'Resilience'],
              howToBuildSkills: [
                'Take marketing and sales courses',
                'Practice negotiation skills',
                'Join sales competitions',
                'Intern with sales teams'
              ],
              ghanaRelevance: 'Essential role in all industries from telecom to consumer goods'
            }
          ];

        default:
          return getDefaultCareers();
      }
    }

    // Sternberg Thinking Styles
    if (assessmentType === 'sternberg') {
      switch (cognitiveStyle.toLowerCase()) {
        case 'analytical':
          return [
            {
              title: 'Financial Analyst',
              description: 'Analyze financial data to guide investment and business decisions',
              whySuitsYou: 'Your strong analytical skills and ability to evaluate complex information make you ideal for financial analysis and forecasting.',
              skillsNeeded: ['Financial modeling', 'Excel proficiency', 'Critical thinking', 'Attention to detail'],
              howToBuildSkills: [
                'Study finance and accounting',
                'Learn Excel and financial software',
                'Follow financial markets',
                'Complete financial modeling courses'
              ],
              ghanaRelevance: 'Banks, investment firms, and large corporations seek skilled analysts'
            },
            {
              title: 'Medical Doctor',
              description: 'Diagnose and treat illnesses, injuries, and diseases',
              whySuitsYou: 'Your analytical approach to problem-solving and attention to detail are crucial for accurate diagnosis and treatment.',
              skillsNeeded: ['Medical knowledge', 'Diagnostic reasoning', 'Attention to detail', 'Empathy'],
              howToBuildSkills: [
                'Excel in science subjects',
                'Study for WASSCE and NSMQ',
                'Shadow doctors at hospitals',
                'Join health clubs'
              ],
              ghanaRelevance: 'Critical shortage of doctors in Ghana creates strong career prospects'
            },
            {
              title: 'Lawyer / Legal Consultant',
              description: 'Provide legal advice and represent clients in legal matters',
              whySuitsYou: 'Your ability to analyze arguments, identify flaws, and build logical cases makes you well-suited for legal practice.',
              skillsNeeded: ['Legal research', 'Argumentation', 'Writing', 'Critical analysis'],
              howToBuildSkills: [
                'Study law',
                'Join debate clubs',
                'Practice legal writing',
                'Intern at law firms'
              ],
              ghanaRelevance: 'Law remains a prestigious and in-demand profession in Ghana'
            }
          ];

        case 'creative':
          return [
            {
              title: 'Graphic Designer',
              description: 'Create visual content for brands, media, and advertising',
              whySuitsYou: 'Your creative thinking and ability to generate original ideas make you perfect for visual communication and design.',
              skillsNeeded: ['Design software (Adobe Suite)', 'Creativity', 'Visual communication', 'Client management'],
              howToBuildSkills: [
                'Learn Photoshop, Illustrator, and Figma',
                'Build a design portfolio',
                'Take on freelance projects',
                'Study design principles'
              ],
              ghanaRelevance: 'Growing demand in advertising agencies, media houses, and startups'
            },
            {
              title: 'Content Creator / Influencer',
              description: 'Create engaging content for social media and digital platforms',
              whySuitsYou: 'Your innovative thinking and unique perspective help you create content that stands out and engages audiences.',
              skillsNeeded: ['Creativity', 'Social media savvy', 'Video editing', 'Storytelling'],
              howToBuildSkills: [
                'Start a YouTube channel or blog',
                'Learn video editing',
                'Study successful creators',
                'Build an authentic online presence'
              ],
              ghanaRelevance: 'Rapidly growing digital economy with brands seeking authentic voices'
            },
            {
              title: 'Innovation Consultant',
              description: 'Help organizations develop new products, services, and strategies',
              whySuitsYou: 'Your ability to think outside the box and generate novel solutions makes you valuable for driving organizational innovation.',
              skillsNeeded: ['Creative problem-solving', 'Business strategy', 'Facilitation', 'Research'],
              howToBuildSkills: [
                'Study business innovation',
                'Join innovation hubs',
                'Practice design thinking',
                'Read about emerging trends'
              ],
              ghanaRelevance: 'Consulting firms and progressive companies need innovation specialists'
            }
          ];

        case 'practical':
          return [
            {
              title: 'Project Manager',
              description: 'Plan, execute, and deliver projects on time and within budget',
              whySuitsYou: 'Your practical approach, ability to apply knowledge, and focus on results make you excellent at managing complex projects.',
              skillsNeeded: ['Organization', 'Leadership', 'Risk management', 'Communication'],
              howToBuildSkills: [
                'Lead student projects',
                'Learn project management tools',
                'Study for PMP certification',
                'Intern with project teams'
              ],
              ghanaRelevance: 'Every industry needs skilled project managers'
            },
            {
              title: 'Nurse Practitioner',
              description: 'Provide direct patient care and health services',
              whySuitsYou: 'Your practical, hands-on approach and ability to handle real-world situations make you ideal for direct patient care.',
              skillsNeeded: ['Medical knowledge', 'Practical skills', 'Empathy', 'Quick decision-making'],
              howToBuildSkills: [
                'Study nursing',
                'Volunteer at health facilities',
                'Practice clinical skills',
                'Join nursing associations'
              ],
              ghanaRelevance: 'High demand nationwide in hospitals and community health centers'
            },
            {
              title: 'Operations Manager',
              description: 'Optimize business processes and day-to-day operations',
              whySuitsYou: 'Your ability to translate ideas into action and solve everyday problems efficiently makes you perfect for operations management.',
              skillsNeeded: ['Process optimization', 'Problem-solving', 'Leadership', 'Analytical thinking'],
              howToBuildSkills: [
                'Study business operations',
                'Learn Lean Six Sigma',
                'Intern in operations roles',
                'Analyze business processes'
              ],
              ghanaRelevance: 'Essential role in manufacturing, logistics, and service companies'
            }
          ];

        default:
          return getDefaultCareers();
      }
    }

    // Dual-Process Decision Styles
    if (assessmentType === 'dual-process') {
      switch (cognitiveStyle.toLowerCase()) {
        case 'intuitive':
        case 'balanced':
          return [
            {
              title: 'Emergency Medical Technician',
              description: 'Provide immediate medical care in emergency situations',
              whySuitsYou: 'Your ability to make quick, intuitive decisions under pressure is crucial for emergency medical response.',
              skillsNeeded: ['Quick thinking', 'Medical knowledge', 'Stress management', 'Physical fitness'],
              howToBuildSkills: [
                'Get EMT certification',
                'Volunteer with ambulance services',
                'Practice emergency scenarios',
                'Stay physically fit'
              ],
              ghanaRelevance: 'Growing emergency medical services across urban areas'
            },
            {
              title: 'Creative Director',
              description: 'Lead creative teams in advertising and media',
              whySuitsYou: 'Your intuitive sense of what works and quick pattern recognition help you guide creative direction effectively.',
              skillsNeeded: ['Creative vision', 'Leadership', 'Trend awareness', 'Decision-making'],
              howToBuildSkills: [
                'Build a creative portfolio',
                'Lead creative projects',
                'Study successful campaigns',
                'Network in creative industries'
              ],
              ghanaRelevance: 'Advertising agencies and media houses need creative leadership'
            }
          ];

        case 'reflective':
          return [
            {
              title: 'Research Analyst',
              description: 'Conduct in-depth research and analysis for organizations',
              whySuitsYou: 'Your deliberate, thorough approach to decision-making makes you excellent at producing well-researched insights.',
              skillsNeeded: ['Research methods', 'Critical thinking', 'Writing', 'Patience'],
              howToBuildSkills: [
                'Take research methodology courses',
                'Write research papers',
                'Learn data analysis tools',
                'Work on research projects'
              ],
              ghanaRelevance: 'Think tanks, NGOs, and government agencies need skilled researchers'
            },
            {
              title: 'Strategic Planner',
              description: 'Develop long-term strategies for organizations',
              whySuitsYou: 'Your reflective nature and careful analysis of information make you ideal for strategic planning and forecasting.',
              skillsNeeded: ['Strategic thinking', 'Analysis', 'Forecasting', 'Communication'],
              howToBuildSkills: [
                'Study business strategy',
                'Analyze case studies',
                'Learn scenario planning',
                'Intern in strategy roles'
              ],
              ghanaRelevance: 'Corporations and government need strategic planning expertise'
            }
          ];

        default:
          return getDefaultCareers();
      }
    }

    return getDefaultCareers();
  };

  function getDefaultCareers(): Career[] {
    return [
      {
        title: 'Business Analyst',
        description: 'Bridge business needs and technical solutions',
        whySuitsYou: 'Your balanced skills help you understand both business and technical perspectives.',
        skillsNeeded: ['Analysis', 'Communication', 'Technical understanding', 'Problem-solving'],
        howToBuildSkills: [
          'Study business and IT',
          'Learn requirements gathering',
          'Practice process mapping',
          'Intern in analyst roles'
        ],
        ghanaRelevance: 'Growing demand in tech and consulting firms'
      }
    ];
  }

  const careers = getCareers();

  const handleCareerClick = (career: Career) => {
    setSelectedCareer(career);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle>Career Pathways for You</CardTitle>
          </div>
          <CardDescription>
            Careers that align with your {cognitiveStyle} profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {careers.map((career, index) => (
              <button
                key={index}
                onClick={() => handleCareerClick(career)}
                className="text-left p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
              >
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {career.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {career.description}
                </p>
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Learn more
                  <ExternalLink className="w-4 h-4 ml-1" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Career Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedCareer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedCareer.title}</DialogTitle>
                <DialogDescription>{selectedCareer.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Why This Suits You */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Why This Suits You
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                    {selectedCareer.whySuitsYou}
                  </p>
                </div>

                {/* Skills Needed */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Skills Needed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCareer.skillsNeeded.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* How to Build Skills */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      How to Build These Skills in School
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {selectedCareer.howToBuildSkills.map((step, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Ghana Relevance */}
                {selectedCareer.ghanaRelevance && (
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      🇬🇭 Relevance in Ghana
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {selectedCareer.ghanaRelevance}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
