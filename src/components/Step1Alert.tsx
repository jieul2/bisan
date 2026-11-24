import React from 'react';
import {
  AlertTriangle,
  Navigation,
  PhoneCall,
  Users,
  ShieldAlert,
  ArrowLeft,
  Mountain,
  Waves,
  Flame,
  Biohazard
} from 'lucide-react';
import type { Shelter, DisasterType } from '@/types';

interface Step1AlertProps {
  onStartNav: () => void;
  onEmergencySOS: () => void;
  onGoDashboard: () => void;
  onReturnToNormal: () => void;
  userCoords: { lat: number; lng: number };
  shelter: Shelter;
  disasterType: DisasterType;
}

export const Step1Alert: React.FC<Step1AlertProps> = ({
  onStartNav,
  onEmergencySOS,
  onGoDashboard,
  onReturnToNormal,
  userCoords,
  shelter,
  disasterType,
}) => {
  const disasterMetaMap: Record<
    DisasterType,
    {
      title: string;
      badge: string;
      icon: React.ReactNode;
      advice: string;
      dangerReason: string;
    }
  > = {
    landslide: {
      title: '산사태 경보 발령!',
      badge: '⛰️ 산사태 위험지역',
      icon: <Mountain className="w-8 h-8 text-white" />,
      advice: '계곡과 비탈면 급경사지를 즉시 벗어나 지반이 단단한 고지대로 대피하세요.',
      dangerReason: '집중호우로 인한 급경사지 토사 유실 및 붕괴 위험',
    },
    flood: {
      title: '침수·호우 경보 발령!',
      badge: '🌊 하천 범람 위험',
      icon: <Waves className="w-8 h-8 text-white" />,
      advice: '지하 대피소를 피하고 지상 2층 이상 안전 건물로 대피하세요.',
      dangerReason: '백운천 수위 상승 및 저지대 침수 우려',
    },
    chemical: {
      title: '화학물질 비산 경보 발령!',
      badge: '☣️ 유독 가스 비산',
      icon: <Biohazard className="w-8 h-8 text-white" />,
      advice: '바람의 직각 방향으로 신속 이동 후 실내 창문과 문을 닫고 밀폐하세요.',
      dangerReason: '공기 중 유해 화학물질 확산 방지 필요',
    },
    wildfire: {
      title: '대형 산불 대피 경보 발령!',
      badge: '🔥 산림 화재 확산',
      icon: <Flame className="w-8 h-8 text-white" />,
      advice: '바람을 등지고 불길 반대편 활엽수림, 공터 및 마을회관으로 대피하세요.',
      dangerReason: '강풍에 따른 불티 비산 및 주거지 접근 위험',
    },
  };

  const currentMeta = disasterMetaMap[disasterType] || disasterMetaMap.landslide;

  // 모바일 iOS 나침반 권한 직접 터치 요청 연계
  const handleStartNavWithPermission = async () => {
    if (
      typeof (DeviceOrientationEvent as any) !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        await (DeviceOrientationEvent as any).requestPermission();
      } catch (e) {
        console.warn('iOS 나침반 권한 요청 시도:', e);
      }
    }
    onStartNav();
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* 상태 배너 & 평시 복귀 버튼 */}
      <div className="flex items-center justify-between text-sm font-extrabold px-1">
        <span className="text-alert flex items-center gap-1.5 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-alert" />
          <span>STEP 1 · 긴급재난경보 수신</span>
        </span>
        <button
          onClick={onReturnToNormal}
          className="text-xs font-bold text-ink2 bg-white px-2.5 py-1 rounded-full border border-border shadow-sm hover:bg-gray-50 flex items-center gap-1 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 평시 모드 복귀
        </button>
      </div>

      {/* 재난문자 자동 변환 카드 (재난 모드: 100% 붉은색 테마) */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-xl border-4 border-alert animate-emergencyPulse">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-alert to-alert-dark text-white px-5 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2.5 font-black text-lg">
            {currentMeta.icon}
            <div>
              <div className="text-[11px] opacity-90 font-bold">대한민국 긴급재난문자 (CBS)</div>
              <span>{currentMeta.title}</span>
            </div>
          </div>
          <span className="bg-white text-alert text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
            제천시
          </span>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white bg-alert px-3 py-1 rounded-full">
              {currentMeta.badge}
            </span>
            <span className="text-xs font-bold text-alert animate-pulse">
              🚨 즉시 행동 필요
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black leading-snug text-ink">
            지금 즉시 <u className="decoration-alert decoration-4 underline-offset-4 text-alert">{shelter.name}</u>(으)로 대피하세요
          </h1>

          {/* 재난 유형별 맞춤 행동 요령 배너 */}
          <div className="bg-alert-light/70 rounded-2xl p-4 flex items-start gap-3 border border-alert/30">
            <ShieldAlert className="w-6 h-6 text-alert flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-black text-alert leading-relaxed">
              <b>{currentMeta.title} 행동 수칙:</b><br />
              {currentMeta.advice}
            </div>
          </div>

          {/* 지정된 대피소 세부 카드 (CSV 데이터 연계) */}
          <div className="bg-surface rounded-2xl p-4 text-left flex flex-col gap-1.5 border border-border">
            <div className="text-xs font-bold text-ink2">자동 매칭된 최근접 안심 대피소</div>
            <div className="font-extrabold text-xl text-ink">{shelter.name}</div>
            <div className="text-xs font-semibold text-ink2">{shelter.address}</div>
            <div className="flex items-center gap-3 text-sm font-black text-alert mt-1">
              <span>거리: 약 {shelter.distance ?? 180}m</span>
              <span>도보 약 {Math.max(1, Math.ceil((shelter.distance ?? 180) / 60))}분</span>
              <span>수용: {shelter.capacity?.toLocaleString() || '1,000'}명</span>
            </div>
          </div>

          {/* 실시간 대피 안내 시작 버튼 (초대형 붉은색) */}
          <button
            onClick={handleStartNavWithPermission}
            className="w-full min-h-[76px] bg-alert hover:bg-alert-dark text-white rounded-2xl p-4 flex items-center justify-center gap-3 text-xl font-black shadow-lg shadow-alert/30 transition-transform active:scale-[0.98]"
          >
            <Navigation className="w-7 h-7" />
            <div className="text-left">
              <div>실시간 대피 안내 시작 (STEP 2)</div>
              <div className="text-xs font-normal opacity-90 mt-0.5">200px 대형 회전 화살표 & 카카오 길찾기 음성 안내</div>
            </div>
          </button>

          {/* 119 긴급 위치 전송 버튼 */}
          <button
            onClick={onEmergencySOS}
            className="w-full min-h-[64px] bg-white border-2 border-alert text-alert hover:bg-alert-light rounded-2xl p-4 flex items-center justify-center gap-3 text-lg font-black shadow-sm transition-transform active:scale-[0.98]"
          >
            <PhoneCall className="w-6 h-6 text-alert" />
            <div className="text-left">
              <div>119 긴급 위치 전송 및 통화</div>
              <div className="text-xs font-medium text-ink2">현재 GPS 좌표를 소방 상황실에 원터치 전송</div>
            </div>
          </button>
        </div>
      </div>

      {/* 현재 GPS 위치 안내 카드 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm text-left border border-border">
        <div className="text-xs font-bold text-ink2">현재 확인된 내 GPS 좌표</div>
        <div className="text-base font-extrabold text-ink mt-0.5">
          위도 {userCoords.lat.toFixed(5)}, 경도 {userCoords.lng.toFixed(5)}
        </div>
        <div className="text-xs font-bold text-alert mt-1">
          ✓ 충북 119 종합상황실 및 덕동리 이장과 실시간 연동 중
        </div>
      </div>

      {/* 관제 화면 링크 */}
      <button
        onClick={onGoDashboard}
        className="text-alert font-black text-base underline underline-offset-4 py-2 hover:opacity-80 flex items-center justify-center gap-1.5"
      >
        <Users className="w-5 h-5 text-alert" />
        이장 · 보호자 관제 화면 보기
      </button>
    </div>
  );
};
