import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { useAppStore } from "../stores/appStore";
import { useAuth } from "./useAuth";
import { supabase } from "../lib/supabase";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  hasPermission: boolean | null; // null = not yet asked
  loading: boolean;
}

/**
 * Round coordinates to ~2 decimal places (~1.1km precision).
 * Enough for "8 min away" but not their front door.
 */
function roundCoord(val: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

export function useLocation() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const setUserProfile = useAppStore((s) => s.setUserProfile);
  const setLocation = useAppStore((s) => s.setLocation);
  const userName = useAppStore((s) => s.userName);
  const userInitials = useAppStore((s) => s.userInitials);

  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    city: null,
    hasPermission: null,
    loading: false,
  });

  // Check existing permission on mount (doesn't trigger prompt)
  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setState((s) => ({
        ...s,
        hasPermission: status === "granted",
      }));
    });
  }, []);

  // Request permission and get location
  const requestLocation = useCallback(async (): Promise<boolean> => {
    setState((s) => ({ ...s, loading: true }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setState((s) => ({ ...s, hasPermission: false, loading: false }));
        return false;
      }

      setState((s) => ({ ...s, hasPermission: true }));

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // ~100m, fast
      });

      const lat = roundCoord(location.coords.latitude);
      const lng = roundCoord(location.coords.longitude);

      // Reverse geocode for city name
      let city = "";
      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });
        if (place) {
          city = [place.city, place.region]
            .filter(Boolean)
            .join(", ");
        }
      } catch {
        // Geocoding can fail — location still works without city name
      }

      setState({
        latitude: lat,
        longitude: lng,
        city,
        hasPermission: true,
        loading: false,
      });

      // Update store with coordinates
      setLocation(lat, lng);

      // Persist to Supabase
      if (userId) {
        await supabase
          .from("profiles")
          .update({
            location_lat: lat,
            location_lng: lng,
            location_city: city,
          })
          .eq("id", userId);
      }

      // Update local store
      setUserProfile({
        name: userName,
        initials: userInitials,
        city,
      });

      return true;
    } catch {
      setState((s) => ({ ...s, loading: false }));
      return false;
    }
  }, [userId, userName, userInitials, setUserProfile]);

  return {
    ...state,
    requestLocation,
  };
}
