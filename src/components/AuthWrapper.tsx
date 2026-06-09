import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { secureLogout, supabase } from '../supabaseClient';
import EncryptionService from '../services/encryptionService';
import PinEntry from './PinEntry';
import AttemptManager from '../utils/attemptManager';

interface AuthWrapperProps {
  children: React.ReactNode;
  user: User | null;
}

interface AuthState {
  isAuthenticated: boolean;
  needsPinSetup: boolean;
  needsPinEntry: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthWrapper = ({ children, user }: AuthWrapperProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    needsPinSetup: false,
    needsPinEntry: false,
    isLoading: true,
    error: null
  });

  const encryptionService = EncryptionService.getInstance();
  const attemptManager = AttemptManager.getInstance();

  const handlePinSetup = useCallback(async (pin: string, rememberDevice = true) => {
    if (!user) return;

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      await encryptionService.initializeKeyForOAuthWithPin(
        user.id,
        user.email || '',
        pin
      );

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        const encryptedProfile = await encryptionService.encryptProfileData(profileData);

        const { error: updateError } = await supabase.from('profiles').update(encryptedProfile).eq('id', user.id);

        if (updateError) throw updateError;

        encryptionService.storeCurrentKey(user.id, rememberDevice);
        setAuthState({
          isAuthenticated: true,
          needsPinSetup: false,
          needsPinEntry: false,
          isLoading: false,
          error: null
        });

      } catch (criticalError) {
        await encryptionService.revertPinSetup(user.id);
        throw criticalError;
      }

    } catch (error) {
      console.error('PIN setup failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: `PIN-Setup fehlgeschlagen: ${errorMessage}`
      }));
    }
  }, [user, encryptionService]);

  const handlePinEntry = useCallback(async (pin: string, rememberDevice = true) => {
    if (!user) return;

    const lockoutStatus = attemptManager.isLockedOut();
    if (lockoutStatus.locked) {
      const until = lockoutStatus.until?.toLocaleTimeString('de-DE') || '';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: `Zu viele Fehlversuche. Bitte versuche es nach ${until} Uhr erneut.`
      }));
      return;
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const isValidPin = await encryptionService.verifyPin(
        user.id,
        user.email || '',
        pin
      );

      if (isValidPin) {
        attemptManager.clearAttempts();
        encryptionService.storeCurrentKey(user.id, rememberDevice);
        setAuthState({
          isAuthenticated: true,
          needsPinSetup: false,
          needsPinEntry: false,
          isLoading: false,
          error: null
        });
      } else {
        attemptManager.recordFailedAttempt();
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Ungültige PIN. Bitte versuche es erneut.'
        }));
      }
    } catch (error) {
      console.error('PIN verification failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'PIN-Überprüfung fehlgeschlagen'
      }));
    }
  }, [user, encryptionService, attemptManager]);

  const handleCancel = useCallback(async () => {
    await secureLogout();
  }, []);

  useEffect(() => {
    const checkAuthenticationStatus = async (user: User) => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
  
        if (encryptionService.isInitialized()) {
          setAuthState({
            isAuthenticated: true,
            needsPinSetup: false,
            needsPinEntry: false,
            isLoading: false,
            error: null
          });
          return
        }

        if (encryptionService.restoreKeyForUser(user.id)) {
          setAuthState({
            isAuthenticated: true,
            needsPinSetup: false,
            needsPinEntry: false,
            isLoading: false,
            error: null
          });
          return;
        }

        const savedPin = sessionStorage.getItem("userPin");
        if (savedPin) {
          const isLegacyPinValid = await encryptionService.verifyPin(
            user.id,
            user.email || '',
            savedPin
          );
          sessionStorage.removeItem("userPin");

          if (isLegacyPinValid) {
            encryptionService.storeCurrentKey(user.id, true);
            setAuthState({
              isAuthenticated: true,
              needsPinSetup: false,
              needsPinEntry: false,
              isLoading: false,
              error: null
            });
            return;
          }
        }

        if (await encryptionService.isPinBasedAuthReady(user.id)) {
          setAuthState({
            isAuthenticated: false,
            needsPinSetup: false,
            needsPinEntry: true,
            isLoading: false,
            error: null
          });
          return;
        }
          setAuthState({
            isAuthenticated: false,
            needsPinSetup: true,
            needsPinEntry: false,
            isLoading: false,
            error: null
          });
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setAuthState({
          isAuthenticated: false,
          needsPinSetup: true,
          needsPinEntry: false,
          isLoading: false,
          error: 'Fehler:' + error
        });
      }
    };

    if (user) {
      checkAuthenticationStatus(user);
    } else {
      setAuthState({
        isAuthenticated: false,
        needsPinSetup: false,
        needsPinEntry: false,
        isLoading: false,
        error: null,
      });
    }
  }, [user, encryptionService, handlePinEntry]);

  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg" />
          <p className="mt-4 text-lg">Authentifizierung wird überprüft...</p>
        </div>
      </div>
    );
  }

  if (authState.needsPinSetup) {
    return (
      <PinEntry
        isOpen={true}
        onSubmit={handlePinSetup}
        onCancel={handleCancel}
        error={authState.error || undefined}
        loading={authState.isLoading}
        isFirstTime={true}
      />
    );
  }

  if (authState.needsPinEntry) {
    return (
      <PinEntry
        isOpen={true}
        onSubmit={handlePinEntry}
        onCancel={handleCancel}
        error={authState.error || undefined}
        loading={authState.isLoading}
        isFirstTime={false}
      />
    );
  }

  if (authState.isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentifizierungsfehler</h1>
        <p className="mb-4">Ein unerwarteter Fehler ist aufgetreten.</p>
        {authState.error && (
          <p className="mb-4 text-red-600">{authState.error}</p>
        )}
        <button 
          className="btn btn-primary"
          onClick={() => window.location.href = '/login'}
        >
          Zur Anmeldung
        </button>
      </div>
    </div>
  );
};

export default AuthWrapper;
