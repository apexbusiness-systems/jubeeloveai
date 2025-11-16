import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { captureMessage, addBreadcrumb } from '@/lib/sentry';

/**
 * User feedback widget for reporting issues
 * Integrates with Sentry for tracking
 */
export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: 'Please enter your feedback',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Add breadcrumb for context
      addBreadcrumb({
        category: 'user_feedback',
        message: feedback,
        level: 'info',
      });

      // Capture feedback as message
      captureMessage(`User Feedback: ${feedback}`, 'info');

      toast({
        title: 'Thank you for your feedback!',
        description: 'We appreciate your input.',
      });

      setFeedback('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to submit feedback',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
        size="lg"
      >
        <MessageSquare className="w-5 h-5 mr-2" />
        Feedback
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Send Feedback</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Tell us what you think or report an issue..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={5}
          className="resize-none"
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
