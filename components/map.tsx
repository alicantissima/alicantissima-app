"use client";

import { GoogleMap, Marker, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import { useState } from "react";

export default function Map({ locations }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const [active, setActive] = useState(null);

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      center={{ lat: 38.3452, lng: -0.4810 }}
      zoom={13}
      mapContainerStyle={{ width: "100%", height: "100vh" }}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={{ lat: loc.latitude, lng: loc.longitude }}
          onClick={() => setActive(loc)}
        />
      ))}

      {active && (
        <InfoWindow
          position={{ lat: active.latitude, lng: active.longitude }}
          onCloseClick={() => setActive(null)}
        >
          <div style={{ minWidth: 160 }}>
            <strong>{active.name}</strong>
            <p style={{ margin: "4px 0" }}>Luggage • Shower</p>
            <button
              style={{
                marginTop: 6,
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #111",
                background: "#fff",
                cursor: "pointer",
              }}
              onClick={() => window.location.href = `/location/${active.id}`}
            >
              View details
            </button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}