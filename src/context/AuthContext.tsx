import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isMockMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_ADMIN_KEY = '@fee_manager_admin_session_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMockMode, setIsMockMode] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (isSupabaseConfigured) {
      // 1. Check existing Supabase session
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsMockMode(false);
        setLoading(false);
      });

      // 2. Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Mock mode fallback when credentials are not yet entered
      AsyncStorage.getItem(LOCAL_ADMIN_KEY).then((data) => {
        if (data) {
          try {
            const parsed = JSON.parse(data);
            setUser(parsed);
          } catch {
            setUser(null);
          }
        }
        setIsMockMode(true);
        setLoading(false);
      });
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      setSession(data.session);
      setUser(data.user);
      return { error: null };
    } else {
      // Mock Admin Login
      if (email.toLowerCase() === 'admin@feemanager.com' && password.length >= 6) {
        const mockUser = {
          id: 'mock-admin-uuid',
          email,
          role: 'authenticated',
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: { full_name: 'Super Admin' },
          created_at: new Date().toISOString(),
        } as unknown as User;

        setUser(mockUser);
        await AsyncStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(mockUser));
        return { error: null };
      } else {
        return { error: 'Invalid credentials. Use admin@feemanager.com with password length >= 6' };
      }
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    await AsyncStorage.removeItem(LOCAL_ADMIN_KEY);
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAuthenticated: Boolean(user),
        loading,
        isMockMode,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
