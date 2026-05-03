


"use client";

import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useState } from "react";

type Service = {
  id: string;
  name: string;
  base_price: number | null;
};

type Location = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  services?: Service[] | null;
};

type MapProps = {
  locations: Location[];
  googleMapsApiKey: string;
};

export default function Map({ locations, googleMapsApiKey }: MapProps) {
  const [active, setActive] = useState<Location | null>(null);

  // const validLocations = locations.filter(
//   (loc) => loc.latitude !== null && loc.longitude !== null
// );

const validLocations = [
  {
    id: "1",
    name: "Alicantissima Test",
    latitude: 38.3452,
    longitude: -0.481,
  },
];

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey,
  });

  if (!googleMapsApiKey) {
    return <div style={{ padding: 24 }}>Missing Google Maps API key</div>;
  }

  if (!isLoaded) return <div style={{ padding: 24 }}>Loading map...</div>;

  return (
    <GoogleMap
      center={{ lat: 38.3452, lng: -0.481 }}
      zoom={13}
      mapContainerStyle={{ width: "100%", height: "100vh" }}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      {validLocations.map((loc) => (
        <Marker
          key={loc.id}
          position={{
            lat: Number(loc.latitude),
            lng: Number(loc.longitude),
          }}
          onClick={() => setActive(loc)}
        />
      ))}

      {active && active.latitude !== null && active.longitude !== null && (
        <InfoWindow
          position={{
            lat: Number(active.latitude),
            lng: Number(active.longitude),
          }}
          onCloseClick={() => setActive(null)}
        >
          <div style={{ minWidth: 180 }}>
            <strong>{active.name}</strong>

            {(active.services || []).map((service) => (
              <p key={service.id} style={{ margin: "4px 0" }}>
                {service.name}
                {service.base_price !== null
                  ? ` from €${service.base_price}`
                  : ""}
              </p>
            ))}

            <button
              style={{
                marginTop: 6,
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #111",
                background: "#fff",
                cursor: "pointer",
              }}
              onClick={() => {
                window.location.href = `/location/${active.id}`;
              }}
            >
              View details
            </button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}