import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import type { LocationPoint } from "../domain/types";
import { strings } from "../domain/i18n";
import { loadLocation, saveLocation } from "./storage";

export type LocationSource = "gps" | "manual" | "saved" | "none";

export interface CurrentLocationState {
  point: LocationPoint | null;
  source: LocationSource;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setManual: (point: LocationPoint) => Promise<void>;
}

async function fetchGps(): Promise<LocationPoint> {
  const pos = await Location.getCurrentPositionAsync({});
  return [pos.coords.longitude, pos.coords.latitude];
}

export function useCurrentLocation(): CurrentLocationState {
  const [point, setPoint] = useState<LocationPoint | null>(null);
  const [source, setSource] = useState<LocationSource>("none");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await loadLocation();
      if (cancelled) return;

      if (stored) {
        setPoint([stored.lng, stored.lat]);
        setSource("saved");
        setLoading(false);
        hydrated.current = true;

        // Best-effort silent refresh, only if permission is already granted - never re-prompt on launch.
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted" && !cancelled) {
          try {
            const gps = await fetchGps();
            if (!cancelled) {
              setPoint(gps);
              setSource("gps");
              await saveLocation(gps, "gps");
            }
          } catch {
            // Keep the saved location; silent refresh is best-effort only.
          }
        }
        return;
      }

      // First run: no saved location, ask for permission and fetch.
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) {
            setSource("none");
            setError(strings.locationPermissionDenied);
            setLoading(false);
          }
          return;
        }
        const gps = await fetchGps();
        if (!cancelled) {
          setPoint(gps);
          setSource("gps");
          await saveLocation(gps, "gps");
        }
      } catch {
        if (!cancelled) {
          setSource("none");
          setError(strings.locationFetchError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError(strings.locationPermissionDenied);
        return;
      }
      const gps = await fetchGps();
      setPoint(gps);
      setSource("gps");
      await saveLocation(gps, "gps");
    } catch {
      setError(strings.locationFetchError);
    } finally {
      setLoading(false);
    }
  }, []);

  const setManual = useCallback(async (p: LocationPoint) => {
    setPoint(p);
    setSource("manual");
    setError(null);
    await saveLocation(p, "manual");
  }, []);

  return { point, source, loading, error, refresh, setManual };
}
