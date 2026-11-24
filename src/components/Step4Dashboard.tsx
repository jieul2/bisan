import React, { useState } from 'react';
import { Phone, AlertCircle, ArrowLeft, Send, ShieldAlert } from 'lucide-react';
import type { Resident } from '@/types';

interface Step4DashboardProps {
  onBackToMain: () => void;
  onStartCall: (name: string, number: string) => void;
}

const INITIAL_RESIDENTS: Resident[] = [
  {
    id: '1',
    name: '김순자',
    age: 78,
    status: 'completed',
    statusText: '백운면 대피소 도착 · 19:24',
    phone: '010-1234-5671',
  },
  {
    id: '2',
    name: '박영수',
    age: 81,
    status: 'completed',
    statusText: '백운면 대피소 도착 · 19:30',
    phone: '010-1234-5672',
  },
  {
    id: '3',
    name: '최정옥',
    age: 75,
    role: '보호자 동행',
    status: 'moving',
    statusText: '마을회관 앞 이동 중 (도보 4분 남음)',
    phone: '010-1234-5673',
  },
  {
    id: '4',
    name: '이갑득',
    age: 84,
    role: '독거가구',
    status: 'missing',
    statusText: '위치 수신 두절 (최종: 18:50 안방)',
    phone: '010-1234-5674',
    isUrgent: true,
  },
];

