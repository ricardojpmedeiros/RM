import React, { useState, useEffect } from "react";
import { Trip, UserProfile, Event, Expense, Document, SmartRecommendation, Vehicle } from "../types";
import { documentService } from "../services/documentService";
import { invitationService, TripInvitation } from "../services/invitationService";
import { 
  POPULAR_BRANDS,
  getModelsForBrand,
  getYearsForModel,
  getVersionsForSelection
} from "../data/cars";
import MapPicker from "./MapPicker";
import { 
  Car, 
  BatteryCharging, 
  Fuel, 
  FileText, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Users, 
  Upload, 
  Plus, 
  Trash, 
  Copy, 
  Archive, 
  FolderOpen, 
  Camera, 
  Check, 
  Map, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  Printer, 
  Download, 
  Info, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Clock, 
  AlertCircle,
  TrendingDown,
  Navigation,
  Sparkles,
  RefreshCw,
  Pencil,
  Edit,
  X,
  Search,
  Utensils,
  Pill,
  Home,
  Hotel,
  Building,
  Bike,
  Plane,
  Ship,
  Footprints,
  Train
} from "lucide-react";

const getBatteryOrFuelEstimate = (distanceStr?: string, vehicle?: Vehicle | null) => {
  if (!distanceStr || !vehicle) return null;
  // Parse digits/decimals from string (e.g. "25 km" -> 25, "12.5" -> 12.5)
  const match = distanceStr.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const km = parseFloat(match[1]);
  if (isNaN(km) || km <= 0) return null;

  const pct = Math.round((km / vehicle.autonomyRange) * 100);
  if (vehicle.type === "electric") {
    return `~${pct || 1}% bateria`;
  } else {
    // Liters for combustion (assuming average 6.5L/100km)
    const liters = ((km * 6.5) / 100).toFixed(1);
    return `~${pct || 1}% dep. (~${liters}L)`;
  }
};

const getTransportStats = (distance: number, mode: string) => {
  let speed = 50; // km/h
  let cost = 0;
  let durationMin = 0;
  let error: string | null = null;

  switch (mode) {
    case "A pé":
      speed = 5;
      durationMin = (distance / speed) * 60;
      cost = 0;
      break;
    case "Bicicleta":
      speed = 15;
      durationMin = (distance / speed) * 60;
      cost = distance * 0.10; // estimativa de aluguer/desgaste
      break;
    case "Trotinete Elétrica (20Km máx)":
      speed = 18;
      durationMin = (distance / speed) * 60;
      cost = 1.00 + (durationMin * 0.20); // 1€ desbloqueio + 0.20€/minuto
      if (distance > 20) {
        error = "A distância excede o limite máximo de 20Km recomendado para Trotinete!";
      }
      break;
    case "Carro":
      speed = 50;
      durationMin = (distance / speed) * 60;
      cost = distance * 0.18; // combustível
      break;
    case "Metro":
      speed = 35;
      durationMin = (distance / speed) * 60 + 5; // +5 mins de espera média
      cost = 1.65; // bilhete simples metro
      break;
    case "Comboio":
      speed = 75;
      durationMin = (distance / speed) * 60 + 10; // +10 mins de espera média
      cost = 1.35 + (distance * 0.08);
      break;
    case "Avião":
      speed = 650;
      durationMin = (distance / speed) * 60 + 120; // +2 horas de antecedência/aeroporto
      cost = 45 + (distance * 0.12);
      break;
    case "Barco":
      speed = 25;
      durationMin = (distance / speed) * 60 + 15; // +15 mins de embarque
      cost = 3.00 + (distance * 0.15);
      break;
    default:
      speed = 50;
      durationMin = (distance / speed) * 60;
      cost = distance * 0.18;
  }

  // Format duration nicely
  let durationStr = "";
  if (durationMin >= 60) {
    const hours = Math.floor(durationMin / 60);
    const mins = Math.round(durationMin % 60);
    durationStr = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } else {
    durationStr = `${Math.ceil(durationMin)} min`;
  }

  return {
    distance: `${distance.toFixed(1)} km`,
    duration: durationStr,
    durationMin,
    cost,
    error
  };
};

