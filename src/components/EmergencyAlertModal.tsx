import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  Waves,
  Mountain,
  Biohazard,
  Navigation,
  PhoneCall,
  Volume2,
  VolumeX,
  X,
  ShieldAlert
} from 'lucide-react';
import type { Shelter, DisasterType } from '@/types';

interface EmergencyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNav: () => void;
  onEmergencySOS: () => void;
  shelter: Shelter;
  disasterType: DisasterType;
  isSirenPlaying: boolean;
  onToggleSiren: () => void;
}

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  isOpen,
  onClose,
  onStartNav,
  onEmergencySOS,
  shelter,
  disasterType,
  isSirenPlaying,
  onToggleSiren,
}) => {
  // 화면 빤짝빤짝(스트로브 플래시) 상태
  const [strobeState, setStrobeState] = useState<'red' | 'dark'>('red');

  useEffect(() => {
    if (!isOpen) return;

    // 260ms 간격으로 배경색을 긴급 레드와 딥 다크로 교차 점멸
    const interval = setInterval(() => {
      setStrobeState(prev => (prev === 'red' ? 'dark' : 'red'));
    }, 260);

    // 단말기 긴급 진동 (지원되는 경우)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([600, 200, 600, 200, 600]);
    }

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // 재난 유형별 맞춤 배지 및 정보 매핑
  const disasterConfigMap: Record<
    DisasterType,
    {
      title: string;
      subtitle: string;
      badge: string;
      icon: React.ReactNode;
      instruction: string;
      dangerReason: string;
    }
  > = {
    landslide: {
      title: '산사태 긴급 대피 경보 발령!',
      subtitle: '충북 제천시 백운면 일대 토사 붕괴 위험',
      badge: '⛰️ 산사태 경보 (심각)',
      icon: <Mountain className="w-10 h-10 text-white animate-bounce" />,
      instruction: '계곡이나 비탈면 급경사지에서 즉시 벗어나, 단단한 고지대 대피소로 이동하세요!',
      dangerReason: '최근 집중호우로 인한 지반 약화 및 산사태 위험 최고조',
    },
    flood: {
      title: '침수·호우 긴급 대피 경보 발령!',
      subtitle: '충북 제천시 백운천 수위 급상승 및 범람 우려',
      badge: '🌊 침수·호우 경보 (심각)',
      icon: <Waves className="w-10 h-10 text-white animate-bounce" />,
      instruction: '지하 공간 출입을 절대 금지하고, 지상 2층 이상 고지대로 신속히 대피하세요!',
      dangerReason: '저지대 및 반지하 가구 침수 위험 발생',
    },
    wildfire: {
      title: '대형 산불 긴급 대피 경보 발령!',
      subtitle: '충북 제천시 백운면 산림 화재 확산 우려',
      badge: '🔥 산불 대피 경보 (심각)',
      icon: <Flame className="w-10 h-10 text-white animate-bounce" />,
      instruction: '바람을 등지고 불길 반대편 활엽수림, 공터 및 마을회관으로 즉시 대피하세요!',
      dangerReason: '건조한 대기 및 강풍으로 인한 산불 번짐 위험',
    },
    chemical: {
      title: '유해 화학물질 비산 경보 발령!',
      subtitle: '충북 제천시 관내 유독 가스 비산 위험',
      badge: '☣️ 화학물질 비산 경보 (심각)',
      icon: <Biohazard className="w-10 h-10 text-white animate-bounce" />,
      instruction: '바람의 직각 방향으로 이동 후 실내 창문과 문을 완전히 닫아 밀폐하세요!',
      dangerReason: '공기 중 유독성 증기 확산 방지 필요',
    },
  };

  const config = disasterConfigMap[disasterType] || disasterConfigMap.landslide;

  return (
    <div
      className={`fixed inset-0 z-[999999] flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200 select-none overflow-y-auto ${
        strobeState === 'red' ? 'bg-[#8b0000]' : 'bg-[#0f172a]'
      }`}
    >
      {/* 1. 상단 경보 헤더 & 제어 버튼 */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping" />
          <span className="text-white text-xs sm:text-sm font-black bg-black/40 px-3 py-1 rounded-full border border-white/30 backdrop-blur-sm">
            {config.badge}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 사이렌 소리 제어 토글 */}
          <button
            onClick={onToggleSiren}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-lg transition-transform active:scale-95 ${
              isSirenPlaying
                ? 'bg-white text-alert animate-pulse'
                : 'bg-black/40 text-white border border-white/30'
            }`}
            title="사이렌 소리 제어"
          >
            {isSirenPlaying ? <Volume2 className="w-4 h-4 text-alert" /> : <VolumeX className="w-4 h-4" />}
            <span>{isSirenPlaying ? '최대 사이렌 켜짐' : '사이렌 끔'}</span>
          </button>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center border border-white/30 hover:bg-black/60"
            title="경보 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. 중앙 초대형 경보 카드 (무슨 경보인지 한눈에 알기 쉽게 강조) */}
      <div className="my-auto py-4 flex flex-col items-center text-center gap-4 max-w-md mx-auto w-full">
        {/* 깜빡이는 대형 경보 아이콘 */}
        <div className="relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/20 border-4 border-white flex items-center justify-center shadow-2xl backdrop-blur-md">
            {config.icon}
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-75" />
        </div>

        {/* 무슨 경보인지 36px 초대형 텍스트로 표기 */}
        <div>
          <div className="text-white/90 text-sm sm:text-base font-extrabold tracking-wide mb-1">
            대한민국 행정안전부 · 충청북도 제천시
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
            {config.title}
          </h1>
          <p className="text-white/90 text-sm sm:text-base font-bold mt-1">
            {config.subtitle}
          </p>
        </div>

        {/* 핵심 대피 행동 지침 박스 (고대비 백색 카드) */}
        <div className="bg-white rounded-3xl p-5 shadow-2xl text-left flex flex-col gap-2.5 w-full border-4 border-yellow-300">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-alert flex-shrink-0" />
            <span className="text-alert font-black text-base sm:text-lg">
              지금 즉시 아래 대피소로 이동하세요!
            </span>
          </div>

          <div className="bg-[#fff1f0] p-4 rounded-2xl border-2 border-alert/30">
            <div className="text-xs font-bold text-alert">지정 최근접 안심 대피소</div>
            <div className="text-2xl font-black text-ink mt-0.5">{shelter.name}</div>
            <div className="text-xs font-semibold text-ink2 mt-0.5">{shelter.address}</div>
            <div className="text-sm font-black text-alert mt-1.5 flex items-center gap-3">
              <span>거리: 약 {shelter.distance || 180}m</span>
              <span>도보 약 {Math.max(1, Math.ceil((shelter.distance || 180) / 60))}분 소요</span>
            </div>
          </div>

          <div className="text-xs sm:text-sm font-black text-ink leading-relaxed p-2 bg-gray-50 rounded-xl border border-gray-200">
            📌 <b>행동 요령:</b> {config.instruction}
          </div>
        </div>
      </div>

      {/* 3. 하단 엄지 접근 초대형 버튼 영역 */}
      <div className="flex flex-col gap-2.5 max-w-md mx-auto w-full pb-2">
        {/* 대피 시작 버튼 (STEP 2 화살표 안내로 직행) */}
        <button
          onClick={() => {
            onClose();
            onStartNav();
          }}
          className="w-full min-h-[76px] bg-yellow-400 hover:bg-yellow-300 text-black rounded-2xl p-4 flex items-center justify-center gap-3 text-xl font-black shadow-2xl transition-transform active:scale-[0.98] border-2 border-white"
        >
          <Navigation className="w-8 h-8 fill-black" />
          <div className="text-left">
            <div>실시간 대피 안내 시작 (STEP 2)</div>
            <div className="text-xs font-bold opacity-90 mt-0.5">
              200px 대형 회전 화살표 & 음성 안내 켜기
            </div>
          </div>
        </button>

        {/* 119 원터치 긴급 연결 버튼 */}
        <button
          onClick={() => {
            onClose();
            onEmergencySOS();
          }}
          className="w-full min-h-[58px] bg-white text-alert font-black text-base rounded-2xl p-3 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
        >
          <PhoneCall className="w-5 h-5 text-alert" />
          <span>위기 시 119 긴급 위치 전송 및 통화</span>
        </button>
      </div>
    </div>
  );
};
