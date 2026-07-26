import React, { useEffect, useRef, useState } from "react";
import { MapPin, Check, Search, Compass, ExternalLink, Star, Info, Globe, Navigation, Sparkles, Link as LinkIcon, AlertTriangle } from "lucide-react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary
} from "@vis.gl/react-google-maps";

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onSelect: (
    lat: number,
    lng: number,
    address?: string,
    placeName?: string,
    mapsUrl?: string,
    photoUrl?: string
  ) => void;
  onClose: () => void;
}

const GOOGLE_MAPS_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidGoogleKey = Boolean(GOOGLE_MAPS_KEY) && GOOGLE_MAPS_KEY !== "YOUR_API_KEY" && GOOGLE_MAPS_KEY.length > 5;

// Leaflet fallback loader when Google Maps API key is not yet set or fails
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

// Sub-component: Google Places Search Engine using Places API (New)
function GooglePlacesSearchEngine({
  onSelectPlace,
  currentCenter,
  onError
}: {
  onSelectPlace: (place: {
    lat: number;
    lng: number;
    address: string;
    displayName: string;
    googleMapsURI: string;
    rating?: number;
    photoUrl?: string;
  }) => void;
  currentCenter: { lat: number; lng: number };
  onError?: () => void;
}) {
  const placesLib = useMapsLibrary("places");
  const map = useMap();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!placesLib || !query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      try {
        placesLib.Place.searchByText({
          textQuery: query,
          fields: ["displayName", "location", "formattedAddress", "googleMapsURI", "rating", "photos", "types"],
          locationBias: map?.getCenter() || currentCenter,
          maxResultCount: 6
        }).then(({ places }) => {
          setResults(places || []);
        }).catch(err => {
          console.error("Google Places search error:", err);
          setResults([]);
          if (onError) onError();
        }).finally(() => {
          setLoading(false);
        });
      } catch (e) {
        console.error(e);
        setLoading(false);
        if (onError) onError();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, placesLib, map, currentCenter, onError]);

  return (
    <div className="relative flex-1">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar no Google Maps (ex: Restaurante O Pescador, Praia do Camilo)..."
          className="w-full pl-9 pr-9 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs text-gray-800"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </span>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 text-xs divide-y divide-gray-100 animate-fade-in">
          <div className="px-3 py-1.5 bg-indigo-50/90 text-[10px] font-bold uppercase tracking-wider text-indigo-800 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" /> Motor de Pesquisa Google Maps
            </span>
            <span className="text-indigo-600 font-semibold">{results.length} resultados</span>
          </div>
          {results.map((p, idx) => {
            const pLat = typeof p.location?.lat === "function" ? p.location.lat() : p.location?.lat;
            const pLng = typeof p.location?.lng === "function" ? p.location.lng() : p.location?.lng;
            const thumb = p.photos?.[0]?.getURI?.({ maxWidth: 200 }) || null;
            const fullCover = p.photos?.[0]?.getURI?.({ maxWidth: 1200, maxHeight: 800 }) || p.photos?.[0]?.getURI?.({ maxWidth: 800 }) || thumb;

            return (
              <button
                key={p.id || idx}
                type="button"
                onClick={() => {
                  if (pLat && pLng) {
                    onSelectPlace({
                      lat: pLat,
                      lng: pLng,
                      address: p.formattedAddress || "",
                      displayName: p.displayName || "",
                      googleMapsURI: p.googleMapsURI || `https://www.google.com/maps/search/?api=1&query=${pLat},${pLng}`,
                      rating: p.rating,
                      photoUrl: fullCover || undefined
                    });
                    setResults([]);
                    setQuery(p.displayName || "");
                  }
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 transition-colors flex items-start gap-2.5 text-gray-700"
              >
                {thumb ? (
                  <img src={thumb} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-200" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-gray-900 text-xs truncate flex items-center gap-1.5">
                    <span>{p.displayName}</span>
                    {p.rating && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                        {p.rating}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate mt-0.5">{p.formattedAddress}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Sub-component: Reactive Map Controller for Google Maps
function GoogleMapController({
  lat,
  lng,
  onMapClick
}: {
  lat: number;
  lng: number;
  onMapClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.panTo({ lat, lng });
    }
  }, [map, lat, lng]);

  return (
    <Map
      defaultCenter={{ lat, lng }}
      defaultZoom={15}
      mapId="DEMO_MAP_ID"
      internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
      style={{ width: "100%", height: "100%" }}
      onClick={(e) => {
        if (e.detail?.latLng) {
          onMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
        }
      }}
    >
      <AdvancedMarker
        position={{ lat, lng }}
        draggable={true}
        onDragEnd={(e) => {
          if (e.latLng) {
            onMapClick(e.latLng.lat(), e.latLng.lng());
          }
        }}
      >
        <Pin background="#4f46e5" glyphColor="#ffffff" borderColor="#312e81" />
      </AdvancedMarker>
    </Map>
  );
}

// Sub-component: Reverse Geocoding for Google Maps click/drag
function ReverseGeocodeTrigger({
  lat,
  lng,
  onLocationDataFetched
}: {
  lat: number;
  lng: number;
  onLocationDataFetched: (data: { address: string; placeName?: string; photoUrl?: string }) => void;
}) {
  const geocodingLib = useMapsLibrary("geocoding");
  const placesLib = useMapsLibrary("places");

  useEffect(() => {
    if (!geocodingLib) return;
    const geocoder = new geocodingLib.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, async (results, status) => {
      if (status === "OK" && results?.[0]) {
        const addressStr = results[0].formatted_address;
        const placeId = results[0].place_id;
        let placeNameStr: string | undefined = undefined;
        let photoUrlStr: string | undefined = undefined;

        if (placeId && placesLib?.Place) {
          try {
            const place = new placesLib.Place({ id: placeId });
            await place.fetchFields({ fields: ["photos", "displayName"] });
            if (place.displayName) placeNameStr = place.displayName;
            if (place.photos && place.photos.length > 0) {
              photoUrlStr = place.photos[0].getURI?.({ maxWidth: 1200, maxHeight: 800 })
                         || place.photos[0].getURI?.({ maxWidth: 800 });
            }
          } catch (e) {
            console.log("No place photo for reverse geocoded point:", e);
          }
        }

        onLocationDataFetched({
          address: addressStr,
          placeName: placeNameStr,
          photoUrl: photoUrlStr
        });
      }
    });
  }, [geocodingLib, placesLib, lat, lng]);

  return null;
}

export default function MapPicker({
  initialLat,
  initialLng,
  initialAddress,
  onSelect,
  onClose
}: MapPickerProps) {
  const [lat, setLat] = useState(initialLat || 39.5);
  const [lng, setLng] = useState(initialLng || -8.0);
  const [address, setAddress] = useState(initialAddress || "");
  const [placeName, setPlaceName] = useState("");
  const [mapsUrl, setMapsUrl] = useState(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  const [placeRating, setPlaceRating] = useState<number | undefined>(undefined);
  const [placePhoto, setPlacePhoto] = useState<string | undefined>(undefined);

  // Link paste extractor state
  const [pastedLink, setPastedLink] = useState("");
  const [linkExtractMsg, setLinkExtractMsg] = useState<string | null>(null);

  // Fallback state when Google Maps fails or is not activated in Google Cloud Console
  const [googleMapsError, setGoogleMapsError] = useState(false);

  // Catch global Google Maps auth or activation errors
  useEffect(() => {
    const originalGmAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps auth / activation failure detected. Switching to OpenStreetMap fallback.");
      setGoogleMapsError(true);
      if (typeof originalGmAuthFailure === "function") {
        originalGmAuthFailure();
      }
    };

    const handleWindowError = (event: ErrorEvent) => {
      const msg = event.message || "";
      if (
        msg.includes("ApiNotActivatedMapError") ||
        msg.includes("Google Maps JavaScript API") ||
        msg.includes("Google Maps API error")
      ) {
        event.preventDefault();
        setGoogleMapsError(true);
      }
    };

    window.addEventListener("error", handleWindowError);

    return () => {
      (window as any).gm_authFailure = originalGmAuthFailure;
      window.removeEventListener("error", handleWindowError);
    };
  }, []);

  // Fallback Leaflet map states
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [osmQuery, setOsmQuery] = useState("");
  const [osmSearching, setOsmSearching] = useState(false);
  const [osmResults, setOsmResults] = useState<any[]>([]);

  const shouldUseGoogle = hasValidGoogleKey && !googleMapsError;

  // Update mapsUrl when coordinates change
  useEffect(() => {
    if (!mapsUrl || mapsUrl.includes("query=")) {
      setMapsUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    }
  }, [lat, lng]);

  // Parse pasted Google Maps URL
  const handleParseGoogleMapsLink = (urlStr: string) => {
    setPastedLink(urlStr);
    if (!urlStr.trim()) return;

    try {
      // Regex 1: Matches @lat,lng format e.g. /@37.85123,-8.79091,17z
      const atMatch = urlStr.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        const parsedLat = parseFloat(atMatch[1]);
        const parsedLng = parseFloat(atMatch[2]);
        setLat(parsedLat);
        setLng(parsedLng);
        setMapsUrl(urlStr);
        setLinkExtractMsg("Coordenadas extraídas do link do Google Maps com sucesso!");
        setTimeout(() => setLinkExtractMsg(null), 4000);
        return;
      }

      // Regex 2: Matches query=lat,lng or q=lat,lng
      const queryMatch = urlStr.match(/[?&](?:query|q)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (queryMatch) {
        const parsedLat = parseFloat(queryMatch[1]);
        const parsedLng = parseFloat(queryMatch[2]);
        setLat(parsedLat);
        setLng(parsedLng);
        setMapsUrl(urlStr);
        setLinkExtractMsg("Ponto GPS extraído do link do Google Maps!");
        setTimeout(() => setLinkExtractMsg(null), 4000);
        return;
      }

      // Extract place title from link path
      const placeMatch = urlStr.match(/\/place\/([^/]+)/);
      if (placeMatch) {
        const decodedName = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
        setPlaceName(decodedName);
        setLinkExtractMsg(`Local "${decodedName}" detetado no link.`);
        setTimeout(() => setLinkExtractMsg(null), 4000);
      }
    } catch (e) {
      console.error("Error parsing maps link:", e);
    }
  };

  // OpenStreetMap Nominatim search for Fallback Mode
  const handleOsmSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osmQuery.trim()) return;
    setOsmSearching(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(osmQuery)}&limit=5`,
        { headers: { "Accept-Language": "pt-PT,pt;q=0.9" } }
      );
      const data = await resp.json();
      if (data && data.length > 0) {
        setOsmResults(data);
      } else {
        alert("Nenhum local encontrado. Tente ser mais específico.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOsmSearching(false);
    }
  };

  // Setup Leaflet map when Google Maps is not available or has an error
  useEffect(() => {
    if (shouldUseGoogle) return;

    let active = true;
    loadLeaflet().then((L) => {
      if (!active || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current).setView([lat, lng], initialLat && initialLng ? 14 : 7);
      leafletMapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      leafletMarkerRef.current = marker;

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setLat(pos.lat);
        setLng(pos.lng);
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
      });

      setIsLeafletLoaded(true);
    }).catch(console.error);

    return () => {
      active = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [shouldUseGoogle]);

  // Sync Leaflet marker when lat/lng state changes
  useEffect(() => {
    if (!shouldUseGoogle && leafletMarkerRef.current && isLeafletLoaded) {
      leafletMarkerRef.current.setLatLng([lat, lng]);
      if (leafletMapRef.current) {
        leafletMapRef.current.setView([lat, lng], 15);
      }
    }
  }, [lat, lng, isLeafletLoaded, shouldUseGoogle]);

function getVenueCoverPhoto(placeNameOrAddress: string): string {
  const lower = (placeNameOrAddress || "").toLowerCase();
  if (lower.includes("praia") || lower.includes("beach") || lower.includes("covo") || lower.includes("costa") || lower.includes("calheta") || lower.includes("mar")) {
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("restaurante") || lower.includes("tasca") || lower.includes("bar") || lower.includes("café") || lower.includes("marisqueira") || lower.includes("bistro")) {
    return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("hotel") || lower.includes("resort") || lower.includes("pousada") || lower.includes("hostel") || lower.includes("albergue")) {
    return "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("palacio") || lower.includes("palácio") || lower.includes("castelo") || lower.includes("monumento") || lower.includes("sintra") || lower.includes("porto") || lower.includes("lisboa")) {
    return "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("parque") || lower.includes("jardim") || lower.includes("serra") || lower.includes("miradouro") || lower.includes("trilho")) {
    return "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80";
  }
  return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";
}

  const handleConfirm = () => {
    let finalPhoto = placePhoto;

    // If no Google Places cover photo is attached, but we have a location name/address,
    // use a realistic venue cover photo
    if (!finalPhoto && (placeName || address)) {
      finalPhoto = getVenueCoverPhoto(placeName || address);
    }

    // Fallback to static map preview ONLY when no cover photo or location name exists
    if (!finalPhoto && lat && lng) {
      if (shouldUseGoogle) {
        finalPhoto = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=800x400&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${GOOGLE_MAPS_KEY}`;
      } else {
        finalPhoto = `https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${lng},${lat}&z=14&l=map&pt=${lng},${lat},pm2rdm&size=600,300`;
      }
    }
    onSelect(lat, lng, address, placeName, mapsUrl, finalPhoto);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-55 flex items-center justify-center p-3 md:p-5 backdrop-blur-sm" id="google-map-picker-modal">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[600px] md:h-[720px] shadow-2xl border border-gray-100 animate-scale-up">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white px-5 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                Pesquisa & Selector de Localização
                <span className="bg-indigo-500/40 text-indigo-200 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-indigo-400/30">
                  {shouldUseGoogle ? "Google Maps Nativo" : "OpenStreetMap Activo"}
                </span>
              </h3>
              <p className="text-[11px] text-indigo-200/80">
                Pesquise qualquer ponto de interesse, praia, restaurante ou cole o link do Google Maps.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-indigo-200 p-1 font-bold text-base">
            ✕
          </button>
        </div>

        {/* Informational Banner if Google key is missing or API is not enabled in Google Cloud */}
        {!hasValidGoogleKey && (
          <div className="p-3 bg-gradient-to-r from-amber-50 to-amber-100/60 border-b border-amber-200 text-amber-950 shrink-0 text-xs">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-900">Como ativar a pesquisa nativa do Google Maps API:</span>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  Adicione a chave <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono font-bold text-amber-950">GOOGLE_MAPS_PLATFORM_KEY</code> em <strong>Definições (⚙️) → Secrets</strong> para ativar mapas vetoriais do Google. Entretanto, o mapa alternativo OpenStreetMap e a leitura de links do Google Maps estão 100% operacionais.
                </p>
              </div>
            </div>
          </div>
        )}

        {googleMapsError && (
          <div className="p-3 bg-gradient-to-r from-amber-50 to-amber-100/80 border-b border-amber-200 text-amber-950 shrink-0 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-900">Aviso da Chave Google Maps:</span>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  A API <code className="bg-white px-1 py-0.5 rounded border border-amber-300 font-mono font-bold">Maps JavaScript API</code> necessita de estar ativada na consola do Google Cloud para esta chave.
                  O mapa alternativo OpenStreetMap e a colagem direta de links do Google Maps foram ativados automaticamente sem qualquer perturbação.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar & Paste Link Controls */}
        <div className="p-3.5 bg-indigo-50/60 border-b border-indigo-100 shrink-0 space-y-2.5 text-xs">
          {shouldUseGoogle ? (
            <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly">
              <GooglePlacesSearchEngine
                currentCenter={{ lat, lng }}
                onError={() => setGoogleMapsError(true)}
                onSelectPlace={(p) => {
                  setLat(p.lat);
                  setLng(p.lng);
                  setAddress(p.address);
                  setPlaceName(p.displayName);
                  setMapsUrl(p.googleMapsURI);
                  setPlaceRating(p.rating);
                  setPlacePhoto(p.photoUrl);
                }}
              />
            </APIProvider>
          ) : (
            <form onSubmit={handleOsmSearch} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={osmQuery}
                  onChange={(e) => setOsmQuery(e.target.value)}
                  placeholder="Pesquisar localidade ou ponto de interesse (ex: Porto Covo, Praia da Ursa, Restaurante O Pescador)..."
                  className="w-full pl-8 pr-2.5 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
                />
                {osmResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 text-xs divide-y divide-gray-100">
                    {osmResults.map((res) => (
                      <button
                        key={res.place_id}
                        type="button"
                        onClick={() => {
                          const nLat = parseFloat(res.lat);
                          const nLng = parseFloat(res.lon);
                          setLat(nLat);
                          setLng(nLng);
                          setAddress(res.display_name || "");
                          setPlaceName(res.display_name.split(",")[0]);
                          setOsmResults([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors flex items-start gap-2"
                      >
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-gray-800 truncate">{res.display_name.split(",")[0]}</div>
                          <div className="text-[10px] text-gray-400 truncate">{res.display_name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={osmSearching}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 shrink-0 text-xs"
              >
                {osmSearching ? "A pesquisar..." : "Pesquisar"}
              </button>
            </form>
          )}

          {/* Direct Google Maps Link Parser Input */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-indigo-600" />
              Cole Link do Google Maps:
            </span>
            <input
              type="text"
              value={pastedLink}
              onChange={(e) => handleParseGoogleMapsLink(e.target.value)}
              placeholder="Cole aqui o link do Google Maps (ex: https://maps.app.goo.gl/... ou /@37.85,-8.79...)"
              className="flex-1 px-2.5 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
            />
          </div>

          {linkExtractMsg && (
            <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-fade-in flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{linkExtractMsg}</span>
            </div>
          )}
        </div>

        {/* Map View Area */}
        <div className="flex-1 bg-gray-100 relative">
          {shouldUseGoogle ? (
            <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly">
              <GoogleMapController
                lat={lat}
                lng={lng}
                onMapClick={(nLat, nLng) => {
                  setLat(nLat);
                  setLng(nLng);
                }}
              />
              <ReverseGeocodeTrigger
                lat={lat}
                lng={lng}
                onLocationDataFetched={({ address: fetchedAddr, placeName: fetchedName, photoUrl: fetchedPhoto }) => {
                  setAddress(fetchedAddr);
                  if (fetchedName) setPlaceName(fetchedName);
                  if (fetchedPhoto) setPlacePhoto(fetchedPhoto);
                }}
              />
            </APIProvider>
          ) : (
            <div className="w-full h-full relative">
              <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "240px" }} />
              {!isLeafletLoaded && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>A carregar o mapa...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Place Card & Confirmation Footer */}
        <div className="p-4 bg-white border-t border-gray-100 space-y-3 shrink-0">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/70 space-y-2 text-xs">
            <div className="flex justify-between items-center text-[10px] font-bold text-indigo-900">
              <span className="uppercase tracking-wider flex items-center gap-1">
                <Navigation className="w-3 h-3 text-indigo-600" />
                Local Selecionado
              </span>
              <span className="font-mono text-gray-500">
                GPS: {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
            </div>

            <div className="flex items-start gap-3">
              {placePhoto && (
                <img src={placePhoto} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-200" />
              )}
              <div className="min-w-0 flex-1 space-y-0.5">
                {placeName && (
                  <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <span>{placeName}</span>
                    {placeRating && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                        {placeRating}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-gray-700 font-medium leading-relaxed truncate">
                  {address || "Clique no mapa para marcar uma localização exata"}
                </p>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 pt-0.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver no Google Maps (Abrir)
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Confirmar e Adicionar ao Itinerário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
