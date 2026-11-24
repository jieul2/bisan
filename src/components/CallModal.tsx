import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, ShieldAlert, Radio } from 'lucide-react';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  targetNumber: string;
  userCoords?: { lat: number; lng: number };
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  targetName,
  targetNumber,
  userCoords = { lat: 37.1315, lng: 128.23 },
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  // 통화 타이머
  useEffect(() => {
    if (!isOpen) {
      setSeconds(0);
      return;
    }

    const interval = window.setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isOpen]);

  // 가상 119 상황실 음성 안내 (최초 연결 시 1회)
  useEffect(() => {
    if (!isOpen) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text =
        targetNumber === '119'
          ? '119 종합상황실입니다. 어르신, 현재 계신 정확한 위치 좌표가 확인되었습니다. 안전한 대피소 방향으로 이동하세요.'
          : `${targetName}님과 통화가 연결되었습니다.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, targetName, targetNumber]);

  if (!isOpen) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const is119 = targetNumber === '119' || targetName.includes('119');

  return (
    <div className="fixed inset-0 bg-[#0c131f] z-[9999] flex flex-col justify-between text-white p-6 select-none animate-fadeIn">
      {/* 상단 훈련 모의 배너 (법적·안전 고지) */}
      <div className="bg-alert/90 text-white text-xs font-black py-2 px-4 rounded-full mx-auto flex items-center gap-2 shadow-lg border border-alert-light/30">
        <ShieldAlert className="w-4 h-4 text-alert-light" />
        <span>[안전 훈련 시뮬레이션] 실제 119로 발신되지 않는 가상 통화 화면입니다</span>
      </div>

      {/* 중앙 상대방 정보 및 통화 시간 */}
      <div className="flex flex-col items-center gap-3 my-auto">
        <div
          className={`w-28 h-28 rounded-full flex items-center justify-center font-black text-3xl shadow-2xl ${
            is119 ? 'bg-alert text-white animate-pulse' : 'bg-primary text-white'
          }`}
        >
          {is119 ? '119' : targetName.slice(0, 2)}
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight">{targetName}</h2>
          <div className="text-lg font-bold text-gray-400 mt-1">{targetNumber}</div>
        </div>

        <div className="flex items-center gap-2 text-base font-extrabold text-primary-soft">
          <Radio className="w-4 h-4 animate-ping" />
          <span>통화 중 · {formatTime(seconds)}</span>
        </div>

        {/* 내 정밀 위치 상황실 자동 전송 표시 */}
        <div className="bg-white/10 rounded-2xl p-4 max-w-sm w-full text-center border border-white/10 mt-2">
          <div className="text-xs font-bold text-gray-300">상황실 모니터에 실시간 좌표 표출 중</div>
          <div className="text-sm font-extrabold text-white mt-1">
            위도 {userCoords.lat.toFixed(5)}, 경도 {userCoords.lng.toFixed(5)}
          </div>
          <div className="text-xs text-secondary-soft font-semibold mt-0.5">
            ✓ 백운면 전담 119 구조 차량과 좌표 실시간 공유 중
          </div>
        </div>
      </div>

      {/* 하단 통화 제어 버튼들 */}
      <div className="flex flex-col gap-6 max-w-sm w-full mx-auto pb-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className={`py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
              isMuted ? 'bg-alert text-white' : 'bg-white/10 text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            <span className="text-xs">{isMuted ? '음소거 됨' : '음소거'}</span>
          </button>

          <button
            onClick={() => setIsSpeaker(prev => !prev)}
            className={`py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
              isSpeaker ? 'bg-primary-soft text-primary' : 'bg-white/10 text-white'
            }`}
          >
            {isSpeaker ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            <span className="text-xs">{isSpeaker ? '스피커폰 ON' : '스피커폰'}</span>
          </button>
        </div>

        {/* 통화 종료 버튼 (초대형 붉은 버튼) */}
        <button
          onClick={onClose}
          className="w-full min-h-[72px] bg-alert hover:bg-alert-dark active:scale-[0.98] text-white rounded-full flex items-center justify-center gap-3 text-xl font-black shadow-2xl transition-all"
        >
          <PhoneOff className="w-7 h-7" />
          <span>통화 종료 (화면 닫기)</span>
        </button>
      </div>
    </div>
  );
};
