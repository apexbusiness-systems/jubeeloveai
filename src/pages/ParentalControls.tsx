import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParentalStore } from '@/store/useParentalStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SEO } from '@/components/SEO';
import { ScheduleConfigurator } from '@/components/ScheduleConfigurator';
import { toast } from '@/hooks/use-toast';
import { Lock, UserPlus, Clock, Shield, Users, Settings as SettingsIcon } from 'lucide-react';
import type { } from '@/store/useParentalStore';
import { validatePIN, validateChildName } from '@/lib/inputValidation';

export default function ParentalControls() {
  const navigate = useNavigate();
  const { 
    children, 
    settings, 
    isParentMode, 
    addChild, 
    updateChild, 
    deleteChild, 
    updateSettings, 
    setParentMode,
    verifyPin 
  } = useParentalStore();

  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(!settings.isLocked || isParentMode);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // New child form
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('');
  const [newChildTimeLimit, setNewChildTimeLimit] = useState('60');

  const handleUnlock = () => {
    if (verifyPin(pinInput)) {
      setIsUnlocked(true);
      setParentMode(true);
      setPinInput('');
      toast({
        title: "Access Granted",
        description: "Welcome to Parental Controls",
      });
    } else {
      toast({
        title: "Incorrect PIN",
        description: "Please try again",
        variant: "destructive",
      });
      setPinInput('');
    }
  };

  const handleSetupPin = () => {
    // SECURITY: Use centralized validation
    const pinValidation = validatePIN(newPin);
    if (!pinValidation.valid) {
      toast({
        title: "Invalid PIN",
        description: pinValidation.error || "PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (newPin !== confirmPin) {
      toast({
        title: "PINs Don't Match",
        description: "Please make sure both PINs are the same",
        variant: "destructive",
      });
      return;
    }

    updateSettings({ pin: newPin, isLocked: true });
    setShowPinSetup(false);
    setNewPin('');
    setConfirmPin('');
    toast({
      title: "PIN Set Successfully",
      description: "Parental controls are now protected",
    });
  };

  const handleAddChild = () => {
    // SECURITY: Validate child name
    const nameValidation = validateChildName(newChildName);
    if (!nameValidation.valid) {
      toast({
        title: "Invalid Name",
        description: nameValidation.error || "Please provide a valid name",
        variant: "destructive",
      });
      return;
    }

    if (!newChildAge) {
      toast({
        title: "Missing Information",
        description: "Please provide child's age",
        variant: "destructive",
      });
      return;
    }

    addChild({
      name: newChildName.trim(),
      age: parseInt(newChildAge),
      avatar: '👦', // Default avatar
      dailyTimeLimit: parseInt(newChildTimeLimit),
      allowedActivities: ['write', 'shapes', 'stories', 'games', 'progress', 'stickers'],
    });

    setNewChildName('');
    setNewChildAge('');
    setNewChildTimeLimit('60');
    
    toast({
      title: "Child Profile Created",
      description: `${newChildName}'s profile has been added`,
    });
  };

  if (!isUnlocked) {
    return (
      <>
        <SEO 
          title="Parental Controls - Jubee Love"
          description="Manage your children's learning experience with time limits, content filtering, and progress tracking"
        />
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-accent/10">
          <Card className="w-full max-w-md border-4 border-primary">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Lock className="w-16 h-16 text-primary" />
              </div>
              <CardTitle className="text-3xl text-primary">Parental Controls</CardTitle>
              <CardDescription className="text-lg">
                {settings.isLocked ? 'Enter your PIN to continue' : 'Set up PIN protection'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.isLocked ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pin">Enter PIN</Label>
                    <Input
                      id="pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="text-center text-2xl tracking-widest"
                      onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    />
                  </div>
                  <Button onClick={handleUnlock} className="w-full" size="lg">
                    Unlock
                  </Button>
                </>
              ) : (
                <Button onClick={() => setShowPinSetup(true)} className="w-full" size="lg">
                  <Shield className="mr-2 h-5 w-5" />
                  Set Up PIN Protection
                </Button>
              )}
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Back to Home
              </Button>
            </CardContent>
          </Card>

          {/* PIN Setup Dialog */}
          <Dialog open={showPinSetup} onOpenChange={setShowPinSetup}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Up PIN</DialogTitle>
                <DialogDescription>
                  Create a 4-digit PIN to protect parental controls
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPin">New PIN</Label>
                  <Input
                    id="newPin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPin">Confirm PIN</Label>
                  <Input
                    id="confirmPin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPinSetup(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSetupPin}>
                  Set PIN
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Parental Controls - Jubee Love"
        description="Manage your children's learning experience with time limits, content filtering, and progress tracking"
      />
      <div className="container max-w-6xl mx-auto p-4 sm:p-8 pt-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Parental Controls</h1>
            <p className="text-muted-foreground text-lg">Manage your children's learning experience</p>
          </div>
          <Button onClick={() => { setIsUnlocked(false); setParentMode(false); }} variant="outline">
            <Lock className="mr-2 h-5 w-5" />
            Lock
          </Button>
        </div>

        <Tabs defaultValue="children" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="children" className="text-lg">
              <Users className="mr-2 h-5 w-5" />
              Children
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-lg">
              <SettingsIcon className="mr-2 h-5 w-5" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-lg">
              <Clock className="mr-2 h-5 w-5" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="children" className="space-y-6">
            {/* Add New Child */}
            <Card className="border-2 border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-6 w-6" />
                  Add Child Profile
                </CardTitle>
                <CardDescription>Create a new profile for your child</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="childName">Name</Label>
                    <Input
                      id="childName"
                      value={newChildName}
                      onChange={(e) => setNewChildName(e.target.value)}
                      placeholder="Child's name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="childAge">Age</Label>
                    <Input
                      id="childAge"
                      type="number"
                      min="2"
                      max="12"
                      value={newChildAge}
                      onChange={(e) => setNewChildAge(e.target.value)}
                      placeholder="Age"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">Daily Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      min="15"
                      max="180"
                      value={newChildTimeLimit}
                      onChange={(e) => setNewChildTimeLimit(e.target.value)}
                      placeholder="60"
                    />
                  </div>
                </div>
                <Button onClick={handleAddChild} className="w-full sm:w-auto">
                  Add Child
                </Button>
              </CardContent>
            </Card>

            {/* Children List */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {children.map((child) => (
                <Card key={child.id} className="border-2 border-accent/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{child.avatar}</span>
                        <div>
                          <CardTitle className="text-xl">{child.name}</CardTitle>
                          <CardDescription>Age {child.age}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Daily Limit:</span>
                      <span className="font-bold">{child.dailyTimeLimit} min</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Today:</span>
                      <span className="font-bold">{Math.floor(child.totalTimeToday / 60)} min</span>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit {child.name}'s Profile</DialogTitle>
                            <CardDescription>
                              Configure time limits and usage schedules
                            </CardDescription>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <Label>Daily Time Limit (minutes)</Label>
                              <Input
                                type="number"
                                min="15"
                                max="180"
                                defaultValue={child.dailyTimeLimit}
                                onChange={(e) => updateChild(child.id, { dailyTimeLimit: parseInt(e.target.value) })}
                              />
                            </div>

                            <ScheduleConfigurator
                              schedules={child.settings?.schedules || []}
                              enforceSchedule={child.settings?.enforceSchedule || false}
                              onSchedulesChange={(schedules) => 
                                updateChild(child.id, { 
                                  settings: { 
                                    ...child.settings,
                                    schedules 
                                  } 
                                })
                              }
                              onEnforceChange={(enforceSchedule) =>
                                updateChild(child.id, {
                                  settings: {
                                    ...child.settings,
                                    enforceSchedule
                                  }
                                })
                              }
                            />
                          </div>
                          <DialogFooter>
                            <Button onClick={() => toast({ title: "Profile updated!" })}>
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => {
                          deleteChild(child.id);
                          toast({ title: "Profile deleted" });
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {children.length === 0 && (
              <Card className="border-2 border-dashed">
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No children profiles yet</p>
                  <p className="text-sm text-muted-foreground">Add your first child profile above</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage PIN and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>PIN Protection</Label>
                    <p className="text-sm text-muted-foreground">
                      Require PIN to access parental controls
                    </p>
                  </div>
                  <Switch
                    checked={settings.isLocked}
                    onCheckedChange={(checked) => updateSettings({ isLocked: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require PIN for Exit</Label>
                    <p className="text-sm text-muted-foreground">
                      Prevent children from exiting the app
                    </p>
                  </div>
                  <Switch
                    checked={settings.requirePinForExit}
                    onCheckedChange={(checked) => updateSettings({ requirePinForExit: checked })}
                  />
                </div>
                <Button onClick={() => setShowPinSetup(true)} variant="outline">
                  Change PIN
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Default Time Limits</CardTitle>
                <CardDescription>Set default daily time limits for new profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Daily Limit (minutes)</Label>
                  <Input
                    type="number"
                    min="15"
                    max="180"
                    value={settings.maxDailyTime}
                    onChange={(e) => updateSettings({ maxDailyTime: parseInt(e.target.value) })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Reports</CardTitle>
                <CardDescription>Track your children's learning activity</CardDescription>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">No activity to report yet</p>
                    <p className="text-sm text-muted-foreground">Add child profiles to start tracking</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {children.map((child) => (
                      <Card key={child.id} className="border">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{child.avatar}</span>
                            <div>
                              <CardTitle className="text-lg">{child.name}</CardTitle>
                              <CardDescription>Today's Activity</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Time Used:</span>
                            <span className="font-bold text-lg">{Math.floor(child.totalTimeToday / 60)} / {child.dailyTimeLimit} min</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3">
                            <div 
                              className="bg-primary h-3 rounded-full transition-all"
                              style={{ 
                                width: `${Math.min((child.totalTimeToday / 60 / child.dailyTimeLimit) * 100, 100)}%` 
                              }}
                            />
                          </div>
                          {child.totalTimeToday / 60 >= child.dailyTimeLimit && (
                            <p className="text-sm text-destructive font-medium">
                              ⚠️ Daily limit reached
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Button onClick={() => navigate('/')} variant="outline" size="lg">
            Back to Home
          </Button>
        </div>
      </div>
    </>
  );
}
