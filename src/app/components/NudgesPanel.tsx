import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, ChevronRight, Bell, BellOff } from 'lucide-react';
import {
  getUserNudges,
  dismissNudge,
  interactWithNudge,
  refreshNudges,
  getReminderSchedule,
  updateReminderSchedule,
  type Nudge,
} from '../utils/nudgeSystem';

interface Props {
  userId: string;
  onNavigate: (route: string) => void;
}

export function NudgesPanel({ userId, onNavigate }: Props) {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [showNudges, setShowNudges] = useState(true);

  useEffect(() => {
    loadNudges();
    const schedule = getReminderSchedule(userId);
    setRemindersEnabled(schedule.enabled);

    // Refresh nudges every 5 minutes
    const interval = setInterval(loadNudges, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadNudges = () => {
    refreshNudges(userId);
    const userNudges = getUserNudges(userId, false);
    setNudges(userNudges);
  };

  const handleDismiss = (nudgeId: string) => {
    dismissNudge(nudgeId);
    loadNudges();
  };

  const handleAction = (nudge: Nudge) => {
    interactWithNudge(nudge.id);
    if (nudge.action) {
      onNavigate(nudge.action.route);
    }
    loadNudges();
  };

  const handleToggleReminders = () => {
    const newEnabled = !remindersEnabled;
    updateReminderSchedule(userId, { enabled: newEnabled });
    setRemindersEnabled(newEnabled);
  };

  if (!showNudges || nudges.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-white"
          onClick={() => setShowNudges(true)}
        >
          <Bell className="h-5 w-5" />
          {nudges.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {nudges.length}
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] overflow-y-auto space-y-2">
      {/* Header */}
      <Card className="bg-white shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Smart Nudges</span>
              <Badge variant="secondary" className="text-xs">
                {nudges.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleToggleReminders}
                title={remindersEnabled ? 'Disable reminders' : 'Enable reminders'}
              >
                {remindersEnabled ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4 text-gray-400" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowNudges(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nudges */}
      {nudges.map((nudge) => (
        <Card
          key={nudge.id}
          className="bg-white shadow-lg border-l-4 hover:shadow-xl transition"
          style={{
            borderLeftColor: nudge.color || '#5B7DB1',
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              {nudge.icon && (
                <div
                  className="text-2xl flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: `${nudge.color}20` || '#5B7DB120',
                  }}
                >
                  {nudge.icon}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{nudge.title}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => handleDismiss(nudge.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <p className="text-sm text-gray-600 mb-3">{nudge.message}</p>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      nudge.priority === 'high'
                        ? 'destructive'
                        : nudge.priority === 'medium'
                        ? 'default'
                        : 'secondary'
                    }
                    className="text-xs"
                  >
                    {nudge.priority}
                  </Badge>

                  {nudge.action && (
                    <Button
                      size="sm"
                      className="ml-auto"
                      onClick={() => handleAction(nudge)}
                    >
                      {nudge.action.label}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Settings Footer */}
      {nudges.length > 3 && (
        <Card className="bg-white shadow-lg">
          <CardContent className="p-3 text-center">
            <button
              className="text-xs text-muted-foreground hover:text-primary transition"
              onClick={() => setShowNudges(false)}
            >
              Minimize nudges
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
