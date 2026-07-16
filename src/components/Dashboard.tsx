import React, { useState } from "react";
import { Trip, UserProfile } from "../types";
import { 
  POPULAR_BRANDS,
  getModelsForBrand,
  getYearsForModel,
  getVersionsForSelection
} from "../data/cars";
import { 
  Car, 
  BatteryCharging, 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Trash, 
  Copy, 
  Archive, 
  FolderOpen, 
  ChevronRight, 
  Compass,
  TrendingUp,
  Award,
  Home,
  Building,
  Map,
  RefreshCw,
  X,
  UserPlus,
  LogOut
} from "lucide-react";
import MapPicker from "./MapPicker";

interface DashboardProps {
  trips: Trip[];
  activeUser: UserProfile;
  profiles?: UserProfile[];
  onAddProfile?: (profile: UserProfile, targetTripIds: string[]) => void;
  onDeleteProfile?: (id: string) => void;
  onChangeUser: (user: UserProfile | null) => void;
  onSelectTrip: (trip: Trip) => void;
  onCreateTrip: (tripData: any) => void;
  onDuplicateTrip: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDeleteTrip: (id: string) => void;
}

export default function Dashboard({
  trips,
  activeUser,
  profiles = [],
  onAddProfile,
  onDeleteProfile,
  onChangeUser,
  onSelectTrip,
  onCreateTrip,
  onDuplicateTrip,
  onToggleArchive,
  onDeleteTrip
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileEmail, setNewProfileEmail] = useState("");
  const [newProfileRole, setNewProfileRole] = useState<"Planeador" | "Consultor">("Consultor");
  const [newProfilePin, setNewProfilePin] = useState("");
  const [selectedProfileTripIds, setSelectedProfileTripIds] = useState<string[]>([]);
  
  // Create Trip form state
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("2026-07-10");
  const [endDate, setEndDate] = useState("2026-07-13");
  const [description, setDescription] = useState("");
  const [hasVehicle, setHasVehicle] = useState(false);
  const [vehicleType, setVehicleType] = useState<"electric" | "gasoline" | "diesel" | "hybrid">("electric");
  const [vehicleName, setVehicleName] = useState("Tesla Model 3");
  const [vehicleRange, setVehicleRange] = useState<number | "">(400);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [homeAddress, setHomeAddress] = useState("Av. Almirante Reis, Lisboa");
  const [accommodationAddress, setAccommodationAddress] = useState("");
  const [accommodationMapLink, setAccommodationMapLink] = useState("");
  const [accommodationName, setAccommodationName] = useState("");
  const [accommodationContact, setAccommodationContact] = useState("");
  const [showAccommodationMapPicker, setShowAccommodationMapPicker] = useState(false);

  // Filter trips based on active user's permissions (Consultores only see assigned trips)
  const isPlanner = activeUser.role === "Planeador";
  const userTrips = trips.filter(t => isPlanner || t.participants.some(p => p.id === activeUser.id));

  const filteredTrips = userTrips.filter(t => t.status === activeTab);

  // Statistics calculations
  const totalTrips = userTrips.length;
  const activeTripsCount = userTrips.filter(t => t.status === "active").length;
  
  // Sum spent (Planeador only can see)
  const totalSpent = userTrips.reduce((sum, trip) => {
    return sum + trip.expenses.filter(e => !e.isPlanned).reduce((acc, e) => acc + e.amount, 0);
  }, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !destination) return;
    
    onCreateTrip({
      name,
      destination,
      startDate,
      endDate,
      description,
      homeAddress,
      accommodationAddress,
      accommodationMapLink,
      accommodationName,
      accommodationContact,
      vehicle: hasVehicle ? {
        id: "veh-" + Date.now(),
        name: vehicleName,
        type: vehicleType,
        autonomyRange: vehicleRange === "" ? 400 : Number(vehicleRange),
        limitThreshold: 30,
        currentAutonomy: vehicleRange === "" ? 400 : Number(vehicleRange),
        batteryPercent: 100,
        fuelPercent: 100
      } : null
    });

    // Reset Form
    setName("");
    setDestination("");
    setDescription("");
    setHomeAddress("Av. Almirante Reis, Lisboa");
    setAccommodationAddress("");
    setAccommodationMapLink("");
    setAccommodationName("");
    setAccommodationContact("");
    setVehicleName("Tesla Model 3");
    setVehicleRange(400);
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedYear("");
    setHasVehicle(false);
    setShowCreateModal(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-10" id="tp-dashboard">
      {/* Header Profile Switcher and Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-gray-100" id="tp-header-row">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-100">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-sans text-gray-900 tracking-tight">TripPilot Pro</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">Sua central inteligente para planeamento e execução de road trips em tempo real</p>
        </div>

        {/* User context widget */}
        <div className="bg-gray-50 border border-gray-100 p-3 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto" id="profile-switcher">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${activeUser.role === "Planeador" ? "bg-emerald-500" : "bg-blue-500"}`}></div>
            <div className="text-xs">
              <p className="font-semibold text-gray-700">{activeUser.name}</p>
              <p className="text-gray-500 text-[10px]">{activeUser.role === "Planeador" ? "Acesso Total (Planeador)" : "Acesso Leitura (Consultor)"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 w-full md:w-auto">
            <button
              onClick={() => onChangeUser(null)}
              className="text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 font-medium px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer"
              title="Sair da sessão atual"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-500" />
              <span>Sair</span>
            </button>
            {activeUser.role === "Planeador" && (
              <button
                onClick={() => setShowProfilesModal(true)}
                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-2.5 py-1.5 rounded-md border border-indigo-100/50 transition-all flex items-center gap-1 cursor-pointer ml-1"
                title="Gerir Utilizadores e Convidados"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Gerir</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analytics stats bento-grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8" id="tp-stats-grid">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total de Viagens</p>
            <p className="text-2xl font-bold text-gray-900">{totalTrips}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Viagens Ativas</p>
            <p className="text-2xl font-bold text-gray-900">{activeTripsCount}</p>
          </div>
        </div>
      </div>

      {/* Trips list tabs and filter actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" id="trips-section">
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Tabs */}
          <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-200 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 sm:flex-initial text-sm px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "active"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Viagens Ativas
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`flex-1 sm:flex-initial text-sm px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "archived"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Arquivo Histórico
            </button>
          </div>

          {/* Create Button (Planeador only!) */}
          {activeUser.role === "Planeador" ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-100"
              id="btn-create-trip"
            >
              <Plus className="w-4 h-4" />
              Planear Nova Viagem
            </button>
          ) : (
            <div className="text-xs text-gray-400 font-medium italic">
              Apenas Planeadores podem criar e modificar planos.
            </div>
          )}
        </div>

        {/* Trips list body */}
        <div className="p-4 md:p-6" id="trips-grid-container">
          {filteredTrips.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Compass className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Nenhuma viagem encontrada</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mt-1">
                {activeTab === "active" 
                  ? "Comece agora a planear o seu próximo itinerário adicionando uma nova viagem!" 
                  : "Seu arquivo está vazio. Conclua ou arquive viagens ativas para guardá-las aqui."}
              </p>
              {activeUser.role === "Planeador" && activeTab === "active" && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 font-semibold px-4 py-2 rounded-xl text-xs hover:bg-indigo-100 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Criar primeira viagem
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTrips.map((trip) => {
                const totalDays = Object.keys(trip.itinerary).length;
                const totalEvents = Object.values(trip.itinerary).reduce((sum, events) => sum + events.length, 0);
                const hasElectric = trip.vehicle?.type === "electric";
                
                return (
                  <div 
                    key={trip.id}
                    className="group border border-gray-100 hover:border-indigo-100 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Name & status tag */}
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{trip.name}</h4>
                        <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full ${
                          trip.status === "active" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {trip.status === "active" ? "Ativa" : "Arquivada"}
                        </span>
                      </div>

                      {/* Destination and period */}
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{trip.destination}</span>
                      </div>

                      <p className="text-gray-600 text-xs line-clamp-2 mb-4 h-8">{trip.description || "Sem descrição."}</p>

                      {/* Travel meta icons */}
                      <div className="grid grid-cols-3 gap-2 border-t border-b border-gray-50 py-3 mb-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{totalDays} {totalDays === 1 ? "Dia" : "Dias"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{trip.participants.length} Part.</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{trip.vehicle ? trip.vehicle.name : "Nenhum"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom actions */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-1">
                        {/* Duplicate */}
                        {activeUser.role === "Planeador" && (
                          <button
                            onClick={() => onDuplicateTrip(trip.id)}
                            title="Duplicar Viagem"
                            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl hover:text-indigo-600 transition-all"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Archive / Restore */}
                        {activeUser.role === "Planeador" && (
                          <button
                            onClick={() => onToggleArchive(trip.id)}
                            title={trip.status === "active" ? "Arquivar Viagem" : "Restaurar Viagem"}
                            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl hover:text-amber-600 transition-all"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete */}
                        {activeUser.role === "Planeador" && (
                          <button
                            onClick={() => {
                              if (confirm(`Pretende mesmo eliminar a viagem "${trip.name}"? Esta ação é irreversível.`)) {
                                onDeleteTrip(trip.id);
                              }
                            }}
                            title="Eliminar Viagem"
                            className="p-2 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl transition-all"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => onSelectTrip(trip)}
                        className="flex items-center gap-1.5 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
                      >
                        Abrir Viagem
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- CREATE NEW TRIP MODAL (Planeador only) --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Planear Nova Viagem 🗺️</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg text-sm transition-all"
              >
                X
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome da Viagem *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Road Trip Gerês Selvagem"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base md:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Destino *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Porto → Lamego → Douro"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base md:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data Início *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base md:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data Fim *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base md:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Descrição</label>
                <textarea
                  placeholder="Breve descrição dos objetivos da viagem, participantes ou notas iniciais."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base md:text-sm"
                />
              </div>

              {/* Vehicle parameters associated directly at creation (Optional toggle) */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg text-indigo-600 shadow-sm border border-indigo-100/50">
                    <Car className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-indigo-900 uppercase">Registar Viatura de Aluguer?</h5>
                    <p className="text-[10px] text-indigo-700/80 mt-0.5">Deseja adicionar um veículo a esta viagem agora?</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasVehicle}
                    onChange={(e) => setHasVehicle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {hasVehicle && (
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                  <h5 className="text-xs font-bold text-indigo-900 uppercase flex items-center gap-1.5">
                    <Car className="w-4 h-4" />
                    Especificações da Viatura de Aluguer
                  </h5>

                  <div className="space-y-3 bg-white p-3 rounded-xl border border-gray-100 shadow-inner">
                    <div className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5 mb-2 border-b border-indigo-50 pb-1.5">
                      <span>🚗</span>
                      <span>Selecione a partir do Catálogo de Modelos:</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">1. Escolha a Marca 🏷️</label>
                      <select
                        value={selectedBrand}
                        onChange={(e) => {
                          setSelectedBrand(e.target.value);
                          setSelectedModel("");
                          setSelectedYear("");
                        }}
                        className="w-full h-[36px] px-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                      >
                        <option value="">-- Selecione uma Marca --</option>
                        {POPULAR_BRANDS.map(b => (
                          <option key={b.brand} value={b.brand}>{b.brand}</option>
                        ))}
                      </select>
                    </div>

                    {selectedBrand && (
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">2. Escolha o Modelo 🚗</label>
                        <select
                          value={selectedModel}
                          onChange={(e) => {
                            setSelectedModel(e.target.value);
                            setSelectedYear("");
                          }}
                          className="w-full h-[36px] px-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                        >
                          <option value="">-- Selecione um Modelo --</option>
                          {getModelsForBrand(selectedBrand).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedBrand && selectedModel && (
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">3. Época / Ano de Fabrico 📅</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          className="w-full h-[36px] px-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                        >
                          <option value="">-- Selecione a Época --</option>
                          {getYearsForModel(selectedBrand, selectedModel).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedBrand && selectedModel && selectedYear && (
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 mt-3 space-y-2">
                        <p className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                          🔌 <span>4. Selecione a Motorização/Versão:</span>
                        </p>
                        <p className="text-[10px] text-indigo-700 leading-normal">
                          Clique na sua motorização para preencher automaticamente:
                        </p>
                        <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {getVersionsForSelection(selectedBrand, selectedModel, selectedYear).map((opt, i) => {
                            const isSelected = vehicleName === opt.name && vehicleType === opt.type && vehicleRange === opt.autonomyRange;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setVehicleName(opt.name);
                                  setVehicleType(opt.type);
                                  setVehicleRange(opt.autonomyRange);
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

                  <div className="space-y-3 mt-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Nome / Modelo do Veículo</label>
                      <input
                        type="text"
                        value={vehicleName}
                        onChange={(e) => setVehicleName(e.target.value)}
                        placeholder="Ex: Tesla Model 3 RWD"
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base md:text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Tipo de Motor</label>
                        <select
                          value={vehicleType}
                          onChange={(e: any) => setVehicleType(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base md:text-xs"
                        >
                          <option value="electric">Elétrico (EV)</option>
                          <option value="hybrid">Híbrido</option>
                          <option value="diesel">Diesel (Gasóleo)</option>
                          <option value="gasoline">Gasolina</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Autonomia Total (km)</label>
                        <input
                          type="number"
                          value={vehicleRange}
                          onChange={(e) => setVehicleRange(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base md:text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Alojamento (Estadia) Details */}
              <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
                <h5 className="text-xs font-bold text-emerald-900 uppercase mb-2 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-600" />
                  Alojamento (Estadia de Referência)
                </h5>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <span className="text-emerald-600">🏢</span>
                        Nome do Alojamento
                      </label>
                      <input
                        type="text"
                        value={accommodationName}
                        onChange={(e) => setAccommodationName(e.target.value)}
                        placeholder="Ex: Herdade do Touril"
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base md:text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <span className="text-emerald-600">📞</span>
                        Contacto telefónico
                      </label>
                      <input
                        type="text"
                        value={accommodationContact}
                        onChange={(e) => setAccommodationContact(e.target.value)}
                        placeholder="Ex: +351 283 960 000"
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base md:text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-emerald-600" />
                      Morada do Alojamento
                    </label>
                    <input
                      type="text"
                      value={accommodationAddress}
                      onChange={(e) => setAccommodationAddress(e.target.value)}
                      placeholder="Ex: Herdade do Touril, Zambujeira do Mar"
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base md:text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <span className="text-emerald-600">🔗</span>
                      Localização por Link (ex: Google Maps)
                    </label>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={accommodationMapLink}
                        onChange={(e) => setAccommodationMapLink(e.target.value)}
                        placeholder="Ex: https://maps.google.com/?q=Herdade+do+Touril"
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base md:text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccommodationMapPicker(true)}
                        className="w-full py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold border border-emerald-200/50 rounded-lg text-[10px] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Map className="w-3.5 h-3.5" />
                        Escolher no Mapa / Pesquisar
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-800 leading-normal mt-2 italic">
                  * Útil para consultar rapidamente no mapa e para calcular automaticamente as deslocações e o consumo de energia/combustível no início e fim de cada dia!
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-100"
                >
                  Criar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAccommodationMapPicker && (
        <MapPicker
          initialLat={undefined}
          initialLng={undefined}
          onSelect={(lat, lng, addr) => {
            if (addr) {
              setAccommodationAddress(addr);
            }
            setAccommodationMapLink(`https://www.google.com/maps?q=${lat},${lng}`);
            setShowAccommodationMapPicker(false);
          }}
          onClose={() => setShowAccommodationMapPicker(false)}
        />
      )}

      {/* Profiles Management Modal */}
      {showProfilesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="profiles-modal">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Gestão de Utilizadores & Convidados
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Crie e faça a gestão dos perfis que acedem à plataforma e controle o acesso a despesas financeiras.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowProfilesModal(false);
                  // Reset form
                  setNewProfileName("");
                  setNewProfileEmail("");
                  setNewProfileRole("Consultor");
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Existing Profiles List */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Utilizadores Registados ({profiles.length})</h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50">
                  {profiles.map((p) => {
                    const isActive = p.id === activeUser.id;
                    return (
                      <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-800 text-sm">{p.name}</p>
                            {isActive && (
                              <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                Ativo agora
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-[10px] mt-0.5">{p.email}</p>
                          <p className="text-[10px] text-gray-500 mt-1 italic">
                            {p.role === "Planeador" 
                              ? "✓ Acesso total: cria e edita itinerários, orçamentos, faturas e autonomia." 
                              : "👁 Acesso leitura: consulta o plano e rotas, mas despesas e preços ficam ocultos."}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.role === "Planeador" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}>
                            {p.role}
                          </span>

                          {!isActive && activeUser.role !== "Planeador" && (
                            <button
                              onClick={() => onChangeUser(p)}
                              className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 font-semibold border border-gray-200 rounded-lg transition-colors cursor-pointer"
                              title="Alternar para este utilizador"
                            >
                              Alternar
                            </button>
                          )}

                          {profiles.length > 1 && !isActive && (
                            <button
                              onClick={() => {
                                if (confirm(`Deseja mesmo eliminar o utilizador ${p.name}?`)) {
                                  onDeleteProfile(p.id);
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Eliminar utilizador"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Profile Form */}
              <div className="border-t border-gray-100 pt-6 space-y-4">
                <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  Adicionar Novo Utilizador / Convidado
                </h4>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newProfileName || !newProfileEmail) return;
                    if (trips.length > 0 && selectedProfileTripIds.length === 0) {
                      return;
                    }
                    
                    const newProfile: UserProfile = {
                      id: "user-" + Date.now(),
                      name: newProfileName.trim(),
                      email: newProfileEmail.trim(),
                      role: newProfileRole,
                      pin: newProfilePin.trim() || undefined
                    };
                    
                    onAddProfile(newProfile, selectedProfileTripIds);
                    setNewProfileName("");
                    setNewProfileEmail("");
                    setNewProfileRole("Consultor");
                    setNewProfilePin("");
                    setSelectedProfileTripIds([]);
                  }}
                  className="bg-gray-50/50 border border-gray-100 p-4 rounded-2xl space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-gray-600 font-bold">Nome do Membro *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Maria Ramos"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-gray-600 font-bold">E-mail *</label>
                      <input
                        type="email"
                        required
                        placeholder="maria@example.com"
                        value={newProfileEmail}
                        onChange={(e) => setNewProfileEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-gray-600 font-bold">Tipo de Permissão</label>
                      <select
                        value={newProfileRole}
                        onChange={(e: any) => setNewProfileRole(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none h-[30px]"
                      >
                        <option value="Consultor">Consultor (Consulta sem custos)</option>
                        <option value="Planeador">Planeador (Acesso total)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-gray-600 font-bold">Código de Acesso PIN (Opcional)</label>
                      <input
                        type="password"
                        placeholder="Ex: 1234 (vazio se público)"
                        value={newProfilePin}
                        onChange={(e) => setNewProfilePin(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-600 font-bold">Associar a Viagens * (Obrigatório)</label>
                    {trips.length === 0 ? (
                      <p className="text-amber-600 text-[10px] italic font-semibold bg-amber-50 border border-amber-100 p-2 rounded-xl">De momento não tem nenhuma viagem criada. Crie uma viagem antes de adicionar convidados.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto border border-gray-200 bg-white rounded-xl p-2.5 shadow-inner">
                        {trips.map((t) => (
                          <label key={t.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors select-none">
                            <input
                              type="checkbox"
                              checked={selectedProfileTripIds.includes(t.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProfileTripIds([...selectedProfileTripIds, t.id]);
                                } else {
                                  setSelectedProfileTripIds(selectedProfileTripIds.filter(id => id !== t.id));
                                }
                              }}
                              className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-xs text-gray-700 font-medium truncate" title={t.name}>{t.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={trips.length === 0 || selectedProfileTripIds.length === 0}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Criar Convidado
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-500 text-center leading-normal">
              Utilizadores marcados como <strong>Consultor</strong> não poderão aceder ao menu de Despesas, faturas ou relatórios financeiros de nenhuma viagem do sistema.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
