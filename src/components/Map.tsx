// src/components/Map.tsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Coordenadas aproximadas del centro de Chile
const center: [number, number] = [-39.8142, -73.2459]; 

const markers = [
  { position: [-33.4489, -70.6693], name: "Santiago" },
  { position: [-33.0472, -71.6127], name: "Valparaíso" },
  { position: [-36.8201, -73.0444], name: "Concepción" },
];


// Este componente accede a la instancia del mapa y la actualiza.
function MapUpdater() {
  const map = useMap();
  useEffect(() => {
    // Se usa un timeout para asegurar que el contenedor ya tenga su tamaño final.
    setTimeout(() => {
      map.invalidateSize();
    }, 100); // 100ms es un pequeño retraso seguro
  }, [map]);
  return null;
}



export function Map() {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {markers.map((marker, index) => (
        <Marker key={index} position={marker.position as [number, number]}>
          <Popup>{marker.name}</Popup>
        </Marker>
      ))}

      <MapUpdater />

    </MapContainer>
  );
}