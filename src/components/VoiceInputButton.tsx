import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, X, Volume2 } from 'lucide-react';
import { useSpeechRecognition, speakNotification } from '../hooks/useSpeechRecognition';

export interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  title?: string;
  placeholder?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'badge' | 'button';
  buttonText?: string;
  className?: string;
  lang?: string;
  disabled?: boolean;
  speakConfirmation?: boolean;
  confirmationPrefix?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  title = 'Click to speak (Voice Input)',
  placeholder = 'Listening... Speak clearly into microphone',
  size = 'sm',
  variant = 'icon',
  buttonText = 'Voice',
  className = '',
  lang = 'en-IN',
  disabled = false,
  speakConfirmation = false,
  confirmationPrefix = 'Recognized'
}) => {
  const [showStatusPopover, setShowStatusPopover] = useState(false);

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening
  } = useSpeechRecognition({
    lang,
    onResult: (finalText) => {
      if (finalText && finalText.trim()) {
        onTranscript(finalText.trim());
        if (speakConfirmation) {
          speakNotification(`${confirmationPrefix} ${finalText}`);
        }
      }
    }
  });

  // Keep popover open while listening or if there's an error
  useEffect(() => {
    if (isListening) {
      setShowStatusPopover(true);
    } else {
      const timer = setTimeout(() => {
        setShowStatusPopover(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isListening]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    if (!isSupported) {
      alert(
        'Speech Recognition is not supported by your browser. Please use Google Chrome, Microsoft Edge, or a modern Chromium browser.'
      );
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
      setShowStatusPopover(true);
    }
  };

  // Size styling map
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs p-1',
    sm: 'w-7 h-7 text-xs p-1.5',
    md: 'w-8 h-8 text-sm p-2',
    lg: 'w-10 h-10 text-base p-2.5'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="relative inline-flex items-center">
      {variant === 'icon' && (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={`rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0 ${
            isListening
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse ring-2 ring-rose-300 ring-offset-1'
              : 'text-slate-400 hover:text-teal-700 hover:bg-teal-50 bg-transparent'
          } ${sizeClasses[size]} ${className}`}
          title={isListening ? 'Click to stop listening' : title}
          aria-label={title}
        >
          {isListening ? (
            <Mic className={`${iconSizes[size]} text-white animate-bounce`} />
          ) : (
            <Mic className={iconSizes[size]} />
          )}
        </button>
      )}

      {variant === 'badge' && (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
            isListening
              ? 'bg-rose-500 text-white border-rose-600 shadow-xs ring-2 ring-rose-300 ring-offset-1 animate-pulse'
              : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
          } ${className}`}
          title={isListening ? 'Click to stop listening' : title}
        >
          {isListening ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <Mic className="w-3.5 h-3.5 text-white" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-teal-600" />
              <span>{buttonText}</span>
            </>
          )}
        </button>
      )}

      {variant === 'button' && (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-2xs border ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 ring-2 ring-rose-300'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
          } ${className}`}
          title={isListening ? 'Click to stop listening' : title}
        >
          {isListening ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <Mic className="w-4 h-4 text-white animate-bounce" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-teal-600" />
              <span>{buttonText}</span>
            </>
          )}
        </button>
      )}

      {/* Floating Listening State Popover / Waveform Pill */}
      {showStatusPopover && (
        <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-xs py-1.5 px-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 pointer-events-auto">
          {isListening ? (
            <>
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-1 h-3 bg-rose-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                <span className="w-1 h-2 bg-rose-300 rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.1s]" />
                <span className="w-1 h-3.5 bg-rose-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.2s]" />
                <span className="w-1 h-1.5 bg-rose-300 rounded-full animate-[pulse_0.3s_ease-in-out_infinite_0.15s]" />
              </div>
              <span className="font-medium text-slate-200">
                {interimTranscript || transcript ? (
                  <span className="text-teal-300 font-bold">"{interimTranscript || transcript}"</span>
                ) : (
                  placeholder
                )}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stopListening();
                }}
                className="ml-1 p-0.5 text-slate-400 hover:text-white rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : error ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-rose-200 text-[11px]">{error}</span>
            </>
          ) : transcript ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="text-emerald-300 font-semibold">"{transcript}"</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
