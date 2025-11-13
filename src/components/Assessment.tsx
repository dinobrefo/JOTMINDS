import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { 
  learningStyleQuestions, 
  thinkingStyleQuestions, 
  decisionStyleQuestions,
  generatePersonalizedQuestions,
  calculateResults,
  generateInsights
} from '../utils/assessmentData';
import { saveProgress, submitAssessment } from '../utils/api';
import { useAuth } from './AuthContext';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface AssessmentProps {
  type: 'learning' | 'thinking' | 'decision';
  onComplete: (results: any) => void;
  onBack: () => void;
}

export const Assessment: React.FC<AssessmentProps> = ({ type, onComplete, onBack }) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const allQuestions = 
      type === 'learning' ? learningStyleQuestions :
      type === 'thinking' ? thinkingStyleQuestions :
      decisionStyleQuestions;

    const personalizedQuestions = generatePersonalizedQuestions(user.id, allQuestions);
    setQuestions(personalizedQuestions);
  }, [type, user]);

  useEffect(() => {
    // Auto-save progress
    if (answers.length > 0 && user) {
      const autoSave = async () => {
        setIsSaving(true);
        try {
          await saveProgress(type, currentIndex, answers, false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      };

      const timeout = setTimeout(autoSave, 1000);
      return () => clearTimeout(timeout);
    }
  }, [answers, currentIndex, type, user]);

  const handleAnswer = () => {
    if (selectedOption === null) return;

    console.log('[Assessment] Handling answer for question', currentIndex);
    console.log('[Assessment] Selected option:', selectedOption);

    const currentQuestion = questions[currentIndex];
    const selectedOptionData = currentQuestion.options[selectedOption];

    const newAnswers = [...answers];
    newAnswers[currentIndex] = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      selectedOption: selectedOptionData.text,
      selectedStyle: selectedOptionData.style
    };

    console.log('[Assessment] New answers array:', newAnswers);
    console.log('[Assessment] Answers length:', newAnswers.length);
    console.log('[Assessment] Questions length:', questions.length);

    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(newAnswers[currentIndex + 1] ? 
        currentQuestion.options.findIndex((opt: any) => opt.text === newAnswers[currentIndex + 1].selectedOption) : 
        null
      );
    } else {
      console.log('[Assessment] Last question answered!');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      if (answers[currentIndex - 1]) {
        const prevQuestion = questions[currentIndex - 1];
        const answerIndex = prevQuestion.options.findIndex(
          (opt: any) => opt.text === answers[currentIndex - 1].selectedOption
        );
        setSelectedOption(answerIndex);
      } else {
        setSelectedOption(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (answers.length !== questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setIsSaving(true);

    try {
      const results = calculateResults(answers, type);
      const insights = generateInsights(results, type);

      await submitAssessment(
        type,
        answers,
        results,
        insights.strengths,
        insights.weaknesses,
        insights.recommendations
      );

      onComplete({
        results,
        insights,
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#2C2E83' }}></div>
          <p>Loading assessment...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const allQuestionsAnswered = answers.length === questions.length && answers.every(a => a !== undefined);
  
  // Check if current question is answered
  const currentQuestionAnswered = answers[currentIndex] !== undefined;

  console.log('[Assessment] Current state:');
  console.log('  - currentIndex:', currentIndex);
  console.log('  - isLastQuestion:', isLastQuestion);
  console.log('  - currentQuestionAnswered:', currentQuestionAnswered);
  console.log('  - answers.length:', answers.length);
  console.log('  - questions.length:', questions.length);
  console.log('  - allQuestionsAnswered:', allQuestionsAnswered);
  console.log('  - selectedOption:', selectedOption);

  const getAssessmentTitle = () => {
    switch (type) {
      case 'learning': return 'Your Learning Style';
      case 'thinking': return 'Your Thinking Style';
      case 'decision': return 'Your Decision Style';
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(to bottom, #F8F9FA 0%, #FFFFFF 100%)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl" style={{ color: '#2C2E83' }}>{getAssessmentTitle()}</h1>
            <span className="text-sm" style={{ color: '#6B7280' }}>
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          {isSaving && (
            <p className="text-xs mt-2" style={{ color: '#1FC8E1' }}>Saving progress...</p>
          )}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
            <CardDescription>Select the option that best describes you</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedOption?.toString()}
              onValueChange={(value) => setSelectedOption(parseInt(value))}
            >
              <div className="space-y-3">
                {currentQuestion.options.map((option: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedOption === index
                        ? 'border-[#2C2E83] bg-[#F0F0FF]'
                        : 'border-gray-200 hover:border-[#1FC8E1]'
                    }`}
                    onClick={() => setSelectedOption(index)}
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-3">
                {/* On last question, show Next/Save button if current question not answered yet */}
                {isLastQuestion && !currentQuestionAnswered && (
                  <Button
                    onClick={handleAnswer}
                    disabled={selectedOption === null}
                    style={{ backgroundColor: selectedOption !== null ? '#2C2E83' : undefined }}
                  >
                    Save Answer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {/* Show Submit button on last question only if current question is answered */}
                {isLastQuestion && currentQuestionAnswered && (
                  <Button
                    onClick={handleSubmit}
                    disabled={!allQuestionsAnswered || isSaving}
                    style={{ backgroundColor: allQuestionsAnswered ? '#FF715B' : undefined }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isSaving ? 'Submitting...' : 'Submit Assessment'}
                  </Button>
                )}

                {/* On all other questions, show Next button */}
                {!isLastQuestion && (
                  <Button
                    onClick={handleAnswer}
                    disabled={selectedOption === null}
                    style={{ backgroundColor: selectedOption !== null ? '#2C2E83' : undefined }}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#F0F9FF', borderLeft: '4px solid #1FC8E1' }}>
          <p className="text-sm">
            <strong>Note:</strong> These questions are personalized for you and will remain consistent across all your attempts. 
            Your progress is automatically saved.
          </p>
        </div>
      </div>
    </div>
  );
};