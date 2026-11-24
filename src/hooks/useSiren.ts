import { useState, useCallback, useRef, useEffect } from 'react';

export function useSiren() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  const toggleSiren = useCallback(() => {
    if (isPlaying) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
        oscRef.current = null;
      }
      setIsPlaying(false);
    } else {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.25;

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.start();
      oscRef.current = osc;

      let high = false;
      intervalRef.current = window.setInterval(() => {
        if (oscRef.current) {
          high = !high;
          oscRef.current.frequency.value = high ? 1000 : 650;
        }
      }, 350);

      setIsPlaying(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
      }
    };
  }, []);

  return { isSirenPlaying: isPlaying, toggleSiren };
}
