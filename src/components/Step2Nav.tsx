import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall,
  Flame,
  Lightbulb,
  Compass,
  AlertOctagon,
  CheckCircle2,
  Sliders,
  Volume2,
  ArrowLeft,
  Radio,
  X,
  AlertCircle
} from 'lucide-react';
import { useKakaoMap } from '@/hooks/useKakaoMap';
import { useCompass } from '@/hooks/useCompass';
import type { Waypoint, Shelter } from '@/types';

interface Step2NavProps {
  route: Waypoint[];
  polyline?: { lat: number; lng: number }[];
  shelter: Shelter;
  onEmergencySOS: () => void;
  onOpenFlashlight: () => void;
  onSirenToggle: () => void;
  isSirenPlaying: boolean;
  onSpeak: (text: string, force?: boolean) => void;
  isSimulation: boolean;
  onToggleSimulation: () => void;
  onReturnToNormal: () => void;
}

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

function getDistance(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) {
  const dLat = rad(p2.lat - p1.lat);
  const dLng = rad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function getBearing(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) {
  const y = Math.sin(rad(p2.lng - p1.lng)) * Math.cos(rad(p2.lat));
  const x =
    Math.cos(rad(p1.lat)) * Math.sin(rad(p2.lat)) -
    Math.sin(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.cos(rad(p2.lng - p1.lng));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

function normalizeDiff(diff: number) {
  return ((diff + 540) % 360) - 180;
}

export const Step2Nav: React.FC<Step2NavProps> = ({
  route,
  polyline,
  shelter,
  onEmergencySOS,
  onOpenFlashlight,
  onSirenToggle,
  isSirenPlaying,
  onSpeak,
  isSimulation,
  onReturnToNormal,
}) => {
  const safeRoute = route.length > 0 ? route : [
    { lat: 37.1315, lng: 128.23, name: '현재 위치' },
    { lat: shelter.lat, lng: shelter.lng, name: shelter.name }
  ];

  const [currentWpIdx, setCurrentWpIdx] = useState(1);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number; name?: string }>({ ...safeRoute[0] });
  const [heading, setHeading] = useState(0);
  const [smoothedDiff, setSmoothedDiff] = useState(0);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [isArrived, setIsArrived] = useState(false);
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [isStrobeActive, setIsStrobeActive] = useState(false);
  const [strobeColor, setStrobeColor] = useState<'red' | 'white'>('red');

  // 모바일 나침반 훅 연동 (iOS 및 Android 절대방위각 자동 감지)
  const {
    heading: sensorHeading,
    permissionState,
    isSecure,
    requestPermission: requestCompassPermission,
  } = useCompass(!isSimulation);

  // 센서 방위각 갱신 시 heading 상태에 실시간 반영
  useEffect(() => {
    if (!isSimulation) {
      setHeading(sensorHeading);
    }
  }, [sensorHeading, isSimulation]);

  // SOS 경광등 점멸 타이머
  useEffect(() => {
    if (!isStrobeActive) return;
    const interval = setInterval(() => {
      setStrobeColor(c => (c === 'red' ? 'white' : 'red'));
    }, 280);
    return () => clearInterval(interval);
  }, [isStrobeActive]);

  // 카카오맵 훅 연결 (재난 대피로는 긴급 붉은색 #c62828 Polyline 사용)
  const { isMapLoaded } = useKakaoMap('kakaoNavMap', myPos, safeRoute, polyline, '#c62828');

  const smoothedDiffRef = useRef(0);

  // Low-Pass Filter (alpha = 0.2)
  const applyLowPassFilter = (targetDiff: number) => {
    let delta = targetDiff - smoothedDiffRef.current;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    smoothedDiffRef.current += 0.2 * delta;
    while (smoothedDiffRef.current > 180) smoothedDiffRef.current -= 360;
    while (smoothedDiffRef.current < -180) smoothedDiffRef.current += 360;
    return smoothedDiffRef.current;
  };

  // 실시간 단말기 GPS 연동
  useEffect(() => {
    if (isSimulation) return;

    let watchId: number | null = null;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        pos => {
          setMyPos({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        err => console.warn('GPS 오류 (기본 시연 좌표 유지):', err),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 7000 }
      );
    }

    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isSimulation]);

  // Turn-by-Turn 엔진 계산
  const targetWp = safeRoute[currentWpIdx] || safeRoute[safeRoute.length - 1];
  const distToTarget = getDistance(myPos, targetWp);

  // 전체 남은 거리 계산
  let totalRemainingDist = distToTarget;
  for (let i = currentWpIdx; i < safeRoute.length - 1; i++) {
    totalRemainingDist += getDistance(safeRoute[i], safeRoute[i + 1]);
  }

  // 15m 이내 경유지 통과 판정
  useEffect(() => {
    if (distToTarget <= 15) {
      if (currentWpIdx < safeRoute.length - 1) {
        setCurrentWpIdx(prev => prev + 1);
        const nextGuide = safeRoute[currentWpIdx + 1]?.instruction || `${targetWp.name} 통과`;
        onSpeak(`${nextGuide}. 계속 이동하세요.`, true);
      } else if (!isArrived) {
        setIsArrived(true);
        onSpeak(`안전한 대피소인 ${shelter.name}에 무사히 도착하셨습니다. 회관 안으로 들어가세요.`, true);
      }
    }
  }, [distToTarget, currentWpIdx, safeRoute, targetWp.name, isArrived, onSpeak, shelter.name]);

  // 25m 이탈 판정
  useEffect(() => {
    const prevWp = safeRoute[currentWpIdx - 1] || safeRoute[0];
    const baseline = getDistance(prevWp, targetWp);
    const deviation = Math.max(0, getDistance(myPos, prevWp) + distToTarget - baseline);

    const off = deviation > 25;
    setIsOffRoute(off);

    if (off) {
      if ('vibrate' in navigator) navigator.vibrate([300, 150, 300]);
      onSpeak('경로를 벗어났습니다. 화살표 방향을 확인해 주세요.');
    }
  }, [myPos, currentWpIdx, distToTarget, targetWp, safeRoute, onSpeak]);

  // 방위각 및 회전각 diff 계산
  useEffect(() => {
    const targetBearing = getBearing(myPos, targetWp);
    const rawDiff = normalizeDiff(targetBearing - heading);
    const filtered = applyLowPassFilter(rawDiff);
    setSmoothedDiff(filtered);

    // 각도에 따른 음성 안내
    if (!isOffRoute && !isArrived) {
      if (targetWp.instruction) {
        onSpeak(targetWp.instruction);
      } else if (filtered >= -20 && filtered <= 20) {
        onSpeak('정면으로 직진하세요');
      } else if (filtered > 20 && filtered <= 110) {
        onSpeak('오른쪽 방향으로 가세요');
      } else if (filtered < -20 && filtered >= -110) {
        onSpeak('왼쪽 방향으로 가세요');
      } else {
        onSpeak('뒤로 돌아서 가세요');
      }
    }
  }, [myPos, targetWp, heading, isOffRoute, isArrived, onSpeak]);

  // 지침 텍스트
  let actionText = targetWp.instruction || '정면으로 직진하세요';
  if (isArrived) {
    actionText = '대피소 도착 완료!';
  } else if (isOffRoute) {
    actionText = '경로를 벗어났습니다! 화살표 확인';
  } else if (smoothedDiff >= -20 && smoothedDiff <= 20) {
    actionText = '정면으로 직진하세요';
  } else if (smoothedDiff > 20 && smoothedDiff <= 110) {
    actionText = '오른쪽 방향으로 가세요';
  } else if (smoothedDiff < -20 && smoothedDiff >= -110) {
    actionText = '왼쪽 방향으로 가세요';
  } else {
    actionText = '뒤로 돌아서 가세요';
  }

  // 시뮬레이션 제어 핸들러
  const handleStepForward = () => {
    const targetBearing = getBearing(myPos, targetWp);
    const bRad = rad(targetBearing);
    const dLat = (10 * Math.cos(bRad)) / R;
    const dLng = (10 * Math.sin(bRad)) / (R * Math.cos(rad(myPos.lat)));
    setMyPos(prev => ({
      lat: prev.lat + deg(dLat),
      lng: prev.lng + deg(dLng),
    }));
  };

  const handlePassWaypoint = () => {
    setMyPos({ lat: targetWp.lat, lng: targetWp.lng });
  };

  const handleOffRouteTest = () => {
    setMyPos(prev => ({
      lat: prev.lat + 0.00045,
      lng: prev.lng + 0.00045,
    }));
  };

  const handleFinishTest = () => {
    const finalWp = safeRoute[safeRoute.length - 1];
    setMyPos({ lat: finalWp.lat, lng: finalWp.lng });
    setCurrentWpIdx(safeRoute.length - 1);
  };

  const handleReset = () => {
    setMyPos({ ...safeRoute[0] });
    setCurrentWpIdx(1);
    setIsArrived(false);
    setIsOffRoute(false);
    smoothedDiffRef.current = 0;
    setSmoothedDiff(0);
    setHeading(0);
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* 상태 표시줄 & 복귀 버튼 */}
      <div className="flex items-center justify-between text-sm font-extrabold px-1">
        <span className="text-alert flex items-center gap-1.5 animate-pulse">
          <Compass className="w-4 h-4 text-alert" />
          <span>STEP 2 · 쉬운 길 실시간 도보 대피</span>
        </span>
        <button
          onClick={onReturnToNormal}
          className="text-xs font-bold text-ink2 bg-white px-2.5 py-1 rounded-full border border-border shadow-sm hover:bg-gray-50 flex items-center gap-1 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 평시 모드 복귀
        </button>
      </div>

      {/* 1. 최상단 즉시 판단 영역 (Immediate Action) - 재난 모드: 100% 긴급 붉은색 */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-alert flex flex-col items-center gap-3">
        {/* 대형 원형 나침반 + Turn-by-Turn 회전 화살표 */}
        <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-full border-4 border-alert/20 bg-alert-light/40 flex items-center justify-center shadow-inner">
          {/* 회전 각도 인디케이터 (붉은 화살표) */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
            style={{ transform: `rotate(${smoothedDiff}deg)` }}
          >
            <div className="w-0 h-0 border-x-[26px] border-x-transparent border-b-[90px] sm:border-b-[100px] border-b-alert drop-shadow-md" />
          </div>

          {/* 중앙 허브 (현재 방위각 및 회전각) */}
          <div className="absolute w-12 h-12 rounded-full bg-white border-4 border-alert flex items-center justify-center shadow-md">
            <span className="text-xs font-black text-alert">
              {Math.abs(Math.round(smoothedDiff))}°
            </span>
          </div>

          {/* 이탈 경고 오버레이 */}
          {isOffRoute && (
            <div className="absolute inset-0 rounded-full bg-alert/80 flex flex-col items-center justify-center text-white p-4 text-center animate-pulse">
              <span className="text-3xl font-black">경로 이탈</span>
              <span className="text-xs font-bold mt-1">화살표 방향으로 돌아오세요</span>
            </div>
          )}
        </div>

        {/* iOS 등 센서 권한 허용이 필요한 경우 원터치 활성화 버튼 노출 */}
        {permissionState === 'prompt' && (
          <button
            onClick={requestCompassPermission}
            className="mt-1 py-2 px-4 bg-alert text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 animate-bounce active:scale-95 transition-transform"
          >
            <Compass className="w-4 h-4" />
            <span>나침반 센서 켜기 (터치하여 허용)</span>
          </button>
        )}

        {/* 비보안(HTTP) 안내 (로컬 IP 등으로 접속 시) */}
        {!isSecure && (
          <div className="text-[11px] font-semibold text-gray-500 bg-gray-100 p-2 rounded-xl text-center flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>비보안(HTTP) 환경에서는 브라우저 정책상 나침반 센서가 제한될 수 있습니다.</span>
          </div>
        )}

        {/* 핵심 행동 지침 & 대형 남은 거리 (재난 모드: 붉은색) */}
        <h2 className="text-3xl font-black tracking-tight text-center text-alert">
          {actionText}
        </h2>

        <div className="text-4xl sm:text-5xl font-black text-alert text-center">
          {isArrived ? '0' : Math.round(totalRemainingDist)}
          <span className="text-2xl font-bold ml-1 text-ink2">m</span>
        </div>

        <p className="text-base font-bold text-ink text-center">
          {isArrived ? '대피소 안으로 들어가세요' : `${targetWp.name} 향해 이동 중`}
        </p>

        {/* 경로 진행 바 (재난 모드: 붉은색 진행) */}
        <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden mt-1 p-0.5 border border-gray-200">
          <div
            className="bg-alert h-full rounded-full transition-all duration-300"
            style={{
              width: `${isArrived ? 100 : Math.max(10, Math.min(95, Math.round(((currentWpIdx - 1) + (1 - distToTarget / 150)) / (safeRoute.length - 1) * 100)))}%`
            }}
          />
        </div>
      </div>

      {/* 2. 중단 공간 확인 영역 (카카오맵 카드 - 붉은색 대피선) */}
      <div className="bg-white rounded-3xl p-3.5 shadow-md border border-alert/20 flex flex-col gap-2">
        <div className="flex justify-between items-center px-2">
          <span className="font-black text-base flex items-center gap-1.5 text-alert">
            <Compass className="w-5 h-5 text-alert" />
            카카오 실시간 대피로 ({shelter.name})
          </span>
          <span className="text-xs font-bold text-ink2">내 위치 자동 추종</span>
        </div>

        <div className="w-full h-56 rounded-2xl overflow-hidden relative bg-[#fbebeb] border border-alert/20">
          <div id="kakaoNavMap" className="w-full h-full" />
          {!isMapLoaded && (
            <div className="absolute inset-0 bg-[#fbebeb] flex flex-col items-center justify-center p-4 text-center gap-2">
              <AlertOctagon className="w-10 h-10 text-alert" />
              <div className="font-bold text-base text-alert">카카오 대피 경로 연동 중</div>
              <div className="text-xs font-medium text-ink2 leading-relaxed">
                카카오 도메인 등록 시 실시간 도로 지도가 자동 렌더링됩니다.<br/>
                <b>(통신 장애 상태에서도 상단 붉은 화살표와 음성 안내는 100% 정상 작동)</b>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. 하단 비상 도구 영역 (호루라기, 물리/화면 손전등, 야간 SOS 경광등) */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onSirenToggle}
          className={`min-h-[58px] rounded-2xl font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] ${
            isSirenPlaying ? 'bg-alert text-white animate-pulse' : 'bg-white text-ink border border-alert/30 shadow-sm'
          }`}
        >
          <Flame className="w-5 h-5 text-alert" />
          <span>{isSirenPlaying ? '호루라기 정지' : '비상 호루라기'}</span>
        </button>

        <button
          onClick={onOpenFlashlight}
          className="min-h-[58px] bg-white text-ink border border-border rounded-2xl font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98]"
        >
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <span>손전등 (플래시)</span>
        </button>

        <button
          onClick={() => setIsStrobeActive(true)}
          className="min-h-[58px] bg-white text-alert border border-alert/30 rounded-2xl font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98]"
        >
          <Radio className="w-5 h-5 text-alert" />
          <span>SOS 경광등</span>
        </button>
      </div>

      {/* 최하단 고정형 119 원터치 SOS 버튼 */}
      <button
        onClick={onEmergencySOS}
        className="w-full min-h-[76px] bg-alert hover:bg-alert-dark text-white rounded-2xl p-4 flex items-center justify-center gap-3 text-xl font-black shadow-lg shadow-alert/30 transition-transform active:scale-[0.98]"
      >
        <PhoneCall className="w-7 h-7" />
        <div className="text-left">
          <div>119 긴급 위치 전송 및 통화</div>
          <div className="text-xs font-normal opacity-90 mt-0.5">내 GPS 좌표 즉시 전송 · 모의 상황실 연결</div>
        </div>
      </button>

      {/* 4. 시연·검증용 시뮬레이션 제어 (평소 단정하게 접어둠) */}
      <div className="mt-2 text-center pb-4">
        <button
          onClick={() => setShowSimPanel(prev => !prev)}
          className="text-[11px] text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors cursor-pointer"
        >
          {showSimPanel ? '센서 및 모의 이동 설정 닫기' : '센서 및 모의 이동 설정'}
        </button>

        {showSimPanel && (
          <div className="mt-3 bg-white border border-alert/20 rounded-2xl p-4 flex flex-col gap-3 text-left shadow-sm">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>단말기 방위각: {Math.round(heading)}°</span>
                <span className="text-alert font-black">회전각(diff): {Math.round(smoothedDiff)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={heading}
                onChange={e => setHeading(parseFloat(e.target.value))}
                className="w-full accent-alert h-2 bg-gray-200 rounded-lg cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleStepForward}
                className="py-2.5 px-3 bg-surface border border-gray-300 rounded-xl font-bold text-xs active:bg-gray-100"
              >
                🚶 앞으로 10m 전진
              </button>
              <button
                onClick={handlePassWaypoint}
                className="py-2.5 px-3 bg-surface border border-gray-300 rounded-xl font-bold text-xs active:bg-gray-100"
              >
                ⏩ 경유지 통과 (15m 이내)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleOffRouteTest}
                className="py-2.5 px-3 bg-alert-light border border-alert/30 text-alert rounded-xl font-black text-xs active:opacity-80"
              >
                ⚠️ 30m 이탈 테스트
              </button>
              <button
                onClick={handleFinishTest}
                className="py-2.5 px-3 bg-alert text-white rounded-xl font-black text-xs active:opacity-90"
              >
                🏁 대피소 도착 테스트
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleReset}
                className="py-2 px-3 bg-gray-100 rounded-xl font-bold text-xs text-ink2"
              >
                🔄 처음부터 다시
              </button>
              <button
                onClick={() => onSpeak(actionText, true)}
                className="py-2 px-3 bg-gray-100 text-ink rounded-xl font-bold text-xs flex items-center justify-center gap-1"
              >
                <Volume2 className="w-3.5 h-3.5" /> 음성 다시 듣기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SOS 고휘도 점멸 경광등 오버레이 (야간/연기 대피용) */}
      {isStrobeActive && (
        <div
          className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between p-8 select-none transition-colors duration-150 ${
            strobeColor === 'red' ? 'bg-alert text-white' : 'bg-white text-alert'
          }`}
        >
          <div className="text-center pt-8">
            <div className="text-4xl font-black tracking-widest animate-bounce">
              🚨 SOS 🚨
            </div>
            <div className="text-lg font-extrabold mt-2">
              119 구조 신호 화면 점멸 중
            </div>
            <div className="text-xs opacity-80 mt-1">
              야간이나 연기 속에서 구조대가 쉽게 발견할 수 있도록 화면을 밝게 점멸합니다.
            </div>
          </div>

          <button
            onClick={() => setIsStrobeActive(false)}
            className="w-full max-w-xs py-4 rounded-2xl bg-black text-white font-black text-lg shadow-2xl flex items-center justify-center gap-2 active:scale-95"
          >
            <X className="w-6 h-6" />
            <span>경광등 끄기 (길안내 복귀)</span>
          </button>
        </div>
      )}
    </div>
  );
};