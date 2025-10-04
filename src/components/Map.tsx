// src/components/Map.tsx
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
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
  created_at: string;
}

interface MapProps {
  estaciones: Estacion[];
  selectedEstacion?: Estacion | null;
  onEstacionSelect?: (estacion: Estacion) => void;
  showZoomControls?: boolean;
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

export function Map({ estaciones, selectedEstacion, onEstacionSelect, showZoomControls = true }: MapProps) {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <MapContainer
      center={center}
      zoom={5}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      {showZoomControls && <ZoomControl position="topright" />}

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
            <div className="text-sm space-y-2">
              <div>
                <div className="font-bold">{estacion.nombre}</div>
                <div className="text-gray-600">{estacion.descripcion}</div>
              </div>
              {onEstacionSelect && (
                <button
                  onClick={() => onEstacionSelect(estacion)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Ver datos de calidad del aire
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      <MapUpdater selectedEstacion={selectedEstacion} />
    </MapContainer>
  );
}