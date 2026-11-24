import React, { useState, useEffect } from 'react';
import { PhoneCall, CheckCircle2, Clock, MapPin, UserCheck, ArrowLeft } from 'lucide-react';

interface Step3SOSProps {
  onBackToNav: () => void;
  userCoords: { lat: number; lng: number };
  onStartCall: (name: string, number: string) => void;
}

export const Step3SOS: React.FC<Step3SOSProps> = ({ onBackToNav, userCoords, onStartCall }) => {
  const [stage, setStage] = useState(1);
  const currentTime = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  useEffect(() => {
    const t1 = setTimeout(() => setStage(2), 1200);
    const t2 = setTimeout(() => setStage(3), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* 상태 헤더 */}
      <div className="flex items-center justify-between text-sm font-extrabold text-alert px-1">
        <span>STEP 3 · 위기 시 119 긴급 연결</span>
        <span className="bg-alert-light text-alert px-2.5 py-0.5 rounded-full text-xs font-black">
          실시간 3각 연동
        </span>
      </div>

      {/* 중앙 펄스 카드 */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-alert/30 flex flex-col items-center text-center gap-3">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-alert text-white flex items-center justify-center text-xl font-black shadow-lg">
            나
          </div>
          <div className="absolute inset-0 rounded-full bg-alert/30 animate-ping -z-10" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-ink">
          {stage >= 2 ? '내 위치 전송 완료' : '내 위치 전송 중...'}
        </h2>

        <p className="text-sm font-semibold text-ink2 leading-relaxed">
          말씀하지 않으셔도 119 종합상황실과 관할 구조대에 현재 계신 정확한 위치 좌표가 전달되었습니다.
        </p>

        <div className="w-full bg-surface rounded-2xl p-4 text-left border border-border mt-1">
          <div className="text-xs font-bold text-ink2 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-alert" /> 전송된 정밀 좌표
          </div>
          <div className="text-base font-extrabold text-ink mt-0.5">
            위도 {userCoords.lat.toFixed(5)}, 경도 {userCoords.lng.toFixed(5)} 인근
          </div>
          <div className="text-xs font-semibold text-alert mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-alert" /> 전송 시각 {currentTime} · GPS 실시간
          </div>
        </div>
      </div>

      {/* 3단계 진행 상황 타임라인 (재난 모드: 붉은색/그레이) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-border flex flex-col gap-3">
        <h3 className="font-extrabold text-base text-ink text-left">안전 확인 진행 상황</h3>

        {/* 1단계 */}
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface border border-border">
          <CheckCircle2 className="w-6 h-6 text-alert flex-shrink-0 mt-0.5" />
          <div className="text-left">
            <div className="font-bold text-sm text-ink">1. 내 위치 GPS 전송</div>
            <div className="text-xs font-bold text-alert">전송 완료 · {currentTime}</div>
          </div>
        </div>

        {/* 2단계 */}
        <div className={`flex items-start gap-3 p-3 rounded-2xl transition-all ${
          stage >= 2 ? 'bg-surface border border-border' : 'bg-gray-50 opacity-60'
        }`}>
          <CheckCircle2 className={`w-6 h-6 flex-shrink-0 mt-0.5 ${stage >= 2 ? 'text-alert' : 'text-gray-400'}`} />
          <div className="text-left">
            <div className="font-bold text-sm text-ink">2. 119 종합상황실 구조대 연계</div>
            <div className="text-xs font-semibold text-ink2">
              {stage >= 2 ? '충북 제천소방서 전담 구조 차량 좌표 공유 완료' : '연계 대기 중...'}
            </div>
          </div>
        </div>

        {/* 3단계 */}
        <div className={`flex items-start gap-3 p-3 rounded-2xl transition-all ${
          stage >= 3 ? 'bg-alert-light/50 border border-alert/20' : 'bg-gray-50 opacity-60'
        }`}>
          <CheckCircle2 className={`w-6 h-6 flex-shrink-0 mt-0.5 ${stage >= 3 ? 'text-alert' : 'text-gray-400'}`} />
          <div className="text-left">
            <div className="font-bold text-sm text-ink">3. 덕동리 이장 및 가족 안심 알림</div>
            <div className="text-xs font-semibold text-ink2">
              {stage >= 3 ? '김영철 이장 및 등록 가족 안심 알림 발송 완료' : '알림 발송 대기...'}
            </div>
          </div>
        </div>
      </div>

      {/* 마을 안전 지킴이 메시지 카드 */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-border flex items-center gap-3.5 text-left">
        <div className="w-14 h-14 rounded-full bg-alert-light text-alert font-black flex items-center justify-center text-base flex-shrink-0">
          김영철
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-extrabold text-alert flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> 마을 안전 지킴이 (덕동리 이장)
          </div>
          <div className="font-extrabold text-base text-ink">김영철 이장</div>
          <p className="text-xs font-semibold text-ink2 mt-0.5 leading-snug">
            "어르신, 당황하지 마시고 대피소 방향 큰길로 천천히 걸어오세요. 지금 마중 나가고 있습니다."
          </p>
        </div>
      </div>

      {/* 119 통화 연결 버튼 (실제 전화 발신 차단 & 목업 통화 화면 연결) */}
      <button
        onClick={() => onStartCall('119 종합상황실 (충북 제천소방서)', '119')}
        className="w-full min-h-[76px] bg-alert hover:bg-alert-dark text-white rounded-2xl p-4 flex items-center justify-center gap-3 text-xl font-black shadow-lg shadow-alert/25 transition-transform active:scale-[0.98]"
      >
        <PhoneCall className="w-7 h-7" />
        <div className="text-left">
          <div>119 상황실 모의 통화</div>
          <div className="text-xs font-normal opacity-90">실제 발신 없는 훈련용 가상 통화 화면으로 연결됩니다</div>
        </div>
      </button>

      {/* 길안내 복귀 버튼 */}
      <button
        onClick={onBackToNav}
        className="w-full min-h-[60px] bg-ink hover:bg-gray-800 text-white rounded-2xl p-4 font-extrabold text-base flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>쉬운 길안내 화면으로 돌아가기</span>
      </button>
    </div>
  );
};