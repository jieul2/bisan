export type AppMode = 'normal' | 'disaster';

export type DisasterType = 'landslide' | 'flood' | 'chemical' | 'wildfire';

export interface Shelter {
  id: number;
  name: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  area: number;
  capacity: number;
  isOpen: boolean;
  facilityType: string;
  tel: string;
  manager: string;
  distance?: number;
}

export interface Waypoint {
  lat: number;
  lng: number;
  name: string;
  instruction?: string;
  distanceFromPrev?: number;
}

export interface RouteResult {
  waypoints: Waypoint[];
  polyline: { lat: number; lng: number }[];
  totalDistance: number;
  totalDuration: number;
}

export interface Resident {
  id: string;
  name: string;
  age: number;
  role?: string;
  status: 'completed' | 'moving' | 'missing';
  statusText: string;
  phone: string;
  isUrgent?: boolean;
  note?: string;
}
