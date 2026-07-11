import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocationPoint } from "../domain/types";

const KEY = "ewater:homeLocation:v1";

export type LocationSource = "gps";

export interface StoredLocation {
  lng: number;
  lat: number;
  source: LocationSource;
  savedAt: string;
}

export async function loadLocation(): Promise<StoredLocation | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredLocation;
  } catch {
    return null;
  }
}

export async function saveLocation(point: LocationPoint, source: LocationSource): Promise<void> {
  const stored: StoredLocation = {
    lng: point[0],
    lat: point[1],
    source,
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(stored));
}
