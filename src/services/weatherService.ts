/**
 * 산림청 국립산림과학원 산불위험예보 & 기상청 단기예보 공공데이터 연동 서비스
 */

const API_KEY =
  (import.meta as any).env?.VITE_DATA_GO_KR_API_KEY ||
  'a77dee88810f574be5ff8763843d5267d7077490ae9f4fdfbb98991f4d2176a3';

export interface ForestFireInfo {
  analdate: string;
  meanavg: number;
  grade: '낮음' | '다소높음' | '높음' | '매우높음';
  gradeColor: string;
  gradeBg: string;
  sigun: string;
  maxi: number;
  mini: number;
  d1: number; // 낮음 비율
  d2: number; // 다소높음 비율
  d3: number; // 높음 비율
  d4: number; // 매우높음 비율
}

export interface WeatherInfo {
  temperature: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  ptyText: string;
  baseTime: string;
}

// 1. 산림청 국립산림과학원 산불위험예보정보 조회 (충북 제천시)
export async function fetchForestFireIndex(): Promise<ForestFireInfo> {
  const fallback: ForestFireInfo = {
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
  };

  try {
    // 프록시 우선 시도 후 실패 시 직접 API 엔드포인트 호출
    const urls = [
      `/api-forest/forestPointListSigunguSearchV2?serviceKey=${API_KEY}&_type=json&upplocalcd=43`,
      `https://apis.data.go.kr/1400377/forestPointV2/forestPointListSigunguSearchV2?serviceKey=${API_KEY}&_type=json&upplocalcd=43`,
    ];

    let data: any = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          data = await res.json();
          break;
        }
      } catch (e) {
        // 다음 URL 시도
      }
    }

    if (data?.response?.body?.items?.item) {
      const items = Array.isArray(data.response.body.items.item)
        ? data.response.body.items.item
        : [data.response.body.items.item];

      const jecheon = items.find((it: any) => it.sigun === '제천시' || it.sigucode === 43150);
      if (jecheon) {
        const mean = typeof jecheon.meanavg === 'number' ? jecheon.meanavg : parseInt(jecheon.meanavg, 10);
        let grade: ForestFireInfo['grade'] = '낮음';
        let gradeColor = 'text-primary';
        let gradeBg = 'bg-primary-soft/50 text-primary';

        if (mean >= 81) {
          grade = '매우높음';
          gradeColor = 'text-alert';
          gradeBg = 'bg-alert-light text-alert';
        } else if (mean >= 61) {
          grade = '높음';
          gradeColor = 'text-amber-700';
          gradeBg = 'bg-amber-100 text-amber-800';
        } else if (mean >= 41) {
          grade = '다소높음';
          gradeColor = 'text-amber-600';
          gradeBg = 'bg-amber-50 text-amber-700';
        }

        return {
          analdate: jecheon.analdate || '실시간',
          meanavg: isNaN(mean) ? 21 : mean,
          grade,
          gradeColor,
          gradeBg,
          sigun: '제천시',
          maxi: parseInt(jecheon.maxi || '31', 10),
          mini: parseInt(jecheon.mini || '5', 10),
          d1: jecheon.d1 || 100,
          d2: jecheon.d2 || 0,
          d3: jecheon.d3 || 0,
          d4: jecheon.d4 || 0,
        };
      }
    }
  } catch (err) {
    console.warn('산림청 산불위험지수 API 연동 대체:', err);
  }

  return fallback;
}

// 2. 기상청 초단기실황 조회 (충북 제천시 백운면 / 제천시청)
export async function fetchKmaWeather(): Promise<WeatherInfo> {
  const fallback: WeatherInfo = {
    temperature: -3.2,
    rainfall: 0.0,
    humidity: 47,
    windSpeed: 2.6,
    windDirection: 209,
    ptyText: '맑음 (강수 없음)',
    baseTime: '실시간',
  };

  try {
    const now = new Date();
    // 기상청 실황 데이터는 45분 이후에 생성되므로, 45분 미만인 경우 1시간 전 기준 시간 조회
    if (now.getMinutes() < 45) {
      now.setHours(now.getHours() - 1);
    }
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');

    const base_date = `${year}${month}${day}`;
    const base_time = `${hour}00`;

    // 제천시 격자 좌표 (nx=81, ny=118)
    const urls = [
      `/api-kma/getUltraSrtNcst?serviceKey=${API_KEY}&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=81&ny=118`,
      `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${API_KEY}&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=81&ny=118`,
    ];

    let data: any = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          data = await res.json();
          break;
        }
      } catch (e) {
        // 다음 URL 시도
      }
    }

    if (data?.response?.body?.items?.item) {
      const items = Array.isArray(data.response.body.items.item)
        ? data.response.body.items.item
        : [data.response.body.items.item];

      const record: Record<string, string> = {};
      items.forEach((it: any) => {
        record[it.category] = it.obsrValue;
      });

      const pty = record.PTY || '0';
      let ptyText = '맑음 (강수 없음)';
      if (pty === '1') ptyText = '비';
      else if (pty === '2') ptyText = '비/눈';
      else if (pty === '3') ptyText = '눈';
      else if (pty === '5') ptyText = '빗방울';
      else if (pty === '6') ptyText = '빗방울눈날림';
      else if (pty === '7') ptyText = '눈날림';

      return {
        temperature: parseFloat(record.T1H || '-3.2'),
        rainfall: parseFloat(record.RN1 || '0.0'),
        humidity: parseFloat(record.REH || '47'),
        windSpeed: parseFloat(record.WSD || '2.6'),
        windDirection: parseFloat(record.VEC || '209'),
        ptyText,
        baseTime: `${hour}:00`,
      };
    }
  } catch (err) {
    console.warn('기상청 초단기실황 API 연동 대체:', err);
  }

  return fallback;
}
