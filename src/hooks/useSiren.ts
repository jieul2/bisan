import { useState, useCallback, useRef, useEffect } from 'react';

export function useSiren() {
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);

  // 사이렌 중지
  const stopSiren = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (stopTimeoutRef.current) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch (e) {
        // 이미 중지된 경우 무시
      }
      oscRef.current = null;
    }
    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }
    setIsSirenPlaying(false);
  }, []);

  // 최대 음량 긴급재난경보 사이렌 재생 (톱니파 주파수 스위프 800Hz ~ 1250Hz)
  const startSiren = useCallback((volume = 1.0, autoStopSeconds?: number) => {
    stopSiren();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // 요청받은 최대 볼륨 적용 (1.0 = 최대치)
      gain.gain.setValueAtTime(Math.min(1.0, Math.max(0.1, volume)), ctx.currentTime);

      // 국가재난경보 사이렌 효과: 톱니파(sawtooth)로 날카롭고 명확한 경보음 생성
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;

      // 주파수 상승/하강 스위프 (850Hz ~ 1250Hz 교차)
      let freq = 850;
      let direction = 1;
      intervalRef.current = window.setInterval(() => {
        if (oscRef.current && audioCtxRef.current) {
          freq += direction * 50;
          if (freq >= 1250) direction = -1;
          if (freq <= 850) direction = 1;
          oscRef.current.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
        }
      }, 50);

      setIsSirenPlaying(true);

      // 자동 종료 타이머 (설정된 경우)
      if (autoStopSeconds && autoStopSeconds > 0) {
        stopTimeoutRef.current = window.setTimeout(() => {
          stopSiren();
        }, autoStopSeconds * 1000);
      }
    } catch (err) {
      console.warn('재난 사이렌 오디오 실행 실패 (사용자 상호작용 필요):', err);
    }
  }, [stopSiren]);

  // 토글 함수
  const toggleSiren = useCallback(() => {
    if (isSirenPlaying) {
      stopSiren();
    } else {
      startSiren(0.9);
    }
  }, [isSirenPlaying, startSiren, stopSiren]);

  useEffect(() => {
    return () => {
      stopSiren();
    };
  }, [stopSiren]);

  return {
    isSirenPlaying,
    startSiren,
    stopSiren,
    toggleSiren,
  };
}
