"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

export type SitterMapMarker = {
  id: string;
  name: string;
  area: string;
  shortInfo: string;
  coordinates: [number, number];
};

type SitterMapProps = {
  sitters: SitterMapMarker[];
  activeSitterId: string;
  onSelect: (sitterId: string) => void;
};

function ActiveSitterFocus({ coordinates }: { coordinates: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(coordinates, Math.max(map.getZoom(), 13), {
      duration: 0.65,
    });
  }, [coordinates, map]);

  return null;
}

function createSitterIcon(nameInitial: string, isActive: boolean) {
  const borderColor = isActive ? "#E36A6A" : "rgba(227,106,106,0.45)";
  const background = isActive ? "#E36A6A" : "#FFFBF1";
  const textColor = isActive ? "#FFFBF1" : "#E36A6A";

  return L.divIcon({
    className: "",
    html: `<span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;border:2px solid ${borderColor};background:${background};color:${textColor};box-shadow:0 8px 16px rgba(227,106,106,0.28);font-size:13px;font-weight:700;line-height:1;">${nameInitial}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -28],
  });
}

export default function SitterMap({
  sitters,
  activeSitterId,
  onSelect,
}: SitterMapProps) {
  const activeSitter = useMemo(
    () => sitters.find((sitter) => sitter.id === activeSitterId) ?? null,
    [activeSitterId, sitters],
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (sitters.length === 0) {
      return [51.1657, 10.4515];
    }

    const latTotal = sitters.reduce(
      (sum, sitter) => sum + sitter.coordinates[0],
      0,
    );
    const lngTotal = sitters.reduce(
      (sum, sitter) => sum + sitter.coordinates[1],
      0,
    );

    return [latTotal / sitters.length, lngTotal / sitters.length];
  }, [sitters]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={sitters.length > 0 ? 13 : 6}
      scrollWheelZoom
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {activeSitter ? (
        <ActiveSitterFocus coordinates={activeSitter.coordinates} />
      ) : null}

      {sitters.map((sitter) => {
        const isActive = sitter.id === activeSitterId;

        return (
          <Marker
            key={sitter.id}
            position={sitter.coordinates}
            icon={createSitterIcon(sitter.name.charAt(0), isActive)}
            eventHandlers={{
              click: () => onSelect(sitter.id),
            }}
          >
            <Popup>
              <div className="space-y-1 text-[#5A3333]">
                <p className="text-sm font-semibold">{sitter.name}</p>
                <p className="text-xs text-[#6B4C4C]">{sitter.area}</p>
                <p className="text-xs">{sitter.shortInfo}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
