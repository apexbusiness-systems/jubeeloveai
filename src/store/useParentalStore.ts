import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { logger } from '@/lib/logger';
import { secureGetItem, secureSetItem, secureRemoveItem } from '@/lib/secureStorage';

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  createdAt: number;
  dailyTimeLimit: number;
  sessionStartTime: number | null;
  totalTimeToday: number;
  allowedActivities: string[];
  lastResetDate: string | null;
}

export interface ParentalSettings {
  isLocked: boolean;
  pin: string;
  maxDailyTime: number;
  blockedActivities: string[];
  requirePinForSettings: boolean;
}

interface ParentalState {
  children: ChildProfile[];
  activeChildId: string | null;
  settings: ParentalSettings;
  isParentMode: boolean;
  isPremium: boolean; // 💎 Premium Status
  
  addChild: (child: Omit<ChildProfile, 'id' | 'createdAt' | 'sessionStartTime' | 'totalTimeToday' | 'lastResetDate'>) => void;
  updateChild: (id: string, updates: Partial<ChildProfile>) => void;
  deleteChild: (id: string) => void;
  setActiveChild: (id: string | null) => void;
  startSession: (childId: string) => void;
  endSession: () => void;
  updateSessionTime: () => boolean;
  setParentMode: (isParent: boolean) => void;
  updateSettings: (settings: Partial<ParentalSettings>) => void;
  verifyPin: (pin: string) => boolean;
  setPremiumStatus: (status: boolean) => void;
  getChildStats: (childId: string) => { totalTime: number; activitiesCompleted: number };
}

const DEFAULT_SETTINGS: ParentalSettings = {
  isLocked: false,
  pin: '',
  maxDailyTime: 60,
  blockedActivities: [],
  requirePinForSettings: true,
};

export const useParentalStore = create<ParentalState>()(
  persist(
    immer((set, get) => ({
      children: [],
      activeChildId: null,
      settings: DEFAULT_SETTINGS,
      isParentMode: false,
      isPremium: false,

      addChild: (childData) => set((state) => {
        const newChild: ChildProfile = {
          ...childData,
          id: `child-${Date.now()}`,
          createdAt: Date.now(),
          sessionStartTime: null,
          totalTimeToday: 0,
          lastResetDate: null,
          allowedActivities: childData.allowedActivities || ['write', 'shapes', 'stories', 'games'],
        };
        state.children.push(newChild);
      }),

      updateChild: (id, updates) => set((state) => {
        const child = state.children.find((c) => c.id === id);
        if (child) Object.assign(child, updates);
      }),

      deleteChild: (id) => set((state) => {
        state.children = state.children.filter((c) => c.id !== id);
      }),

      setActiveChild: (id) => set((state) => { state.activeChildId = id; }),

      startSession: (childId) => set((state) => {
        const child = state.children.find((c) => c.id === childId);
        if (!child) return;
        child.sessionStartTime = Date.now();
        const today = new Date().toDateString();
        if (child.lastResetDate !== today) {
          child.totalTimeToday = 0;
          child.lastResetDate = today;
        }
        state.activeChildId = childId;
      }),

      endSession: () => set((state) => {
        const activeChild = state.children.find((c) => c.id === state.activeChildId);
        if (activeChild?.sessionStartTime) {
          const duration = Math.floor((Date.now() - activeChild.sessionStartTime) / 1000);
          activeChild.totalTimeToday += duration;
          activeChild.sessionStartTime = null;
        }
        state.activeChildId = null;
      }),

      updateSessionTime: () => {
        const state = get();
        const activeChild = state.children.find((c) => c.id === state.activeChildId);
        if (!activeChild?.sessionStartTime) return false;
        
        const duration = Math.floor((Date.now() - activeChild.sessionStartTime) / 1000);
        const total = activeChild.totalTimeToday + duration;
        
        if (activeChild.dailyTimeLimit > 0 && total >= activeChild.dailyTimeLimit * 60) {
          get().endSession();
          return true;
        }
        return false;
      },

      setParentMode: (val) => set((s) => { s.isParentMode = val; }),
      updateSettings: (newSettings) => set((s) => { Object.assign(s.settings, newSettings); }),
      verifyPin: (pin) => { const { settings } = get(); return !settings.isLocked || settings.pin === pin; },
      setPremiumStatus: (status) => set((s) => { s.isPremium = status; }),
      
      getChildStats: (childId) => {
        const child = get().children.find((c) => c.id === childId);
        return { totalTime: child?.totalTimeToday || 0, activitiesCompleted: 0 };
      },
    })),
    { 
      name: 'jubeelove-parental-storage',
      version: 2,
      // 🔒 SECURITY ADAPTER
      storage: {
        getItem: (name) => secureGetItem(name, null),
        setItem: (name, value) => secureSetItem(name, value),
        removeItem: (name) => secureRemoveItem(name),
      }
    }
  )
);

