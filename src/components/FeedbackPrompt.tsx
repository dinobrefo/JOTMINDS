import { MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

export const FeedbackPrompt = () => {
  const handleFeedbackClick = () => {
    window.open('https://forms.gle/SXPFj29PxUbmYVQq7', '_blank');
  };

  return (
    <Card className="border-[#1FC8E1]/30 bg-gradient-to-br from-cyan-50/50 to-blue-50/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Share Your Feedback</h3>
              <p className="text-sm text-gray-600">
                Help us improve JotMinds for students, teachers, and parents across Ghana
              </p>
            </div>
          </div>
          <Button
            onClick={handleFeedbackClick}
            className="bg-gradient-to-r from-[#1FC8E1] to-[#2C2E83] hover:from-[#1AB5CC] hover:to-[#252770] whitespace-nowrap"
          >
            Give Feedback
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};