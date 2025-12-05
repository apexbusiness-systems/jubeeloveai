import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { SEO } from '@/components/SEO';

export default function OAuthConsent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Check for error in URL params
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          return;
        }

        // Get session from Supabase (handles the OAuth callback automatically)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setStatus('error');
          setMessage(sessionError.message);
          return;
        }

        if (session) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Redirect to home after short delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1000);
        } else {
          // No session yet, wait for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              setStatus('success');
              setMessage('Authentication successful! Redirecting...');
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 1000);
            }
          });

          // Timeout after 10 seconds if no auth event
          setTimeout(() => {
            subscription.unsubscribe();
            if (status === 'processing') {
              setStatus('error');
              setMessage('Authentication timed out. Please try again.');
            }
          }, 10000);
        }
      } catch (err) {
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    handleOAuthCallback();
  }, [navigate, searchParams, status]);

  return (
    <>
      <SEO 
        title="Authorizing - Jubee Love"
        description="Completing authentication for Jubee Love"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
        <Card className="w-full max-w-md border-2 border-border shadow-2xl bg-card">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold text-primary">
              🎓 Jubee Love
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {status === 'processing' && 'Completing sign in...'}
              {status === 'success' && 'Welcome!'}
              {status === 'error' && 'Sign in failed'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
            {status === 'processing' && (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}
            
            {status === 'success' && (
              <div className="text-6xl">✅</div>
            )}
            
            {status === 'error' && (
              <div className="text-6xl">❌</div>
            )}
            
            <p className="text-center text-muted-foreground">{message}</p>
            
            {status === 'error' && (
              <button
                onClick={() => navigate('/auth')}
                className="mt-4 text-primary hover:underline"
              >
                Return to sign in
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
