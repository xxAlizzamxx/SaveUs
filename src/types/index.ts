export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  initials: string;
}

export interface EvidenceRecord {
  id: string;
  title: string;
  date: string;
  duration: number;
  type: 'video' | 'audio' | 'photo';
  blobUrl: string;
  size: number;
}

export interface AiLogEntry {
  time: string;
  message: string;
  danger: boolean;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface SOSOrigin {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}
