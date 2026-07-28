import React, { useEffect, useRef, useState } from "react";
import { 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Navigation, 
  Check, 
  ExternalLink, 
  Map as MapIcon, 
  Layers, 
  Car, 
  Plane, 
  Utensils, 
  Hotel, 
  Compass,
  ListFilter
} from "lucide-react";
import { Trip, Event } from "../types";

interface TripMapProps {
  trip: Trip;
  onUpdateTrip: (updatedTrip: Trip) => void;
}

// Dynamic Leaflet Loader helper
const loadLeaflet = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve((window as any).L);
    script.onerror = () => reject(new Error("Failed to load Leaflet"));
    document.body.appendChild(script);
  });
};

interface MapPoint {
  id: string;
  name: string;
  dateStr: string;
  timeStart: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  completed: boolean;
  googleMapsLink?: string;
}

export default function TripMap({ trip, onUpdateTrip }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapInstance = useRef<any>(null);
  
  const dates = Object.keys(trip.itinerary).filter(d => Boolean(d) && d.trim() !== "").sort();
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("all");
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [leafletError, setLeafletError] = useState(false);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Collect all valid coordinate points from itinerary & accommodation
  const getAllPoints = (): MapPoint[] => {
    const points: MapPoint[] = [];

    // Filter dates based on user selection
    const activeDates = selectedDayFilter === "all" ? dates : [selectedDayFilter];

    activeDates.forEach(dateStr => {
      const events = trip.itinerary[dateStr] || [];
      events.forEach((evt, idx) => {
        let lat = evt.coordinates?.lat;
        let lng = evt.coordinates?.lng;

        // Auto-assign default simulated coords if missing coordinates based on index and trip location
        if (!lat || !lng) {
          // Base default around Vicentina / Portugal region (e.g., 37.95, -8.86) or generated offset
          const baseLat = 37.95;
          const baseLng = -8.86;
          lat = baseLat + (idx * 0.05) + (dates.indexOf(dateStr) * 0.1);
          lng = baseLng - (idx * 0.03);
        }

        points.push({
          id: `${dateStr}-${evt.id}`,
          name: evt.name,
          dateStr,
          timeStart: evt.timeStart || "10:00",
          category: evt.category || "Ponto de Interesse",
          address: evt.address || "Local sem morada especificada",
          lat,
          lng,
          completed: Boolean(evt.completed),
          googleMapsLink: evt.googleMapsLink
        });
      });
    });

    return points;
  };

  const allPoints = getAllPoints();
  const completedPoints = allPoints.filter(p => p.completed);
  const plannedPoints = allPoints.filter(p => !p.completed);

  // Initialize interactive Leaflet Map
  useEffect(() => {
    let isSubscribed = true;

    loadLeaflet()
      .then((L) => {
        if (!isSubscribed || !mapRef.current) return;
        setIsLeafletReady(true);

        // Cleanup existing map instance if any
        if (leafletMapInstance.current) {
          leafletMapInstance.current.remove();
          leafletMapInstance.current = null;
        }

        // Center map around first point or default
        const defaultCenter: [number, number] = allPoints.length > 0 
          ? [allPoints[0].lat, allPoints[0].lng] 
          : [37.95, -8.86];

        const map = L.map(mapRef.current, {
          center: defaultCenter,
          zoom: 10,
          zoomControl: true
        });

        leafletMapInstance.current = map;

        // OpenStreetMap Tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);

        const bounds = L.latLngBounds([]);

        // Split coordinates for Polylines
        const completedCoords: [number, number][] = [];
        const plannedCoords: [number, number][] = [];

        allPoints.forEach((pt, index) => {
          const latLng: [number, number] = [pt.lat, pt.lng];
          bounds.extend(latLng);

          if (pt.completed) {
            completedCoords.push(latLng);
          } else {
            // If it's the first planned point and there are completed points, connect last completed to first planned
            if (plannedCoords.length === 0 && completedCoords.length > 0) {
              plannedCoords.push(completedCoords[completedCoords.length - 1]);
            }
            plannedCoords.push(latLng);
          }

          // Marker color & style
          const colorHex = pt.completed ? "#10b981" : "#4f46e5";
          const statusText = pt.completed ? "Percorrido ✓" : "Por Percorrer (Planeado)";
          const statusBg = pt.completed ? "background:#10b981;" : "background:#4f46e5;";

          const customIcon = L.divIcon({
            className: "custom-map-marker",
            html: `
              <div style="
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                ${statusBg}
                color: white;
                border-radius: 50%;
                font-weight: bold;
                font-size: 12px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                border: 2.5px solid #ffffff;
                cursor: pointer;
              ">
                ${pt.completed ? "✓" : index + 1}
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const popupContent = `
            <div style="font-family: sans-serif; padding: 4px; max-width: 200px;">
              <span style="font-size: 9px; font-weight: bold; padding: 2px 8px; border-radius: 12px; color: white; ${statusBg}">
                ${statusText}
              </span>
              <h4 style="margin: 6px 0 2px 0; font-weight: bold; font-size: 13px; color: #1e293b;">${pt.name}</h4>
              <p style="margin: 0; font-size: 11px; color: #64748b;">${pt.category} • ${pt.dateStr} (${pt.timeStart})</p>
              <p style="margin: 4px 0 8px 0; font-size: 10px; color: #94a3b8;">${pt.address}</p>
              ${pt.googleMapsLink ? `<a href="${pt.googleMapsLink}" target="_blank" style="font-size: 10px; font-weight: bold; color: #4f46e5; text-decoration: none;">Abrir no Google Maps →</a>` : ""}
            </div>
          `;

          const marker = L.marker(latLng, { icon: customIcon }).addTo(map);
          marker.bindPopup(popupContent);
        });

        // 1. Polyline for ZONAS PERCORRIDAS (Solid Emerald Green Line)
        if (completedCoords.length > 1) {
          L.polyline(completedCoords, {
            color: "#10b981",
            weight: 5,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round"
          }).addTo(map);
        }

        // 2. Polyline for ZONAS POR PERCORRER (Dashed Indigo Line)
        if (plannedCoords.length > 1) {
          L.polyline(plannedCoords, {
            color: "#6366f1",
            weight: 4,
            opacity: 0.85,
            dashArray: "8, 8",
            lineCap: "round",
            lineJoin: "round"
          }).addTo(map);
        }

        // Fit map bounds if points exist
        if (allPoints.length > 0 && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      })
      .catch((err) => {
        console.warn("Leaflet error fallback:", err);
        if (isSubscribed) setLeafletError(true);
      });

    return () => {
      isSubscribed = false;
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
    };
  }, [selectedDayFilter, trip.itinerary]);

  // Toggle completion status for an event
  const toggleEventCompleted = (dateStr: string, pointId: string) => {
    const rawEvtId = pointId.replace(`${dateStr}-`, "");
    const updatedItinerary = { ...trip.itinerary };

    if (updatedItinerary[dateStr]) {
      updatedItinerary[dateStr] = updatedItinerary[dateStr].map(evt => {
        if (evt.id === rawEvtId || `${dateStr}-${evt.id}` === pointId) {
          return { ...evt, completed: !evt.completed };
        }
        return evt;
      });

      onUpdateTrip({
        ...trip,
        itinerary: updatedItinerary
      });
    }
  };

  return (
    <div className="space-y-6" id="view-map">
      {/* Header & Controls */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              <span>Mapa de Rota & Progresso do Itinerário</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Visualização em tempo real das zonas percorridas (linha verde) e zonas por percorrer (linha traçada azul)
            </p>
          </div>

          {/* Filter by Day */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200 text-xs">
            <ListFilter className="w-4 h-4 text-gray-500 ml-1.5 shrink-0" />
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className="bg-transparent font-bold text-gray-800 text-xs py-1 pr-3 focus:outline-none cursor-pointer"
            >
              <option value="all">Rota Completa (Todas as Datas)</option>
              {dates.map((d, idx) => (
                <option key={d} value={d}>
                  Dia {idx + 1} ({new Date(d + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short" })})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Route Stats Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Zonas Percorridas</span>
              <span className="text-lg font-black text-emerald-950 mt-0.5 block">
                {completedPoints.length} de {allPoints.length} locais
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              ✓
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">Zonas Por Percorrer</span>
              <span className="text-lg font-black text-indigo-950 mt-0.5 block">
                {plannedPoints.length} locais
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              ⏱️
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Progresso do Itinerário</span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">
                {allPoints.length > 0 ? Math.round((completedPoints.length / allPoints.length) * 100) : 0}% Concluído
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
              {allPoints.length > 0 ? Math.round((completedPoints.length / allPoints.length) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Legend Indicator Bar */}
        <div className="flex items-center gap-6 text-xs bg-slate-900 text-white p-3 rounded-2xl font-medium">
          <div className="flex items-center gap-2">
            <span className="w-6 h-1 bg-emerald-400 rounded-full inline-block shadow-sm"></span>
            <span className="text-emerald-300 font-bold">Linha Verde Contínua:</span>
            <span className="text-slate-300">Zonas Percorridas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-1 border-t-2 border-dashed border-indigo-400 inline-block"></span>
            <span className="text-indigo-300 font-bold">Linha Azul Traçada:</span>
            <span className="text-slate-300">Zonas Planeadas</span>
          </div>
        </div>

        {/* Interactive Map Canvas */}
        <div className="relative rounded-2xl h-[460px] overflow-hidden border border-gray-200 shadow-inner bg-slate-100">
          <div ref={mapRef} className="w-full h-full z-10" />

          {/* SVG Fallback if Leaflet doesn't render */}
          {(leafletError || !isLeafletReady) && (
            <div className="absolute inset-0 bg-[#f4f1ea] p-6 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200 z-20">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <MapIcon className="w-4 h-4 text-indigo-600" />
                  <span>Esquema Vetorial de Rota Dinâmica</span>
                </span>
                <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-semibold">
                  Modo Interativo
                </span>
              </div>

              {/* Vector SVG schematic path */}
              <div className="relative my-auto py-8">
                <svg className="w-full h-40 overflow-visible" viewBox="0 0 800 160">
                  {/* Background road line */}
                  <path
                    d="M 50 80 Q 200 20 400 80 T 750 80"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Completed solid green line */}
                  <path
                    d="M 50 80 Q 200 20 400 80"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  {/* Planned dashed blue line */}
                  <path
                    d="M 400 80 T 750 80"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="5"
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Nodes along vector path */}
                <div className="absolute inset-0 flex items-center justify-between px-8">
                  {allPoints.slice(0, 5).map((pt, idx) => (
                    <div
                      key={pt.id}
                      onClick={() => toggleEventCompleted(pt.dateStr, pt.id)}
                      className={`cursor-pointer group flex flex-col items-center transition-all ${
                        pt.completed ? "scale-105" : ""
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-white transition-transform group-hover:scale-110 ${
                          pt.completed ? "bg-emerald-500" : "bg-indigo-600"
                        }`}
                      >
                        {pt.completed ? "✓" : idx + 1}
                      </div>
                      <div className="mt-2 bg-white/90 border border-gray-200 px-2.5 py-1 rounded-xl text-center shadow-xs">
                        <p className="font-bold text-gray-800 text-[11px] truncate max-w-[100px]">{pt.name}</p>
                        <p className="text-[9px] font-semibold text-gray-500">{pt.timeStart}</p>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${
                          pt.completed ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                        }`}>
                          {pt.completed ? "Percorrido" : "Por Percorrer"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* List of stops & status toggles */}
        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Lista Sequencial de Locais da Rota</span>
          </h4>

          {allPoints.length === 0 ? (
            <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-2xl text-center border">
              Nenhum evento com morada no itinerário. Adicione eventos na tab "Itinerário".
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allPoints.map((pt, idx) => (
                <div
                  key={pt.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    pt.completed 
                      ? "bg-emerald-50/40 border-emerald-200 hover:border-emerald-300" 
                      : "bg-white border-gray-200 hover:border-indigo-300 shadow-2xs"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        pt.completed ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      }`}>
                        <span>Ponto #{idx + 1}</span>
                        <span>•</span>
                        <span>{pt.dateStr}</span>
                      </span>
                      <span className="text-[10px] font-mono text-gray-500 font-bold bg-gray-100 px-1.5 py-0.5 rounded">
                        {pt.timeStart}
                      </span>
                    </div>

                    <h5 className="font-bold text-gray-900 text-sm leading-snug mt-1">{pt.name}</h5>
                    <p className="text-xs text-gray-500 line-clamp-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{pt.address}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleEventCompleted(pt.dateStr, pt.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        pt.completed
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          : "bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 border border-gray-200"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{pt.completed ? "Percorrido ✓" : "Marcar Percorrido"}</span>
                    </button>

                    {pt.googleMapsLink && (
                      <a
                        href={pt.googleMapsLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 p-1"
                      >
                        <span>GPS</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