export const Step4Dashboard: React.FC<Step4DashboardProps> = ({ onBackToMain, onStartCall }) => {
  const [residents, setResidents] = useState<Resident[]>(INITIAL_RESIDENTS);
  const [isTransferred, setIsTransferred] = useState(false);
  const [checkList, setCheckList] = useState({ broadcast: true, shuttle: true });

  const total = residents.length + 20; // 가상 24명
  const completed = 21;
  const moving = 2;
  const missing = 1;
  const rate = Math.round((completed / total) * 100);

  const currentTime = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const handleTransferTo119 = () => {
    if (confirm('119 긴급 구조본부에 [이갑득 어르신 / 덕동리 142번지] 미대피자 정보를 바로 이첩하시겠습니까?')) {
      setIsTransferred(true);
      setResidents(prev =>
        prev.map(r => (r.id === '4' ? { ...r, statusText: `119 구조대 이첩 완료 (${currentTime})` } : r))
      );
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* 헤더 */}
      <div className="flex items-center justify-between text-sm font-extrabold text-alert px-1">
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-alert" />
          STEP 4 · 대피 현황 확인
        </span>
        <span className="text-ink2 font-semibold">이장 · 보호자 관제</span>
      </div>

      {/* 대피율 게이지 카드 */}
      <div className="bg-white rounded-3xl p-5 shadow-md border border-border flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs font-bold text-ink2">충북 제천시 백운면</div>
            <h2 className="text-xl font-black text-ink">마을 주민 대피 현황 (덕동리 1반)</h2>
          </div>
        </div>

        <div className="flex justify-between items-end mt-1">
          <span className="text-base font-bold text-ink2">마을 대피율</span>
          <span className="text-3xl font-black text-alert">
            {rate}% <span className="text-sm font-bold text-ink2">({completed}/{total}명)</span>
          </span>
        </div>

        {/* 3색 진행 바 (재난 모드: 완료-슬레이트, 이동-앰버, 미확인-레드) */}
        <div className="h-4 bg-gray-100 rounded-full flex overflow-hidden p-0.5 gap-1">
          <div style={{ width: '87.5%' }} className="h-full bg-ink rounded-full" />
          <div style={{ width: '8.3%' }} className="h-full bg-amber-500 rounded-full" />
          <div style={{ width: '4.2%' }} className="h-full bg-alert rounded-full" />
        </div>

        <div className="flex justify-between text-xs font-bold text-ink2 px-1">
          <span className="text-ink font-extrabold">완료 {completed}</span>
          <span className="text-amber-600 font-extrabold">이동 중 {moving}</span>
          <span className="text-alert font-extrabold">미확인 {missing}</span>
        </div>

        {/* 4분할 통계 그리드 */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          <div className="bg-surface rounded-2xl p-2.5 text-center border border-border">
            <div className="text-xs font-bold text-ink2">총 주민</div>
            <div className="text-xl font-black text-ink mt-0.5">{total}</div>
          </div>
          <div className="bg-gray-100 rounded-2xl p-2.5 text-center border border-gray-200">
            <div className="text-xs font-bold text-ink">대피완료</div>
            <div className="text-xl font-black text-ink mt-0.5">{completed}</div>
          </div>
          <div className="bg-amber-50 rounded-2xl p-2.5 text-center border border-amber-200">
            <div className="text-xs font-bold text-amber-700">이동중</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">{moving}</div>
          </div>
          <div className="bg-alert-light rounded-2xl p-2.5 text-center border border-alert/20">
            <div className="text-xs font-bold text-alert">미확인</div>
            <div className="text-xl font-black text-alert mt-0.5">{missing}</div>
          </div>
        </div>
      </div>

      {/* 미대피 주민 긴급 확인 필요 배너 */}
      <div className="bg-alert-light rounded-2xl p-4 border border-alert/30 flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="font-extrabold text-base text-alert flex items-center gap-1.5">
            <AlertCircle className="w-5 h-5 text-alert" />
            미대피 주민 긴급 확인 필요
          </span>
          <span className="bg-alert text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full">
            우선 조치
          </span>
        </div>
        <p className="text-xs font-bold text-alert/90 leading-relaxed mt-1">
          산사태 위험 지역(덕동계곡 방면) 거주 어르신 1명의 응답이 없습니다. 119 즉시 연계를 권장합니다.
        </p>
      </div>

      {/* 가구별 실시간 현황 리스트 */}
      <div className="flex flex-col gap-2">
        <h3 className="font-extrabold text-base text-ink px-1">가구별 실시간 현황</h3>

        {residents.map(r => (
          <div
            key={r.id}
            className={`p-3.5 rounded-2xl shadow-sm flex items-center gap-3 transition-colors ${
              r.isUrgent
                ? 'bg-[#fff5f4] border-2 border-alert'
                : r.status === 'moving'
                ? 'bg-white border-2 border-amber-400'
                : 'bg-white border border-border'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                r.isUrgent
                  ? 'bg-alert text-white'
                  : r.status === 'moving'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-ink'
              }`}
            >
              {r.name.slice(0, 2)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-ink">
                  {r.name} 어르신 ({r.age}세)
                </span>
                {r.role && (
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                      r.isUrgent ? 'bg-alert text-white' : 'bg-gray-100 text-ink'
                    }`}
                  >
                    {r.role}
                  </span>
                )}
              </div>
              <div
                className={`text-xs font-bold mt-0.5 truncate ${
                  r.isUrgent ? 'text-alert' : r.status === 'moving' ? 'text-amber-700' : 'text-ink2'
                }`}
              >
                {r.statusText}
              </div>
            </div>

            {/* 상태 뱃지 & 전화 버튼 (목업 통화 연동) */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {r.status === 'completed' && (
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-gray-100 text-ink">
                  완료
                </span>
              )}
              <button
                onClick={() => onStartCall(`${r.name} 어르신`, r.phone)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                  r.isUrgent ? 'bg-alert text-white' : 'bg-gray-100 text-ink'
                }`}
                title="안부 통화 (시뮬레이션)"
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 이장 현장 확인 체크박스 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-border flex flex-col gap-2">
        <div className="text-sm font-extrabold text-ink">이장 현장 확인 체크</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-xs font-bold text-ink2 bg-surface p-2.5 rounded-xl border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={checkList.broadcast}
              onChange={e => setCheckList(p => ({ ...p, broadcast: e.target.checked }))}
              className="w-4 h-4 accent-alert cursor-pointer"
            />
            마을 방송 3회 완료
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-ink2 bg-surface p-2.5 rounded-xl border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={checkList.shuttle}
              onChange={e => setCheckList(p => ({ ...p, shuttle: e.target.checked }))}
              className="w-4 h-4 accent-alert cursor-pointer"
            />
            대피소 셔틀 도착
          </label>
        </div>
      </div>

      {/* 미확인자 119 이첩 버튼 */}
      <button
        onClick={handleTransferTo119}
        disabled={isTransferred}
        className={`w-full min-h-[72px] rounded-2xl p-4 flex items-center justify-center gap-3 text-lg font-black shadow-lg transition-transform active:scale-[0.98] ${
          isTransferred ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-alert hover:bg-alert-dark text-white shadow-alert/25'
        }`}
      >
        <Send className="w-6 h-6" />
        <div className="text-left">
          <div>{isTransferred ? '119 이첩 완료' : '미확인자 119 즉시 이첩'}</div>
          <div className="text-xs font-normal opacity-90 mt-0.5">
            {isTransferred
              ? '충북 제천소방서 상황실로 데이터 전송 완료'
              : '이갑득 어르신 위치·연락처 구조대 즉시 전송'}
          </div>
        </div>
      </button>

      {/* 메인으로 돌아가기 */}
      <button
        onClick={onBackToMain}
        className="text-alert font-black text-base underline underline-offset-4 py-2 flex items-center justify-center gap-1.5"
      >
        <ArrowLeft className="w-5 h-5 text-alert" />
        대피 안내 메인 화면으로 돌아가기
      </button>
    </div>
  );
};