import { useState, useRef, useCallback } from 'react';

export interface TorchState {
  isTorchOn: boolean;
  isPhysicalTorchSupported: boolean;
  isPhysicalTorchActive: boolean;
  errorMessage: string | null;
}

export const useTorch = () => {
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isPhysicalTorchActive, setIsPhysicalTorchActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  // 물리 손전등 켜기 시도
  const turnOn = useCallback(async () => {
    setIsTorchOn(true);
    setErrorMessage(null);

    // 1. 브라우저 보안 컨텍스트 및 미디어 장치 지원 여부 검사
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('MediaDevices API 미지원 (HTTP 비보안 환경이거나 미지원 브라우저)');
      setIsPhysicalTorchActive(false);
      return;
    }

    try {
      // 후면 카메라(environment) 스트림 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
      });

      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      // 카메라 트랙의 토치(플래시) 지원 여부 확인
      const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;

      if (capabilities && capabilities.torch) {
        await (track as any).applyConstraints({
          advanced: [{ torch: true }],
        });
        setIsPhysicalTorchActive(true);
      } else {
        console.info('기기 후면 카메라에 물리 플래시(Torch) 기능이 없습니다. 화면 손전등으로 전환합니다.');
        setIsPhysicalTorchActive(false);
      }
    } catch (err: any) {
      console.warn('물리 플래시 켜기 실패 (카메라 권한 필요 또는 비보안 환경):', err);
      setIsPhysicalTorchActive(false);
      if (err.name === 'NotAllowedError') {
        setErrorMessage('카메라 접근 권한이 필요합니다. 화면 손전등으로 대체합니다.');
      }
    }
  }, []);

  // 손전등 끄기 (물리 플래시 해제 및 카메라 해제)
  const turnOff = useCallback(() => {
    setIsTorchOn(false);
    setIsPhysicalTorchActive(false);

    if (trackRef.current) {
      try {
        (trackRef.current as any).applyConstraints({
          advanced: [{ torch: false }],
        });
      } catch (e) {
        // 무시
      }
      trackRef.current.stop();
      trackRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const toggleTorch = useCallback(() => {
    if (isTorchOn) {
      turnOff();
    } else {
      turnOn();
    }
  }, [isTorchOn, turnOn, turnOff]);

  return {
    isTorchOn,
    isPhysicalTorchActive,
    errorMessage,
    turnOn,
    turnOff,
    toggleTorch,
  };
};
