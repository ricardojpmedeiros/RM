import React, { useEffect, useRef, useState } from "react";
import { MapPin, Check, X, Search, Compass } from "lucide-react";

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onSelect: (lat: number, lng: number, address?: string) => void;
  onClose: () => void;
}

const loadLeaflet = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }

    // Insert stylesheet
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Insert script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      resolve((window as any).L);
    };
    script.onerror = () => {
      reject(new Error("Failed to load Leaflet"));
    };
    document.body.appendChild(script);
  });
};

export default function MapPicker({ initialLat, initialLng, onSelect, onClose }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [lat, setLat] = useState(initialLat || 39.5); // Default centered at Portugal
  const [lng, setLng] = useState(initialLng || -8.0);
  const [address, setAddress] = useState("");
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Search & Coordinates entry state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [coordLatInput, setCoordLatInput] = useState(String(initialLat || 39.5));
  const [coordLngInput, setCoordLngInput] = useState(String(initialLng || -8.0));

  // Sync manual inputs when map updates coordinate state from dragging/clicking
  useEffect(() => {
    setCoordLatInput(String(lat));
    setCoordLngInput(String(lng));
  }, [lat, lng]);

  // Handle Search Query triggering Nominatim API
  const performSearch = async (queryStr: string, isManual = false) => {
    if (!queryStr.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=5`,
        {
          headers: {
            "Accept-Language": "pt-PT,pt;q=0.9"
          }
        }
      );
      const data = await resp.json();
      if (data && data.length > 0) {
        setSearchResults(data);
        if (isManual) {
          // For manual searches, automatically fly to the first match as well
          const first = data[0];
          const newLat = parseFloat(first.lat);
          const newLng = parseFloat(first.lon);
          setLat(newLat);
          setLng(newLng);
          setAddress(first.display_name || "");
        }
      } else {
        setSearchResults([]);
        if (isManual) {
          alert("Nenhum local encontrado. Tente ser mais específico (ex: 'Zambujeira do Mar' ou 'Porto Covo').");
        }
      }
    } catch (err) {
      console.error("Error searching address:", err);
    } finally {
      setSearching(false);
    }
  };

  // Debounce query search on typing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      performSearch(searchQuery, false);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery, true);
  };

  const handleCoordsSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedLat = parseFloat(coordLatInput);
    const parsedLng = parseFloat(coordLngInput);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      setLat(parsedLat);
      setLng(parsedLng);
    } else {
      alert("Por favor, introduza coordenadas válidas.");
    }
  };

  useEffect(() => {
    let active = true;
    loadLeaflet().then((L) => {
      if (!active || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current).setView([lat, lng], initialLat && initialLng ? 14 : 7);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      // Handle drag end
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        setLat(position.lat);
        setLng(position.lng);
      });

      // Handle map click
      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
      });

      setIsMapLoaded(true);
    }).catch(err => {
      console.error(err);
    });

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Sync marker position when lat/lng state changes
  useEffect(() => {
    if (markerRef.current && isMapLoaded) {
      const currentPos = markerRef.current.getLatLng();
      if (currentPos.lat !== lat || currentPos.lng !== lng) {
        markerRef.current.setLatLng([lat, lng]);
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);
        }
      }
    }
  }, [lat, lng, isMapLoaded]);

  // Reverse geocode when coordinates change
  useEffect(() => {
    let active = true;
    const fetchAddress = async () => {
      setLoadingAddress(true);
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          {
            headers: {
              "Accept-Language": "pt-PT,pt;q=0.9"
            }
          }
        );
        const data = await resp.json();
        if (active && data) {
          setAddress(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } catch (err) {
        console.error("Error reverse geocoding:", err);
        if (active) {
          setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } finally {
        if (active) setLoadingAddress(false);
      }
    };

    const timer = setTimeout(fetchAddress, 800); // Debounce API calls
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [lat, lng]);

  const handleConfirm = () => {
    onSelect(lat, lng, address);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-55 flex items-center justify-center p-4 backdrop-blur-sm" id="map-picker-modal">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col h-[550px] md:h-[650px] shadow-2xl border border-gray-100">
        <div className="bg-indigo-600 text-white px-5 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <h3 className="font-bold text-sm">Escolher Localização no Mapa</h3>
          </div>
          <button onClick={onClose} className="text-white hover:text-indigo-100 p-1 font-bold">
            X
          </button>
        </div>

        {/* Search and Coordinates Control Panel */}
        <div className="p-3 bg-indigo-50/50 border-b border-indigo-100/40 shrink-0 space-y-2 text-xs">
          {/* 1. Address / Point Search */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar localidade, praia, hotel... (ex: Porto Covo)"
                className="w-full pl-8 pr-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {/* Autocomplete / Suggestions list overlay */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 text-xs divide-y divide-gray-100">
                  {searchResults.map((result) => (
                    <button
                      key={result.place_id || result.osm_id + Math.random()}
                      type="button"
                      onClick={() => {
                        const newLat = parseFloat(result.lat);
                        const newLng = parseFloat(result.lon);
                        setLat(newLat);
                        setLng(newLng);
                        setAddress(result.display_name || "");
                        setSearchResults([]); // close dropdown
                        setSearchQuery(result.display_name.split(",")[0]); // set input to clean name
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors flex items-start gap-2 text-gray-700"
                    >
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-800 truncate">{result.display_name.split(",")[0]}</div>
                        <div className="text-[10px] text-gray-400 truncate">{result.display_name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              {searching ? "A pesquisar..." : "Pesquisar"}
            </button>
          </form>

          {/* 2. Manual GPS Coordinates */}
          <form onSubmit={handleCoordsSubmit} className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
              Coordenadas:
            </span>
            <div className="flex gap-1.5 flex-1">
              <input
                type="text"
                placeholder="Latitude (Ex: 37.8512)"
                value={coordLatInput}
                onChange={(e) => setCoordLatInput(e.target.value)}
                className="w-1/2 px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <input
                type="text"
                placeholder="Longitude (Ex: -8.7909)"
                value={coordLngInput}
                onChange={(e) => setCoordLngInput(e.target.value)}
                className="w-1/2 px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors shrink-0"
            >
              Ir para GPS
            </button>
          </form>
        </div>

        {/* Leaflet container */}
        <div className="flex-1 bg-gray-50 relative">
          <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "200px" }} />
          {!isMapLoaded && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>A carregar o mapa interativo...</span>
            </div>
          )}
        </div>

        {/* Selected location and confirmation footer */}
        <div className="p-4 bg-white border-t border-gray-100 space-y-3 shrink-0">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
              <span>LOCALIZAÇÃO SELECIONADA</span>
              <span className="font-mono text-gray-500">
                Lat: {lat.toFixed(5)} • Lng: {lng.toFixed(5)}
              </span>
            </div>
            <p className="text-gray-800 font-medium leading-relaxed">
              {loadingAddress ? "A obter morada..." : address || "Clique no mapa para escolher um local"}
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Confirmar Localização
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
