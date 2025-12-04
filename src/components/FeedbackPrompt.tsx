import { MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useState } from 'react';

interface FeedbackPromptProps {
  className?: string;
  variant?: 'default' | 'full';
}

export const FeedbackPrompt = ({ className = '', variant = 'default' }: FeedbackPromptProps) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleExternalFeedbackClick = () => {
    window.open('https://forms.gle/SXPFj29PxUbmYVQq7', '_blank');
  };

  const handleInAppFeedbackClick = () => {
    setShowFeedbackForm(true);
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call - in production, this would send to your backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setShowFeedbackForm(false);
      setIsSubmitted(false);
      setFeedback('');
    }, 3000);
  };

  if (showFeedbackForm) {
    return (
      <Card className={`border-[#1FC8E1]/30 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:border-[#1FC8E1]/20 dark:from-cyan-950/30 dark:to-blue-950/30 ${className}`}>
        <CardContent className="p-4 sm:p-6">
          {isSubmitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                Thank You!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your feedback helps us improve JotMinds for everyone
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide text-sm">
                    Help Us Improve JotMinds — Share Your Feedback
                  </h3>
                </div>
              </div>
              
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you think... What's working well? What could be better?"
                className="w-full min-h-[120px] p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#1FC8E1] focus:border-transparent"
                autoFocus
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={!feedback.trim() || isSubmitting}
                  className="flex-1 bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] hover:from-[#1AB5CC] hover:to-[#252770] h-12 text-base font-medium"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
                <Button
                  onClick={() => setShowFeedbackForm(false)}
                  variant="outline"
                  className="px-6 h-12"
                >
                  Cancel
                </Button>
              </div>
              
              <div className="text-center">
                <button
                  onClick={handleExternalFeedbackClick}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline inline-flex items-center gap-1"
                >
                  Or use our detailed feedback form
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-[#1FC8E1]/30 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:border-[#1FC8E1]/20 dark:from-cyan-950/30 dark:to-blue-950/30 ${className}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start sm:items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide text-sm mb-1">
                Help Us Improve JotMinds — Share Your Feedback
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your input helps us build a better experience for students, teachers, and parents
              </p>
            </div>
          </div>
          <Button
            onClick={handleInAppFeedbackClick}
            className="bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] hover:from-[#1AB5CC] hover:to-[#252770] w-full sm:w-auto whitespace-nowrap h-12 px-6 text-base font-medium"
          >
            Share Feedback
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};