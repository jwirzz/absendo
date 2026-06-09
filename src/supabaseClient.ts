import { createClient, User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import EncryptionService from './services/encryptionService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
function stripSensitiveAuthHashFromUrl(): void {
  if (typeof window === "undefined") return;

  const hash = window.location.hash || "";
  const containsSensitiveAuthData = /(access_token|refresh_token|token_type|expires_in|type=)/i.test(hash);
  if (!containsSensitiveAuthData) return;

  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(window.history.state, document.title, cleanUrl);
}

export const secureLogout = async (): Promise<void> => {
  try {
    const encryptionService = EncryptionService.getInstance();
    await encryptionService.clearKey();

    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error during secure logout:', error);
    await supabase.auth.signOut();
  }
};

export function useIsUserLoggedIn() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (supabaseUrl === 'https://placeholder.supabase.co') {
            setUser(null);
            return;
        }

        const checkUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);
            } catch (error) {
                console.warn('Supabase auth check failed:', error);
                setUser(null);
            }
        };

        checkUser();

        void supabase.auth.getSession().finally(() => {
            stripSensitiveAuthHashFromUrl();
        });

        const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
            const newUser = session?.user || null;
            setUser(newUser);

            if (event === 'SIGNED_OUT') {
                const encryptionService = EncryptionService.getInstance();
                await encryptionService.clearKey();
            } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "PASSWORD_RECOVERY") {
                stripSensitiveAuthHashFromUrl();
            }
        });

        return () => {
            subscription.subscription.unsubscribe();
        };
    }, []);

    return user;
}