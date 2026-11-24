import React, { useEffect } from 'react';
import { Flashlight as FlashlightIcon, X, Zap } from 'lucide-react';
import { useTorch } from '@/hooks/useTorch';

interface FlashlightProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Flashlight: React.FC<FlashlightProps> = ({ isOpen, onClose }) => {
  const { isTorchOn, isPhysicalTorchActive, errorMessage, turnOn, turnOff } = useTorch();

  useEffect(() => {
    if (isOpen) {
      turnOn();
    } else {
      turnOff();
    }
    return () => {
      turnOff();
    };
  }, [isOpen, turnOn, turnOff]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-white z-[99999] flex flex-col items-center justify-between text-black p-8 select-none animate-fadeIn cursor-pointer"
    >
      {/* 상단 안내 */}
      <div className="w-full flex justify-between items-center text-xs font-bold text-gray-500 pt-2">
        <span className="flex items-center gap-1">
          <FlashlightIcon className="w-4 h-4 text-amber-500" /> 비상 조명 모드
        </span>
        <button
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-black font-black"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* 중앙 텍스트 & 상태 */}
      <div className="flex flex-col items-center text-center gap-4 my-auto">
        <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center shadow-inner animate-pulse">
          <Zap className="w-12 h-12 text-amber-500" />
        </div>

        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
            {isPhysicalTorchActive ? '후면 LED 플래시 켜짐' : '화면 손전등 켜짐'}
          </h2>
          <p className="text-base sm:text-lg font-bold text-gray-700 mt-2 max-w-xs leading-snug">
            {isPhysicalTorchActive
              ? '스마트폰 후면 카메라 플래시와 화면 불빛이 함께 켜졌습니다.'
              : '어두운 야간이나 정전 시 화면 불빛으로 발밑을 비추세요.'}
          </p>
        </div>

        {errorMessage && (
          <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full mt-1">
            {errorMessage}
          </div>
        )}

        {isPhysicalTorchActive && (
          <div className="bg-amber-50 text-amber-800 text-xs font-black px-4 py-1.5 rounded-full border border-amber-200">
            ✓ 모바일 물리 LED 플래시 연동 성공
          </div>
        )}
      </div>

      {/* 하단 닫기 버튼 */}
      <div className="w-full max-w-sm pb-4">
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-black text-white font-black text-lg shadow-xl active:scale-95 transition-transform"
        >
          화면 터치하여 끄기
        </button>
      </div>
    </div>
  );
};
