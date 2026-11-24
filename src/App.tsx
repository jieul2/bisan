import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Flashlight } from '@/components/Flashlight';
import { CallModal } from '@/components/CallModal';
import { EmergencyAlertModal } from '@/components/EmergencyAlertModal';
import { NormalModeView } from '@/components/NormalModeView';
import { Step1Alert } from '@/components/Step1Alert';
import { Step2Nav } from '@/components/Step2Nav';
import { Step3SOS } from '@/components/Step3SOS';
import { Step4Dashboard } from '@/components/Step4Dashboard';
import { useSpeechGuide } from '@/hooks/useSpeechGuide';
import { useSiren } from '@/hooks/useSiren';
import { findNearestShelters, fetchKakaoRoute } from '@/services/routeService';
import type { AppMode, DisasterType, Shelter, RouteResult } from '@/types';

export const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('normal');
  const [disasterType, setDisasterType] = useState<DisasterType>('landslide');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isFlashlightOpen, setIsFlashlightOpen] = useState(false);
  const [isEmergencyAlertOpen, setIsEmergencyAlertOpen] = useState(false);
  // 기본 시뮬레이션 상태: 실제 모바일 센서(나침반/GPS) 우선 사용 (false)
  const [isSimulation, setIsSimulation] = useState(false);

  // 모의 통화 화면 상태 (실제 119 발신 차단)
  const [activeCall, setActiveCall] = useState<{
    isOpen: boolean;
    name: string;
    number: string;
  }>({
    isOpen: false,
    name: '',
    number: '',
  });

  const handleStartCall = (name: string, number: string) => {
    setActiveCall({
      isOpen: true,
      name,
      number,
    });
  };

  // 기본 사용자 위치: 충북 제천시 백운면 덕동리 (산악 인접 가구)
  const [userCoords, setUserCoords] = useState({ lat: 37.1315, lng: 128.23 });

  // 제천시 민방위 대피시설 CSV 데이터셋(53개소) 기반 최근접 대피소 자동 계산
  const nearbyShelters = useMemo(() => {
    return findNearestShelters(userCoords, 5);
  }, [userCoords]);

  // 선택된 대피소 (기본값: 가장 가까운 1순위 대피소)
  const [selectedShelter, setSelectedShelter] = useState<Shelter>(nearbyShelters[0]);

  // 카카오 길찾기 API 연동 동적 경로 결과
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);

  const { isVoiceEnabled, toggleVoice, speak } = useSpeechGuide();
  const { isSirenPlaying, startSiren, stopSiren, toggleSiren } = useSiren();

  // 실제 GPS 수신 (비 시뮬레이션 모드 시)
  useEffect(() => {
    if (!isSimulation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        err => console.warn('GPS 확인 불가 (시연 좌표 유지):', err),
        { enableHighAccuracy: true }
      );
    }
  }, [isSimulation]);

  // 대피소 변경 시 또는 초기 로드 시 카카오 경로 비동기 계산
  const updateRouteForShelter = useCallback(async (shelter: Shelter) => {
    setSelectedShelter(shelter);
    const result = await fetchKakaoRoute(userCoords, shelter);
    setRouteResult(result);
  }, [userCoords]);

  useEffect(() => {
    if (nearbyShelters[0]) {
      updateRouteForShelter(nearbyShelters[0]);
    }
  }, [nearbyShelters, updateRouteForShelter]);

  // [🚨 재난 상황 부여] 트리거 핸들러 - 고휘도 점멸, 최대 음량 사이렌, 명확한 재난 정보
  const handleTriggerDisaster = async (type: DisasterType, shelter?: Shelter) => {
    const target = shelter || nearbyShelters[0];
    setDisasterType(type);
    setSelectedShelter(target);

    // 카카오맵 정밀 경로 즉시 호출
    const res = await fetchKakaoRoute(userCoords, target);
    setRouteResult(res);

    setAppMode('disaster');
    setCurrentStep(1);

    // 1. 화면 빤짝빤짝 긴급 재난 스트로브 모달 활성화
    setIsEmergencyAlertOpen(true);

    // 2. 최대 음량 사이렌 재생 (6초간 강력 경보음 출력)
    startSiren(1.0, 6);

    // 3. 단말기 긴급 진동 (지원 환경)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([600, 200, 600, 200, 600]);
    }

    // 4. 최대 음량 구어체 음성 안내 (TTS)
    const typeKor =
      type === 'landslide'
        ? '산사태'
        : type === 'flood'
        ? '침수'
        : type === 'wildfire'
        ? '산불 대피'
        : '유해 화학물질 비산';
    speak(
      `긴급 ${typeKor} 경보 발령! 지금 즉시 ${target.name}으로 대피를 시작하세요!`,
      true
    );
  };

  // [🕊️ 평시 안전 모드 복귀] 핸들러
  const handleReturnToNormal = () => {
    stopSiren();
    setIsEmergencyAlertOpen(false);
    setAppMode('normal');
    setCurrentStep(1);
    speak('평시 안전 모드로 복귀했습니다.', true);
  };

  return (
    <div className="max-w-[480px] mx-auto min-h-screen px-4 pt-4 pb-12 flex flex-col">
      {/* 헤더 */}
      <Header
        appMode={appMode}
        currentStep={currentStep}
        isVoiceEnabled={isVoiceEnabled}
        onToggleVoice={toggleVoice}
        onReturnToNormal={handleReturnToNormal}
      />

      <main className="flex-1">
        {/* 1. 평시 안전 모드 화면 */}
        {appMode === 'normal' && (
          <NormalModeView
            nearbyShelters={nearbyShelters}
            onTriggerDisaster={handleTriggerDisaster}
            userCoords={userCoords}
            onStartCall={handleStartCall}
            onOpenFlashlight={() => setIsFlashlightOpen(true)}
            onSirenToggle={toggleSiren}
            isSirenPlaying={isSirenPlaying}
          />
        )}

        {/* 2. 재난 상황 시 대피 단계별 화면 */}
        {appMode === 'disaster' && (
          <>
            {currentStep === 1 && (
              <Step1Alert
                onStartNav={() => {
                  stopSiren();
                  setCurrentStep(2);
                  speak('대피 안내를 시작합니다. 큰 화살표를 따라 이동하세요.', true);
                }}
                onEmergencySOS={() => {
                  stopSiren();
                  setCurrentStep(3);
                }}
                onGoDashboard={() => {
                  stopSiren();
                  setCurrentStep(4);
                }}
                onReturnToNormal={handleReturnToNormal}
                userCoords={userCoords}
                shelter={selectedShelter}
                disasterType={disasterType}
              />
            )}

            {currentStep === 2 && (
              <Step2Nav
                route={routeResult?.waypoints || []}
                polyline={routeResult?.polyline}
                shelter={selectedShelter}
                onEmergencySOS={() => setCurrentStep(3)}
                onOpenFlashlight={() => setIsFlashlightOpen(true)}
                onSirenToggle={toggleSiren}
                isSirenPlaying={isSirenPlaying}
                onSpeak={speak}
                isSimulation={isSimulation}
                onToggleSimulation={() => setIsSimulation(prev => !prev)}
                onReturnToNormal={handleReturnToNormal}
              />
            )}

            {currentStep === 3 && (
              <Step3SOS
                onBackToNav={() => setCurrentStep(2)}
                userCoords={userCoords}
                onStartCall={handleStartCall}
              />
            )}

            {currentStep === 4 && (
              <Step4Dashboard
                onBackToMain={() => setCurrentStep(1)}
                onStartCall={handleStartCall}
              />
            )}
          </>
        )}
      </main>

      {/* 긴급 재난 경보 고휘도 점멸 스트로브 모달 (화면 빤짝빤짝 & 최대 볼륨 사이렌) */}
      <EmergencyAlertModal
        isOpen={isEmergencyAlertOpen}
        onClose={() => {
          setIsEmergencyAlertOpen(false);
          stopSiren();
        }}
        onStartNav={() => {
          setIsEmergencyAlertOpen(false);
          stopSiren();
          setCurrentStep(2);
          speak('실시간 대피 안내를 시작합니다. 큰 화살표를 따라 이동하세요.', true);
        }}
        onEmergencySOS={() => {
          setIsEmergencyAlertOpen(false);
          stopSiren();
          setCurrentStep(3);
        }}
        shelter={selectedShelter}
        disasterType={disasterType}
        isSirenPlaying={isSirenPlaying}
        onToggleSiren={toggleSiren}
      />

      {/* 모의 통화 화면 오버레이 (실제 119 발신 방지) */}
      <CallModal
        isOpen={activeCall.isOpen}
        onClose={() => setActiveCall(p => ({ ...p, isOpen: false }))}
        targetName={activeCall.name}
        targetNumber={activeCall.number}
        userCoords={userCoords}
      />

      {/* 후면 물리 LED 플래시 & 화면 손전등 오버레이 */}
      <Flashlight
        isOpen={isFlashlightOpen}
        onClose={() => setIsFlashlightOpen(false)}
      />
    </div>
  );
};
