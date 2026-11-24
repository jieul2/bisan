import React from 'react';
import { Volume2, VolumeX, ShieldAlert, ShieldCheck, RotateCcw } from 'lucide-react';
import type { AppMode } from '@/types';

interface HeaderProps {
  appMode: AppMode;
  currentStep: number;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
  onReturnToNormal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  currentStep,
  isVoiceEnabled,
  onToggleVoice,
  onReturnToNormal,
}) => {
  const isDisaster = appMode === 'disaster';

  return (
    <header
      className={`flex items-center justify-between text-white px-4 py-3.5 rounded-2xl shadow-md mb-3 transition-all duration-300 ${
        isDisaster
          ? 'bg-gradient-to-r from-alert to-alert-dark border-b-2 border-alert-light/40 shadow-alert/20'
          : 'bg-[#004626] border-b border-primary-dark shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2">
        {isDisaster ? (
          <ShieldAlert className="w-6 h-6 text-alert-light animate-pulse flex-shrink-0" />
        ) : (
          <ShieldCheck className="w-6 h-6 text-primary-soft flex-shrink-0" />
        )}
        <span className="font-black text-xl tracking-tight">비산대피</span>

        {isDisaster ? (
          <span className="text-xs bg-white text-alert font-black px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
            🚨 재난 STEP {currentStep}
          </span>
        ) : (
          <span className="text-xs bg-white/20 text-white font-extrabold px-2.5 py-0.5 rounded-full">
            제천 안심
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* 음성 안내 토글 */}
        <button
          onClick={onToggleVoice}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            isDisaster
              ? isVoiceEnabled
                ? 'bg-white text-alert font-black shadow-sm'
                : 'bg-white/20 text-white/80'
              : isVoiceEnabled
              ? 'bg-secondary-soft text-[#3d4310] font-black'
              : 'bg-white/10 text-white/70'
          }`}
          aria-label={isVoiceEnabled ? '음성 안내 켜짐' : '음성 안내 꺼짐'}
        >
          {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">{isVoiceEnabled ? '음성 ON' : '음성 OFF'}</span>
        </button>

        {/* 재난 모드 시 평시 안전 모드로 원터치 복귀 버튼 */}
        {isDisaster && onReturnToNormal && (
          <button
            onClick={onReturnToNormal}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full font-black bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all active:scale-95"
            title="상황 종료 및 평시 복귀"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">상황 해제</span>
          </button>
        )}
      </div>
    </header>
  );
};
