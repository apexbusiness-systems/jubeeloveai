import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { logger } from '@/lib/logger';

export interface Schedule {
  day: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

export interface ChildSettings {
  schedules?: Schedule[];
  enforceSchedule?: boolean;
}

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
  lastResetDate: string | null; // Track daily reset per child
  settings?: ChildSettings; // Schedule and other settings
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
  addChild: (child: Omit<ChildProfile, 'id' | 'createdAt' | 'sessionStartTime' | 'totalTimeToday' | 'lastResetDate'>) => void;
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
        // Guardrail: Validate child data
        if (!childData.name || typeof childData.name !== 'string') {
          logger.error('[ParentalStore] Invalid child name, cannot add child')
          return
        }
        
        if (!Number.isFinite(childData.age) || childData.age < 0 || childData.age > 18) {
          logger.error('[ParentalStore] Invalid child age, cannot add child')
          return
        }
        
        if (!Number.isFinite(childData.dailyTimeLimit) || childData.dailyTimeLimit < 0) {
          logger.warn('[ParentalStore] Invalid time limit, setting to default 60 minutes')
          childData.dailyTimeLimit = 60
        }
        
        const newChild: ChildProfile = {
          ...childData,
          id: `child-${Date.now()}`,
          createdAt: Date.now(),
          sessionStartTime: null,
          totalTimeToday: 0,
          lastResetDate: null,
          allowedActivities: childData.allowedActivities || [
            'write', 'shapes', 'stories', 'games', 'progress', 'stickers'
          ],
        };
        
        // Guardrail: Limit maximum children
        if (state.children.length >= 10) {
          logger.error('[ParentalStore] Maximum 10 children allowed')
          return
        }
        
        state.children.push(newChild);
        logger.dev(`[ParentalStore] Child added: ${newChild.name}`)
      }),

      updateChild: (id, updates) => set((state) => {
        const child = state.children.find((c) => c.id === id);
        if (!child) {
          logger.warn(`[ParentalStore] Child not found: ${id}`)
          return
        }
        
        // Guardrail: Validate updates
        if (updates.age !== undefined && (!Number.isFinite(updates.age) || updates.age < 0 || updates.age > 18)) {
          logger.error('[ParentalStore] Invalid age update, ignoring')
          delete updates.age
        }
        
        if (updates.dailyTimeLimit !== undefined && (!Number.isFinite(updates.dailyTimeLimit) || updates.dailyTimeLimit < 0)) {
          logger.error('[ParentalStore] Invalid time limit update, ignoring')
          delete updates.dailyTimeLimit
        }
        
        if (updates.totalTimeToday !== undefined && (!Number.isFinite(updates.totalTimeToday) || updates.totalTimeToday < 0)) {
          logger.error('[ParentalStore] Invalid time today update, ignoring')
          delete updates.totalTimeToday
        }
        
        Object.assign(child, updates);
        logger.dev(`[ParentalStore] Child updated: ${child.name}`)
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
        if (!child) {
          logger.error(`[ParentalStore] Cannot start session, child not found: ${childId}`)
          return
        }
        
        // Guardrail: Validate time data
        if (!Number.isFinite(child.totalTimeToday) || child.totalTimeToday < 0) {
          logger.warn('[ParentalStore] Invalid totalTimeToday, resetting to 0')
          child.totalTimeToday = 0
        }
        
        child.sessionStartTime = Date.now();
        
        // Reset daily time if it's a new day
        const today = new Date().toDateString();
        if (child.lastResetDate !== today) {
          logger.dev(`[ParentalStore] New day detected for ${child.name}, resetting daily time`)
          child.totalTimeToday = 0;
          child.lastResetDate = today;
        }
        
        state.activeChildId = childId;
        logger.dev(`[ParentalStore] Session started for ${child.name}`)
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
    { 
      name: 'jubeelove-parental-storage',
      version: 1, // Version for future migrations
      // Enhanced validation on rehydration
      onRehydrateStorage: () => (state) => {
        if (!state) return
        
        // Validate children array
        if (!Array.isArray(state.children)) {
          logger.error('[ParentalStore] Invalid children array on rehydration, resetting')
          state.children = []
        }
        
        // Validate and clean up each child profile
        state.children = state.children.filter(child => {
          if (!child.id || !child.name) {
            logger.warn('[ParentalStore] Invalid child profile found, removing')
            return false
          }
          
          // Fix invalid time values
          if (!Number.isFinite(child.totalTimeToday) || child.totalTimeToday < 0) {
            logger.warn(`[ParentalStore] Invalid time for ${child.name}, resetting to 0`)
            child.totalTimeToday = 0
          }
          
          if (!Number.isFinite(child.dailyTimeLimit) || child.dailyTimeLimit < 0) {
            logger.warn(`[ParentalStore] Invalid time limit for ${child.name}, setting to 60`)
            child.dailyTimeLimit = 60
          }
          
          // Ensure arrays exist
          if (!Array.isArray(child.allowedActivities)) {
            logger.warn(`[ParentalStore] Invalid activities for ${child.name}, setting defaults`)
            child.allowedActivities = ['write', 'shapes', 'stories', 'games', 'progress', 'stickers']
          }
          
          return true
        })
        
        // Validate settings
        if (!state.settings || typeof state.settings !== 'object') {
          logger.warn('[ParentalStore] Invalid settings on rehydration, using defaults')
          state.settings = DEFAULT_SETTINGS
        } else {
          // Ensure all required settings fields exist
          state.settings = { ...DEFAULT_SETTINGS, ...state.settings }
        }
        
        // Validate active child ID
        if (state.activeChildId && !state.children.find(c => c.id === state.activeChildId)) {
          logger.warn('[ParentalStore] Active child ID invalid, clearing')
          state.activeChildId = null
        }
        
        logger.dev('[ParentalStore] State rehydrated and validated successfully')
      }
    }
  )
);
