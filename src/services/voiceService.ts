// Voice recognition and text-to-speech utility for City Rx ERP
// Handles Web Speech API with fallback across Chrome, Safari, Android WebView, and PWA

export interface VoiceCommandMatch {
  type: 'NAVIGATE' | 'SEARCH_MEDICINE' | 'POS_ACTION' | 'QUERY_STOCK' | 'UNKNOWN';
  targetTab?: string;
  query?: string;
  action?: string;
  originalText: string;
}

export class SpeechService {
  /**
   * Check if speech synthesis (TTS) is supported in current environment
   */
  public static isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Check if speech recognition (STT) is supported in current environment
   */
  public static isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  /**
   * Get an instance of SpeechRecognition or webkitSpeechRecognition
   */
  public static createRecognizer(): any | null {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Indian English / Tamil accent friendly
    return recognition;
  }

  /**
   * Text-to-speech feedback
   */
  public static speak(text: string, lang = 'en-IN'): Promise<void> {
    return new Promise(resolve => {
      if (!this.isSpeechSupported()) {
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel(); // Stop any pending speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.05; // Slightly brisk, clear pharmacy speed
        utterance.pitch = 1.0;

        // Try to pick an Indian English or natural voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          v => v.lang.includes('en-IN') || v.lang.includes('en_IN') || v.name.includes('India')
        ) || voices.find(v => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
        resolve();
      }
    });
  }

  /**
   * Stop any ongoing speech
   */
  public static stopSpeaking(): void {
    if (this.isSpeechSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Parse natural speech transcripts into ERP actions
   */
  public static parseCommand(transcript: string): VoiceCommandMatch {
    const text = transcript.trim().toLowerCase();

    // 1. Tab Navigation commands
    if (
      text.includes('open pos') ||
      text.includes('go to pos') ||
      text.includes('billing') ||
      text.includes('counter sale') ||
      text.includes('open bill')
    ) {
      return { type: 'NAVIGATE', targetTab: 'pos', originalText: transcript };
    }

    if (
      text.includes('open purchase') ||
      text.includes('purchase entry') ||
      text.includes('inward bill') ||
      text.includes('supplier bill') ||
      text.includes('go to purchase')
    ) {
      return { type: 'NAVIGATE', targetTab: 'purchases', originalText: transcript };
    }

    if (
      text.includes('purchase report') ||
      text.includes('itc report') ||
      text.includes('purchase summary') ||
      text.includes('tax credit')
    ) {
      return { type: 'NAVIGATE', targetTab: 'purchases', originalText: transcript };
    }

    if (
      text.includes('open inventory') ||
      text.includes('check stock') ||
      text.includes('stock report') ||
      text.includes('go to stock') ||
      text.includes('stock view')
    ) {
      return { type: 'NAVIGATE', targetTab: 'inventory', originalText: transcript };
    }

    if (
      text.includes('supplier') ||
      text.includes('distributor') ||
      text.includes('sublayer') ||
      text.includes('vendors')
    ) {
      return { type: 'NAVIGATE', targetTab: 'suppliers', originalText: transcript };
    }

    if (
      text.includes('patient') ||
      text.includes('refill') ||
      text.includes('customer')
    ) {
      return { type: 'NAVIGATE', targetTab: 'patients', originalText: transcript };
    }

    if (
      text.includes('clinic') ||
      text.includes('doctor') ||
      text.includes('consultation') ||
      text.includes('appointment')
    ) {
      return { type: 'NAVIGATE', targetTab: 'clinic', originalText: transcript };
    }

    if (
      text.includes('generic') ||
      text.includes('substitute') ||
      text.includes('molecule')
    ) {
      return { type: 'NAVIGATE', targetTab: 'generics', originalText: transcript };
    }

    if (
      text.includes('reports') ||
      text.includes('analytics') ||
      text.includes('sales report') ||
      text.includes('gst report')
    ) {
      return { type: 'NAVIGATE', targetTab: 'reports', originalText: transcript };
    }

    if (text.includes('settings') || text.includes('profile') || text.includes('configuration')) {
      return { type: 'NAVIGATE', targetTab: 'settings', originalText: transcript };
    }

    // 2. POS Actions
    if (text.includes('hold bill') || text.includes('park bill')) {
      return { type: 'POS_ACTION', action: 'HOLD_BILL', originalText: transcript };
    }
    if (text.includes('clear cart') || text.includes('clear bill') || text.includes('new bill')) {
      return { type: 'POS_ACTION', action: 'CLEAR_CART', originalText: transcript };
    }
    if (text.includes('quick cash') || text.includes('cash sale')) {
      return { type: 'POS_ACTION', action: 'QUICK_CASH', originalText: transcript };
    }

    // 3. Medicine / Molecule Searches
    const searchMatch = text.match(
      /(?:search|find|check|look up|get|dispense|give me|do we have|stock of)\s+(.+)/i
    );
    if (searchMatch && searchMatch[1]) {
      const query = searchMatch[1]
        .replace(/tablet|capsule|syrup|injection|mg|ml/gi, '')
        .trim();
      return { type: 'SEARCH_MEDICINE', query, originalText: transcript };
    }

    // Default: treat entire clean query as medicine/item lookup
    return {
      type: 'SEARCH_MEDICINE',
      query: transcript.trim(),
      originalText: transcript
    };
  }
}
