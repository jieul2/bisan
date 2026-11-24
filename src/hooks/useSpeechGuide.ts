import { useState, useCallback, useRef, useEffect } from 'react';

const SPEECH_COOLDOWN_MS = 15000;

export function useSpeechGuide() {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const lastSpokenTextRef = useRef('');
  const lastSpokenTimeRef = useRef(0);

  const speak = useCallback((text: string, force = false) => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const now = Date.now();
    if (!force && text === lastSpokenTextRef.current && now - lastSpokenTimeRef.current < SPEECH_COOLDOWN_MS) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
    lastSpokenTextRef.current = text;
    lastSpokenTimeRef.current = now;
  }, [isVoiceEnabled]);

  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled(prev => {
      const next = !prev;
      if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { isVoiceEnabled, toggleVoice, speak };
}
