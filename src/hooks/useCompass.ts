import { useState, useEffect, useCallback, useRef } from 'react';

export type CompassPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export const useCompass = (enabled: boolean = true) => {
  const [heading, setHeading] = useState<number>(0);
  const [permissionState, setPermissionState] = useState<CompassPermissionState>('prompt');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isSecure, setIsSecure] = useState<boolean>(true);

  const headingRef = useRef(0);

  // 보안 컨텍스트 확인 (HTTPS 또는 localhost)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSecure(window.isSecureContext);
      if (!window.isSecureContext) {
        console.warn('비보안(HTTP) 환경에서는 모바일 센서 권한이 브라우저 보안 정책상 차단될 수 있습니다.');
      }
    }
  }, []);

  // 센서 이벤트 핸들러
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    let compassHeading: number | null = null;

    // 1. iOS Safari: webkitCompassHeading 제공 (0°가 북쪽, 시계방향 0~360°)
    if ('webkitCompassHeading' in e && typeof (e as any).webkitCompassHeading === 'number') {
      compassHeading = (e as any).webkitCompassHeading;
    }
    // 2. Android Chrome: alpha 값으로부터 방위각 계산 (0°가 북쪽)
    else if (e.alpha !== null && typeof e.alpha === 'number') {
      // 절대 방위각인 경우 (deviceorientationabsolute 또는 e.absolute === true)
      compassHeading = (360 - e.alpha) % 360;
    }

    if (compassHeading !== null && !isNaN(compassHeading)) {
      headingRef.current = compassHeading;
      setHeading(compassHeading);
      setPermissionState('granted');
    }
  }, []);

  // iOS 13+ 권한 요청 함수 (사용자 직접 터치 이벤트 내에서 호출 필수)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    // iOS 13+ DeviceOrientationEvent.requestPermission
    if (
      typeof (DeviceOrientationEvent as any) !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionState('granted');
          window.addEventListener('deviceorientation', handleOrientation, true);
          return true;
        } else {
          setPermissionState('denied');
          console.warn('iOS 나침반 센서 권한 거부됨');
          return false;
        }
      } catch (err) {
        console.warn('iOS 나침반 센서 권한 요청 오류:', err);
        setPermissionState('denied');
        return false;
      }
    } else {
      // Android 및 기타 브라우저 (명시적 requestPermission 함수 없음, 바로 이벤트 리스너 등록)
      setPermissionState('granted');
      return true;
    }
  }, [handleOrientation]);

  // 이벤트 리스너 등록
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    if (!('DeviceOrientationEvent' in window)) {
      setIsSupported(false);
      setPermissionState('unsupported');
      return;
    }

    // iOS 13+ 인지 확인 (requestPermission 함수 존재 여부)
    const isIOS13Plus =
      typeof (DeviceOrientationEvent as any) !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function';

    if (!isIOS13Plus) {
      // Android / 일반 브라우저: 즉시 리스너 등록
      // Android Chrome은 deviceorientationabsolute를 우선 지원
      window.addEventListener('deviceorientationabsolute' as any, handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      // iOS: requestPermission 호출 전에는 이벤트가 트리거되지 않으므로 대기
      setPermissionState(prev => (prev === 'granted' ? 'granted' : 'prompt'));
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute' as any, handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [enabled, handleOrientation]);

  return {
    heading,
    permissionState,
    isSupported,
    isSecure,
    requestPermission,
  };
};
