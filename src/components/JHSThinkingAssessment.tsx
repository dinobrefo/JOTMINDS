import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { JHS_QUESTIONS, THINKING_STYLES } from '../utils/jhsThinkingData';
import { calculateJHSScores, JHSResults } from '../utils/jhsScoring';

interface JHSThinkingAssessmentProps {
  userId: string;
  onComplete: (results: JHSResults) => void;
  onCancel: () => void;
}

const EMOJI_SCALE = [
  { value: 1, emoji: '😕', label: 'Not really me' },
  { value: 2, emoji: '😐', label: 'A little like me' },
  { value: 3, emoji: '🙂', label: 'Sometimes me' },
  { value: 4, emoji: '😃', label: 'Mostly me' },
  { value: 5, emoji: '🤩', label: 'Totally me!' }
];

const SECTION_INFO = {
  creative: {
    title: '🎨 CREATIVE THINKING',
    subtitle: '"I love to imagine and explore ideas!"',
    description: 'These questions help see how your mind creates new ideas or connects things differently.',
    color: '#FF715B'
  },
  analytical: {
    title: '🔍 ANALYTICAL THINKING',
    subtitle: '"I like figuring out how things work."',
    description: 'These questions show how your brain notices details and uses logic.',
    color: '#1FC8E1'
  },
  practical: {
    title: '🛠️ PRACTICAL THINKING',
    subtitle: '"I use what I know to make things work."',
    description: 'These questions explore how you turn ideas into action and solve real-life challenges.',
    color: '#2C2E83'
  },
  reflective: {
    title: '💭 REFLECTIVE THINKING',
    subtitle: '"I think about my thoughts and choices."',
    description: 'These questions check how you learn from experience and understand yourself better.',
    color: '#9B59B6'
  }
};

export function JHSThinkingAssessment({ userId, onComplete, onCancel }: JHSThinkingAssessmentProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<number[]>(new Array(24).fill(0));

  const question = JHS_QUESTIONS[currentQuestion];
  const currentSection = question.section;
  const sectionInfo = SECTION_INFO[currentSection];
  const progress = ((currentQuestion + 1) / JHS_QUESTIONS.length) * 100;
  const isLastQuestion = currentQuestion === JHS_QUESTIONS.length - 1;
  const canProceed = responses[currentQuestion] > 0;

  // Check if we're at the start of a new section
  const isNewSection = currentQuestion === 0 || 
    JHS_QUESTIONS[currentQuestion].section !== JHS_QUESTIONS[currentQuestion - 1]?.section;

  const handleResponse = (value: number) => {
    const newResponses = [...responses];
    newResponses[currentQuestion] = value;
    setResponses(newResponses);
  };

  const handleNext = () => {
    if (currentQuestion < JHS_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    const results = calculateJHSScores(responses);
    onComplete(results);
  };

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="max-w-3xl mx-auto py-8">
          <Card className="border-4" style={{ borderColor: '#2C2E83' }}>
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl" style={{ color: '#2C2E83' }}>
                🧠 JOTMINDS – THINKING STYLES ADVENTURE
              </CardTitle>
              <CardDescription className="text-lg text-gray-700">
                Discover how your mind learns, solves, and creates!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Welcome Message */}
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-lg">
                <p className="text-lg text-gray-800 leading-relaxed">
                  👋 <strong>Hey there, Thinker!</strong> Every brain is unique — including yours! 
                  Let's find out how you love to think, solve problems, and come up with ideas. 
                  There are no right or wrong answers — just be honest about what feels true for you.
                </p>
              </div>

              {/* How to Answer */}
              <div className="space-y-3">
                <h3 className="font-bold text-xl" style={{ color: '#2C2E83' }}>
                  🌈 HOW TO ANSWER
                </h3>
                <p className="text-gray-700">
                  Choose what sounds most like you:
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {EMOJI_SCALE.map((item) => (
                    <div key={item.value} className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-3xl mb-1">{item.emoji}</div>
                      <div className="text-xs text-gray-600">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What You'll Discover */}
              <div className="space-y-3">
                <h3 className="font-bold text-xl" style={{ color: '#2C2E83' }}>
                  ⭐ WHAT YOU'LL DISCOVER
                </h3>
                <p className="text-gray-700">
                  The app will show your <strong>Thinking Style Power Mix!</strong> You'll see which thinking 
                  skills are your strongest — and which ones are growing.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {Object.entries(THINKING_STYLES).map(([key, style]) => (
                    <div key={key} className="bg-white p-4 rounded-lg shadow-sm border-2" style={{ borderColor: style.color }}>
                      <div className="text-2xl mb-2">{style.emoji}</div>
                      <div className="font-bold text-sm" style={{ color: style.color }}>{style.friendlyName}</div>
                      <div className="text-xs text-gray-600 mt-1">{style.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-4">
                <Button 
                  onClick={() => setShowIntro(false)}
                  className="w-full text-lg py-6"
                  style={{ backgroundColor: '#2C2E83' }}
                >
                  Let's Start My Thinking Adventure! 🚀
                </Button>
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  className="w-full mt-2"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-3xl mx-auto py-8">
        <Card>
          <CardHeader>
            {/* Section Header (show at start of each section) */}
            {isNewSection && (
              <div className="mb-6 p-6 rounded-lg" style={{ backgroundColor: `${sectionInfo.color}15` }}>
                <h2 className="text-2xl font-bold mb-2" style={{ color: sectionInfo.color }}>
                  {sectionInfo.title}
                </h2>
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {sectionInfo.subtitle}
                </p>
                <p className="text-sm text-gray-600">
                  {sectionInfo.description}
                </p>
              </div>
            )}

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Question {currentQuestion + 1} of {JHS_QUESTIONS.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Question */}
            <div className="text-center py-6">
              <p className="text-xl text-gray-800 leading-relaxed">
                {question.text}
              </p>
            </div>

            {/* Emoji Response Scale */}
            <div className="space-y-4">
              <p className="text-center text-sm text-gray-600 font-semibold">
                How much does this sound like you?
              </p>
              <div className="grid grid-cols-5 gap-3">
                {EMOJI_SCALE.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => handleResponse(item.value)}
                    className={`p-4 rounded-xl transition-all ${
                      responses[currentQuestion] === item.value
                        ? 'ring-4 scale-110 shadow-lg'
                        : 'hover:scale-105 hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: responses[currentQuestion] === item.value
                        ? `${sectionInfo.color}20`
                        : 'white',
                      borderColor: responses[currentQuestion] === item.value
                        ? sectionInfo.color
                        : '#E5E7EB',
                      borderWidth: '2px',
                      ringColor: sectionInfo.color
                    }}
                  >
                    <div className="text-4xl mb-2">{item.emoji}</div>
                    <div className="text-xs text-gray-700 font-medium leading-tight">
                      {item.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={currentQuestion === 0 ? onCancel : handlePrevious}
                className="min-w-[120px]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {currentQuestion === 0 ? 'Cancel' : 'Previous'}
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed}
                  style={{ backgroundColor: canProceed ? '#2C2E83' : undefined }}
                  className="min-w-[120px]"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  See My Results!
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed}
                  style={{ backgroundColor: canProceed ? sectionInfo.color : undefined }}
                  className="min-w-[120px]"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Helper message */}
            {!canProceed && (
              <p className="text-center text-sm text-gray-500">
                Please select an emoji above to continue
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
