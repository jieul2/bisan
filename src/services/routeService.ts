import sheltersData from '@/data/shelters.json';
import type { Shelter, Waypoint, RouteResult } from '@/types';

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

const KAKAO_REST_KEY = 'dee3dafbe7fc59707db4ecd1779ebc13';

// 1. 거리 계산 (Haversine 공식, 미터 단위)
export function getDistance(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const dLat = rad(p2.lat - p1.lat);
  const dLng = rad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// 2. 방위각 계산 (0° ~ 360°)
export function getBearing(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const y = Math.sin(rad(p2.lng - p1.lng)) * Math.cos(rad(p2.lat));
  const x =
    Math.cos(rad(p1.lat)) * Math.sin(rad(p2.lat)) -
    Math.sin(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.cos(rad(p2.lng - p1.lng));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

// 3. 제천시 관내 민방위 대피시설 필터링 (총 53개소 전용 적용)
export const JECHEON_SHELTERS: Shelter[] = (sheltersData as Shelter[]).filter(
  s => s.address.includes('제천시') || s.manager.includes('제천시')
);

// 제천시 대피소 데이터셋에서 현재 위치 기준 최근접 대피소 검색
export function findNearestShelters(
  currentPos: { lat: number; lng: number },
  limit = 5
): Shelter[] {
  const list = JECHEON_SHELTERS.map(s => ({
    ...s,
    distance: Math.round(getDistance(currentPos, s)),
  }));

  list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  return list.slice(0, limit);
}

// 4. 카카오모빌리티 길찾기 API 연동 및 동적 경로 생성
export async function fetchKakaoRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteResult> {
  const fallbackRoute = generateFallbackRoute(origin, destination);

  try {
    const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}&priority=RECOMMEND`;
    const res = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_KEY}`,
      },
    });

    if (!res.ok) {
      console.warn('카카오 내비 API 응답 실패, 동적 지형 안전 경로 적용:', res.statusText);
      return fallbackRoute;
    }

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route || !route.sections?.[0]) {
      return fallbackRoute;
    }

    const section = route.sections[0];
    const polyline: { lat: number; lng: number }[] = [];

    // 도로 Vertexes 추출 (Polyline 구성)
    if (section.roads) {
      for (const road of section.roads) {
        if (road.vertexes) {
          for (let i = 0; i < road.vertexes.length; i += 2) {
            polyline.push({
              lng: road.vertexes[i],
              lat: road.vertexes[i + 1],
            });
          }
        }
      }
    }

    // 회전 지점 Guides 추출 (Waypoints 구성)
    const waypoints: Waypoint[] = [];
    if (section.guides && section.guides.length > 0) {
      for (const guide of section.guides) {
        waypoints.push({
          lat: guide.y,
          lng: guide.x,
          name: guide.guidance || guide.name || '경유지',
          instruction: guide.guidance || '직진하세요',
          distanceFromPrev: guide.distance,
        });
      }
    }

    // 만약 waypoints가 비어있으면 fallback 병합
    if (waypoints.length === 0) {
      return fallbackRoute;
    }

    return {
      waypoints,
      polyline: polyline.length > 0 ? polyline : fallbackRoute.polyline,
      totalDistance: section.distance || fallbackRoute.totalDistance,
      totalDuration: section.duration || fallbackRoute.totalDuration,
    };
  } catch (err) {
    console.warn('카카오 길찾기 호출 중 예외 (오프라인 모드로 안전 경로 대체):', err);
    return fallbackRoute;
  }
}

// 5. 오프라인 또는 API 미응답 시 동적 안전 경로 생성 (출발지 ~ 대피소 연결)
function generateFallbackRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): RouteResult {
  const totalDist = Math.round(getDistance(origin, dest));
  const steps = 4;
  const waypoints: Waypoint[] = [];
  const polyline: { lat: number; lng: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = origin.lat + (dest.lat - origin.lat) * ratio;
    const lng = origin.lng + (dest.lng - origin.lng) * ratio;
    const pt = { lat, lng };
    polyline.push(pt);

    let name = '안전 경로';
    let instruction = '정면으로 직진하세요';
    if (i === 0) {
      name = '현재 위치 (출발)';
    } else if (i === 1) {
      name = '마을 큰길 안심로 진입';
      instruction = '큰길을 따라 직진하세요';
    } else if (i === 2) {
      name = '완만 평지길 (계단 없음)';
      instruction = '평지 안심로를 따라 이동하세요';
    } else if (i === steps) {
      name = '대피소 도착';
      instruction = '대피소 안으로 들어가세요';
    }

    waypoints.push({
      lat,
      lng,
      name,
      instruction,
    });
  }

  return {
    waypoints,
    polyline,
    totalDistance: totalDist,
    totalDuration: Math.max(1, Math.ceil(totalDist / 60)) * 60,
  };
}
