import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Clock } from 'lucide-react';

interface Schedule {
  day: number;
  startTime: string;
  endTime: string;
}

interface ScheduleConfiguratorProps {
  schedules: Schedule[];
  enforceSchedule: boolean;
  onSchedulesChange: (schedules: Schedule[]) => void;
  onEnforceChange: (enforce: boolean) => void;
}

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function ScheduleConfigurator({
  schedules,
  enforceSchedule,
  onSchedulesChange,
  onEnforceChange,
}: ScheduleConfiguratorProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const handleAddSchedule = () => {
    if (!startTime || !endTime) return;

    const newSchedule: Schedule = {
      day: selectedDay,
      startTime,
      endTime,
    };

    onSchedulesChange([...schedules, newSchedule]);
  };

  const handleRemoveSchedule = (index: number) => {
    onSchedulesChange(schedules.filter((_, i) => i !== index));
  };

  const formatSchedule = (schedule: Schedule) => {
    const day = DAYS.find(d => d.value === schedule.day)?.label || '';
    return `${day}: ${schedule.startTime} - ${schedule.endTime}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Usage Schedule
            </CardTitle>
            <CardDescription>
              Set when the child can use the app
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="enforce-schedule">Enforce</Label>
            <Switch
              id="enforce-schedule"
              checked={enforceSchedule}
              onCheckedChange={onEnforceChange}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Schedule Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label htmlFor="schedule-day">Day</Label>
            <Select value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}>
              <SelectTrigger id="schedule-day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map(day => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-time">Start Time</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-time">End Time</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleAddSchedule}
              className="w-full"
              disabled={!startTime || !endTime}
              aria-label="Add new schedule"
              title={(!startTime || !endTime) ? "Please select both start and end times" : "Add schedule"}
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add
            </Button>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-2">
          <Label>Active Schedules</Label>
          {schedules.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
              No schedules set. Add a schedule to restrict usage times.
            </div>
          ) : (
            <div className="space-y-2">
              {schedules.map((schedule, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <Badge variant="secondary" className="font-normal">
                    {formatSchedule(schedule)}
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSchedule(index)}
                          aria-label="Remove schedule"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Remove schedule</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </div>
          )}
        </div>

        {enforceSchedule && schedules.length > 0 && (
          <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
            <strong>Note:</strong> When schedules are enforced, the app will only be accessible during the specified time windows.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
