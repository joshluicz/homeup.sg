"use client";

import { useEffect, useMemo, useRef } from "react";
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
  denseMarkers?: boolean;
};

const CARTO_VOYAGER =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

const BASE_ZOOM = 15;
const PROPERTY_PIN_SIZE = 30;
const AMENITY_DOT_SIZE = 10;
const AMENITY_DOT_SIZE_SELECTED = 14;
const DENSE_DOT_SIZE = 7;
const DENSE_DOT_SIZE_SELECTED = 11;

function createPinIcon(fill: string, size: number) {
  const height = Math.round(size * 1.35);
  return L.divIcon({
    className: "listing-map-pin-icon",
    html: `<svg width="${size}" height="${height}" viewBox="0 0 32 44" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M16 42C16 42 30 26.5 30 16C30 8.82 23.73 3 16 3C8.27 3 2 8.82 2 16C2 26.5 16 42 16 42Z" fill="${fill}" stroke="#fff" stroke-width="2.5"/><circle cx="16" cy="16" r="5.5" fill="#fff" fill-opacity="0.95"/></svg>`,
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
  });
}

function createDotIcon(fill: string, size: number) {
  const border = Math.max(1, Math.round(size * 0.2));
  return L.divIcon({
    className: "listing-map-dot-icon",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${fill};border:${border}px solid #fff;box-shadow:0 1px 2px rgba(15,23,42,0.35);"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapMarker({
  position,
  icon,
  zIndexOffset = 0,
  openPopup = false,
  label,
}: {
  position: [number, number];
  icon: L.DivIcon;
  zIndexOffset?: number;
  openPopup?: boolean;
  label: string;
}) {
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
  denseMarkers = false,
}: ListingLeafletMapProps) {
  const propertyIcon = useMemo(
    () => createPinIcon("#dc2626", PROPERTY_PIN_SIZE),
    [],
  );

  const amenityDotSize = denseMarkers ? DENSE_DOT_SIZE : AMENITY_DOT_SIZE;
  const amenityDotSizeSelected = denseMarkers ? DENSE_DOT_SIZE_SELECTED : AMENITY_DOT_SIZE_SELECTED;

  const amenityIcon = useMemo(
    () => createDotIcon("#3b82f6", amenityDotSize),
    [amenityDotSize],
  );
  const amenityIconSelected = useMemo(
    () => createDotIcon("#1d4ed8", amenityDotSizeSelected),
    [amenityDotSizeSelected],
  );

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

        <MapMarker
          position={[property.lat, property.lng]}
          icon={propertyIcon}
          zIndexOffset={1000}
          label={property.label}
        />

        {places.map((place) => {
          const selected = place.id === selectedPlaceId;
          return (
            <MapMarker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={selected ? amenityIconSelected : amenityIcon}
              zIndexOffset={selected ? 800 : 0}
              openPopup={selected}
              label={place.label}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
