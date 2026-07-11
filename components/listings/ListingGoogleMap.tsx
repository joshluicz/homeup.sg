"use client";

import { useEffect } from "react";
import { APIProvider, Map, Marker, Polyline, useMap } from "@vis.gl/react-google-maps";
import { getGoogleMapsEmbedKey, getGoogleMapsJsApiKey } from "@/lib/listings/google-maps-key";
import { buildMapEmbedUrl, buildGoogleMapsDirectionsEmbedUrl } from "@/lib/listings/map-embed";

export type MapPoint = {
  lat: number;
  lng: number;
  label: string;
};

type ListingGoogleMapProps = {
  property: MapPoint;
  selectedPlace: MapPoint | null;
  className?: string;
};

const PROPERTY_ICON = "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
const AMENITY_ICON = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";

function MapViewport({ property, selectedPlace }: ListingGoogleMapProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (!selectedPlace) {
      map.panTo(property);
      map.setZoom(15);
      return;
    }

    map.fitBounds(
      {
        north: Math.max(property.lat, selectedPlace.lat),
        south: Math.min(property.lat, selectedPlace.lat),
        east: Math.max(property.lng, selectedPlace.lng),
        west: Math.min(property.lng, selectedPlace.lng),
      },
      {
        top: 48,
        right: 48,
        bottom: 48,
        left: 300,
      },
    );
  }, [map, property, selectedPlace]);

  return null;
}

function GoogleMapCanvas({ property, selectedPlace, className }: ListingGoogleMapProps) {
  const path = selectedPlace
    ? [
        { lat: property.lat, lng: property.lng },
        { lat: selectedPlace.lat, lng: selectedPlace.lng },
      ]
    : null;

  return (
    <div className={className}>
      <Map
        defaultCenter={property}
        defaultZoom={15}
        gestureHandling="greedy"
        disableDefaultUI={false}
        fullscreenControl={false}
        mapTypeControl={false}
        streetViewControl={false}
        className="h-full w-full"
      >
        <MapViewport property={property} selectedPlace={selectedPlace} />
        <Marker position={property} title={property.label} icon={PROPERTY_ICON} />
        {selectedPlace ? (
          <>
            <Marker position={selectedPlace} title={selectedPlace.label} icon={AMENITY_ICON} />
            {path ? (
              <Polyline
                path={path}
                strokeColor="#009A44"
                strokeOpacity={0.85}
                strokeWeight={3}
              />
            ) : null}
          </>
        ) : null}
      </Map>
    </div>
  );
}

export function ListingGoogleMap({ property, selectedPlace, className }: ListingGoogleMapProps) {
  const jsApiKey = getGoogleMapsJsApiKey();
  const embedKey = getGoogleMapsEmbedKey();

  if (!jsApiKey) {
    const directionsSrc =
      selectedPlace && buildGoogleMapsDirectionsEmbedUrl(property, selectedPlace, embedKey);
    const iframeSrc =
      directionsSrc ?? buildMapEmbedUrl(property.label, property, embedKey);

    return (
      <iframe
        title={
          selectedPlace
            ? `Walking route from ${property.label} to ${selectedPlace.label}`
            : `Map showing ${property.label}`
        }
        src={iframeSrc}
        className={className ?? "h-full w-full border-0"}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    );
  }

  return (
    <APIProvider apiKey={jsApiKey}>
      <GoogleMapCanvas property={property} selectedPlace={selectedPlace} className={className} />
    </APIProvider>
  );
}
