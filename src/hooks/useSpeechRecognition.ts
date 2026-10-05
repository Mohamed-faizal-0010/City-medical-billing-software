import { useState, useEffect, useRef, useCallback } from 'react';

// Common pharma spoken substitutions & number cleaner
export const cleanPharmaVoiceInput = (rawText: string): string => {
  if (!rawText) return '';
  let cleaned = rawText.trim();

  // Normalize common spoken numbers in dosage
  cleaned = cleaned
    .replace(/\bsix hundred and fifty\b/gi, '650')
    .replace(/\bsix fifty\b/gi, '650')
    .replace(/\bfive hundred\b/gi, '500')
    .replace(/\btwo hundred and fifty\b/gi, '250')
    .replace(/\btwo fifty\b/gi, '250')
    .replace(/\bone hundred\b/gi, '100')
    .replace(/\bsixty\b/gi, '60')
    .replace(/\bfifty\b/gi, '50')
    .replace(/\bforty\b/gi, '40')
    .replace(/\btwenty\b/gi, '20')
    .replace(/\bten\b/gi, '10')
    .replace(/\bfive\b/gi, '5');

  // Common phonetic mishearings for Indian pharmacy brands
  cleaned = cleaned
    .replace(/\bdollo\b/gi, 'Dolo')
    .replace(/\bdolo\b/gi, 'Dolo')
    .replace(/\bcrocine\b/gi, 'Crocin')
    .replace(/\bcalpol\b/gi, 'Calpol')
    .replace(/\bparasitamol\b/gi, 'Paracetamol')
    .replace(/\bparacitamol\b/gi, 'Paracetamol')
    .replace(/\baugumentin\b/gi, 'Augmentin')
    .replace(/\bazithral\b/gi, 'Azithral')
    .replace(/\bazithromicin\b/gi, 'Azithromycin')
    .replace(/\bpantose\b/gi, 'Pentose')
    .replace(/\brabalkem\b/gi, 'Rabalkem')
    .replace(/\brabekem\b/gi, 'Rabalkem')
    .replace(/\bpan 40\b/gi, 'Pan 40')
    .replace(/\btelma\b/gi, 'Telma')
    .replace(/\bmetformin\b/gi, 'Metformin')
    .replace(/\bglycomet\b/gi, 'Glycomet')
    .replace(/\bcetrizine\b/gi, 'Cetirizine')
    .replace(/\bzerodol\b/gi, 'Zerodol')
    .replace(/\bcombiflam\b/gi, 'Combiflam');

  return cleaned;
};

// Text-to-Speech Helper
export const speakNotification = (text: string, lang = 'en-IN') => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
};

export interface UseSpeechRecognitionOptions {
  lang?: string; // 'en-IN', 'en-US', 'ta-IN'
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (finalTranscript: string) => void;
  onError?: (error: string) => void;
  autoStopTimeout?: number; // Auto stop listening after X ms of silence
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const {
    lang = 'en-IN',
    continuous = false,
    interimResults = true,
    onResult,
    onError,
    autoStopTimeout = 4000
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript;
          } else {
            interimStr += res[0].transcript;
          }
        }

        const cleanedInterim = cleanPharmaVoiceInput(interimStr);
        setInterimTranscript(cleanedInterim);

        if (finalStr) {
          const cleanedFinal = cleanPharmaVoiceInput(finalStr);
          setTranscript(cleanedFinal);
          if (onResult) {
            onResult(cleanedFinal);
          }
        }

        // Reset silence timer on speech activity
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        if (autoStopTimeout > 0) {
          silenceTimerRef.current = setTimeout(() => {
            stopListening();
          }, autoStopTimeout);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'no-speech') {
          setError('No voice detected. Please try speaking again.');
        } else if (event.error === 'audio-capture') {
          setError('Microphone not found or audio capture failed.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access in your browser.');
        } else {
          setError(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
        if (onError) onError(event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition initialization error:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [lang, continuous, interimResults]);

  const startListening = useCallback(
    (customLang?: string) => {
      if (!recognitionRef.current) {
        setError('Voice recognition is not supported in this browser.');
        return;
      }

      try {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
        if (customLang) {
          recognitionRef.current.lang = customLang;
        }
        recognitionRef.current.start();
        setIsListening(true);

        if (autoStopTimeout > 0) {
          silenceTimerRef.current = setTimeout(() => {
            stopListening();
          }, autoStopTimeout + 3000); // initial start timeout
        }
      } catch (err: any) {
        // If already started, restart
        if (err.name === 'InvalidStateError') {
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              recognitionRef.current.start();
              setIsListening(true);
            }, 100);
          } catch {
            // ignore
          }
        } else {
          setError('Unable to start voice input. Please check microphone permissions.');
        }
      }
    },
    [autoStopTimeout]
  );

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
};
