/**
 * Parent Journey Verification Card
 * 
 * UI component for the Performance Monitor that triggers
 * the client-side parent journey verifier and displays results.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Eye, Download } from 'lucide-react';
import { verifyParentJourney } from './verifyParentJourneyClient';
import type { ParentJourneyResult } from './verifyParentJourneyClient';

export function ParentJourneyCard() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ParentJourneyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunVerification = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const report = await verifyParentJourney();
      setResult(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      console.error('Verification error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleViewScreenshots = () => {
    if (typeof window !== 'undefined') {
      (window as any).viewJourneyScreenshots?.();
    }
  };

  const handleDownloadScreenshots = () => {
    if (typeof window !== 'undefined') {
      (window as any).downloadJourneyScreenshots?.();
    }
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Verify Parent User Journey
        </CardTitle>
        <CardDescription>
          Simulates a non-technical parent's first experience with Jubee.Love,
          validating the complete flow from onboarding to story reading with visual evidence.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Run Button */}
        <Button
          onClick={handleRunVerification}
          disabled={isRunning}
          className="w-full"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Running verification...
            </>
          ) : (
            'Run verification'
          )}
        </Button>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="font-semibold text-destructive">Verification Failed</span>
            </div>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-4">
            {/* Overall Result */}
            <div
              className={`p-4 rounded-lg border ${
                result.overallPass
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {result.overallPass ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="text-lg font-bold text-green-700 dark:text-green-400">PASS</span>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      {result.passedSteps}/{result.totalSteps} steps
                    </Badge>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-6 w-6 text-red-600" />
                      <span className="text-lg font-bold text-red-700 dark:text-red-400">FAIL</span>
                    </div>
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                      {result.passedSteps}/{result.totalSteps} passed
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Duration: {((result.endTime - result.startTime) / 1000).toFixed(2)}s
              </p>
            </div>

            {/* Step-by-Step Results */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Verification Steps:</h4>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {result.results.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border"
                  >
                    {step.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{step.step}</p>
                      <p className="text-xs text-muted-foreground mt-1">{step.evidence}</p>
                      {step.error && (
                        <p className="text-xs text-destructive mt-1">Error: {step.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Screenshot Actions */}
            {result.screenshots && result.screenshots.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleViewScreenshots}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Screenshots ({result.screenshots.length})
                </Button>
                <Button
                  onClick={handleDownloadScreenshots}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              </div>
            )}

            {/* Console Info */}
            <p className="text-xs text-muted-foreground text-center">
              Full report logged to console. Screenshots can be viewed/downloaded using the buttons above.
            </p>
          </div>
        )}

        {/* Instructions */}
        {!result && !error && (
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground mb-3">
              This test simulates a parent's journey through:
            </p>
            <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
              <li>Loading the homepage and seeing onboarding</li>
              <li>Progressing through onboarding steps</li>
              <li>Navigating to the Stories section</li>
              <li>Selecting and reading a story</li>
              <li>Verifying audio controls and navigation</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              Results include screenshots at each step for visual verification.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
