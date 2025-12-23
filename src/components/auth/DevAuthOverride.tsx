import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParentalStore } from '@/store/useParentalStore';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';

const DEV_EMAILS = ['unseen_g4@yahoo.com'];

export function DevAuthOverride() {
  const { user } = useAuth();
  const { setPremiumStatus, isPremium } = useParentalStore();

  useEffect(() => {
    if (user?.email && DEV_EMAILS.includes(user.email)) {
      if (!isPremium) {
        console.log(`[DevAuth] 🔓 Authorizing Developer: ${user.email}`);
        
        // 1. Force Unlock Premium
        setPremiumStatus(true);
        
        // 2. Notify User
        toast.success("Developer Mode Active", {
          description: "Full Access Authorized 🔓",
          icon: <ShieldCheck className="w-5 h-5 text-green-500" />,
          duration: 4000,
        });
      }
    }
  }, [user, isPremium, setPremiumStatus]);

  return null; // This component is invisible
}

