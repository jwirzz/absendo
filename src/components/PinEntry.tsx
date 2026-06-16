import { useState, useRef, useEffect } from 'react';
import E2EEModal from "./E2EEModal.tsx";

interface PinEntryProps {
  isOpen: boolean;
  onSubmit: (pin: string, rememberDevice: boolean) => void;
  onCancel: () => void;
  error?: string;
  loading?: boolean;
  isFirstTime?: boolean;
}

const PinEntry = ({ 
  isOpen, 
  onSubmit, 
  onCancel, 
  error, 
  loading = false,
  isFirstTime = false 
}: PinEntryProps) => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
  const [isConfirming, setIsConfirming] = useState(false);
  const [localError, setLocalError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isE2EEModalOpen, setIsE2EEModalOpen] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '', '', '']);
      setConfirmPin(['', '', '', '', '', '']);
      setIsConfirming(false);
      setLocalError('');
      setRememberDevice(true);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isFirstTime && !isConfirming) {
      setIsE2EEModalOpen(true);
    } else {
      setIsE2EEModalOpen(false);
    }
  }, [isFirstTime, isConfirming]);

  useEffect(() => {
    if (localError) {
      setLocalError('');
    }
  }, [pin, confirmPin, localError]);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    if (value.length > 1) return;

    const currentArray = isConfirming ? confirmPin : pin;
    const setCurrentArray = isConfirming ? setConfirmPin : setPin;
    
    const newArray = [...currentArray];
    newArray[index] = value;
    setCurrentArray(newArray);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    const currentArray = isConfirming ? confirmPin : pin;
    
    if (e.key === 'Backspace' && !currentArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length >= 4) {
      const newArray = digits.split('').concat(['', '', '', '', '', '']).slice(0, 6);
      if (isConfirming) {
        setConfirmPin(newArray);
      } else {
        setPin(newArray);
      }

      const lastIndex = Math.min(digits.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const validatePin = (pinArray: string[]): boolean => {
    const pinString = pinArray.join('');
    return pinString.length >= 4 && pinString.length <= 6;
  };

  const handleSubmit = () => {
    if (loading) return;

    const currentPin = pin.join('');
    
    if (!validatePin(pin)) {
      setLocalError('PIN muss 4-6 Ziffern haben');
      return;
    }

    if (isFirstTime && !isConfirming) {
      setIsConfirming(true);
      setConfirmPin(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return;
    }

    if (isFirstTime && isConfirming) {
      setIsE2EEModalOpen(false);
      const confirmPinString = confirmPin.join('');
      if (currentPin !== confirmPinString) {
        setLocalError('PINs stimmen nicht überein');
        setIsConfirming(false);
        setPin(['', '', '', '', '', '']);
        setConfirmPin(['', '', '', '', '', '']);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
        return;
      }
    }

    onSubmit(currentPin, rememberDevice);
  };

  const handleBack = () => {
    setIsConfirming(false);
    setConfirmPin(['', '', '', '', '', '']);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  const currentArray = isConfirming ? confirmPin : pin;
  const displayError = error || localError;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <E2EEModal
          isOpen={isE2EEModalOpen}
          onClose={() => setIsE2EEModalOpen(false)}
      />
      <div className="card w-full max-w-md bg-base-100 p-8 shadow-soft-xl" style={{ animation: "heroIn 0.3s var(--ease-out) both" }}>
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="icon-tile mb-4 h-12 w-12" style={{ background: "color-mix(in oklab, var(--color-primary) 14%, white)", color: "var(--color-primary)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-6 w-6">
              <rect x="4" y="10" width="16" height="11" rx="2.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 1 1 8 0v3" />
              <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <h2 className="display-md text-2xl">
            {isFirstTime
              ? (isConfirming ? 'PIN bestätigen' : 'Sicherheits-PIN festlegen')
              : 'PIN eingeben'}
          </h2>
          <p className="measure mt-2 text-sm text-base-content/60">
            {isFirstTime
              ? (isConfirming
                ? 'Bitte gib deine PIN erneut ein.'
                : 'Erstelle eine PIN mit 4 bis 6 Ziffern für die lokale Verschlüsselung.')
              : 'Gib deine PIN ein, um fortzufahren.'}
          </p>
        </div>

        <div className={["mb-5 flex justify-center gap-2 sm:gap-2.5", displayError ? "shake" : ""].join(" ")}>
          {currentArray.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={[
                "h-14 w-11 rounded-xl border-2 bg-base-100 text-center text-2xl font-bold tabular-nums outline-none transition-[border-color,box-shadow,transform] duration-150 focus:border-primary focus:ring-4 focus:ring-primary/15 sm:w-12",
                displayError ? "border-error" : digit ? "border-secondary" : "border-base-300",
              ].join(" ")}
              disabled={loading}
              autoComplete="off"
              data-form-type="other"
            />
          ))}
        </div>

        {displayError && (
          <div className="mb-4 text-center text-sm font-medium text-error">{displayError}</div>
        )}

        {!isFirstTime && (
          <label className="mb-5 flex cursor-pointer items-center justify-center gap-2.5 text-sm text-base-content/70">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="toggle toggle-primary toggle-sm"
              disabled={loading}
            />
            Auf diesem Gerät angemeldet bleiben
          </label>
        )}

        {isFirstTime && !isConfirming && (
          <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-warning/15 px-4 py-3 text-sm text-base-content/80">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
            <span><strong>Gut merken:</strong> Ohne deine PIN kommst du nicht mehr an deine Daten. Sie lässt sich nicht zurücksetzen.</span>
          </div>
        )}

        <div className="flex gap-2.5">
          {isFirstTime && isConfirming && (
            <button type="button" onClick={handleBack} className="btn btn-ghost flex-1" disabled={loading}>
              Zurück
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !validatePin(currentArray)}
            className="btn btn-primary flex-1"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                {isFirstTime ? 'Schlüssel wird erstellt…' : 'Wird geprüft…'}
              </>
            ) : (
              isFirstTime && !isConfirming ? 'Weiter' : 'Bestätigen'
            )}
          </button>

          {!isFirstTime && (
            <button type="button" onClick={onCancel} className="btn btn-ghost" disabled={loading}>
              Abbrechen
            </button>
          )}
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-base-content/45">
          Deine PIN wird nie gespeichert oder übertragen. Sie verschlüsselt deine Daten nur lokal.
        </p>
      </div>
    </div>
  );
};

export default PinEntry;
