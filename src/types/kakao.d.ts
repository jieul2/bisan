export {};

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => any;
        Map: new (container: HTMLElement, options: { center: any; level: number }) => {
          panTo: (latlng: any) => void;
          setCenter: (latlng: any) => void;
        };
        Polyline: new (options: {
          path: any[];
          strokeWeight: number;
          strokeColor: string;
          strokeOpacity: number;
          strokeStyle: string;
        }) => {
          setMap: (map: any) => void;
        };
        Marker: new (options: { position: any; map: any; title?: string }) => {
          setPosition: (latlng: any) => void;
          setMap: (map: any) => void;
        };
      };
    };
  }
}
