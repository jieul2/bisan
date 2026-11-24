import { useEffect, useRef, useState } from 'react';
import type { Waypoint } from '@/types';

// 카카오맵 SDK가 비동기 다운로드 중일 때 안전하게 대기하여 초기화하는 헬퍼
export function loadKakaoSDK(callback: () => void) {
  if (typeof window === 'undefined') return;

  if (window.kakao && window.kakao.maps) {
    window.kakao.maps.load(callback);
    return;
  }

  let retries = 0;
  const interval = setInterval(() => {
    retries++;
    if (window.kakao && window.kakao.maps) {
      clearInterval(interval);
      window.kakao.maps.load(callback);
    } else if (retries > 50) {
      clearInterval(interval);
      console.warn('카카오맵 SDK 로딩 시간 초과 또는 도메인 미등록');
    }
  }, 100);
}

export function useKakaoMap(
  containerId: string,
  myPos: { lat: number; lng: number },
  route: Waypoint[],
  polylinePath?: { lat: number; lng: number }[],
  strokeColor: string = '#c62828'
) {
  const mapRef = useRef<any>(null);
  const myMarkerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    loadKakaoSDK(() => {
      try {
        const container = document.getElementById(containerId);
        if (!container) return;

        const center = new window.kakao!.maps.LatLng(myPos.lat, myPos.lng);
        const map = new window.kakao!.maps.Map(container, {
          center,
          level: 4,
        });
        mapRef.current = map;

        // 경로선 Polyline 그리기
        const pts = polylinePath && polylinePath.length > 0 ? polylinePath : route;
        if (pts.length > 0) {
          const path = pts.map(p => new window.kakao!.maps.LatLng(p.lat, p.lng));
          const polyline = new window.kakao!.maps.Polyline({
            path,
            strokeWeight: 6,
            strokeColor: strokeColor,
            strokeOpacity: 0.95,
            strokeStyle: 'solid',
          });
          polyline.setMap(map);
        }

        // 대피소 도착지 마커
        if (route.length > 0) {
          const dest = route[route.length - 1];
          const destPos = new window.kakao!.maps.LatLng(dest.lat, dest.lng);
          new window.kakao!.maps.Marker({
            position: destPos,
            map,
            title: dest.name,
          });
        }

        // 내 위치 마커
        const myMarker = new window.kakao!.maps.Marker({
          position: center,
          map,
          title: '내 위치',
        });
        myMarkerRef.current = myMarker;

        setIsLoaded(true);
      } catch (e) {
        console.warn('카카오맵 렌더링 중 오류 (오프라인 모드로 지속):', e);
      }
    });
  }, [containerId, route, polylinePath, strokeColor]);

  // 위치 변경 시 마커와 지도 이동 (panTo)
  useEffect(() => {
    if (mapRef.current && myMarkerRef.current && window.kakao?.maps) {
      try {
        const newPos = new window.kakao.maps.LatLng(myPos.lat, myPos.lng);
        myMarkerRef.current.setPosition(newPos);
        mapRef.current.panTo(newPos);
      } catch (e) {
        // Safe fail
      }
    }
  }, [myPos.lat, myPos.lng]);

  return { isMapLoaded: isLoaded };
}
