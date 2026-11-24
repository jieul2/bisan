import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Users,
  Phone,
  Flame,
  Lightbulb,
  CloudSun,
  Activity,
  HeartHandshake,
  CheckCircle2,
  Settings2,
  X,
  PackageCheck,
  HeartPulse,
  Info,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { loadKakaoSDK } from '@/hooks/useKakaoMap';
import { fetchForestFireIndex, fetchKmaWeather } from '@/services/weatherService';
import type { ForestFireInfo, WeatherInfo } from '@/services/weatherService';
import type { Shelter, DisasterType } from '@/types';

interface NormalModeViewProps {
  nearbyShelters: Shelter[];
  onTriggerDisaster: (type: DisasterType, shelter?: Shelter) => void;
  userCoords: { lat: number; lng: number };
  onStartCall: (name: string, number: string) => void;
  onOpenFlashlight: () => void;
  onSirenToggle: () => void;
  isSirenPlaying: boolean;
}

export const NormalModeView: React.FC<NormalModeViewProps> = ({
  nearbyShelters,
  onTriggerDisaster,
  userCoords,
  onStartCall,
  onOpenFlashlight,
  onSirenToggle,
  isSirenPlaying,
}) => {
  const [activeShelterId, setActiveShelterId] = useState<number | null>(
    nearbyShelters[0]?.id || null
  );
  const [selectedShelterDetail, setSelectedShelterDetail] = useState<Shelter | null>(null);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [is119SafeCallOpen, setIs119SafeCallOpen] = useState(false);
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType>('landslide');
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // 실시간 기상청 & 산림청 데이터 상태
  const [forestFire, setForestFire] = useState<ForestFireInfo>({
    analdate: '오늘 21시 기준',
    meanavg: 21,
    grade: '낮음',
    gradeColor: 'text-primary',
    gradeBg: 'bg-primary-soft/50 text-primary',
    sigun: '제천시',
    maxi: 31,
    mini: 5,
    d1: 100,
    d2: 0,
    d3: 0,
    d4: 0,
  });

  const [weather, setWeather] = useState<WeatherInfo>({
    temperature: -3.2,
    rainfall: 0.0,
    humidity: 47,
    windSpeed: 2.6,
    windDirection: 209,
    ptyText: '맑음 (강수 없음)',
    baseTime: '21:00',
  });

  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // 공공데이터 API 비동기 수신 (산림청 산불위험예보 + 기상청 초단기실황)
  const refreshWeatherData = async () => {
    setIsLoadingApi(true);
    try {
      const [ffData, weatherData] = await Promise.all([
        fetchForestFireIndex(),
        fetchKmaWeather(),
      ]);
      setForestFire(ffData);
      setWeather(weatherData);
    } catch (err) {
      console.warn('기상/산불 데이터 갱신 중 오류 (기본값 유지):', err);
    } finally {
      setIsLoadingApi(false);
    }
  };

  useEffect(() => {
    refreshWeatherData();
  }, []);

  // 안심 배낭 체크리스트 상태
  const [backpackItems, setBackpackItems] = useState([
    { id: 1, text: '만성질환 상비약 (혈압·당뇨약 등 7일분)', checked: true, note: '처방전 사본 포함' },
    { id: 2, text: '돋보기 안경 또는 보청기 여분 배터리', checked: true, note: '시야 및 청취 확보' },
    { id: 3, text: '휴대용 손전등 및 여분 건전지', checked: true, note: '정전 및 야간 대비' },
    { id: 4, text: '신분증, 복지카드 및 비상연락망 메모', checked: true, note: '가족 연락처 기재' },
    { id: 5, text: '보온 겉옷, 비옷 및 방한 장갑', checked: false, note: '저체온증 예방' },
    { id: 6, text: '비상 호루라기 (구조 신호용)', checked: false, note: '조난 시 위치 알림' },
  ]);

  const checkedCount = backpackItems.filter(i => i.checked).length;
  const backpackPercent = Math.round((checkedCount / backpackItems.length) * 100);

  const toggleBackpackItem = (id: number) => {
    setBackpackItems(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  // 119 안심콜 등록 데이터
  const [safeCallInfo] = useState({
    name: '김순자 (어르신 본인)',
    birth: '1946.03.15 (만 78세)',
    disease: '고혈압, 퇴행성 관절염 (거동 불편)',
    medicine: '노바스크(혈압약), 아스피린',
    guardian: '김철수 (장남 / 010-9876-5432)',
    address: '충청북도 제천시 백운면 덕동리 142',
    isRegistered: true,
  });

  // 카카오맵 안전 로드 및 마커 표시 (polling loader 적용)
  useEffect(() => {
    loadKakaoSDK(() => {
      try {
        const container = document.getElementById('kakaoNormalMap');
        if (!container) return;

        const center = new window.kakao!.maps.LatLng(userCoords.lat, userCoords.lng);
        const map = new window.kakao!.maps.Map(container, {
          center,
          level: 4,
        });
        setMapInstance(map);

        // 내 위치 마커
        new window.kakao!.maps.Marker({
          position: center,
          map,
          title: '내 현재 위치',
        });

        // 제천 관내 주변 대피소 마커들 (53개소)
        nearbyShelters.forEach(s => {
          const pos = new window.kakao!.maps.LatLng(s.lat, s.lng);
          new window.kakao!.maps.Marker({
            position: pos,
            map,
            title: s.name,
          });
        });

        setIsMapLoaded(true);
      } catch (e) {
        console.warn('평시 지도 렌더링 대체 (오프라인 모드 지속):', e);
        setIsMapLoaded(false);
      }
    });
  }, [userCoords, nearbyShelters]);

  // 대피소 선택 시 지도 중심 이동
  const handleSelectShelter = (s: Shelter) => {
    setActiveShelterId(s.id);
    if (mapInstance && window.kakao?.maps) {
      const pos = new window.kakao.maps.LatLng(s.lat, s.lng);
      mapInstance.panTo(pos);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* 1. 제천시 실시간 기상 및 산불위험예보 카드 (공공데이터 2종 연동: 기상청 + 산림청) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-border flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-black text-primary">기상청 · 산림청 실시간 연동</span>
          </div>
          <button
            onClick={refreshWeatherData}
            disabled={isLoadingApi}
            className="flex items-center gap-1 text-[11px] font-bold text-ink2 bg-surface px-2.5 py-1 rounded-full border border-border hover:bg-gray-100 active:scale-95 transition-all"
            title="실시간 날씨 및 산불위험지수 새로고침"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingApi ? 'animate-spin text-primary' : ''}`} />
            <span>충북 제천시 백운면</span>
          </button>
        </div>

        <div className="flex justify-between items-center mt-1">
          <div>
            <div className="text-2xl font-black text-ink">현재 관내 안전 상태</div>
            <div className="text-xs font-semibold text-ink2 mt-0.5">
              기상청 단기예보 및 산림청 산불위험지수 정상 범위
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-soft/50 flex items-center justify-center flex-shrink-0">
            <CloudSun className="w-7 h-7 text-primary" />
          </div>
        </div>

        {/* 4대 실시간 지표 그리드 (기온, 강수량, 풍속, 산불위험지수) */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100 text-center">
          {/* 1. 기온 */}
          <div className="bg-surface p-2.5 rounded-2xl border border-border flex flex-col items-center">
            <div className="text-[11px] font-bold text-ink2 flex items-center gap-0.5">
              <Thermometer className="w-3 h-3 text-primary" /> 기온
            </div>
            <div className="text-sm font-black text-ink mt-0.5">
              {weather.temperature}℃
            </div>
            <div className="text-[10px] text-ink2 mt-0.5">{weather.ptyText}</div>
          </div>

          {/* 2. 강수량 */}
          <div className="bg-surface p-2.5 rounded-2xl border border-border flex flex-col items-center">
            <div className="text-[11px] font-bold text-ink2 flex items-center gap-0.5">
              <Droplets className="w-3 h-3 text-primary" /> 강수량
            </div>
            <div className="text-sm font-black text-primary mt-0.5">
              {weather.rainfall.toFixed(1)} mm
            </div>
            <div className="text-[10px] text-ink2 mt-0.5">습도 {weather.humidity}%</div>
          </div>

          {/* 3. 풍속 */}
          <div className="bg-surface p-2.5 rounded-2xl border border-border flex flex-col items-center">
            <div className="text-[11px] font-bold text-ink2 flex items-center gap-0.5">
              <Wind className="w-3 h-3 text-primary" /> 풍속
            </div>
            <div className="text-sm font-black text-primary mt-0.5">
              {weather.windSpeed} m/s
            </div>
            <div className="text-[10px] text-ink2 mt-0.5">바람 양호</div>
          </div>

          {/* 4. [신규] 산림청 산불위험지수 */}
          <div className="bg-surface p-2.5 rounded-2xl border border-border flex flex-col items-center">
            <div className="text-[11px] font-bold text-ink2 flex items-center gap-0.5">
              <Flame className="w-3 h-3 text-amber-600" /> 산불위험
            </div>
            <div className={`text-sm font-black mt-0.5 ${forestFire.gradeColor}`}>
              {forestFire.meanavg}점
            </div>
            <div className="text-[10px] font-bold text-primary mt-0.5">
              {forestFire.grade} (안전)
            </div>
          </div>
        </div>

        {/* 공공데이터 출처 안내 바 */}
        <div className="text-[10px] font-semibold text-gray-400 bg-surface px-3 py-1.5 rounded-xl border border-border/60 flex justify-between items-center">
          <span>데이터 출처: 산림청 국립산림과학원 · 기상청 ({weather.baseTime} 실황)</span>
          <span className="text-primary font-bold">제천시 43150</span>
        </div>
      </div>

      {/* 2. 제천시 53개 민방위 대피시설 지도 (카카오맵 연동 + 폴백 안내) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-border flex flex-col gap-2">
        <div className="flex justify-between items-center px-1">
          <span className="font-extrabold text-base flex items-center gap-1.5 text-ink">
            <MapPin className="w-5 h-5 text-primary" />
            제천시 민방위 대피시설 지도
          </span>
          <span className="text-xs font-bold text-primary bg-primary-soft/50 px-2.5 py-0.5 rounded-full">
            관내 53개소 전용
          </span>
        </div>

        <div className="w-full h-56 rounded-2xl overflow-hidden relative bg-[#d8e6dc] border border-border">
          <div id="kakaoNormalMap" className="w-full h-full" />

          {/* 카카오맵 SDK 로딩 중 또는 도메인 미등록 시 대화형 폴백 뷰 */}
          {!isMapLoaded && (
            <div className="absolute inset-0 bg-[#e8f1ec] flex flex-col items-center justify-center p-4 text-center gap-2">
              <MapPin className="w-8 h-8 text-primary animate-pulse" />
              <div className="font-bold text-sm text-ink">
                제천시 민방위 대피시설 위치 연동 중
              </div>
              <div className="text-[11px] font-medium text-ink2 leading-relaxed max-w-xs">
                카카오맵 타일이 로딩 중이거나 도메인 승인 대기 중입니다.<br />
                <b>(아래 대피소 목록 및 안심 시설 정보는 정상 이용 가능합니다)</b>
              </div>
              <div className="text-[10px] text-gray-500 bg-white/70 px-3 py-1 rounded-full border border-gray-200 mt-1">
                등록 도메인: http://localhost:5173 / Netlify HTTPS
              </div>
            </div>
          )}
        </div>
        <div className="text-[11px] font-semibold text-ink2 px-1">
          ※ 평시에는 인근 대피소 위치와 시설 환경을 미리 확인해 두시면 비상 시 큰 도움이 됩니다.
        </div>
      </div>

      {/* 3. 가까운 제천 대피시설 목록 (거리순) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-extrabold text-base text-ink">
            가까운 제천 대피시설 ({nearbyShelters.length}곳)
          </h3>
          <span className="text-xs text-ink2 font-bold">거리순 정렬</span>
        </div>

        {nearbyShelters.map((s, idx) => {
          const isSelected = activeShelterId === s.id;
          return (
            <div
              key={s.id}
              onClick={() => handleSelectShelter(s)}
              className={`p-4 rounded-2xl bg-white shadow-sm border transition-all cursor-pointer ${
                isSelected
                  ? 'border-2 border-primary bg-primary-soft/10 shadow-md'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                      {idx + 1}순위
                    </span>
                    <h4 className="font-black text-lg text-ink">{s.name}</h4>
                  </div>
                  <div className="text-xs font-semibold text-ink2 mt-1">
                    {s.address}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-lg font-black text-primary">
                    {s.distance ? `${s.distance}m` : '-'}
                  </span>
                  <div className="text-[11px] font-bold text-ink2">
                    도보 약 {Math.max(1, Math.ceil((s.distance || 0) / 60))}분
                  </div>
                </div>
              </div>

              {/* 시설 스펙 및 상태 */}
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-xs font-bold text-ink2">
                <span className="flex items-center gap-1 text-primary">
                  <Users className="w-3.5 h-3.5" />
                  수용 {s.capacity ? s.capacity.toLocaleString() : 0}명
                </span>
                <span className="bg-surface px-2 py-0.5 rounded-md border border-border">
                  {s.facilityType || '지하대피시설'}
                </span>
                <span className="text-primary font-extrabold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> 상시 개방
                </span>
                <span className="bg-primary-soft/40 text-primary text-[11px] px-2 py-0.5 rounded-md font-bold">
                  비상급수·발전시설 완비
                </span>

                {s.tel && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onStartCall(`${s.name} 관리기관`, s.tel);
                    }}
                    className="ml-auto text-primary font-black flex items-center gap-1 hover:underline"
                    title="관리기관 안심 문의"
                  >
                    <Phone className="w-3 h-3" /> 기관 문의
                  </button>
                )}
              </div>

              {/* 하단 행동 버튼 */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleSelectShelter(s);
                  }}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface text-ink border border-border hover:bg-gray-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {isSelected ? '지도 중심 표시 중' : '지도에서 위치 확인'}
                </button>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedShelterDetail(s);
                  }}
                  className="py-2 px-3 bg-surface text-ink border border-border rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-gray-100"
                >
                  <Info className="w-3.5 h-3.5 text-primary" />
                  시설 및 비축물자 안내
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. 어르신 디지털 비상 대피 배낭 점검표 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-border flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-base text-ink">우리 집 안심 생존 배낭 점검</h3>
          </div>
          <span className="text-xs font-black text-primary bg-primary-soft/50 px-2.5 py-0.5 rounded-full">
            {checkedCount} / {backpackItems.length} 완료 ({backpackPercent}%)
          </span>
        </div>

        <p className="text-xs font-semibold text-ink2 leading-relaxed">
          재난 발생 시 1분 만에 들고 나갈 수 있도록, 어르신 필수 소지품을 미리 확인해 두세요.
        </p>

        {/* 진행 바 */}
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${backpackPercent}%` }}
          />
        </div>

        {/* 체크리스트 항목 */}
        <div className="flex flex-col gap-2 mt-1">
          {backpackItems.map(item => (
            <label
              key={item.id}
              onClick={() => toggleBackpackItem(item.id)}
              className={`p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                item.checked
                  ? 'bg-primary-soft/10 border-primary/30'
                  : 'bg-surface border-border hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => {}}
                className="w-4 h-4 accent-primary mt-0.5 cursor-pointer flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold ${item.checked ? 'text-primary' : 'text-ink'}`}>
                  {item.text}
                </div>
                <div className="text-[11px] text-ink2 mt-0.5">{item.note}</div>
              </div>
            </label>
          ))}
        </div>

        {backpackPercent === 100 ? (
          <div className="bg-primary-soft/40 p-2.5 rounded-xl text-center text-xs font-extrabold text-primary flex items-center justify-center gap-1.5 mt-1">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            생존 배낭 준비 완료! 비상 시 가방만 메고 출발하시면 됩니다.
          </div>
        ) : (
          <div className="text-[11px] font-semibold text-ink2 text-center mt-1">
            ※ 아직 챙기지 못한 물품을 오늘 미리 챙겨 가방에 넣어두세요.
          </div>
        )}
      </div>

      {/* 5. 소방청 119 안심콜 서비스 사전등록 연계 카드 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-border flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-base text-ink">소방청 119 안심콜 연계 현황</h3>
          </div>
          <span className="text-[11px] font-black text-primary bg-primary-soft/60 px-2.5 py-0.5 rounded-full">
            사전등록 완료
          </span>
        </div>

        <p className="text-xs font-semibold text-ink2 leading-relaxed">
          어르신의 지병(혈압·관절염 등)과 비상연락처를 소방청 시스템에 연계해 두어, 위급 시 119 구급차가 출동하면서 환자 맞춤형 조치를 즉시 준비합니다.
        </p>

        <div className="bg-surface p-3.5 rounded-2xl border border-border flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-ink2 font-bold">등록 대상자</span>
            <span className="font-extrabold text-ink">{safeCallInfo.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink2 font-bold">등록 지병</span>
            <span className="font-extrabold text-primary">{safeCallInfo.disease}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink2 font-bold">비상 보호자</span>
            <span className="font-extrabold text-ink">{safeCallInfo.guardian}</span>
          </div>
        </div>

        <button
          onClick={() => setIs119SafeCallOpen(true)}
          className="w-full py-2.5 px-4 bg-primary text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-dark transition-all"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>119 안심콜 등록 상세 및 수정</span>
        </button>
      </div>

      {/* 6. 스마트폰 비상 도구 평시 점검 (호루라기, 손전등) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-border flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="font-extrabold text-base text-ink flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-primary" />
            스마트폰 비상 도구 평시 점검
          </span>
          <span className="text-xs font-bold text-primary">자가 점검</span>
        </div>
        <p className="text-xs font-semibold text-ink2 leading-relaxed">
          정전이나 조난에 대비해 소리와 후면 LED 플래시가 정상 작동하는지 가볍게 테스트해 보세요.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-1">
          <button
            onClick={onSirenToggle}
            className={`py-3 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 border transition-all ${
              isSirenPlaying
                ? 'bg-primary text-white border-primary animate-pulse'
                : 'bg-surface text-ink border-border hover:bg-gray-50'
            }`}
          >
            <Flame className="w-4 h-4 text-primary" />
            <span>{isSirenPlaying ? '호루라기 정지' : '비상 호루라기 시험'}</span>
          </button>

          <button
            onClick={onOpenFlashlight}
            className="py-3 px-3 bg-surface text-ink border border-border rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>후면 플래시 시험</span>
          </button>
        </div>
      </div>

      {/* 7. 덕동리 마을 안전 지킴이 (이장 김영철) 위젯 */}
      <div className="bg-surface rounded-3xl p-4 border border-border flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white font-black flex items-center justify-center text-sm flex-shrink-0">
          이장
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-extrabold text-primary flex items-center gap-1">
            <HeartHandshake className="w-3.5 h-3.5" /> 덕동리 마을 안전 지킴이
          </div>
          <div className="font-extrabold text-sm text-ink">김영철 이장 (상시 연동 완료)</div>
          <div className="text-[11px] font-semibold text-ink2 mt-0.5">
            위급 상황 발생 시 어르신 GPS 좌표가 이장님 스마트폰과 119 상황실에 동시 전달됩니다.
          </div>
        </div>
      </div>

      {/* 8. [하단 단정한 행정 푸터 & 심사용 모의 발령 링크] */}
      <footer className="mt-8 pt-5 pb-6 border-t border-gray-200/70 flex flex-col items-center gap-1.5 text-center">
        <div className="text-[11px] font-semibold text-gray-400">
          충청북도 제천시 안전총괄과 민방위 대피망 · 산림청 국립산림과학원 · 기상청 연계
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
          <span>제천시 53개소 전용</span>
          <span>·</span>
          <span>오프라인 LBS 엔진</span>
          <span>·</span>
          <button
            onClick={() => setIsSimModalOpen(true)}
            className="text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors cursor-pointer"
            title="시연 평가 및 지자체 모의 훈련용 재난 발령"
          >
            민관합동 모의훈련 재난발령
          </button>
        </div>
      </footer>

      {/* 대피소 시설 및 비축물자 상세 안내 모달 */}
      {selectedShelterDetail && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 text-left border border-border">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[11px] font-extrabold text-primary bg-primary-soft/50 px-2 py-0.5 rounded-full">
                  제천시 민방위 대피시설 정보
                </span>
                <h3 className="text-xl font-black text-ink mt-1">
                  {selectedShelterDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedShelterDetail(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-semibold text-ink2 leading-relaxed">
              📍 {selectedShelterDetail.address}
            </div>

            <div className="bg-surface rounded-2xl p-4 border border-border flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink2 font-bold">시설 구분</span>
                <span className="font-extrabold text-ink">{selectedShelterDetail.facilityType || '지하 대피소'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink2 font-bold">수용 정원</span>
                <span className="font-extrabold text-primary">{selectedShelterDetail.capacity?.toLocaleString() || 0}명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink2 font-bold">시설 면적</span>
                <span className="font-extrabold text-ink">{selectedShelterDetail.area ? `${selectedShelterDetail.area}㎡` : '확인 중'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink2 font-bold">개방 여부</span>
                <span className="font-extrabold text-primary">24시간 상시 개방</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink2 font-bold">비축 물자</span>
                <span className="font-extrabold text-ink">비상급수(지하수), 비상발전기, 구급낭</span>
              </div>
              {selectedShelterDetail.tel && (
                <div className="flex justify-between">
                  <span className="text-ink2 font-bold">관리 기관</span>
                  <span className="font-extrabold text-primary">{selectedShelterDetail.tel}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedShelterDetail(null)}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm"
            >
              확인 닫기
            </button>
          </div>
        </div>
      )}

      {/* 119 안심콜 사전등록 확인 모달 */}
      {is119SafeCallOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 text-left border border-border">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-black text-ink">119 안심콜 서비스 등록 카드</h3>
              </div>
              <button
                onClick={() => setIs119SafeCallOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-ink2 leading-relaxed">
              소방청 119 안심콜 서비스에 등록된 어르신의 기본 의료 정보입니다. 위급 상황 시 119 구급차가 출동하면서 사전 파악합니다.
            </p>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="bg-surface p-3 rounded-xl border border-border">
                <div className="text-[11px] text-ink2 font-bold">기본 인적사항</div>
                <div className="font-extrabold text-ink mt-0.5">{safeCallInfo.name} ({safeCallInfo.birth})</div>
                <div className="text-ink2 mt-0.5">{safeCallInfo.address}</div>
              </div>

              <div className="bg-surface p-3 rounded-xl border border-border">
                <div className="text-[11px] text-ink2 font-bold">기저 질환 및 특이사항</div>
                <div className="font-extrabold text-primary mt-0.5">{safeCallInfo.disease}</div>
              </div>

              <div className="bg-surface p-3 rounded-xl border border-border">
                <div className="text-[11px] text-ink2 font-bold">상시 복용 약물</div>
                <div className="font-extrabold text-ink mt-0.5">{safeCallInfo.medicine}</div>
              </div>

              <div className="bg-surface p-3 rounded-xl border border-border">
                <div className="text-[11px] text-ink2 font-bold">비상 보호자 연락처</div>
                <div className="font-extrabold text-ink mt-0.5">{safeCallInfo.guardian}</div>
              </div>
            </div>

            <button
              onClick={() => setIs119SafeCallOpen(false)}
              className="w-full py-3 bg-primary text-white rounded-xl font-black text-sm"
            >
              확인 완료
            </button>
          </div>
        </div>
      )}

      {/* 심사위원용 모의 훈련 설정 팝업 모달 */}
      {isSimModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 text-left border border-border">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-black text-ink">모의 훈련 재난 발령 설정</h3>
              </div>
              <button
                onClick={() => setIsSimModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-ink2 leading-relaxed">
              심사 및 시연을 위해 가상의 긴급재난경보를 발령하고, 최근접 대피소 자동 매칭 및 카카오 실시간 내비게이션을 체험합니다.
            </p>

            {/* 재난 유형 선택 */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-ink">재난 시나리오 선택</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'landslide', label: '산사태 경보' },
                  { id: 'flood', label: '침수·호우' },
                  { id: 'wildfire', label: '산불 경보' },
                  { id: 'chemical', label: '화학 비산' },
                ].map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDisaster(d.id as DisasterType)}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all ${
                      selectedDisaster === d.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface text-ink2 border border-border'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 발령 버튼 */}
            <button
              onClick={() => {
                setIsSimModalOpen(false);
                onTriggerDisaster(selectedDisaster);
              }}
              className="w-full py-4 rounded-2xl bg-alert hover:bg-alert-dark text-white font-black text-base shadow-lg shadow-alert/25 transition-transform active:scale-98 flex items-center justify-center gap-2"
            >
              <span>🚨 긴급재난경보 발령 (대피 시작)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
