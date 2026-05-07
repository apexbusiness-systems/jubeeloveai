import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMasteryStore } from '@/store/useMasteryStore';
import { Skills } from '@/lib/mastery/taxonomy';
import { useParentalStore } from '@/store/useParentalStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { Users, Settings, BarChart3, Shield, Plus, LogOut, TrendingUp } from 'lucide-react';

export default function ParentHub() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const children = useParentalStore(useShallow(state => state.children));
const settings = useParentalStore(useShallow(state => state.settings));

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

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/analytics')}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Conversation Analytics</CardTitle>
                    <CardDescription>View sentiment trends and emotional patterns over time</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View Analytics
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Mastery & Progress Overviews */}
            <Card className="col-span-1 md:col-span-2 lg:col-span-2 shadow-sm border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Learning Mastery & Progress</CardTitle>
                    <CardDescription>View adaptive insights for your children's learning journey</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {children.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Add a child to see their progress.</p>
                ) : (
                  children.map(child => {
                    const store = useMasteryStore.getState();
                    const strongest = store.getStrongestSkills(child.id, 2);
                    const needsReview = store.getNeedsReviewSkills(child.id, 2);
                    const practicedToday = store.getPracticedToday(child.id);
                    
                    return (
                      <div key={child.id} className="border rounded-lg p-3 space-y-3 bg-card">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                            {child.avatar}
                          </div>
                          <h3 className="font-medium text-sm">{child.name}'s Week</h3>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-medium text-green-600 block mb-0.5">🌟 Strongest Skills</span>
                            {strongest.length > 0 ? (
                              <ul className="text-muted-foreground list-disc list-inside">
                                {strongest.map(s => <li key={s.skillId}>{Object.values(Skills).find(sk => sk.id === s.skillId)?.name || s.skillId}</li>)}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground">Keep playing to see strengths!</p>
                            )}
                          </div>
                          
                          <div>
                            <span className="font-medium text-amber-600 block mb-0.5">🎯 Needs Another Turn</span>
                            {needsReview.length > 0 ? (
                              <ul className="text-muted-foreground list-disc list-inside">
                                {needsReview.map(s => <li key={s.skillId}>{Object.values(Skills).find(sk => sk.id === s.skillId)?.name || s.skillId}</li>)}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground">All caught up!</p>
                            )}
                          </div>
                          
                          <div>
                            <span className="font-medium text-blue-600 block mb-0.5">💡 Offline Suggestion</span>
                            <p className="text-muted-foreground">
                              {needsReview.length > 0 && needsReview[0].skillId === 'counting' 
                                ? "Try counting the stairs as you walk up together."
                                : "Ask them to spot the color red in the room for 3 minutes."}
                            </p>
                          </div>
                          
                          <div className="pt-2 border-t font-medium text-muted-foreground">
                            Practiced Today: {practicedToday.length} skill{practicedToday.length !== 1 && 's'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer flex-1" onClick={() => navigate('/parent/controls')}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Controls</CardTitle>
                      <CardDescription>Manage limits</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full justify-start pl-0 text-primary">
                    Settings &rarr;
                  </Button>
                </CardContent>
              </Card>

              {/* Demoted Conversation Analytics */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer flex-1" onClick={() => navigate('/parent/analytics')}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-muted-foreground">Chat Logs</CardTitle>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
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
