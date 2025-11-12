/**
 * Performance Monitor Dashboard
 * 
 * Developer tool to view real-time performance metrics
 * Access via /performance-monitor route (development only)
 */

import { useState, useEffect } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

export default function PerformanceMonitor() {
  const { getAllMetrics, getSlowComponents, generateReport, resetMetrics } = usePerformanceMonitor();
  const [metrics, setMetrics] = useState(getAllMetrics());
  const [slowComponents, setSlowComponents] = useState(getSlowComponents());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getAllMetrics());
      setSlowComponents(getSlowComponents());
    }, 1000);

    return () => clearInterval(interval);
  }, [getAllMetrics, getSlowComponents]);

  const handleReset = () => {
    resetMetrics();
    setMetrics([]);
    setSlowComponents([]);
  };

  const handleGenerateReport = () => {
    const report = generateReport();
    console.log(report);
    alert('Performance report generated! Check the console.');
  };

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Performance Monitor</CardTitle>
            <CardDescription>
              This tool is only available in development mode.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitor</h1>
          <p className="text-muted-foreground">
            Real-time component render performance tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateReport} variant="outline">
            Generate Report
          </Button>
          <Button onClick={handleReset} variant="destructive">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Metrics
          </Button>
        </div>
      </div>

      {slowComponents.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Slow Components Detected
            </CardTitle>
            <CardDescription>
              These components are rendering slower than 16ms (60fps threshold)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {slowComponents.map((component) => (
                <div
                  key={component.componentName}
                  className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg"
                >
                  <span className="font-medium">{component.componentName}</span>
                  <Badge variant="destructive">
                    {component.averageDuration.toFixed(2)}ms avg
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No performance data collected yet. Navigate through the app to see metrics.
              </p>
            </CardContent>
          </Card>
        ) : (
          metrics.map((metric) => {
            const isOptimal = metric.averageDuration <= 16;
            return (
              <Card key={metric.componentName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{metric.componentName}</span>
                    {isOptimal ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Average Duration</span>
                      <span className={isOptimal ? 'text-green-600' : 'text-destructive'}>
                        {metric.averageDuration.toFixed(2)}ms
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Render</span>
                      <span>{metric.lastRenderDuration.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Render Count</span>
                      <span>{metric.renderCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Time</span>
                      <span>{metric.totalDuration.toFixed(2)}ms</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isOptimal ? 'bg-green-500' : 'bg-destructive'
                      }`}
                      style={{
                        width: `${Math.min((metric.averageDuration / 50) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {isOptimal
                      ? '✓ Performing well (under 16ms)'
                      : '⚠ Consider optimization'}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Target:</strong> Components should render in under 16ms to maintain 60fps
          </p>
          <p>
            <strong>Good:</strong> 0-16ms (Green badge)
          </p>
          <p>
            <strong>Warning:</strong> 16-50ms (Yellow - noticeable lag)
          </p>
          <p>
            <strong>Critical:</strong> 50ms+ (Red - significant performance issue)
          </p>
          <p className="pt-2 text-muted-foreground">
            Use the "Generate Report" button to export detailed metrics to the console.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
