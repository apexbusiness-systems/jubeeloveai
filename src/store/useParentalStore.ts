import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  createdAt: number;
  dailyTimeLimit: number; // in minutes
  sessionStartTime: number | null;
  totalTimeToday: number; // in seconds
  allowedActivities: string[];
}

export interface ParentalSettings {
  isLocked: boolean;
  pin: string; // 4-digit PIN
  maxDailyTime: number; // in minutes
  blockedActivities: string[];
  requirePinForSettings: boolean;
  requirePinForExit: boolean;
}

interface ParentalState {
  children: ChildProfile[];
  activeChildId: string | null;
  settings: ParentalSettings;
  isParentMode: boolean;
  
  // Child management
  addChild: (child: Omit<ChildProfile, 'id' | 'createdAt' | 'sessionStartTime' | 'totalTimeToday'>) => void;
  updateChild: (id: string, updates: Partial<ChildProfile>) => void;
  deleteChild: (id: string) => void;
  setActiveChild: (id: string | null) => void;
  
  // Session management
  startSession: (childId: string) => void;
  endSession: () => void;
  updateSessionTime: () => boolean;
  
  // Parent controls
  setParentMode: (isParent: boolean) => void;
  updateSettings: (settings: Partial<ParentalSettings>) => void;
  verifyPin: (pin: string) => boolean;
  
  // Activity tracking
  logActivity: (childId: string, activityId: string, duration: number) => void;
  getChildStats: (childId: string) => {
    totalTime: number;
    activitiesCompleted: number;
    averageSessionTime: number;
  };
}

const DEFAULT_SETTINGS: ParentalSettings = {
  isLocked: false,
  pin: '',
  maxDailyTime: 60, // 60 minutes default
  blockedActivities: [],
  requirePinForSettings: true,
  requirePinForExit: false,
};

export const useParentalStore = create<ParentalState>()(
  persist(
    immer((set, get) => ({
      children: [],
      activeChildId: null,
      settings: DEFAULT_SETTINGS,
      isParentMode: false,

      addChild: (childData) => set((state) => {
        const newChild: ChildProfile = {
          ...childData,
          id: `child-${Date.now()}`,
          createdAt: Date.now(),
          sessionStartTime: null,
          totalTimeToday: 0,
          allowedActivities: childData.allowedActivities || [
            'write', 'shapes', 'stories', 'games', 'progress', 'stickers'
          ],
        };
        state.children.push(newChild);
      }),

      updateChild: (id, updates) => set((state) => {
        const child = state.children.find((c) => c.id === id);
        if (child) {
          Object.assign(child, updates);
        }
      }),

      deleteChild: (id) => set((state) => {
        state.children = state.children.filter((c) => c.id !== id);
        if (state.activeChildId === id) {
          state.activeChildId = null;
        }
      }),

      setActiveChild: (id) => set((state) => {
        state.activeChildId = id;
      }),

      startSession: (childId) => set((state) => {
        const child = state.children.find((c) => c.id === childId);
        if (child) {
          child.sessionStartTime = Date.now();
          // Reset daily time if it's a new day
          const lastReset = localStorage.getItem(`lastReset-${childId}`);
          const today = new Date().toDateString();
          if (lastReset !== today) {
            child.totalTimeToday = 0;
            localStorage.setItem(`lastReset-${childId}`, today);
          }
        }
        state.activeChildId = childId;
      }),

      endSession: () => set((state) => {
        const activeChild = state.children.find((c) => c.id === state.activeChildId);
        if (activeChild && activeChild.sessionStartTime) {
          const sessionDuration = Math.floor((Date.now() - activeChild.sessionStartTime) / 1000);
          activeChild.totalTimeToday += sessionDuration;
          activeChild.sessionStartTime = null;
        }
        state.activeChildId = null;
      }),

      updateSessionTime: () => {
        const state = get();
        const activeChild = state.children.find((c) => c.id === state.activeChildId);
        if (!activeChild || !activeChild.sessionStartTime) {
          return false;
        }
        
        const sessionDuration = Math.floor((Date.now() - activeChild.sessionStartTime) / 1000);
        const totalTime = activeChild.totalTimeToday + sessionDuration;
        
        // Check if time limit exceeded
        if (activeChild.dailyTimeLimit > 0 && totalTime >= activeChild.dailyTimeLimit * 60) {
          get().endSession();
          return true; // Time limit exceeded
        }
        return false;
      },

      setParentMode: (isParent) => set((state) => {
        state.isParentMode = isParent;
      }),

      updateSettings: (newSettings) => set((state) => {
        Object.assign(state.settings, newSettings);
      }),

      verifyPin: (pin) => {
        const { settings } = get();
        return !settings.isLocked || settings.pin === pin;
      },

      logActivity: (childId, activityId, duration) => {
        // This can be extended to track detailed activity logs
        console.log(`Activity logged: ${childId} - ${activityId} - ${duration}s`);
      },

      getChildStats: (childId) => {
        const child = get().children.find((c) => c.id === childId);
        if (!child) {
          return { totalTime: 0, activitiesCompleted: 0, averageSessionTime: 0 };
        }
        
        // This is a simplified version - can be extended with more detailed tracking
        return {
          totalTime: child.totalTimeToday,
          activitiesCompleted: 0, // Would need activity tracking
          averageSessionTime: child.totalTimeToday, // Would need session history
        };
      },
    })),
    { name: 'jubeelove-parental-storage' }
  )
);
