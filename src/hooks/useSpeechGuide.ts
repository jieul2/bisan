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

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.86; // 고령자 및 위기 시 명확한 인지를 위해 또박또박한 속도
      utterance.pitch = 1.0;
      utterance.volume = 1.0; // 최대 음량 설정 (1.0)

      window.speechSynthesis.speak(utterance);
      lastSpokenTextRef.current = text;
      lastSpokenTimeRef.current = now;
    } catch (e) {
      console.warn('TTS 음성 안내 재생 실패:', e);
    }
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