const parseCoordinatesFromUrl = (url: string) => {
  // Matches @37.8512,-8.7909
  const matchAt = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (matchAt) {
    return { lat: matchAt[1], lng: matchAt[2] };
  }
  // Matches place/37.8512,-8.7909
  const matchPlace = url.match(/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (matchPlace) {
    return { lat: matchPlace[1], lng: matchPlace[2] };
  }
  // Matches q=37.8512,-8.7909
  const matchQ = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (matchQ) {
    return { lat: matchQ[1], lng: matchQ[2] };
  }
  // Matches ll=37.8512,-8.7909
  const matchLL = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (matchLL) {
    return { lat: matchLL[1], lng: matchLL[2] };
  }
  return null;
};

const MOCK_NEARBY_PLACES = {
  combustivel: [
    { id: "p-comb-1", name: "Repsol - Sines Marina", address: "Av. Vasco da Gama, Sines", dist: "1.2 km", hours: "Aberto 24h", rating: "4.4 (156)", status: "Disponível", category: "Voo", coords: { x: 300, y: 160 } },
    { id: "p-comb-2", name: "Galp - Estrada de Porto Covo", address: "M554, Porto Covo", dist: "2.4 km", hours: "Aberto 07:00 - 23:00", rating: "4.1 (92)", status: "Disponível", category: "Restaurante", coords: { x: 380, y: 195 } },
    { id: "p-comb-3", name: "BP - Rotunda de Odeceixe", address: "N120, Odeceixe", dist: "3.7 km", hours: "Aberto 06:00 - 00:00", rating: "4.3 (78)", status: "Disponível", category: "Restaurante", coords: { x: 600, y: 250 } },
    { id: "p-comb-4", name: "Prio - Vila do Bispo", address: "Estrada de Sagres", dist: "4.8 km", hours: "Aberto 07:00 - 22:00", rating: "4.2 (114)", status: "Disponível", category: "Atividade livre", coords: { x: 740, y: 290 } },
    { id: "p-comb-5", name: "Intermarché Posto - Sines", address: "Rua do Comércio, Sines", dist: "5.1 km", hours: "Aberto 24h", rating: "4.0 (215)", status: "Disponível", category: "Restaurante", coords: { x: 330, y: 150 } },
  ],
  carregamento: [
    { id: "p-ev-1", name: "Mobi.E 50kW - Porto Covo Central", address: "Largo de Porto Covo", dist: "0.6 km", hours: "Disponível 24h", rating: "4.7 (42)", status: "Disponível (1/2 tomadas)", category: "Atividade livre", coords: { x: 360, y: 185 }, isEV: true },
    { id: "p-ev-2", name: "Tesla Supercharger 250kW - Sines", address: "Hotel Sines Park", dist: "1.8 km", hours: "Disponível 24h", rating: "4.9 (88)", status: "Disponível (6/8 tomadas)", category: "Atividade livre", coords: { x: 320, y: 170 }, isEV: true },
    { id: "p-ev-3", name: "Mobi.E 22kW AC - Odeceixe Praia", address: "Praia de Odeceixe", dist: "2.1 km", hours: "Disponível 24h", rating: "4.2 (19)", status: "Ocupado (0/2 tomadas)", category: "Atividade livre", coords: { x: 640, y: 245 }, isEV: true },
    { id: "p-ev-4", name: "Powerdot 120kW - Sagres", address: "Rua de Sagres Centro", dist: "3.2 km", hours: "Disponível 24h", rating: "4.8 (31)", status: "Disponível (2/2 tomadas)", category: "Atividade livre", coords: { x: 760, y: 310 }, isEV: true },
    { id: "p-ev-5", name: "Mobi.E 50kW - Aljezur Parque", address: "Av. de Aljezur", dist: "6.4 km", hours: "Fora de Serviço", rating: "2.5 (14)", status: "Indisponível (Manutenção)", category: "Atividade livre", coords: { x: 670, y: 270 }, isEV: true },
  ],
  restaurante: [
    { id: "p-rest-1", name: "Arte e Sal", address: "Praia de São Torpes, Sines", dist: "1.1 km", hours: "Aberto 12:00 - 22:30", rating: "4.6 (512)", status: "Aberto (Recomendado)", category: "Restaurante", coords: { x: 280, y: 140 } },
    { id: "p-rest-2", name: "Zé Inácio", address: "Rua do Mar, Porto Covo", dist: "0.4 km", hours: "Aberto 12:00 - 23:00", rating: "4.5 (387)", status: "Aberto", category: "Restaurante", coords: { x: 355, y: 180 } },
    { id: "p-rest-3", name: "Taberna do Gabão", address: "Rua da Igreja, Odeceixe", dist: "1.9 km", hours: "Aberto 12:30 - 22:00", rating: "4.4 (295)", status: "Aberto", category: "Restaurante", coords: { x: 615, y: 260 } },
    { id: "p-rest-4", name: "A Tasca - Sagres Porto", address: "Porto da Baleeira, Sagres", dist: "2.8 km", hours: "Fechado hoje", rating: "4.7 (630)", status: "Fechado", category: "Restaurante", coords: { x: 790, y: 325 } },
    { id: "p-rest-5", name: "Cervejaria Porto Covo", address: "Praça Marquês de Pombal, Porto Covo", dist: "0.5 km", hours: "Aberto 12:00 - 00:00", rating: "4.3 (204)", status: "Aberto", category: "Restaurante", coords: { x: 365, y: 175 } },
  ],
  farmacia: [
    { id: "p-farm-1", name: "Farmácia Covoense", address: "Rua Vasco da Gama, Porto Covo", dist: "0.3 km", hours: "Aberto 09:00 - 20:00", rating: "4.5 (24)", status: "Aberto", category: "Atividade livre", coords: { x: 352, y: 178 } },
    { id: "p-farm-2", name: "Farmácia Central de Sines", address: "Rua Teófilo Braga, Sines", dist: "2.1 km", hours: "Serviço de Piquete 24h", rating: "4.6 (56)", status: "Aberto 24h", category: "Atividade livre", coords: { x: 310, y: 155 } },
    { id: "p-farm-3", name: "Farmácia Odeceixense", address: "Rua 25 de Abril, Odeceixe", dist: "1.5 km", hours: "Aberto 09:00 - 19:00", rating: "4.2 (18)", status: "Aberto", category: "Atividade livre", coords: { x: 610, y: 255 } },
    { id: "p-farm-4", name: "Farmácia de Aljezur", address: "Rua da Carreira, Aljezur", dist: "5.5 km", hours: "Aberto 09:00 - 19:00", rating: "4.4 (30)", status: "Aberto", category: "Atividade livre", coords: { x: 680, y: 280 } },
    { id: "p-farm-5", name: "Farmácia de São Vicente", address: "Vila do Bispo Centro", dist: "7.1 km", hours: "Fechado", rating: "4.0 (12)", status: "Fechado", category: "Atividade livre", coords: { x: 750, y: 300 } },
  ]
};

interface TripDetailsProps {
  trip: Trip;
  activeUser: UserProfile;
  onBack: () => void;
  onUpdateTrip: (updated: Trip) => void;
  onOpenReport: () => void;
}

export default function TripDetails({
  trip,
  activeUser,
  onBack,
  onUpdateTrip,
  onOpenReport
}: TripDetailsProps) {
  const [activeTab, setActiveTab] = useState<"hoje" | "itinerary" | "map" | "expenses" | "documents" | "participants" | "vehicle">("hoje");
  
  // Day navigation for itinerary
  const dates = Object.keys(trip.itinerary).sort();
  const [selectedDate, setSelectedDate] = useState(dates[0] || "");

  // Event modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [evtName, setEvtName] = useState("");
  const [evtTimeStart, setEvtTimeStart] = useState("10:00");
  const [evtTimeEnd, setEvtTimeEnd] = useState("");
  const [evtDuration, setEvtDuration] = useState("");
  const [evtGoogleMapsLink, setEvtGoogleMapsLink] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showAccommodationMapPicker, setShowAccommodationMapPicker] = useState(false);
  const [showHomeMapPicker, setShowHomeMapPicker] = useState(false);
  const [evtCategory, setEvtCategory] = useState("Atividade livre");
  const [evtDescription, setEvtDescription] = useState("");
  const [evtAddress, setEvtAddress] = useState("");
  const [evtLat, setEvtLat] = useState("");
  const [evtLng, setEvtLng] = useState("");
  const [evtNotes, setEvtNotes] = useState("");
  const [evtImage, setEvtImage] = useState("");

  // Expense manual form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expCategory, setExpCategory] = useState("Restaurantes");
  const [expDescription, setExpDescription] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(trip.startDate);
  const [expIsPlanned, setExpIsPlanned] = useState(false);
  const [expSupplier, setExpSupplier] = useState("");

  // OCR Invoice scanner simulation & API integration
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState("");

  // Autonomy state & recommendations
  const [batteryPercent, setBatteryPercent] = useState(trip.vehicle?.batteryPercent || 80);
  const [fuelPercent, setFuelPercent] = useState(trip.vehicle?.fuelPercent || 80);
  const [currentAutonomy, setCurrentAutonomy] = useState<number | "">(trip.vehicle?.currentAutonomy || 320);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<SmartRecommendation | null>(null);

  // Map Search Nearby states
  const [mapSearchCategory, setMapSearchCategory] = useState<"combustivel" | "carregamento" | "restaurante" | "farmacia" | "">("");
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [selectedMapPlace, setSelectedMapPlace] = useState<any | null>(null);
  const [addPlaceSuccess, setAddPlaceSuccess] = useState<string | null>(null);

  // Replacement car states
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [replName, setReplName] = useState("Carro de Substituição - Rent-a-Car");
  const [replType, setReplType] = useState<"electric" | "gasoline" | "diesel" | "hybrid">("gasoline");
  const [replRange, setReplRange] = useState<number | "">(600);
  const [selectedReplBrand, setSelectedReplBrand] = useState("");
  const [selectedReplModel, setSelectedReplModel] = useState("");
  const [selectedReplYear, setSelectedReplYear] = useState("");

  // Flight states (Planners can configure flights)
  const [flightNo, setFlightNo] = useState("");
  const [flightAirline, setFlightAirline] = useState("");
  const [flightDep, setFlightDep] = useState("");
  const [flightArr, setFlightArr] = useState("");
  const [flightDate, setFlightDate] = useState(trip.startDate);
  const [flightPassengers, setFlightPassengers] = useState<number | "">(1);
  const [flightPrice, setFlightPrice] = useState<number | "">(50);
  const [showFlightForm, setShowFlightForm] = useState(false);

  // Document upload state
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("application/pdf");
  const [docAllowedConsultor, setDocAllowedConsultor] = useState(true);
  const [showDocForm, setShowDocForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Participant state
  const [partName, setPartName] = useState("");
  const [partEmail, setPartEmail] = useState("");
  const [partRole, setPartRole] = useState<"Planeador" | "Consultor">("Consultor");
  const [showPartForm, setShowPartForm] = useState(false);
  const [invitations, setInvitations] = useState<TripInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  const loadInvitations = async () => {
    if (!trip.id) return;
    setLoadingInvitations(true);
    try {
      const data = await invitationService.fetchInvitations(trip.id);
      setInvitations(data);
    } catch (err) {
      console.error("Error loading invitations:", err);
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    if (activeTab === "participants") {
      loadInvitations();
    }
  }, [trip.id, activeTab]);

  const isPlanner = activeUser.role === "Planeador";

  // Word/Text Draft Itinerary Parser states
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftParsing, setDraftParsing] = useState(false);

  const fetchSmartRecommendations = async () => {
    if (!trip.vehicle) return;
    setRecsLoading(true);
    try {
      const resp = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: trip.id,
          currentAutonomy,
          limitThreshold: trip.vehicle.limitThreshold || 30,
          batteryPercent,
          fuelPercent,
          date: selectedDate || dates[0]
        })
      });
      const data = await resp.json();
      setRecommendations(data);
    } catch (err) {
      console.error("Error loading smart recs:", err);
    } finally {
      setRecsLoading(false);
    }
  };

  // Run initial smart recommendations when entering the Vehicle tab
  useEffect(() => {
    if (activeTab === "vehicle" && trip.vehicle) {
      fetchSmartRecommendations();
    }
  }, [activeTab, trip.vehicle, batteryPercent, fuelPercent, currentAutonomy]);

  // Sync state variables if trip.vehicle updates or goes from null/undefined to loaded
  useEffect(() => {
    if (trip.vehicle) {
      setBatteryPercent(trip.vehicle.batteryPercent ?? 100);
      setFuelPercent(trip.vehicle.fuelPercent ?? 100);
      setCurrentAutonomy(trip.vehicle.currentAutonomy ?? trip.vehicle.autonomyRange);
    }
  }, [trip.vehicle]);

  // Handle OCR receipt files selection
  const handleOCRFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrSuccessMsg("");

    // Read and encode to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const resp = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type
          })
        });
        const extracted = await resp.json();
        
        if (extracted.error) {
          alert("Não foi possível analisar a fatura: " + extracted.error);
        } else {
          // Add newly scanned expense
          const newExp: Expense = {
            id: "exp-ocr-" + Date.now(),
            category: extracted.category || "Outros",
            description: extracted.description || "Digitalização OCR",
            amount: Number(extracted.amount) || 0,
            date: extracted.date || new Date().toISOString().split("T")[0],
            isPlanned: false, // scanned receipts are always Real expenses
            supplier: extracted.supplier || "Desconhecido"
          };

          const updatedTrip = {
            ...trip,
            expenses: [...trip.expenses, newExp]
          };
          onUpdateTrip(updatedTrip);
          setOcrSuccessMsg(`Fatura analisada! Adicionado ${newExp.amount.toFixed(2)}€ em ${newExp.category} (${newExp.supplier}).`);
        }
      } catch (err: any) {
        alert("Falha de OCR: " + err.message);
      } finally {
        setOcrLoading(false);
      }
    };
  };

  // Auto-calculation of distance and departure times (intelligent navigation helper)
  const calculateNavigationLegs = (eventsList: Event[]) => {
    return eventsList.map((evt, idx) => {
      if (idx === 0) return evt;
      
      // If distances are missing, automatically calculate mock GPS ranges dynamically
      const distances = ["12 km", "4.5 km", "22 km", "65 km", "18 km"];
      const times = ["15 min", "8 min", "25 min", "1h 10m", "20 min"];
      
      const prev = eventsList[idx - 1];
      let distance = evt.distanceFromPrev;
      let time = evt.timeFromPrev;

      if (!distance && prev.coordinates && evt.coordinates) {
        // Spherical approximate distance
        const dx = (prev.coordinates.lat - evt.coordinates.lat) * 111;
        const dy = (prev.coordinates.lng - evt.coordinates.lng) * 111 * Math.cos(prev.coordinates.lat * Math.PI / 180);
        const calcDist = Math.sqrt(dx*dx + dy*dy);
        distance = `${calcDist.toFixed(1)} km`;
        // Time assumption: 1.5 minutes per kilometer
        time = `${Math.ceil(calcDist * 1.3)} min`;
      } else if (!distance) {
        distance = distances[idx % distances.length];
        time = times[idx % times.length];
      }

      // Parse the numeric distance in km
      let distanceKm = 5;
      if (distance) {
        const match = distance.match(/(\d+(?:\.\d+)?)/);
        if (match) {
          distanceKm = parseFloat(match[1]);
        }
      }

      let computedTime = time;
      let computedCost = 0;
      let computedError: string | null = null;

      if (evt.transportType) {
        const stats = getTransportStats(distanceKm, evt.transportType);
        computedTime = stats.duration;
        computedCost = stats.cost;
        computedError = stats.error;
      }

      return {
        ...evt,
        distanceFromPrev: distance,
        timeFromPrev: computedTime,
        transportCost: computedCost,
        transportError: computedError
      };
    });
  };

  const activeItineraryList = calculateNavigationLegs(trip.itinerary[selectedDate] || []);

  // Location intelligence: Find Current Event or Next upcoming Event
  const findActiveOrNextEvent = (): { event: Event | null; dateStr: string; type: "current" | "next" | "first" } => {
    // Since our local mock time is 2026-07-05T09:48:19-07:00, let's see if there are any events scheduled for that date or the first date
    const todayStr = new Date().toISOString().split("T")[0]; // "2026-07-05"
    let targetDayEvents = trip.itinerary[todayStr];
    let selectedDateUsed = todayStr;

    if (!targetDayEvents || targetDayEvents.length === 0) {
      // Find the first day with events
      const dayWithEvents = dates.find(d => trip.itinerary[d] && trip.itinerary[d].length > 0);
      if (dayWithEvents) {
        targetDayEvents = trip.itinerary[dayWithEvents];
        selectedDateUsed = dayWithEvents;
      }
    }

    if (!targetDayEvents || targetDayEvents.length === 0) {
      return { event: null, dateStr: "", type: "first" };
    }

    // Parse mock system hour (we can read current local time "09:48" or check system clock)
    const nowHour = new Date().getHours();
    const nowMin = new Date().getMinutes();
    const nowTimeStr = `${String(nowHour).padStart(2, "0")}:${String(nowMin).padStart(2, "0")}`;

    // 1. Try to find active event occurring right now
    const current = targetDayEvents.find(e => nowTimeStr >= e.timeStart && (!e.timeEnd || nowTimeStr <= e.timeEnd));
    if (current) {
      return { event: current, dateStr: selectedDateUsed, type: "current" };
    }

    // 2. Try to find next upcoming event
    const nextEvt = targetDayEvents.find(e => e.timeStart > nowTimeStr);
    if (nextEvt) {
      return { event: nextEvt, dateStr: selectedDateUsed, type: "next" };
    }

    // 3. Fallback to the very first event of that day
    return { event: targetDayEvents[0], dateStr: selectedDateUsed, type: "first" };
  };

  const smartLocationEvent = findActiveOrNextEvent();

  const handleGoogleMapsLinkChange = (link: string) => {
    setEvtGoogleMapsLink(link);
    if (!link) return;

    // Try parsing coordinates
    const coords = parseCoordinatesFromUrl(link);
    if (coords) {
      setEvtLat(coords.lat);
      setEvtLng(coords.lng);
    }

    // Try parsing place name from Google Maps link
    // E.g., /place/Sines,+Portugal/ or similar
    const placeMatch = link.match(/place\/([^/]+)/);
    if (placeMatch && !evtAddress) {
      try {
        const decoded = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
        setEvtAddress(decoded);
      } catch (e) {
        // ignore
      }
    }
  };

  const handleAddSearchPlaceToItinerary = (place: any) => {
    let category = "Atividade livre";
    let defaultTime = "10:00";
    if (mapSearchCategory === "combustivel") {
      category = "Viagem / Na estrada";
      defaultTime = "09:00";
    } else if (mapSearchCategory === "carregamento") {
      category = "Atividade livre";
      defaultTime = "14:00";
    } else if (mapSearchCategory === "restaurante") {
      category = "Restaurante";
      defaultTime = "13:00";
    } else if (mapSearchCategory === "farmacia") {
      category = "Atividade livre";
      defaultTime = "11:00";
    }

    const newEvent: Event = {
      id: "evt-search-" + Date.now(),
      name: place.name,
      timeStart: defaultTime,
      category: category,
      address: place.address,
      description: `Ponto de interesse sugerido por pesquisa próxima: ${place.hours}. Classificação: ${place.rating}.`,
      coordinates: { lat: 37.8, lng: -8.8 },
      googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ", " + place.address)}`,
      wazeLink: `https://waze.com/ul?q=${encodeURIComponent(place.name + ", " + place.address)}`,
      notes: `Pesquisa de proximidade. Estado: ${place.status}`,
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"
    };

    const targetDay = selectedDate || dates[0];
    const updatedItinerary = { ...trip.itinerary };
    if (!updatedItinerary[targetDay]) updatedItinerary[targetDay] = [];
    
    updatedItinerary[targetDay].push(newEvent);
    updatedItinerary[targetDay].sort((a, b) => a.timeStart.localeCompare(b.timeStart));

    onUpdateTrip({
      ...trip,
      itinerary: updatedItinerary
    });

    setAddPlaceSuccess(`"${place.name}" foi adicionado com sucesso ao seu itinerário de dia ${targetDay}!`);
    setTimeout(() => setAddPlaceSuccess(null), 5000);
  };

  // Helper to obtain mock coordinates for home and accommodation addresses
  const getCoordinatesForAddress = (address: string) => {
    const addr = (address || "").toLowerCase();
    if (addr.includes("lisboa")) return { lat: 38.7223, lng: -9.1393 };
    if (addr.includes("porto covo")) return { lat: 37.8512, lng: -8.7909 };
    if (addr.includes("odeceixe")) return { lat: 37.4325, lng: -8.7702 };
    if (addr.includes("sagres")) return { lat: 37.0099, lng: -8.9391 };
    if (addr.includes("zambujeira") || addr.includes("touril")) return { lat: 37.5255, lng: -8.7842 };
    if (addr.includes("sines")) return { lat: 37.9560, lng: -8.8698 };
    if (addr.includes("aeroporto")) return { lat: 38.7742, lng: -9.1342 };
    if (addr.includes("faro")) return { lat: 37.0176, lng: -7.9734 };
    return { lat: 37.5 + (Math.random() - 0.5) * 0.5, lng: -8.5 + (Math.random() - 0.5) * 0.5 };
  };

  // Helper to calculate navigation leg between address and event/address
  const calculateLeg = (fromAddress: string, toAddressOrEvent: Event | string) => {
    const fromCoords = getCoordinatesForAddress(fromAddress);
    let toCoords;
    if (typeof toAddressOrEvent === "string") {
      toCoords = getCoordinatesForAddress(toAddressOrEvent);
    } else {
      toCoords = toAddressOrEvent.coordinates || getCoordinatesForAddress(toAddressOrEvent.address || toAddressOrEvent.name);
    }
    
    const dx = (fromCoords.lat - toCoords.lat) * 111;
    const dy = (fromCoords.lng - toCoords.lng) * 111 * Math.cos(fromCoords.lat * Math.PI / 180);
    const calcDist = Math.sqrt(dx*dx + dy*dy);
    
    const distance = `${calcDist.toFixed(1)} km`;
    const time = `${Math.ceil(calcDist * 1.3)} min`;
    
    return { distance, time };
  };

  // Handle free-form draft text parser submit
  const handleDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftText.trim()) return;

    setDraftParsing(true);
    try {
      const resp = await fetch(`/api/trips/${trip.id}/parse-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftText })
      });
      const data = await resp.json();

      if (data.error) {
        alert("Erro ao analisar rascunho: " + data.error);
      } else if (data.events && data.events.length > 0) {
        const targetDay = selectedDate || dates[0];
        const updatedItinerary = { ...trip.itinerary };
        if (!updatedItinerary[targetDay]) updatedItinerary[targetDay] = [];

        // Add the parsed events to current selected day
        updatedItinerary[targetDay] = [
          ...updatedItinerary[targetDay],
          ...data.events
        ];

        // Sort by timeStart
        updatedItinerary[targetDay].sort((a, b) => a.timeStart.localeCompare(b.timeStart));

        onUpdateTrip({
          ...trip,
          itinerary: updatedItinerary
        });

        alert(`${data.events.length} eventos extraídos e adicionados com sucesso ao dia de itinerário ${targetDay}!`);
        setShowDraftModal(false);
        setDraftText("");
      } else {
        alert("Nenhum evento pôde ser extraído do rascunho. Tente adicionar horas (ex: 09:30 - Pequeno almoço) para que o sistema consiga mapear melhor.");
      }
    } catch (err: any) {
      alert("Erro de rede ao sincronizar rascunho: " + err.message);
    } finally {
      setDraftParsing(false);
    }
  };

  // Handle free-form draft file selection and read
  const handleDraftFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setDraftText(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  // Handle Event submit (Create / Edit)
  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtName) return;

    const coordinates = evtLat && evtLng ? { lat: Number(evtLat), lng: Number(evtLng) } : null;

    const eventPayload: Partial<Event> = {
      name: evtName,
      timeStart: evtTimeStart,
      timeEnd: evtTimeEnd || undefined,
      duration: evtDuration || undefined,
      category: evtCategory,
      description: evtDescription,
      address: evtAddress,
      coordinates,
      googleMapsLink: evtGoogleMapsLink || (evtAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evtAddress)}` : ""),
      wazeLink: evtAddress ? `https://waze.com/ul?q=${encodeURIComponent(evtAddress)}` : "",
      notes: evtNotes,
      image: evtImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"
    };

    let updatedItinerary = { ...trip.itinerary };

    if (editingEventId) {
      // Edit
      updatedItinerary[selectedDate] = updatedItinerary[selectedDate].map(evt => 
        evt.id === editingEventId ? { ...evt, ...eventPayload } : evt
      );
    } else {
      // Create
      const newEvent: Event = {
        id: "evt-" + Date.now(),
        ...(eventPayload as Event)
      };
      if (!updatedItinerary[selectedDate]) updatedItinerary[selectedDate] = [];
      updatedItinerary[selectedDate].push(newEvent);
    }

    // Sort
    updatedItinerary[selectedDate].sort((a, b) => a.timeStart.localeCompare(b.timeStart));

    onUpdateTrip({
      ...trip,
      itinerary: updatedItinerary
    });

    // Reset
    setShowEventModal(false);
    setEditingEventId(null);
    setEvtName("");
    setEvtTimeStart("10:00");
    setEvtTimeEnd("");
    setEvtDuration("");
    setEvtGoogleMapsLink("");
    setEvtDescription("");
    setEvtAddress("");
    setEvtLat("");
    setEvtLng("");
    setEvtNotes("");
    setEvtImage("");
  };

  const handleEditEventClick = (evt: Event) => {
    setEditingEventId(evt.id);
    setEvtName(evt.name);
    setEvtTimeStart(evt.timeStart);
    setEvtTimeEnd(evt.timeEnd || "");
    setEvtDuration(evt.duration || "");
    setEvtGoogleMapsLink(evt.googleMapsLink || "");
    setEvtCategory(evt.category);
    setEvtDescription(evt.description);
    setEvtAddress(evt.address);
    setEvtLat(evt.coordinates ? String(evt.coordinates.lat) : "");
    setEvtLng(evt.coordinates ? String(evt.coordinates.lng) : "");
    setEvtNotes(evt.notes);
    setEvtImage(evt.image);
    setShowEventModal(true);
  };

  const handleDeleteEvent = (id: string) => {
    if (!confirm("Pretende eliminar este evento do itinerário?")) return;
    const updatedItinerary = { ...trip.itinerary };
    updatedItinerary[selectedDate] = updatedItinerary[selectedDate].filter(e => e.id !== id);

    onUpdateTrip({
      ...trip,
      itinerary: updatedItinerary
    });
  };

  const handleUpdateEventTransport = (eventId: string, transportType: string) => {
    const updatedItinerary = { ...trip.itinerary };
    for (const date of Object.keys(updatedItinerary)) {
      updatedItinerary[date] = (updatedItinerary[date] || []).map(evt => {
        if (evt.id === eventId) {
          return {
            ...evt,
            transportType: transportType
          };
        }
        return evt;
      });
    }
    onUpdateTrip({
      ...trip,
      itinerary: updatedItinerary
    });
  };

  // Handle manual expense submit
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDescription || !expAmount) return;

    const newExp: Expense = {
      id: "exp-" + Date.now(),
      category: expCategory,
      description: expDescription,
      amount: Number(expAmount),
      date: expDate,
      isPlanned: expIsPlanned,
      supplier: expSupplier
    };

    onUpdateTrip({
      ...trip,
      expenses: [...trip.expenses, newExp]
    });

    // Reset
    setShowExpenseForm(false);
    setExpDescription("");
    setExpAmount("");
    setExpSupplier("");
  };

  // Handle Flights submit
  const handleFlightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightNo || !flightAirline) return;

    const newFlight = {
      flightNo,
      airline: flightAirline,
      departure: flightDep,
      arrival: flightArr,
      date: flightDate,
      passengers: Number(flightPassengers),
      pricePerPassenger: Number(flightPrice),
      totalPrice: Number(flightPassengers) * Number(flightPrice)
    };

    // Automatically append flight cost to planned expenses
    const flightExpense: Expense = {
      id: "exp-fl-" + Date.now(),
      category: "Voos",
      description: `Voo ${flightNo} (${flightAirline}) - ${flightPassengers} pax`,
      amount: newFlight.totalPrice,
      date: flightDate,
      isPlanned: true,
      supplier: flightAirline
    };

    onUpdateTrip({
      ...trip,
      flights: [...trip.flights, newFlight],
      expenses: [...trip.expenses, flightExpense]
    });

    // Reset
    setShowFlightForm(false);
    setFlightNo("");
    setFlightAirline("");
    setFlightDep("");
    setFlightArr("");
  };

  // Handle Document upload
  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Por favor selecione um ficheiro.");
      return;
    }

    setUploadingDoc(true);
    try {
      const uploaded = await documentService.uploadDocument(
        trip.id,
        selectedFile,
        docAllowedConsultor
      );
      
      onUpdateTrip({
        ...trip,
        documents: [...trip.documents, uploaded]
      });

      setShowDocForm(false);
      setSelectedFile(null);
      setDocName("");
    } catch (err: any) {
      alert("Erro ao carregar documento: " + err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  // Handle inviting participants
  const handleParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partEmail) {
      alert("Por favor introduza o e-mail do convidado.");
      return;
    }

    setSendingInvite(true);
    try {
      await invitationService.createInvitation(trip.id, partEmail);
      alert("Convite registado com sucesso! Copie a ligação abaixo e envie-a ao convidado.");
      setPartEmail("");
      setShowPartForm(false);
      loadInvitations();
    } catch (err: any) {
      alert("Erro ao criar convite: " + err.message);
    } finally {
      setSendingInvite(false);
    }
  };

  // Check manual fuel / battery percent adjustments on the fly
  const handleAutonomyInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip.vehicle) return;
    
    onUpdateTrip({
      ...trip,
      vehicle: {
        ...trip.vehicle,
        batteryPercent: trip.vehicle.type === "electric" ? batteryPercent : undefined,
        fuelPercent: trip.vehicle.type !== "electric" ? fuelPercent : undefined,
        currentAutonomy: Number(currentAutonomy)
      }
    });

    fetchSmartRecommendations();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-8" id="trip-workspace">
      {/* Back button & title bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6" id="title-bar">
        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={onBack}
            className="relative z-20 flex items-center justify-center gap-2 px-4 py-3 sm:px-3 sm:py-2 bg-indigo-600 sm:bg-white hover:bg-indigo-700 sm:hover:bg-gray-50 rounded-xl border border-indigo-600 sm:border-gray-200 text-white sm:text-gray-700 font-bold sm:font-semibold text-sm sm:text-xs shadow-md sm:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0 min-h-[44px]"
            title="Voltar ao Painel"
          >
            <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4 text-white sm:text-gray-500" />
            <span>Voltar</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight truncate">{trip.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{trip.destination} • {trip.startDate} a {trip.endDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Print final report button */}
          <button
            onClick={onOpenReport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-indigo-100"
          >
            <Printer className="w-4 h-4" />
            Relatório de Viagem (PDF)
          </button>
        </div>
      </div>

      {/* Main Workspace Navigation Rails */}
      <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-200 overflow-x-auto gap-1 mb-6 scrollbar-none" id="trip-tabs">
        <button
          onClick={() => setActiveTab("hoje")}
          className={`whitespace-nowrap text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "hoje" ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          Hoje
        </button>
        <button
          onClick={() => setActiveTab("itinerary")}
          className={`whitespace-nowrap text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "itinerary" ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Itinerário
        </button>
        <button
          onClick={() => setActiveTab("map")}
          className={`whitespace-nowrap text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "map" ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Map className="w-4 h-4" />
          Mapa
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`whitespace-nowrap text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "expenses" ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Despesas
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`whitespace-nowrap text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "documents" ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          Documentos
        </button>
        <button
          onClick={() => setActiveTab("participants")}
          className={`whitespace-nowrap text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "participants" ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Users className="w-4 h-4" />
          Grupo
        </button>
        {(trip.vehicle || isPlanner) && (
          <button
            onClick={() => setActiveTab("vehicle")}
            className={`whitespace-nowrap text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "vehicle" ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Car className="w-4 h-4" />
            Veículo & Autonomia
          </button>
        )}
      </div>

      {/* --- TAB 1: HOJE (Intelligent current event locator) --- */}
      {activeTab === "hoje" && (
        <div className="space-y-6" id="view-hoje">
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
            {/* Ambient visual background glow */}
            <div className="absolute right-0 bottom-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 max-w-2xl">
              <span className="bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider text-[10px] px-3 py-1 rounded-full border border-indigo-500/20">
                Localização Inteligente Active-Tracking
              </span>

              {smartLocationEvent.event ? (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-200 text-xs">
                    <Clock className="w-4 h-4" />
                    <span>
                      {smartLocationEvent.type === "current" && `A decorrer agora (${smartLocationEvent.event.timeStart} - ${smartLocationEvent.event.timeEnd})`}
                      {smartLocationEvent.type === "next" && `Próximo evento programado (${smartLocationEvent.event.timeStart})`}
                      {smartLocationEvent.type === "first" && `Dia ${smartLocationEvent.dateStr} (Início do itinerário)`}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{smartLocationEvent.event.name}</h3>
                  <p className="text-indigo-100/80 text-sm leading-relaxed max-w-xl">{smartLocationEvent.event.description || "Nenhuma descrição."}</p>

                  <div className="flex items-center gap-1.5 text-xs text-indigo-200">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    <span>{smartLocationEvent.event.address}</span>
                  </div>

                  {smartLocationEvent.event.notes && (
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs text-indigo-100 max-w-lg">
                      <strong className="text-white block mb-0.5">Notas Importantes:</strong>
                      {smartLocationEvent.event.notes}
                    </div>
                  )}

                  {/* Maps & GPS Navigation shortcuts */}
                  <div className="flex flex-wrap gap-2 pt-3">
                    <a
                      href={smartLocationEvent.event.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white text-indigo-900 font-bold text-xs px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Navegar com Google Maps
                    </a>
                    <a
                      href={smartLocationEvent.event.wazeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      Abrir no Waze
                    </a>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-indigo-200 text-sm">
                  Sem eventos no itinerário para hoje. Toque na aba <strong className="text-white font-bold">Itinerário</strong> para planear o dia!
                </div>
              )}
            </div>
          </div>

          {/* Side card showing current day checklist and vehicle health */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Dicas rápidas para a sua viagem
              </h4>
              <ul className="space-y-2.5 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold">✓</span>
                  <span><strong>Modo Offline Activado:</strong> O TripPilot sincroniza o seu itinerário automaticamente na nuvem quando tiver rede.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold">ℹ</span>
                  <span><strong>Previsão de Desvio:</strong> Selecionando dois pontos consecutivos no Itinerário, calculamos automaticamente as coordenadas e tempos recomendados.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold">!</span>
                  <span><strong>Despesa Rápida (OCR):</strong> Tire foto das faturas de combustível ou portagens na aba Despesas para preenchimento automático.</span>
                </li>
              </ul>
            </div>

            {trip.vehicle && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <Car className="w-4 h-4 text-indigo-600" />
                    Status do Carro
                  </h4>
                  <p className="text-gray-900 font-bold text-base mt-3">{trip.vehicle.name}</p>
                  <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                    <span>Autonomia Estimada:</span>
                    <span className="font-bold text-gray-900">{currentAutonomy} km</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full ${currentAutonomy < 130 ? "bg-rose-500" : "bg-emerald-500"}`} 
                      style={{ width: `${Math.min(100, (currentAutonomy / trip.vehicle.autonomyRange) * 100)}%` }}
                    ></div>
                  </div>

                  {/* Quick Autonomy Update Widget */}
                  <div className="mt-5 pt-4 border-t border-gray-100 space-y-2.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Atualizar Autonomia (km)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Km..."
                        value={currentAutonomy}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          if (rawVal === "") {
                            setCurrentAutonomy("");
                            return;
                          }
                          const val = Number(rawVal);
                          setCurrentAutonomy(val);
                          if (trip.vehicle) {
                            onUpdateTrip({
                              ...trip,
                              vehicle: {
                                ...trip.vehicle,
                                currentAutonomy: val
                              }
                            });
                          }
                        }}
                        className="w-24 px-2.5 py-1.5 border border-gray-300 rounded-lg text-base md:text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          fetchSmartRecommendations();
                          alert("Autonomia sincronizada! Recomendações atualizadas.");
                        }}
                        className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-1.5 rounded-lg transition-colors border border-indigo-100/50"
                      >
                        Sincronizar
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("vehicle")}
                  className="mt-4 text-center bg-gray-50 hover:bg-gray-100 border border-gray-100 text-indigo-600 text-xs font-bold py-2 rounded-xl transition-colors block w-full"
                >
                  Consultar recomendações inteligentes
                </button>
              </div>
            )}

            {!trip.vehicle && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <Car className="w-4 h-4 text-indigo-600" />
                    Status do Carro
                  </h4>
                  <p className="text-gray-500 text-xs leading-relaxed mt-2">
                    Não associou nenhuma viatura de aluguer a esta viagem. Pode registar uma viatura a qualquer momento para obter previsões de consumos, autonomias e postos inteligentes.
                  </p>
                </div>
                {isPlanner ? (
                  <button
                    onClick={() => {
                      setReplName("");
                      setReplType("gasoline");
                      setReplRange(500);
                      setSelectedReplBrand("");
                      setSelectedReplModel("");
                      setSelectedReplYear("");
                      setShowReplacementModal(true);
                    }}
                    className="text-center bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 text-xs font-bold py-2.5 rounded-xl transition-colors block w-full cursor-pointer animate-pulse"
                  >
                    Registar Carro Agora 🚗
                  </button>
                ) : (
                  <div className="text-[10px] text-gray-400 italic text-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                    Apenas os planeadores podem registar viaturas.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: ITINERARIO --- */}
      {activeTab === "itinerary" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="view-itinerary">
          {/* Day picker side block */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Dias de Viagem</h4>
            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              {dates.map((d, index) => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`text-left px-4 py-3 rounded-xl border transition-all shrink-0 lg:shrink flex flex-row lg:flex-col justify-between items-start gap-1 w-fit lg:w-full ${
                    selectedDate === d 
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                      : "bg-white border-gray-100 hover:border-indigo-100 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xs font-bold opacity-75">Dia {index + 1}</span>
                  <span className="font-bold text-xs lg:text-sm">{new Date(d).toLocaleDateString("pt-PT", { month: "short", day: "numeric" })}</span>
                </button>
              ))}
            </div>

            {isPlanner ? (
              <div className="space-y-2 mt-2">
                <button
                  onClick={() => {
                    setEditingEventId(null);
                    setShowEventModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Evento
                </button>
                <button
                  onClick={() => setShowDraftModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-medium py-1.5 rounded-lg text-[11px] transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Importar Rascunho (Word/Texto)
                </button>
              </div>
            ) : null}

            {/* Passageiros / Grupo Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm mt-3" id="trip-passengers-sidebar-card">
              <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Participantes / Passageiros
              </h5>
              
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-1.5 rounded-xl border border-gray-100">
                  <div className="text-gray-400 text-[9px] font-bold uppercase">Adultos</div>
                  {isPlanner ? (
                    <input
                      type="number"
                      min={1}
                      value={trip.numAdults || 2}
                      onChange={(e) => {
                        onUpdateTrip({
                          ...trip,
                          numAdults: Math.max(1, Number(e.target.value))
                        });
                      }}
                      className="w-full text-center font-bold text-gray-800 bg-white border border-gray-200 rounded-lg mt-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <div className="font-extrabold text-base text-gray-800 mt-1">{trip.numAdults || 2}</div>
                  )}
                </div>
                <div className="bg-slate-50 p-1.5 rounded-xl border border-gray-100">
                  <div className="text-gray-400 text-[9px] font-bold uppercase">Crianças</div>
                  {isPlanner ? (
                    <input
                      type="number"
                      min={0}
                      value={trip.numChildren || 0}
                      onChange={(e) => {
                        onUpdateTrip({
                          ...trip,
                          numChildren: Math.max(0, Number(e.target.value))
                        });
                      }}
                      className="w-full text-center font-bold text-gray-800 bg-white border border-gray-200 rounded-lg mt-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <div className="font-extrabold text-base text-gray-800 mt-1">{trip.numChildren || 0}</div>
                  )}
                </div>
                <div className="bg-slate-50 p-1.5 rounded-xl border border-gray-100">
                  <div className="text-gray-400 text-[9px] font-bold uppercase">Bebés</div>
                  {isPlanner ? (
                    <input
                      type="number"
                      min={0}
                      value={trip.numBabies || 0}
                      onChange={(e) => {
                        onUpdateTrip({
                          ...trip,
                          numBabies: Math.max(0, Number(e.target.value))
                        });
                      }}
                      className="w-full text-center font-bold text-gray-800 bg-white border border-gray-200 rounded-lg mt-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <div className="font-extrabold text-base text-gray-800 mt-1">{trip.numBabies || 0}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Morada de Casa (Origem/Fim) Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm mt-3" id="trip-home-sidebar-card">
              <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-indigo-500" />
                Morada de Casa (Origem/Fim)
              </h5>
              
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Morada de Casa / Origem:</label>
                  {isPlanner ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="ex: Av. Almirante Reis, Lisboa"
                        value={trip.homeAddress || ""}
                        onChange={(e) => {
                          onUpdateTrip({
                            ...trip,
                            homeAddress: e.target.value
                          });
                        }}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowHomeMapPicker(true)}
                        className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold border border-indigo-100/50 rounded-lg text-[10px] transition-colors flex items-center justify-center gap-1.5"
                        id="home-map-picker-btn"
                      >
                        <Map className="w-3 h-3" />
                        Escolher no Mapa / Pesquisar
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 min-h-[28px] break-words">
                      {trip.homeAddress || <span className="text-gray-400 italic">Não definida</span>}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[9px] text-gray-400 leading-normal">
                Esta morada é utilizada como ponto de partida no 1º dia e de regresso no último dia da viagem. Nos restantes dias, prevalece a morada do alojamento.
              </p>
            </div>

            {/* Alojamento (Estadia) Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm mt-3" id="trip-accommodation-sidebar-card">
              <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-500" />
                Alojamento (Estadia)
              </h5>
              
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Nome do Alojamento:</label>
                  {isPlanner ? (
                    <input
                      type="text"
                      placeholder="ex: Herdade do Touril"
                      value={trip.accommodationName || ""}
                      onChange={(e) => {
                        onUpdateTrip({
                          ...trip,
                          accommodationName: e.target.value
                        });
                      }}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/50"
                    />
                  ) : (
                    <p className="font-bold text-gray-800 bg-indigo-50/50 px-2.5 py-1.5 rounded-lg border border-indigo-100/30 min-h-[28px] break-words">
                      {trip.accommodationName || <span className="text-gray-400 font-normal italic">Não definido</span>}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Contacto Telefónico:</label>
                  {isPlanner ? (
                    <input
                      type="text"
                      placeholder="ex: +351 283 960 000"
                      value={trip.accommodationContact || ""}
                      onChange={(e) => {
                        onUpdateTrip({
                          ...trip,
                          accommodationContact: e.target.value
                        });
                      }}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/50"
                    />
                  ) : (
                    <p className="font-medium text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 min-h-[28px] break-words flex items-center gap-1">
                      {trip.accommodationContact ? (
                        <>
                          <span>📞</span>
                          <a href={`tel:${trip.accommodationContact}`} className="hover:underline text-indigo-600 font-medium">{trip.accommodationContact}</a>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Não definido</span>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Morada do Alojamento:</label>
                  {isPlanner ? (
                    <input
                      type="text"
                      placeholder="ex: Herdade do Touril, Zambujeira"
                      value={trip.accommodationAddress || ""}
                      onChange={(e) => {
                        onUpdateTrip({
                          ...trip,
                          accommodationAddress: e.target.value
                        });
                      }}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/50"
                    />
                  ) : (
                    <p className="font-medium text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 min-h-[28px] break-words">
                      {trip.accommodationAddress || <span className="text-gray-400 italic">Não definida</span>}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Link de Localização (Mapa/Link):</label>
                  {isPlanner ? (
                    <div className="space-y-1.5">
                      <input
                        type="url"
                        placeholder="ex: https://maps.app.goo.gl/..."
                        value={trip.accommodationMapLink || ""}
                        onChange={(e) => {
                          onUpdateTrip({
                            ...trip,
                            accommodationMapLink: e.target.value
                          });
                        }}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccommodationMapPicker(true)}
                        className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold border border-indigo-100/50 rounded-lg text-[10px] transition-colors flex items-center justify-center gap-1.5"
                        id="accommodation-map-picker-btn"
                      >
                        <Map className="w-3 h-3" />
                        Escolher no Mapa / Pesquisar
                      </button>
                    </div>
                  ) : null}

                  {trip.accommodationMapLink ? (
                    <a
                      href={trip.accommodationMapLink}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      rel="noopener noreferrer"
                      className="mt-1.5 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold py-1.5 rounded-lg text-[10px] transition-colors"
                      id="view-accommodation-map-btn"
                    >
                      <span>🗺️</span>
                      Ver Localização no Mapa
                    </a>
                  ) : (
                    !isPlanner && (
                      <p className="text-[11px] text-gray-400 italic">Link não disponível</p>
                    )
                  )}
                </div>
              </div>
              <p className="text-[9px] text-gray-400 leading-normal">
                Defina o alojamento e o link de localização para futuras referências e para calcular deslocações automáticas do dia.
              </p>
            </div>
          </div>

          {/* Timeline Timeline */}
          <div className="lg:col-span-9 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg">Itinerário Detalhado</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                {activeItineraryList.length} {activeItineraryList.length === 1 ? "Evento" : "Eventos"}
              </span>
            </div>

            {activeItineraryList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-gray-500 text-sm">Nenhum evento agendado para este dia.</p>
                {isPlanner && (
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="mt-3 text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    Adicionar primeiro evento
                  </button>
                )}
              </div>
            ) : (
              <div className="relative border-l border-indigo-100 pl-4 md:pl-6 space-y-6 py-2 ml-4">
                {/* 🏠 Dynamic Starting Location Leg (Home / Accommodation) */}
                {(() => {
                  const isFirstDay = selectedDate === dates[0];
                  const hasHomeAddress = !!trip.homeAddress;
                  const startAddr = (isFirstDay && hasHomeAddress) ? trip.homeAddress : trip.accommodationAddress;
                  const startLabel = (isFirstDay && hasHomeAddress) ? "Saída de Casa (Início da Viagem)" : "Saída do Alojamento (Início do Dia)";
                  const isHome = isFirstDay && hasHomeAddress;
                  
                  if (!startAddr) return null;
                  
                  // Calculate leg to first event
                  const firstEvt = activeItineraryList[0];
                  const leg = calculateLeg(startAddr, firstEvt);
                  
                  return (
                    <div className="relative mb-6 -ml-[25px] md:-ml-[33px]" id="itinerary-day-start-leg">
                      {/* Start Marker Pin */}
                      <span className="absolute left-[8px] md:left-[16px] top-1 w-5 h-5 rounded-full bg-emerald-600 border-2 border-white shadow-sm flex items-center justify-center text-white z-10">
                        {isHome ? <Home className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                      </span>
                      
                      <div className="pl-8 md:pl-10">
                        <div className="bg-emerald-50 border border-emerald-100/50 rounded-xl px-3 py-2 text-xs text-emerald-800 font-semibold inline-flex flex-col gap-0.5 max-w-full">
                          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider flex items-center gap-1">
                            {isHome ? <Home className="w-3.5 h-3.5" /> : <Hotel className="w-3.5 h-3.5" />}
                            {startLabel}
                          </span>
                          <span className="text-gray-700 truncate max-w-xs sm:max-w-md">{startAddr}</span>
                        </div>
                        
                        {/* Departure leg connection banner */}
                        <div className="mt-4 mb-2 ml-0 pl-4 py-1.5 border-l-2 border-dashed border-indigo-200 relative">
                          <span className="absolute -left-[6px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-indigo-300"></span>
                          <div className="bg-indigo-50 border border-indigo-100/50 rounded-md px-1.5 py-0.5 text-[9px] text-indigo-600 font-medium flex flex-wrap items-center gap-1.5 shadow-xs w-fit">
                            <Navigation className="w-2.5 h-2.5 shrink-0 text-indigo-500" />
                            <span>Deslocação até {firstEvt.name}: <strong>{leg.distance}</strong> (estimado {leg.time})</span>
                            {trip.vehicle && (
                              <span className="text-emerald-600 font-bold ml-1 pl-1 border-l border-indigo-100 flex items-center gap-0.5">
                                {trip.vehicle.type === "electric" ? <BatteryCharging className="w-2.5 h-2.5 text-emerald-500" /> : <Fuel className="w-2.5 h-2.5 text-emerald-500" />}
                                Est: {getBatteryOrFuelEstimate(leg.distance, trip.vehicle)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {activeItineraryList.map((evt, idx) => (
                  <div key={evt.id} className="relative group">
                    {/* Circle marker pin */}
                    <span className="absolute -left-[21px] md:-left-[29px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-sm ring-4 ring-indigo-50 flex items-center justify-center text-[8px] text-white"></span>

                    {/* Auto Calculated departure distance leg box & Transport selector */}
                    {idx > 0 && (
                      <div className="mb-4 mt-2 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl p-4 text-xs text-indigo-950 shadow-xs flex flex-col gap-3 relative z-10">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/40 pb-2">
                          <div className="flex flex-wrap items-center gap-2 font-semibold text-indigo-900">
                            <Navigation className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span>Deslocação: <strong className="text-indigo-700">{evt.distanceFromPrev}</strong></span>
                            <span className="text-gray-300">|</span>
                            <span>Tempo: <strong className="text-indigo-700">{evt.timeFromPrev}</strong></span>
                            {evt.transportCost !== undefined && evt.transportCost > 0 && (
                              <>
                                <span className="text-gray-300">|</span>
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                  Custo Est.: {evt.transportCost.toFixed(2)}€
                                </span>
                              </>
                            )}
                            
                            {/* Vehicle consumption, only if "Carro" (or default/undefined representing Carro) is active */}
                            {trip.vehicle && (!evt.transportType || evt.transportType === "Carro") && (
                              <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                                {trip.vehicle.type === "electric" ? (
                                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Fuel className="w-3.5 h-3.5 text-emerald-500" />
                                )}
                                Est: {getBatteryOrFuelEstimate(evt.distanceFromPrev, trip.vehicle)}
                              </span>
                            )}
                          </div>

                          {evt.transportType && (
                            <span className="bg-indigo-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                              {evt.transportType}
                            </span>
                          )}
                        </div>

                        {/* Interactive Transport Options */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Selecionar Meio de Transporte:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: "A pé", value: "A pé", icon: Footprints },
                              { label: "Bicicleta", value: "Bicicleta", icon: Bike },
                              { label: "Trotinete", value: "Trotinete Elétrica (20Km máx)", icon: Sparkles },
                              { label: "Carro", value: "Carro", icon: Car },
                              { label: "Metro", value: "Metro", icon: Train },
                              { label: "Comboio", value: "Comboio", icon: Train },
                              { label: "Avião", value: "Avião", icon: Plane },
                              { label: "Barco", value: "Barco", icon: Ship }
                            ].map((mode) => {
                              const isActive = evt.transportType === mode.value || (!evt.transportType && mode.value === "Carro");
                              const IconComp = mode.icon;
                              return (
                                <button
                                  key={mode.value}
                                  onClick={() => handleUpdateEventTransport(evt.id, mode.value)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-[11px] font-semibold ${
                                    isActive
                                      ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                      : "bg-white border-gray-200 text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/50"
                                  }`}
                                  title={mode.value}
                                >
                                  <IconComp className="w-3.5 h-3.5 shrink-0" />
                                  <span>{mode.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Trotinete maximum warning */}
                        {evt.transportType === "Trotinete Elétrica (20Km máx)" && evt.transportError && (
                          <div className="mt-1 flex items-center gap-1.5 text-amber-600 font-semibold bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-100">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                            <span>{evt.transportError}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card container */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-4">
                      {evt.image && (
                        <div className="w-full md:w-36 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-50 border border-gray-100">
                          <img src={evt.image} alt={evt.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap justify-between items-start gap-x-2 mb-1">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {evt.timeStart}
                              {evt.timeEnd && ` - ${evt.timeEnd}`}
                              {evt.duration && ` (${evt.duration})`}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold bg-gray-50 px-2 py-0.5 rounded border border-gray-100 uppercase">
                              {evt.category}
                            </span>
                          </div>

                          <h4 className="font-bold text-gray-900 text-sm md:text-base mt-1">{evt.name}</h4>
                          <p className="text-gray-500 text-xs leading-relaxed mt-1 line-clamp-2">{evt.description}</p>
                        </div>

                        {/* Event Address and Nav links */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-gray-50 text-xs">
                          <span className="text-gray-400 truncate max-w-[200px] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {evt.address || "Sem endereço físico."}
                          </span>

                          <div className="flex gap-2">
                            <a 
                              href={evt.googleMapsLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 text-[11px]"
                            >
                              Google Maps
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <a 
                              href={evt.wazeLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-amber-600 hover:text-amber-800 font-semibold flex items-center gap-0.5 text-[11px]"
                            >
                              Waze
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            {/* Planner operations */}
                            {isPlanner && (
                              <div className="flex items-center gap-2 ml-3 border-l border-gray-200 pl-3">
                                <button 
                                  onClick={() => handleEditEventClick(evt)}
                                  className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteEvent(evt.id)}
                                  className="text-gray-400 hover:text-red-600 hover:bg-rose-50 p-2 rounded-lg transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
                                  title="Eliminar"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 🏠 Dynamic Returning Location Leg (Home / Accommodation) */}
                {(() => {
                  const isLastDay = selectedDate === dates[dates.length - 1];
                  const hasHomeAddress = !!trip.homeAddress;
                  const endAddr = (isLastDay && hasHomeAddress) ? trip.homeAddress : trip.accommodationAddress;
                  const endLabel = (isLastDay && hasHomeAddress) ? "Regresso a Casa (Fim da Viagem)" : "Regresso ao Alojamento (Fim do Dia)";
                  const isHome = isLastDay && hasHomeAddress;
                  
                  if (!endAddr) return null;
                  
                  // Calculate leg from last event
                  const lastEvt = activeItineraryList[activeItineraryList.length - 1];
                  const leg = calculateLeg(lastEvt.address || lastEvt.name, endAddr);
                  
                  return (
                    <div className="relative mt-8 -ml-[25px] md:-ml-[33px]" id="itinerary-day-end-leg">
                      {/* Return leg connection banner */}
                      <div className="mb-4 ml-2 pl-4 py-1.5 border-l-2 border-dashed border-indigo-200 relative">
                        <span className="absolute -left-[6px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-indigo-300"></span>
                        <div className="bg-indigo-50 border border-indigo-100/50 rounded-md px-1.5 py-0.5 text-[9px] text-indigo-600 font-medium flex flex-wrap items-center gap-1.5 shadow-xs w-fit">
                          <Navigation className="w-2.5 h-2.5 shrink-0 text-indigo-500" />
                          <span>Regresso desde {lastEvt.name}: <strong>{leg.distance}</strong> (estimado {leg.time})</span>
                          {trip.vehicle && (
                            <span className="text-emerald-600 font-bold ml-1 pl-1 border-l border-indigo-100 flex items-center gap-0.5">
                              {trip.vehicle.type === "electric" ? <BatteryCharging className="w-2.5 h-2.5 text-emerald-500" /> : <Fuel className="w-2.5 h-2.5 text-emerald-500" />}
                              Est: {getBatteryOrFuelEstimate(leg.distance, trip.vehicle)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* End Marker Pin */}
                      <span className="absolute left-[8px] md:left-[16px] top-[40px] w-5 h-5 rounded-full bg-rose-600 border-2 border-white shadow-sm flex items-center justify-center text-white z-10">
                        {isHome ? <Home className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                      </span>
                      
                      <div className="pl-8 md:pl-10 pt-8">
                        <div className="bg-rose-50 border border-rose-100/50 rounded-xl px-3 py-2 text-xs text-rose-800 font-semibold inline-flex flex-col gap-0.5 max-w-full">
                          <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider flex items-center gap-1">
                            {isHome ? <Home className="w-3.5 h-3.5" /> : <Hotel className="w-3.5 h-3.5" />}
                            {endLabel}
                          </span>
                          <span className="text-gray-700 truncate max-w-xs sm:max-w-md">{endAddr}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: MAPA (Interactive Route Pin Plotter) --- */}
      {activeTab === "map" && (
        <div className="space-y-6" id="view-map">
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Mapa de Rota & Pontos de Interesse</h3>
              <p className="text-xs text-gray-500 mt-1">Navegação interativa ao longo da Rota Vicentina com localizador de pontos próximos</p>
            </div>

            {/* Simulated Realistic Road Map Canvas */}
            <div className="bg-[#f2efe9] rounded-2xl h-[420px] relative overflow-hidden flex items-center justify-center border border-gray-200 shadow-inner">
              {/* Decorative Land/Water Vectors */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Coastal Ocean water */}
                <path d="M 0 0 Q 150 100 220 230 T 150 350 T 0 420 L 0 0 Z" fill="#cbdcfc" opacity="0.8" />
                <text x="20" y="220" className="text-[10px] font-bold text-blue-600/50 fill-current select-none italic" transform="rotate(-90 20 220)">Oceano Atlântico</text>

                {/* Parks and Natural Reserves */}
                <rect x="250" y="30" width="120" height="100" rx="15" fill="#d5ecd6" opacity="0.9" />
                <rect x="580" y="160" width="160" height="140" rx="20" fill="#d5ecd6" opacity="0.9" />
                <text x="610" y="185" className="text-[9px] font-semibold text-emerald-700/40 fill-current select-none">Parque Natural</text>

                {/* Major Highways & Road Network */}
                <path d="M 120 0 C 180 120 280 180 350 200 S 600 240 700 280 S 780 340 850 420" fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
                <path d="M 120 0 C 180 120 280 180 350 200 S 600 240 700 280 S 780 340 850 420" fill="none" stroke="#ffb74d" strokeWidth="4" strokeLinecap="round" />
                <text x="500" y="215" className="text-[8px] font-bold text-amber-800/60 fill-current select-none uppercase tracking-wider">EN120</text>

                {/* Secondary Cross Streets */}
                <path d="M 0 150 L 1000 150" fill="none" stroke="#ffffff" strokeWidth="6" />
                <path d="M 350 200 L 350 420" fill="none" stroke="#ffffff" strokeWidth="6" />
                <path d="M 500 0 L 780 420" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.5" />

                {/* Active Route Guideline */}
                <path 
                  d="M 100 100 C 180 120 280 180 350 180 S 620 260 620 260 S 780 300 780 300" 
                  fill="none" 
                  stroke="#4f46e5" 
                  strokeWidth="5" 
                  strokeLinecap="round"
                  strokeDasharray="8,6"
                  className="animate-pulse"
                />
              </svg>

              {/* Grid overlay for map feel */}
              <div className="absolute inset-0 bg-[radial-gradient(#00000005_1.2px,transparent_1.2px)] [background-size:24px_24px]"></div>

              {/* Pins along route */}
              <div className="absolute top-[80px] left-[85px] text-center" title="Partida Lisboa">
                <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md ring-4 ring-indigo-500/20 select-none">1</span>
                <p className="text-[9px] text-gray-800 font-extrabold bg-white/90 border border-gray-100 px-1.5 py-0.5 rounded mt-0.5 shadow-sm">Lisboa</p>
              </div>

              <div className="absolute top-[165px] left-[330px] text-center" title="Porto Covo">
                <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md ring-4 ring-indigo-500/20 select-none">2</span>
                <p className="text-[9px] text-gray-800 font-extrabold bg-white/90 border border-gray-100 px-1.5 py-0.5 rounded mt-0.5 shadow-sm">Porto Covo</p>
              </div>

              <div className="absolute top-[245px] left-[600px] text-center" title="Odeceixe">
                <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md ring-4 ring-indigo-500/20 select-none">3</span>
                <p className="text-[9px] text-gray-800 font-extrabold bg-white/90 border border-gray-100 px-1.5 py-0.5 rounded mt-0.5 shadow-sm">Odeceixe</p>
              </div>

              <div className="absolute top-[285px] left-[760px] text-center" title="Sagres">
                <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md ring-4 ring-indigo-500/20 select-none">4</span>
                <p className="text-[9px] text-gray-800 font-extrabold bg-white/90 border border-gray-100 px-1.5 py-0.5 rounded mt-0.5 shadow-sm">Sagres</p>
              </div>

              {/* Dynamic Nearby Place Markers (Rendered when category is selected) */}
              {mapSearchCategory && MOCK_NEARBY_PLACES[mapSearchCategory].map((place) => {
                const isSelected = selectedMapPlace?.id === place.id;
                return (
                  <button
                    key={place.id}
                    onClick={() => setSelectedMapPlace(place)}
                    style={{ top: `${place.coords.y}px`, left: `${place.coords.x}px` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-20"
                    title={place.name}
                  >
                    <div className={`relative flex items-center justify-center p-1.5 rounded-full shadow-lg border transition-all ${
                      isSelected 
                        ? "bg-rose-600 border-white text-white scale-125 z-30 ring-4 ring-rose-500/30" 
                        : "bg-white border-rose-500 text-rose-500 hover:scale-110"
                    }`}>
                      {mapSearchCategory === "combustivel" && <Fuel className="w-3.5 h-3.5" />}
                      {mapSearchCategory === "carregamento" && <BatteryCharging className="w-3.5 h-3.5" />}
                      {mapSearchCategory === "restaurante" && <Utensils className="w-3.5 h-3.5" />}
                      {mapSearchCategory === "farmacia" && <Pill className="w-3.5 h-3.5" />}
                      
                      {/* Pulse effect for selected pin */}
                      {isSelected && (
                        <span className="absolute -inset-1 rounded-full border-2 border-rose-600 animate-ping opacity-75"></span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Interactive Tooltip Overlay */}
              {selectedMapPlace ? (
                <div 
                  className="absolute z-30 bg-white border border-gray-100 rounded-xl p-3 shadow-xl max-w-[240px] text-xs space-y-1.5 animate-scale-up"
                  style={{ 
                    top: `${Math.max(selectedMapPlace.coords.y - 75, 15)}px`, 
                    left: `${Math.min(Math.max(selectedMapPlace.coords.x, 120), 880)}px`,
                    transform: "translateX(-50%)"
                  }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h5 className="font-bold text-gray-900 truncate pr-2">{selectedMapPlace.name}</h5>
                    <button 
                      onClick={() => setSelectedMapPlace(null)}
                      className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{selectedMapPlace.address}</p>
                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <span className="bg-rose-50 text-rose-600 font-bold px-1.5 py-0.2 rounded">{selectedMapPlace.dist}</span>
                    <span className="text-gray-500 font-medium">{selectedMapPlace.hours}</span>
                  </div>
                  <div className="border-t border-gray-50 pt-1.5 flex gap-1.5">
                    <button
                      onClick={() => handleAddSearchPlaceToItinerary(selectedMapPlace)}
                      className="flex-1 text-center py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] rounded-lg transition-all"
                    >
                      + Itinerário
                    </button>
                  </div>
                </div>
              ) : (
                <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-white/10 px-3 py-2 rounded-xl text-white text-xs max-w-sm">
                  <p className="font-bold text-indigo-400">Lisboa → Sines → Sagres</p>
                  <p className="text-gray-300 text-[10px] mt-0.5">Siga a rota demarcada na Rota Vicentina pela EN120.</p>
                </div>
              )}
            </div>

            {/* Quick Search Selector Buttons */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Procurar Serviços Próximos na Rota:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    setMapSearchCategory("combustivel");
                    setSelectedMapPlace(null);
                  }}
                  className={`py-3 px-4 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                    mapSearchCategory === "combustivel"
                      ? "bg-amber-50 border-amber-300 text-amber-800 shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700"
                  }`}
                >
                  <Fuel className="w-5 h-5 text-amber-500" />
                  <span>Postos de Combustível</span>
                </button>

                <button
                  onClick={() => {
                    setMapSearchCategory("carregamento");
                    setSelectedMapPlace(null);
                  }}
                  className={`py-3 px-4 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                    mapSearchCategory === "carregamento"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-800 shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700"
                  }`}
                >
                  <BatteryCharging className="w-5 h-5 text-indigo-500" />
                  <span>Pontos de Carregamento</span>
                </button>

                <button
                  onClick={() => {
                    setMapSearchCategory("restaurante");
                    setSelectedMapPlace(null);
                  }}
                  className={`py-3 px-4 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                    mapSearchCategory === "restaurante"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700"
                  }`}
                >
                  <Utensils className="w-5 h-5 text-emerald-500" />
                  <span>Restaurantes</span>
                </button>

                <button
                  onClick={() => {
                    setMapSearchCategory("farmacia");
                    setSelectedMapPlace(null);
                  }}
                  className={`py-3 px-4 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                    mapSearchCategory === "farmacia"
                      ? "bg-rose-50 border-rose-300 text-rose-800 shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-700"
                  }`}
                >
                  <Pill className="w-5 h-5 text-rose-500" />
                  <span>Farmácias</span>
                </button>
              </div>
            </div>

            {/* Success Feedback banner */}
            {addPlaceSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-pulse">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{addPlaceSuccess}</span>
              </div>
            )}

            {/* Nearest 5 Places list results */}
            {mapSearchCategory ? (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">As 5 localizações mais próximas na viagem:</h4>
                  <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded">Ordenado por distância</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {MOCK_NEARBY_PLACES[mapSearchCategory].map((place) => {
                    const isSelected = selectedMapPlace?.id === place.id;
                    const isCharging = mapSearchCategory === "carregamento";
                    const statusText = place.status;
                    const isAvailable = statusText.includes("Disponível") || statusText.includes("Aberto");

                    return (
                      <div 
                        key={place.id}
                        onClick={() => setSelectedMapPlace(place)}
                        className={`p-4 rounded-xl border transition-all flex justify-between items-start cursor-pointer hover:shadow-sm ${
                          isSelected 
                            ? "bg-indigo-50/40 border-indigo-300 shadow-sm" 
                            : "bg-gray-50/50 border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className="space-y-1 pr-3 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-800 text-xs truncate block">{place.name}</span>
                            <span className="text-[9px] font-bold text-gray-400 shrink-0">★ {place.rating}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">{place.address}</p>
                          <div className="flex items-center gap-2 pt-1 text-[10px]">
                            <span className="text-gray-500 font-medium">Horário: {place.hours}</span>
                            <span className="text-gray-300">•</span>
                            <span className={`font-bold ${isAvailable ? "text-emerald-600" : "text-rose-500"}`}>
                              {place.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[10px] bg-white border border-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                            {place.dist}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddSearchPlaceToItinerary(place);
                            }}
                            className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Adicionar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl text-center">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-gray-600">Nenhum serviço selecionado</h4>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto mt-1">
                  Selecione uma categoria acima para listar postos de combustível, carregadores, restaurantes ou farmácias mais próximos da sua rota.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: DESPESAS (Confidential to Consultores!) --- */}
      {activeTab === "expenses" && (
        <div className="space-y-6" id="view-expenses">
          {!isPlanner && (
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="font-bold text-amber-900">Restrição de Acesso às Despesas</h4>
              <p className="text-amber-800 text-xs max-w-md mx-auto">
                Lamentamos, mas o seu utilizador está configurado como <strong className="font-bold">Consultor</strong>. Não tem permissões para aceder a preços, despesas, orçamentos ou faturas confidenciais desta viagem.
              </p>
            </div>
          )}

          {isPlanner && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: Expenses summary statistics and scanners */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-gray-900 text-sm">Dashboard Financeiro</h4>
                  
                  <div className="space-y-3 pt-2">
                    {(() => {
                      const real = trip.expenses.filter(e => !e.isPlanned).reduce((acc, e) => acc + e.amount, 0);
                      
                      // Calculate dynamic transport costs from the entire itinerary
                      const totalTransportCost = Object.keys(trip.itinerary).reduce((sum, date) => {
                        const events = trip.itinerary[date] || [];
                        const legs = calculateNavigationLegs(events);
                        return sum + legs.reduce((acc, evt) => acc + (evt.transportCost || 0), 0);
                      }, 0);

                      const plannedRaw = trip.expenses.filter(e => e.isPlanned).reduce((acc, e) => acc + e.amount, 0);
                      const totalPlanned = plannedRaw + totalTransportCost;
                      const diff = real - totalPlanned;

                      return (
                        <>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Realizado (Despesas Reais):</span>
                            <span className="font-bold text-emerald-600 text-sm">
                              {real.toFixed(2)} €
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Previsto (Orçamentado):</span>
                            <span className="font-semibold text-indigo-600 text-sm">
                              {plannedRaw.toFixed(2)} €
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Transporte Est. (Itinerário):</span>
                            <span className="font-semibold text-indigo-500 text-sm">
                              {totalTransportCost.toFixed(2)} €
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-2 bg-indigo-50/30 -mx-3 px-3 py-1.5 rounded-lg">
                            <span className="font-medium text-indigo-950">Total Previsto + Transporte:</span>
                            <span className="font-bold text-indigo-900">
                              {totalPlanned.toFixed(2)} €
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-2.5">
                            <span>Diferença:</span>
                            <span className={`font-bold text-sm ${diff > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                              {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} €
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* AI Invoice OCR Quick scanner */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-2xl border border-indigo-100/60 space-y-3">
                  <div className="flex items-center gap-1.5 text-indigo-900">
                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <h4 className="font-bold text-sm">Scanner de Despesas Rápidas</h4>
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Tire uma foto ou carregue um ficheiro do recibo. Nossa Inteligência Artificial (Gemini OCR) preenche automaticamente o valor, fornecedor, data e categoria!
                  </p>

                  <div className="pt-2">
                    <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white/70 hover:bg-white p-4 rounded-xl cursor-pointer transition-all">
                      {ocrLoading ? (
                        <div className="text-center py-2 text-indigo-600 font-bold text-xs flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Gemini a ler fatura...</span>
                        </div>
                      ) : (
                        <div className="text-center space-y-1">
                          <Camera className="w-6 h-6 text-indigo-500 mx-auto" />
                          <p className="text-xs font-semibold text-indigo-900">Digitalizar Recibo</p>
                          <p className="text-[10px] text-gray-400">PDF, JPG ou PNG</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden" 
                        disabled={ocrLoading} 
                        onChange={handleOCRFile} 
                      />
                    </label>
                  </div>

                  {ocrSuccessMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-800 text-[11px] font-semibold flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{ocrSuccessMsg}</span>
                    </div>
                  )}
                </div>

                {/* Flights calculator sub-block */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-gray-900 text-sm">Voos e Passagens</h4>
                    <button
                      onClick={() => setShowFlightForm(!showFlightForm)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      {showFlightForm ? "Fechar" : "Adicionar Voo"}
                    </button>
                  </div>

                  {trip.flights.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Nenhum voo associado.</p>
                  ) : (
                    <div className="space-y-2">
                      {trip.flights.map((f, idx) => (
                        <div key={idx} className="border border-gray-50 rounded-lg p-2.5 text-xs text-gray-600">
                          <p className="font-bold text-gray-800">{f.flightNo} ({f.airline})</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{f.departure} → {f.arrival} ({f.date})</p>
                          <div className="flex justify-between items-center mt-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded">
                            <span>{f.passengers} pax x {f.pricePerPassenger}€</span>
                            <span>Total: {f.totalPrice} €</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showFlightForm && (
                    <form onSubmit={handleFlightSubmit} className="space-y-2 border-t border-gray-50 pt-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text" required placeholder="Nº Voo (ex: TP1482)"
                          value={flightNo} onChange={(e) => setFlightNo(e.target.value)}
                          className="px-2.5 py-1.5 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text" required placeholder="Companhia Aérea"
                          value={flightAirline} onChange={(e) => setFlightAirline(e.target.value)}
                          className="px-2.5 py-1.5 border border-gray-200 rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text" placeholder="Origem"
                          value={flightDep} onChange={(e) => setFlightDep(e.target.value)}
                          className="px-2.5 py-1.5 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="text" placeholder="Destino"
                          value={flightArr} onChange={(e) => setFlightArr(e.target.value)}
                          className="px-2.5 py-1.5 border border-gray-200 rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number" placeholder="Passageiros"
                          value={flightPassengers} onChange={(e) => setFlightPassengers(e.target.value === "" ? "" : Number(e.target.value))}
                          className="px-2 py-1.5 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="number" placeholder="Preço/pax"
                          value={flightPrice} onChange={(e) => setFlightPrice(e.target.value === "" ? "" : Number(e.target.value))}
                          className="px-2 py-1.5 border border-gray-200 rounded-lg"
                        />
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg px-2 text-[10px]">
                          Adicionar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Right column: Expenses list and creation */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h3 className="font-bold text-gray-900 text-base">Registros de Despesas</h3>
                  <button
                    onClick={() => setShowExpenseForm(!showExpenseForm)}
                    className="flex items-center gap-1 bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Lançamento
                  </button>
                </div>

                {/* Manual Expense Form */}
                {showExpenseForm && (
                  <form onSubmit={handleExpenseSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Descrição *</label>
                        <input
                          type="text" required placeholder="Ex: Jantar de Lagosta"
                          value={expDescription} onChange={(e) => setExpDescription(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Categoria</label>
                        <select
                          value={expCategory} onChange={(e) => setExpCategory(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg"
                        >
                          <option value="Restaurantes">Restaurantes</option>
                          <option value="Alojamento">Alojamento</option>
                          <option value="Voos">Voos</option>
                          <option value="Rent-a-Car">Rent-a-Car</option>
                          <option value="Combustível">Combustível</option>
                          <option value="Carregamentos">Carregamentos</option>
                          <option value="Compras">Compras</option>
                          <option value="Entradas">Entradas</option>
                          <option value="Portagens">Portagens</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Valor (€) *</label>
                        <input
                          type="number" step="0.01" required placeholder="Ex: 45.90"
                          value={expAmount} onChange={(e) => setExpAmount(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Data</label>
                        <input
                          type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Fornecedor / Comerciante</label>
                        <input
                          type="text" placeholder="Ex: Galp Sines"
                          value={expSupplier} onChange={(e) => setExpSupplier(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-1">
                      <label className="flex items-center gap-1.5 font-semibold cursor-pointer">
                        <input
                          type="radio" name="expenseType" checked={!expIsPlanned} onChange={() => setExpIsPlanned(false)}
                        />
                        Despesa Realizada (Fatura paga)
                      </label>
                      <label className="flex items-center gap-1.5 font-semibold cursor-pointer">
                        <input
                          type="radio" name="expenseType" checked={expIsPlanned} onChange={() => setExpIsPlanned(true)}
                        />
                        Despesa Prevista (Orçamento estimado)
                      </label>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button" onClick={() => setShowExpenseForm(false)}
                        className="bg-white hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg"
                      >
                        Gravar Registro
                      </button>
                    </div>
                  </form>
                )}

                {/* Expenses list */}
                {trip.expenses.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-6">Nenhuma despesa inserida.</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {trip.expenses.map((exp) => (
                      <div 
                        key={exp.id} 
                        className="flex justify-between items-center border border-gray-50 hover:bg-gray-50/40 rounded-xl p-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-800 truncate">{exp.description}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 font-bold rounded-full ${
                              exp.isPlanned ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}>
                              {exp.isPlanned ? "Prevista" : "Real"}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{exp.date} • {exp.category} {exp.supplier && `• ${exp.supplier}`}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${exp.isPlanned ? "text-indigo-600" : "text-emerald-600"}`}>
                            {exp.amount.toFixed(2)} €
                          </span>
                          <button
                            onClick={() => {
                              if (confirm("Deseja apagar este registro de despesa?")) {
                                onUpdateTrip({
                                  ...trip,
                                  expenses: trip.expenses.filter(e => e.id !== exp.id)
                                });
                              }
                            }}
                            className="text-gray-400 hover:text-rose-600 p-1"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 5: DOCUMENTOS --- */}
      {activeTab === "documents" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 space-y-4" id="view-documents">
          <div className="flex justify-between items-center border-b border-gray-50 pb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Repositório de Documentos</h3>
              <p className="text-xs text-gray-500 mt-1">Anexe bilhetes de avião, reservas de hotel, PDFs ou fotografias</p>
            </div>
            {isPlanner && (
              <button
                onClick={() => setShowDocForm(!showDocForm)}
                className="flex items-center gap-1 bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Anexar Documento
              </button>
            )}
          </div>

          {showDocForm && (
            <form onSubmit={handleDocSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 text-xs max-w-md">
              <div>
                <label className="block font-semibold mb-1">Selecionar Ficheiro *</label>
                <input
                  type="file"
                  required
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    if (file) {
                      setDocName(file.name);
                      setDocType(file.type);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nome de Exibição *</label>
                  <input
                    type="text"
                    required
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Visibilidade</label>
                  <select
                    value={docAllowedConsultor ? "true" : "false"}
                    onChange={(e) => setDocAllowedConsultor(e.target.value === "true")}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="true">Livre (Consultor Vê)</option>
                    <option value="false">Restrito (Oculto Consultor)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button" 
                  onClick={() => { setShowDocForm(false); setSelectedFile(null); }}
                  className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg"
                  disabled={uploadingDoc}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  {uploadingDoc ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>A carregar...</span>
                    </>
                  ) : (
                    <span>Confirmar Anexo</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Docs Grid */}
          {(() => {
            // If active user is Consultor, filter out disallowed documents
            const viewableDocs = trip.documents.filter(d => isPlanner || d.allowedForConsultor);
            
            if (viewableDocs.length === 0) {
              return <p className="text-xs text-gray-400 italic text-center py-6">Nenhum documento disponível ou permitido para o seu utilizador.</p>;
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {viewableDocs.map((doc) => (
                  <div key={doc.id} className="border border-gray-100 hover:border-indigo-100 rounded-2xl p-4 bg-white shadow-sm flex flex-col justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 text-xs truncate" title={doc.name}>{doc.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{doc.size || "150 KB"} • {doc.dateUploaded}</p>
                        {isPlanner && (
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold mt-1.5 px-2 py-0.2 rounded-full ${
                            doc.allowedForConsultor ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {doc.allowedForConsultor ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                            {doc.allowedForConsultor ? "Público" : "Restrito"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-50 pt-3 text-xs">
                      <button
                        onClick={async () => {
                          try {
                            const url = await documentService.getSignedUrl(doc.fileUrl || "");
                            window.open(url, "_blank");
                          } catch (err: any) {
                            alert("Erro ao descarregar documento: " + err.message);
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Descarregar
                      </button>

                      {isPlanner && (
                        <button
                          onClick={async () => {
                            if (confirm("Pretende eliminar permanentemente este documento? Esta ação é irreversível.")) {
                              try {
                                await documentService.deleteDocument(doc.id, doc.fileUrl || "");
                                onUpdateTrip({
                                  ...trip,
                                  documents: trip.documents.filter(d => d.id !== doc.id)
                                });
                              } catch (err: any) {
                                alert("Erro ao desanexar documento: " + err.message);
                              }
                            }
                          }}
                          className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* --- TAB 6: PARTICIPANTES --- */}
      {activeTab === "participants" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 space-y-6" id="view-participants">
          <div className="flex justify-between items-center border-b border-gray-50 pb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Grupo & Participantes</h3>
              <p className="text-xs text-gray-500 mt-1">Configure quem viaja consigo e quem pode ver ou modificar o plano</p>
            </div>
            {isPlanner && (
              <button
                onClick={() => setShowPartForm(!showPartForm)}
                className="flex items-center gap-1 bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Convidar Membro
              </button>
            )}
          </div>

          {showPartForm && (
            <form onSubmit={handleParticipantSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 text-xs max-w-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">E-mail do Convidado *</label>
                  <input
                    type="email" required placeholder="exemplo@dominio.com"
                    value={partEmail} onChange={(e) => setPartEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    disabled={sendingInvite}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tipo de Permissão</label>
                  <select
                    value={partRole} onChange={(e: any) => setPartRole(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    disabled={sendingInvite}
                  >
                    <option value="Consultor">Consultor (Apenas Leitura, preços ocultos)</option>
                    <option value="Planeador">Planeador (Acesso total a editar e preços)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button" onClick={() => setShowPartForm(false)}
                  className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg"
                  disabled={sendingInvite}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  {sendingInvite ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>A enviar...</span>
                    </>
                  ) : (
                    <span>Convidar</span>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Members column */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-50 pb-2">Membros Ativos</h4>
              <div className="space-y-2">
                {trip.participants.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center border border-gray-100 rounded-xl p-3 text-xs bg-white hover:border-indigo-50 shadow-2xs transition-all">
                    <div>
                      <p className="font-bold text-gray-800">{p.name || "Utilizador Registado"}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.email}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.role === "Planeador" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {p.role}
                      </span>

                      {isPlanner && p.id !== activeUser.id && (
                        <button
                          onClick={() => {
                            if (confirm(`Pretende remover o participante ${p.name}?`)) {
                              onUpdateTrip({
                                ...trip,
                                participants: trip.participants.filter(pt => pt.id !== p.id)
                              });
                            }
                          }}
                          className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Invitations column */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 text-sm border-b border-gray-50 pb-2">Convites Pendentes</h4>
              {loadingInvitations ? (
                <p className="text-xs text-gray-400 italic">A carregar convites...</p>
              ) : invitations.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-3">Não existem convites pendentes de aceitação para esta viagem.</p>
              ) : (
                <div className="space-y-2">
                  {invitations.map((invite) => (
                    <div key={invite.id} className="flex justify-between items-center border border-gray-100 rounded-xl p-3 text-xs bg-gray-50/50">
                      <div>
                        <p className="font-bold text-gray-700">{invite.invited_email}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Expira: {new Date(invite.expires_at).toLocaleDateString()}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const link = `${window.location.origin}/?token=${invite.token}`;
                            navigator.clipboard.writeText(link);
                            alert("Ligação de convite copiada para a área de transferência!");
                          }}
                          className="px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded font-bold text-[10px] transition-all cursor-pointer"
                          title="Copiar Ligação de Convite"
                        >
                          Copiar Link
                        </button>

                        {isPlanner && (
                          <button
                            onClick={async () => {
                              if (confirm(`Pretende cancelar o convite para ${invite.invited_email}?`)) {
                                try {
                                  await invitationService.cancelInvitation(invite.id);
                                  loadInvitations();
                                } catch (err: any) {
                                  alert("Erro ao cancelar convite: " + err.message);
                                }
                              }
                            }}
                            className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Cancelar Convite"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 7: VEÍCULO & AUTONOMIA (Fuel tracker and Smart Gemini advisor) --- */}
      {activeTab === "vehicle" && trip.vehicle && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="view-vehicle">
          {/* Autonomy parameters tracker input */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Controle de Autonomia Diário</h3>
              <p className="text-xs text-gray-500 mt-1">Insira os parâmetros indicados no painel do veículo no início do dia</p>
            </div>

            <form onSubmit={handleAutonomyInputSubmit} className="space-y-4 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{trip.vehicle.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">
                      Motor: {trip.vehicle.type === "electric" ? "Elétrico" : trip.vehicle.type === "hybrid" ? "Híbrido" : trip.vehicle.type === "diesel" ? "Diesel" : "Gasolina"} • Max: {trip.vehicle.autonomyRange} km
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReplName(trip.vehicle?.name || "");
                    setReplType(trip.vehicle?.type || "gasoline");
                    setReplRange(trip.vehicle?.autonomyRange || 500);
                    setShowReplacementModal(true);
                  }}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-all shadow-sm"
                >
                  Editar Veículo ⚙️
                </button>
              </div>

              {trip.vehicle.type === "electric" ? (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Percentagem da Bateria Atual (%)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="1" max="100"
                      value={batteryPercent}
                      onChange={(e) => setBatteryPercent(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="font-bold text-gray-900 text-sm min-w-[40px] text-right">{batteryPercent}%</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nível Estimado do Depósito (%)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="1" max="100"
                      value={fuelPercent}
                      onChange={(e) => setFuelPercent(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="font-bold text-gray-900 text-sm min-w-[40px] text-right">{fuelPercent}%</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">Autonomia Restante Indicada pelo Carro (km) *</label>
                <input
                  type="number" required
                  value={currentAutonomy}
                  onChange={(e) => setCurrentAutonomy(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
                <p className="text-[10px] text-gray-400 mt-1">A aplicação utiliza prioritariamente a quilometragem informada pelo veículo.</p>
              </div>

              <button
                type="submit"
                disabled={recsLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
              >
                {recsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Calcular Recomendações
              </button>
            </form>

            {/* Substitution Car Call to Action */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3 pt-4 border-t border-dashed">
              <div className="flex gap-2.5 items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-900">Teve uma avaria ou trocou de carro?</p>
                  <p className="text-amber-700">Substitua o veículo registado na viagem para recalcular as rotas.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReplacementModal(true)}
                className="w-full text-center py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-amber-100/50 cursor-pointer"
              >
                Ativar Carro de Substituição 🚗
              </button>
            </div>
          </div>

          {/* AI Advisor results column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Recomendações de Bateria/Combustível IA
              </h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-lg border border-indigo-100">
                Alimentado por Gemini-3.5
              </span>
            </div>

            {recsLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3 shadow-sm">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <h4 className="font-bold text-gray-900 text-sm">A processar plano de rota...</h4>
                <p className="text-gray-500 text-xs">O Gemini está a mapear o itinerário e a localizar postos adequados para o seu {trip.vehicle.name}.</p>
              </div>
            ) : recommendations ? (
              <div className="space-y-4">
                {/* Warning Alert banner */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  recommendations.needsRecharge 
                    ? "bg-rose-50 border-rose-200 text-rose-800" 
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}>
                  <AlertCircle className={`w-5 h-5 shrink-0 ${recommendations.needsRecharge ? "text-rose-500" : "text-emerald-500"}`} />
                  <div className="text-xs">
                    <p className="font-bold">{recommendations.needsRecharge ? "Abastecimento Recomendado" : "Autonomia Segura"}</p>
                    <p className="mt-0.5 leading-relaxed">{recommendations.alertMessage}</p>
                  </div>
                </div>

                {/* Recommendations list */}
                {recommendations.recommendations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Postos de Paragem Recomendados</h4>
                    
                    {recommendations.recommendations.map((rec) => (
                      <div 
                        key={rec.id} 
                        className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-indigo-100 transition-colors flex gap-3.5"
                      >
                        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0 h-fit">
                          {trip.vehicle?.type === "electric" ? <BatteryCharging className="w-5 h-5" /> : <Fuel className="w-5 h-5" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-gray-900 text-sm">{rec.name}</h5>
                          <p className="text-gray-500 text-xs mt-1 leading-relaxed">{rec.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-gray-50 text-[11px] font-semibold text-gray-500">
                            <div>
                              <p className="text-[10px] text-gray-400 font-normal">Distância</p>
                              <p className="text-gray-800 mt-0.5">{rec.distance}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-normal">Tempo Desvio</p>
                              <p className="text-gray-800 mt-0.5">{rec.deviationTime}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-normal">{trip.vehicle?.type === "electric" ? "Potência" : "Combustível"}</p>
                              <p className="text-gray-800 mt-0.5">{rec.power}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-normal">Tempo Estimado</p>
                              <p className="text-indigo-600 mt-0.5">{rec.chargingTime}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500 text-xs shadow-sm">
                Aguardando parâmetros do carro. Clique em "Calcular Recomendações" para iniciar.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "vehicle" && !trip.vehicle && (
        <div className="max-w-xl mx-auto bg-white border border-gray-100 rounded-2xl p-8 text-center space-y-5 shadow-sm mt-6" id="view-vehicle-empty">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
            <Car className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-lg">Nenhum Veículo Associado</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Esta viagem ainda não tem um veículo registado. Associe as especificações do seu veículo para podermos calcular autonomias, registar consumos e sugerir postos de combustível ou carregamento rápido inteligentes em tempo real ao longo do seu percurso.
            </p>
          </div>
          {isPlanner ? (
            <button
              type="button"
              onClick={() => {
                setReplName("");
                setReplType("gasoline");
                setReplRange(500);
                setSelectedReplBrand("");
                setSelectedReplModel("");
                setSelectedReplYear("");
                setShowReplacementModal(true);
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer animate-pulse"
            >
              Configurar Veículo Agora 🚗
            </button>
          ) : (
            <div className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-gray-100">
              Apenas os planeadores da viagem podem registar e configurar o veículo.
            </div>
          )}
        </div>
      )}

      {/* --- ADD EVENT / EDIT EVENT MODAL (Planner only) --- */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-3.5 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">{editingEventId ? "Editar Evento do Itinerário" : "Novo Evento do Itinerário"}</h3>
              <button 
                onClick={() => setShowEventModal(false)}
                className="text-white/80 hover:text-white font-bold p-1"
              >
                X
              </button>
            </div>

            <form onSubmit={handleEventSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Início *</label>
                  <input
                    type="time" required
                    value={evtTimeStart} onChange={(e) => setEvtTimeStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fim (Opcional)</label>
                  <input
                    type="time"
                    value={evtTimeEnd} onChange={(e) => setEvtTimeEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Duração</label>
                  <input
                    type="text" placeholder="Ex: 1h, 45m"
                    value={evtDuration} onChange={(e) => setEvtDuration(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nome do Evento *</label>
                <input
                  type="text" required placeholder="Ex: Almoço na Praia"
                  value={evtName} onChange={(e) => setEvtName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Categoria</label>
                  <select
                    value={evtCategory} onChange={(e) => setEvtCategory(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-base"
                  >
                    <option value="Voo">Voo</option>
                    <option value="Restaurante">Restaurante</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Praia">Praia</option>
                    <option value="Museu">Museu</option>
                    <option value="Centro Comercial">Centro Comercial</option>
                    <option value="Piscina">Piscina</option>
                    <option value="Parque">Parque</option>
                    <option value="Miradouro">Miradouro</option>
                    <option value="Viagem / Na estrada">Viagem / Na estrada</option>
                    <option value="Passeio">Passeio</option>
                    <option value="Atividade livre">Atividade livre</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Link de Imagem (Opcional)</label>
                  <input
                    type="text" placeholder="URL da foto"
                    value={evtImage} onChange={(e) => setEvtImage(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Link do Sítio / Google Maps (Opcional)</label>
                <input
                  type="text" placeholder="Cole o link do Google Maps para autocompletar"
                  value={evtGoogleMapsLink} onChange={(e) => handleGoogleMapsLinkChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">O sistema extrai as coordenadas e morada do link de forma inteligente.</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Morada / Localização *</label>
                <input
                  type="text" required placeholder="Ex: Av. Beira Mar, Porto Covo"
                  value={evtAddress} onChange={(e) => setEvtAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block font-bold text-gray-700">Coordenadas GPS</label>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors border border-indigo-100/50 shadow-sm"
                  >
                    <Map className="w-3 h-3" />
                    Escolher no Mapa / Coordenadas / Pesquisa
                  </button>
                </div>
                {evtLat && evtLng ? (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 px-3 flex justify-between items-center text-xs font-mono">
                    <span className="text-gray-500">Coordenadas Definidas:</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {Number(evtLat).toFixed(5)}, {Number(evtLng).toFixed(5)}
                    </span>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-2.5 text-center">
                    <p className="text-[11px] text-gray-400 italic">Nenhum ponto GPS definido. Clique no botão acima para escolher ou pesquisar.</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Descrição</label>
                <textarea
                  placeholder="Explique o que vão fazer neste local..."
                  value={evtDescription} onChange={(e) => setEvtDescription(e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Notas Importantes (Ex: reservas, código portão)</label>
                <input
                  type="text" placeholder="Ex: Mesa reservada sob nome Ricardo"
                  value={evtNotes} onChange={(e) => setEvtNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button" onClick={() => setShowEventModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow animate-pulse"
                >
                  Confirmar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMapPicker && (
        <MapPicker
          initialLat={evtLat ? Number(evtLat) : undefined}
          initialLng={evtLng ? Number(evtLng) : undefined}
          onSelect={(lat, lng, addr) => {
            setEvtLat(String(lat));
            setEvtLng(String(lng));
            if (addr) {
              setEvtAddress(addr);
            }
            setShowMapPicker(false);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {showAccommodationMapPicker && (
        <MapPicker
          initialLat={undefined}
          initialLng={undefined}
          onSelect={(lat, lng, addr) => {
            onUpdateTrip({
              ...trip,
              accommodationAddress: addr || trip.accommodationAddress,
              accommodationMapLink: `https://www.google.com/maps?q=${lat},${lng}`
            });
            setShowAccommodationMapPicker(false);
          }}
          onClose={() => setShowAccommodationMapPicker(false)}
        />
      )}

      {showHomeMapPicker && (
        <MapPicker
          initialLat={undefined}
          initialLng={undefined}
          onSelect={(lat, lng, addr) => {
            onUpdateTrip({
              ...trip,
              homeAddress: addr || trip.homeAddress
            });
            setShowHomeMapPicker(false);
          }}
          onClose={() => setShowHomeMapPicker(false)}
        />
      )}

      {showReplacementModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" id="replacement-car-modal">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-gray-100">
            <div className="bg-indigo-600 text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {trip.vehicle ? "Configuração/Substituição de Veículo" : "Registo de Veículo de Aluguer"}
                </h3>
              </div>
              <button type="button" onClick={() => setShowReplacementModal(false)} className="text-white hover:text-indigo-100 font-bold p-1">
                X
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const finalRange = replRange === "" ? 500 : Number(replRange);
              const newVehicle: Vehicle = {
                id: trip.vehicle?.id || "veh-" + Date.now(),
                limitThreshold: trip.vehicle?.limitThreshold || 30,
                name: replName,
                type: replType,
                autonomyRange: finalRange,
                currentAutonomy: finalRange,
                batteryPercent: replType === "electric" ? 100 : undefined,
                fuelPercent: replType !== "electric" ? 100 : undefined,
              };
              setCurrentAutonomy(finalRange);
              if (replType === "electric") setBatteryPercent(100);
              else setFuelPercent(100);

              onUpdateTrip({
                ...trip,
                vehicle: newVehicle
              });
              alert(trip.vehicle ? "Veículo atualizado com sucesso!" : "Veículo registado e associado à viagem com sucesso!");
              setShowReplacementModal(false);
              // Trigger quick recalculation of recommendations if desired
            }} className="p-5 space-y-4 text-xs">
              <div className="space-y-3 bg-white p-3 rounded-xl border border-gray-150 shadow-inner">
                <div className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5 mb-2 border-b border-indigo-50 pb-1.5">
                  <span>🚗</span>
                  <span>Selecione a partir do Catálogo de Modelos:</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">1. Escolha a Marca 🏷️</label>
                  <select
                    value={selectedReplBrand}
                    onChange={(e) => {
                      setSelectedReplBrand(e.target.value);
                      setSelectedReplModel("");
                      setSelectedReplYear("");
                    }}
                    className="w-full h-[36px] px-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                  >
                    <option value="">-- Selecione uma Marca --</option>
                    {POPULAR_BRANDS.map(b => (
                      <option key={b.brand} value={b.brand}>{b.brand}</option>
                    ))}
                  </select>
                </div>

                {selectedReplBrand && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">2. Escolha o Modelo 🚗</label>
                    <select
                      value={selectedReplModel}
                      onChange={(e) => {
                        setSelectedReplModel(e.target.value);
                        setSelectedReplYear("");
                      }}
                      className="w-full h-[36px] px-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                    >
                      <option value="">-- Selecione um Modelo --</option>
                      {getModelsForBrand(selectedReplBrand).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedReplBrand && selectedReplModel && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">3. Época / Ano de Fabrico 📅</label>
                    <select
                      value={selectedReplYear}
                      onChange={(e) => setSelectedReplYear(e.target.value)}
                      className="w-full h-[36px] px-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                    >
                      <option value="">-- Selecione a Época --</option>
                      {getYearsForModel(selectedReplBrand, selectedReplModel).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedReplBrand && selectedReplModel && selectedReplYear && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 mt-3 space-y-2">
                    <p className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                      🔌 <span>4. Selecione a Motorização/Versão:</span>
                    </p>
                    <p className="text-[10px] text-indigo-700 leading-normal">
                      Clique na sua motorização para preencher automaticamente:
                    </p>
                    <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {getVersionsForSelection(selectedReplBrand, selectedReplModel, selectedReplYear).map((opt, i) => {
                        const isSelected = replName === opt.name && replType === opt.type && replRange === opt.autonomyRange;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setReplName(opt.name);
                              setReplType(opt.type);
                              setReplRange(opt.autonomyRange);
                            }}
                            className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex justify-between items-center ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm font-semibold"
                                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">
                                {opt.type === "electric" ? "⚡" : opt.type === "hybrid" ? "🔌" : opt.type === "diesel" ? "⛽" : "⛽"}
                              </span>
                              <div className="text-left">
                                <p className="font-semibold text-[11px]">{opt.name}</p>
                                <p className={`text-[9px] ${isSelected ? "text-indigo-100" : "text-gray-500"}`}>
                                  {opt.type === "electric" ? "Elétrico" : opt.type === "hybrid" ? "Híbrido" : opt.type === "diesel" ? "Diesel" : "Gasolina"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[11px]">{opt.autonomyRange} km</p>
                              <p className={`text-[8px] ${isSelected ? "text-indigo-200" : "text-gray-400"}`}>Autonomia</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nome/Modelo do Carro *</label>
                <input
                  type="text" required
                  value={replName} onChange={(e) => setReplName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                  placeholder="Ex: Peugeot 2008 (Substituição)"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Tipo de Motorização *</label>
                <select
                  value={replType} onChange={(e: any) => setReplType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                >
                  <option value="electric">Elétrico (EV)</option>
                  <option value="gasoline">Gasolina</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Híbrido</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Autonomia Máxima (Tanque Cheio / 100% Bateria) em km *</label>
                <input
                  type="number" required
                  value={replRange} onChange={(e) => setReplRange(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                  placeholder="Ex: 500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button" onClick={() => setShowReplacementModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white font-semibold rounded-xl text-xs shadow transition-colors ${
                    trip.vehicle
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {trip.vehicle ? "Confirmar Troca de Carro" : "Registar e Associar Veículo 🚗"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDraftModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" id="draft-importer-modal">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-gray-100 animate-scale-up">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-200 animate-pulse" />
                <h3 className="font-bold text-sm">Importar Itinerário de Rascunho (Texto/Word)</h3>
              </div>
              <button type="button" onClick={() => setShowDraftModal(false)} className="text-white hover:text-indigo-100 font-bold p-1">
                X
              </button>
            </div>

            <form onSubmit={handleDraftSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50 text-indigo-950 space-y-1">
                <p className="font-bold text-[11px] uppercase tracking-wide text-indigo-700">Como funciona?</p>
                <p className="leading-relaxed text-[11px]">
                  Cole o seu rascunho de viagem em formato livre ou carregue um ficheiro de texto (.txt). 
                  A nossa Inteligência Artificial irá analisar o rascunho de forma inteligente e extrair automaticamente 
                  os eventos, horários, localizações e descrições para o seu itinerário do dia 
                  <strong className="text-indigo-600 font-extrabold bg-indigo-100/80 px-1.5 py-0.5 rounded ml-1">
                    {selectedDate || dates[0]}
                  </strong>.
                </p>
              </div>

              {/* File upload drag/drop zone */}
              <div className="space-y-1.5">
                <label className="block font-bold text-gray-700">Carregar Ficheiro de Rascunho (Opcional):</label>
                <div className="relative border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-gray-50/50">
                  <input
                    type="file"
                    accept=".txt,.doc,.docx"
                    onChange={handleDraftFileChange}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-1 text-gray-500">
                    <Upload className="w-6 h-6 text-indigo-500" />
                    <p className="font-semibold text-xs text-gray-700">Clique para selecionar ou arraste o ficheiro</p>
                    <p className="text-[10px] text-gray-400">Suporta ficheiros de rascunho de texto (.txt)</p>
                  </div>
                </div>
              </div>

              {/* Text Area block */}
              <div className="space-y-1">
                <label className="block font-bold text-gray-700">Copiar e Colar Texto do Rascunho:</label>
                <textarea
                  required
                  rows={8}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Exemplo de rascunho:&#10;08:30 - Pequeno-almoço no hotel em Porto Covo&#10;10:00 - Saída em direção à Praia de São Torpes para aula de Surf&#10;13:00 - Almoço de peixe grelhado no Restaurante Arte e Sal (Sines)&#10;16:30 - Check-in na Herdade do Touril"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono bg-white leading-relaxed"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button" 
                  disabled={draftParsing}
                  onClick={() => setShowDraftModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={draftParsing || !draftText.trim()}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {draftParsing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Analisando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Gerar Eventos Automaticamente
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
