// src/components/Map.tsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet'; // <-- 1. Importa 'L' de leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon.src,
    shadowUrl: iconShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;
// --- FIN DEL CÓDIGO NUEVO ---


const center: [number, number] = [-39.8142, -73.2459]; 
const markers = [
  { position: [-33.4489, -70.6693], name: "Santiago" },
  { position: [-33.0472, -71.6127], name: "Valparaíso" },
  { position: [-36.8201, -73.0444], name: "Concepción" },
];

function MapUpdater() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 100);
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