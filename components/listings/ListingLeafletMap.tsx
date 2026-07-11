"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  lat: number;
  lng: number;
  label: string;
};

export type AmenityPoint = MapPoint & {
  id: string;
};

type ListingLeafletMapProps = {
  property: MapPoint;
  places: AmenityPoint[];
  selectedPlaceId: string | null;
  className?: string;
  fitAllPlaces?: boolean;
  showRadiusCircle?: boolean;
  radiusM?: number;
};

const CARTO_VOYAGER =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

const BASE_ZOOM = 15;
const PROPERTY_PIN_BASE = 40;
const AMENITY_PIN_BASE = 28;

function createPinIcon(fill: string, size: number) {
  const height = Math.round(size * 1.35);
  return L.divIcon({
    className: "listing-map-pin-icon",
    html: `<svg width="${size}" height="${height}" viewBox="0 0 32 44" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M16 42C16 42 30 26.5 30 16C30 8.82 23.73 3 16 3C8.27 3 2 8.82 2 16C2 26.5 16 42 16 42Z" fill="${fill}" stroke="#fff" stroke-width="2.5"/><circle cx="16" cy="16" r="5.5" fill="#fff" fill-opacity="0.95"/></svg>`,
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
  });
}

function pinSizeForZoom(baseSize: number, zoom: number): number {
  const scaled = Math.round(baseSize * 2 ** (BASE_ZOOM - zoom));
  return Math.min(Math.max(scaled, Math.round(baseSize * 0.75)), baseSize * 3);
}

function useFixedPinIcon(fill: string, baseSize: number) {
  const map = useMap();
  const [icon, setIcon] = useState(() => createPinIcon(fill, pinSizeForZoom(baseSize, BASE_ZOOM)));

  useEffect(() => {
    const sync = () => {
      setIcon(createPinIcon(fill, pinSizeForZoom(baseSize, map.getZoom())));
    };

    sync();
    map.on("zoom", sync);
    map.on("zoomend", sync);
    return () => {
      map.off("zoom", sync);
      map.off("zoomend", sync);
    };
  }, [map, fill, baseSize]);

  return icon;
}

function FixedPinMarker({
  position,
  fill,
  baseSize,
  zIndexOffset = 0,
  openPopup = false,
  label,
}: {
  position: [number, number];
  fill: string;
  baseSize: number;
  zIndexOffset?: number;
  openPopup?: boolean;
  label: string;
}) {
  const icon = useFixedPinIcon(fill, baseSize);
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (openPopup) markerRef.current?.openPopup();
  }, [openPopup, label, position[0], position[1]]);

  return (
    <Marker ref={markerRef} position={position} icon={icon} zIndexOffset={zIndexOffset}>
      <Popup>
        <span className="text-sm font-semibold text-neutral-900">{label}</span>
      </Popup>
    </Marker>
  );
}

function MapWheelHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    L.DomEvent.disableScrollPropagation(container);
    L.DomEvent.disableClickPropagation(container);

    let gestureStartZoom = map.getZoom();

    const onWheel = (event: Event) => {
      const wheel = event as WheelEvent;
      L.DomEvent.preventDefault(wheel);
      L.DomEvent.stopPropagation(wheel);

      if (wheel.ctrlKey || wheel.metaKey) {
        const delta = L.DomEvent.getWheelDelta(wheel);
        const rect = container.getBoundingClientRect();
        const point = L.point(wheel.clientX - rect.left, wheel.clientY - rect.top);
        const center = map.containerPointToLatLng(point);
        map.setZoomAround(center, map.getZoom() + delta * 0.2);
        return;
      }

      map.panBy(L.point(wheel.deltaX, wheel.deltaY), { animate: false });
    };

    const onGestureStart = (event: Event) => {
      L.DomEvent.preventDefault(event);
      gestureStartZoom = map.getZoom();
    };

    const onGestureChange = (event: Event) => {
      const gesture = event as Event & { scale?: number };
      L.DomEvent.preventDefault(event);
      if (!Number.isFinite(gesture.scale) || !gesture.scale || gesture.scale <= 0) return;
      map.setZoom(gestureStartZoom + Math.log2(gesture.scale));
    };

    const onGestureEnd = (event: Event) => {
      L.DomEvent.preventDefault(event);
    };

    L.DomEvent.on(container, "wheel", onWheel);
    container.addEventListener("gesturestart", onGestureStart, { passive: false });
    container.addEventListener("gesturechange", onGestureChange, { passive: false });
    container.addEventListener("gestureend", onGestureEnd, { passive: false });

    map.touchZoom.enable();

    return () => {
      L.DomEvent.off(container, "wheel", onWheel);
      container.removeEventListener("gesturestart", onGestureStart);
      container.removeEventListener("gesturechange", onGestureChange);
      container.removeEventListener("gestureend", onGestureEnd);
    };
  }, [map]);

  return null;
}

function MapViewport({
  property,
  selectedPlaceId,
  places,
  fitAllPlaces = false,
}: ListingLeafletMapProps) {
  const map = useMap();
  const selected = places.find((place) => place.id === selectedPlaceId) ?? null;

  useEffect(() => {
    if (selected) {
      map.panTo([selected.lat, selected.lng], { animate: true });
      return;
    }

    if (fitAllPlaces && places.length > 0) {
      const bounds = L.latLngBounds([
        [property.lat, property.lng],
        ...places.map((place) => [place.lat, place.lng] as [number, number]),
      ]);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16, animate: true });
      return;
    }

    map.setView([property.lat, property.lng], BASE_ZOOM, { animate: true });
  }, [map, property, selected, selectedPlaceId, places, fitAllPlaces]);

  return null;
}

export function ListingLeafletMap({
  property,
  places,
  selectedPlaceId,
  className,
  fitAllPlaces = false,
  showRadiusCircle = false,
  radiusM,
}: ListingLeafletMapProps) {
  return (
    <div className={cn("listing-nearby-map-shell", className)}>
      <MapContainer
        center={[property.lat, property.lng]}
        zoom={BASE_ZOOM}
        className="listing-nearby-map h-full w-full rounded-2xl"
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={false}
        touchZoom
        dragging
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={CARTO_VOYAGER}
        />
        <ZoomControl position="bottomright" />
        <MapWheelHandler />
        <MapViewport
          property={property}
          places={places}
          selectedPlaceId={selectedPlaceId}
          fitAllPlaces={fitAllPlaces}
        />

        {showRadiusCircle && radiusM != null && radiusM > 0 && (
          <Circle
            center={[property.lat, property.lng]}
            radius={radiusM}
            pathOptions={{
              color: "#3b82f6",
              weight: 1.5,
              fillColor: "#3b82f6",
              fillOpacity: 0.06,
            }}
          />
        )}

        <FixedPinMarker
          position={[property.lat, property.lng]}
          fill="#dc2626"
          baseSize={PROPERTY_PIN_BASE}
          zIndexOffset={1000}
          label={property.label}
        />

        {places.map((place) => (
          <FixedPinMarker
            key={place.id}
            position={[place.lat, place.lng]}
            fill={place.id === selectedPlaceId ? "#1d4ed8" : "#3b82f6"}
            baseSize={AMENITY_PIN_BASE}
            zIndexOffset={place.id === selectedPlaceId ? 800 : 0}
            openPopup={place.id === selectedPlaceId}
            label={place.label}
          />
        ))}
      </MapContainer>
    </div>
  );
}
