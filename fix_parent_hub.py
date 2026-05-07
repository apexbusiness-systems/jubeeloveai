with open('src/pages/ParentHub.tsx', 'r') as f:
    content = f.read()

import_add = """import { useMasteryStore } from '@/store/useMasteryStore';
import { Skills } from '@/lib/mastery/taxonomy';
"""
if "useMasteryStore" not in content:
    content = content.replace("import { useParentalStore }", import_add + "import { useParentalStore }")

start_str = '          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">'
end_str = '          {/* Children List */}'

idx1 = content.find(start_str)
idx2 = content.find(end_str)

if idx1 != -1 and idx2 != -1:
    new_progress = """          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
          </div>\n\n"""

    content = content[:idx1] + new_progress + content[idx2:]
    
    with open('src/pages/ParentHub.tsx', 'w') as f:
        f.write(content)

