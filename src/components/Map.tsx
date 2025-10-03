// src/components/Map.tsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon.src,
    shadowUrl: iconShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const center: [number, number] = [-39.8142, -73.2459];

interface Estacion {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  descripcion: string;
}

interface MapProps {
  estaciones: Estacion[];
  selectedEstacion?: Estacion | null;
}

function MapUpdater({ selectedEstacion }: { selectedEstacion?: Estacion | null }) {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 100);
  }, [map]);

  useEffect(() => {
    if (selectedEstacion) {
      map.flyTo([selectedEstacion.latitud, selectedEstacion.longitud], 12, {
        duration: 1.5
      });
    }
  }, [selectedEstacion, map]);

  return null;
}

export function Map({ estaciones, selectedEstacion }: MapProps) {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <MapContainer
      center={center}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {estaciones.map((estacion) => (
        <Marker
          key={estacion.id}
          position={[estacion.latitud, estacion.longitud]}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-bold">{estacion.nombre}</div>
              <div className="text-gray-600">{estacion.descripcion}</div>
            </div>
          </Popup>
        </Marker>
      ))}
      <MapUpdater selectedEstacion={selectedEstacion} />
    </MapContainer>
  );
}