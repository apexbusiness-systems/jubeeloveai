import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useParentalStore } from '@/store/useParentalStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { Users, Settings, BarChart3, Shield, Plus, LogOut } from 'lucide-react';

export default function ParentHub() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { children, settings } = useParentalStore();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <SEO 
        title="Parent Hub - JubeeLove"
        description="Manage your children's profiles, monitor progress, and configure parental controls"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Parent Hub</h1>
              <p className="text-muted-foreground">Welcome back! Manage your children's learning journey.</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Children Profiles</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{children.length}</div>
                <p className="text-xs text-muted-foreground">Active profiles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Time Limit</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{settings.maxDailyTime || 60} min</div>
                <p className="text-xs text-muted-foreground">Default limit</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Protection</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{settings.pin ? 'Active' : 'Inactive'}</div>
                <p className="text-xs text-muted-foreground">PIN protection</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/parent/controls')}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Settings className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Parental Controls</CardTitle>
                    <CardDescription>Manage settings, time limits, and restrictions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Open Controls
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/progress')}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Progress Reports</CardTitle>
                    <CardDescription>View your children's learning progress and achievements</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View Progress
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Children List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Children Profiles</CardTitle>
                <CardDescription>Manage your children's accounts</CardDescription>
              </div>
              <Button onClick={() => navigate('/parent/controls')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Child
              </Button>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No children profiles yet. Add your first child to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {children.map((child) => (
                    <Card key={child.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                            {child.avatar || '👶'}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{child.name}</CardTitle>
                            <CardDescription>{child.age} years old</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          <p>Daily limit: {child.dailyTimeLimit} minutes</p>
                          <p>Status: {child.sessionStartTime ? 'Active session' : 'Not active'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Access */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
              <CardDescription>Jump to other sections</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate('/')}>
                Kids Home
              </Button>
              <Button variant="outline" onClick={() => navigate('/stickers')}>
                Sticker Collection
              </Button>
              <Button variant="outline" onClick={() => navigate('/gallery')}>
                Gallery
              </Button>
              <Button variant="outline" onClick={() => navigate('/settings')}>
                App Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
