import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Set up server-side JSON storage for persistence
const DB_FILE = path.join(process.cwd(), "db.json");

// Define types inside server
interface Event {
  id: string;
  timeStart: string;
  timeEnd: string;
  name: string;
  description: string;
  category: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  googleMapsLink: string;
  wazeLink: string;
  image: string;
  notes: string;
  distanceFromPrev?: string;
  timeFromPrev?: string;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  isPlanned: boolean; // true = prevista, false = real
  supplier?: string;
  invoiceUrl?: string;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  status: "active" | "archived";
  vehicle: {
    id: string;
    name: string;
    type: "electric" | "gasoline" | "diesel" | "hybrid";
    autonomyRange: number; // in km
    limitThreshold?: number; // threshold percent (default 30%)
    currentAutonomy?: number; // km indicated by vehicle
    batteryPercent?: number; // e.g. 80%
    fuelPercent?: number; // e.g. 80%
  } | null;
  accommodation: {
    name: string;
    address: string;
    checkIn: string;
    checkOut: string;
    price: number;
  } | null;
  flights: {
    flightNo: string;
    airline: string;
    departure: string;
    arrival: string;
    date: string;
    passengers: number;
    pricePerPassenger: number;
    totalPrice: number;
  }[];
  documents: {
    id: string;
    name: string;
    type: string;
    fileUrl?: string;
    dateUploaded: string;
    size?: string;
    allowedForConsultor: boolean;
  }[];
  itinerary: {
    [date: string]: Event[];
  };
  expenses: Expense[];
  participants: {
    id: string;
    name: string;
    email: string;
    role: "Planeador" | "Consultor";
  }[];
  homeAddress?: string;
  accommodationAddress?: string;
  accommodationMapLink?: string;
  accommodationName?: string;
  accommodationContact?: string;
}

interface DatabaseSchema {
  trips: Trip[];
}

// Initial/Starter Seed Data for TripPilot
const initialData: DatabaseSchema = {
  trips: [
    {
      id: "trip-costa-alentejana",
      name: "Road Trip Costa Alentejana 🌊",
      destination: "Lisboa → Sines → Sagres",
      startDate: "2026-07-10",
      endDate: "2026-07-13",
      description: "Uma viagem inesquecível de carro elétrico ao longo das falésias selvagens, praias deslumbrantes e vilas costeiras do Alentejo e Algarve ocidental.",
      status: "active",
      homeAddress: "Av. Almirante Reis, Lisboa",
      accommodationAddress: "Herdade do Touril, Zambujeira do Mar",
      accommodationMapLink: "https://maps.app.goo.gl/tB1RGr6Ld8gHwW4z5",
      accommodationName: "Herdade do Touril",
      accommodationContact: "+351 283 960 000",
      vehicle: {
        id: "ev-tesla",
        name: "Tesla Model Y RWD",
        type: "electric",
        autonomyRange: 450,
        limitThreshold: 30, // 30% limit
        currentAutonomy: 320,
        batteryPercent: 75
      },
      accommodation: {
        name: "Eco-Resort Herdade do Touril",
        address: "Zambujeira do Mar, Odemira",
        checkIn: "2026-07-10",
        checkOut: "2026-07-13",
        price: 360
      },
      flights: [],
      documents: [
        {
          id: "doc-touril-pdf",
          name: "Confirmacao_Herdade_Touril.pdf",
          type: "application/pdf",
          dateUploaded: "2026-07-04",
          size: "420 KB",
          allowedForConsultor: true
        },
        {
          id: "doc-aluguer-fatura",
          name: "Fatura_Aluguer_Carro_Tesla.pdf",
          type: "application/pdf",
          dateUploaded: "2026-07-05",
          size: "1.2 MB",
          allowedForConsultor: false // prices hidden from consultor
        }
      ],
      itinerary: {
        "2026-07-10": [
          {
            id: "ev-1",
            timeStart: "09:00",
            timeEnd: "10:30",
            name: "Partida de Lisboa (Ponte 25 de Abril)",
            description: "Saída de Lisboa rumo a Sines. Início da grande road trip pela EN120 e Rota Vicentina.",
            category: "Atividade livre",
            address: "Lisboa, Portugal",
            coordinates: { lat: 38.7223, lng: -9.1393 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Lisboa",
            wazeLink: "https://waze.com/ul?q=Lisboa",
            image: "https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=800&q=80",
            notes: "Verificar se os cabos de carregamento estão no porta-bagagens."
          },
          {
            id: "ev-2",
            timeStart: "10:45",
            timeEnd: "12:30",
            name: "Almoço em Porto Covo e Passeio",
            description: "Parada na charmosa vila de Porto Covo. Passeio pelas ruas de casinhas brancas e azuis e descida à Praia dos Coxos.",
            category: "Restaurante",
            address: "Porto Covo, Sines",
            coordinates: { lat: 37.8512, lng: -8.7909 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Porto+Covo",
            wazeLink: "https://waze.com/ul?q=Porto+Covo",
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
            notes: "Procurar restaurante 'Zé Inácio' ou 'A Tasca' para peixe grelhado fresco.",
            distanceFromPrev: "160 km",
            timeFromPrev: "1h 45m"
          },
          {
            id: "ev-3",
            timeStart: "14:00",
            timeEnd: "16:30",
            name: "Praia de Odeceixe",
            description: "Uma espetacular praia onde a ribeira de Seixe se encontra com o oceano. Ótima para banhos de mar e rio.",
            category: "Praia",
            address: "Praia de Odeceixe, Aljezur",
            coordinates: { lat: 37.4429, lng: -8.7983 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Praia+de+Odeceixe",
            wazeLink: "https://waze.com/ul?q=Praia+de+Odeceixe",
            image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
            notes: "Subir ao miradouro para tirar fotos incríveis.",
            distanceFromPrev: "52 km",
            timeFromPrev: "45m"
          },
          {
            id: "ev-4",
            timeStart: "18:00",
            timeEnd: "19:30",
            name: "Check-in na Herdade do Touril",
            description: "Instalação no alojamento sustentável perto da Zambujeira do Mar.",
            category: "Hotel",
            address: "Herdade do Touril, Zambujeira do Mar",
            coordinates: { lat: 37.5342, lng: -8.7753 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Herdade+do+Touril",
            wazeLink: "https://waze.com/ul?q=Herdade+do+Touril",
            image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
            notes: "O hotel dispõe de carregador lento para carros elétricos (Menezes AC 7.4 kW). Excelente para carregar durante a noite!",
            distanceFromPrev: "21 km",
            timeFromPrev: "20m"
          }
        ],
        "2026-07-11": [
          {
            id: "ev-5",
            timeStart: "10:00",
            timeEnd: "13:00",
            name: "Trilho dos Pescadores (Cabo Sardão)",
            description: "Pequena caminhada ao longo das arribas do Cabo Sardão para ver os ninhos de cegonhas brancas nas falésias.",
            category: "Passeio",
            address: "Cabo Sardão, Odemira",
            coordinates: { lat: 37.5985, lng: -8.8149 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Cabo+Sardao",
            wazeLink: "https://waze.com/ul?q=Cabo+Sardao",
            image: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80",
            notes: "Levar calçado confortável, chapéu e protetor solar."
          },
          {
            id: "ev-6",
            timeStart: "13:30",
            timeEnd: "15:00",
            name: "Almoço na Zambujeira do Mar",
            description: "Almoço no centro da vila com vista magnífica sobre a baía.",
            category: "Restaurante",
            address: "Zambujeira do Mar, Odemira",
            coordinates: { lat: 37.5231, lng: -8.7853 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Zambujeira+do+Mar",
            wazeLink: "https://waze.com/ul?q=Zambujeira+do+Mar",
            image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
            notes: "Restaurante 'Costa Alentejana'. Pedir arroz de marisco.",
            distanceFromPrev: "11 km",
            timeFromPrev: "12m"
          },
          {
            id: "ev-7",
            timeStart: "15:30",
            timeEnd: "18:30",
            name: "Praia do Carvalhal",
            description: "Uma enseada protegida com excelente areal e águas límpidas.",
            category: "Praia",
            address: "Praia do Carvalhal, Brejão",
            coordinates: { lat: 37.5023, lng: -8.7915 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Praia+do+Carvalhal",
            wazeLink: "https://waze.com/ul?q=Praia+do+Carvalhal",
            image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
            notes: "Ideal para relaxar a tarde inteira.",
            distanceFromPrev: "5 km",
            timeFromPrev: "8m"
          }
        ],
        "2026-07-12": [
          {
            id: "ev-8",
            timeStart: "09:30",
            timeEnd: "11:00",
            name: "Deslocação para o Algarve (Aljezur)",
            description: "Viagem em direção ao barlavento algarvio pela costa selvagem de Aljezur.",
            category: "Viagem / Na estrada",
            address: "Aljezur, Algarve",
            coordinates: { lat: 37.3193, lng: -8.8033 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Aljezur",
            wazeLink: "https://waze.com/ul?q=Aljezur",
            image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
            notes: "Visitar o Castelo de Aljezur medieval."
          },
          {
            id: "ev-9",
            timeStart: "11:30",
            timeEnd: "14:30",
            name: "Praia da Arrifana",
            description: "Uma mítica praia em forma de concha abrigada de ventos, muito popular para surf.",
            category: "Praia",
            address: "Arrifana, Aljezur",
            coordinates: { lat: 37.2917, lng: -8.8681 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Praia+da+Arrifana",
            wazeLink: "https://waze.com/ul?q=Praia+da+Arrifana",
            image: "https://images.unsplash.com/photo-1471922639536-e67b96715791?auto=format&fit=crop&w=800&q=80",
            notes: "Almoço rápido no restaurante sobre a Arrifana.",
            distanceFromPrev: "12 km",
            timeFromPrev: "15m"
          },
          {
            id: "ev-10",
            timeStart: "15:30",
            timeEnd: "19:00",
            name: "Cabo de São Vicente (Fim do Mundo)",
            description: "Visitar o extremo sudoeste da Europa Continental. Sentir a força do vento e o pôr do sol glorioso sobre os penhascos.",
            category: "Miradouro",
            address: "Cabo de Sao Vicente, Sagres",
            coordinates: { lat: 37.0224, lng: -8.9964 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Cabo+de+Sao+Vicente",
            wazeLink: "https://waze.com/ul?q=Cabo+de+Sao+Vicente",
            image: "https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&w=800&q=80",
            notes: "Levar casaco quente mesmo no verão! O vento é extremamente forte.",
            distanceFromPrev: "45 km",
            timeFromPrev: "40m"
          }
        ],
        "2026-07-13": [
          {
            id: "ev-11",
            timeStart: "10:00",
            timeEnd: "12:30",
            name: "Fortaleza de Sagres",
            description: "Explorar a monumental muralha de Sagres e a sua icónica rosa-dos-ventos de pedra no chão de 43 metros.",
            category: "Museu",
            address: "Fortaleza de Sagres, Sagres",
            coordinates: { lat: 36.9972, lng: -8.9481 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Fortaleza+de+Sagres",
            wazeLink: "https://waze.com/ul?q=Fortaleza+de+Sagres",
            image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
            notes: "Entrada custa 3€ por pessoa."
          },
          {
            id: "ev-12",
            timeStart: "13:00",
            timeEnd: "15:00",
            name: "Almoço de Despedida em Sagres",
            description: "Desfrutar dos sabores locais antes de iniciar o regresso para Lisboa.",
            category: "Restaurante",
            address: "Sagres, Portugal",
            coordinates: { lat: 37.0084, lng: -8.9392 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Sagres",
            wazeLink: "https://waze.com/ul?q=Sagres",
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
            notes: "Restaurante 'A Casinha'. Peixe fresco incomparável.",
            distanceFromPrev: "2 km",
            timeFromPrev: "4m"
          },
          {
            id: "ev-13",
            timeStart: "15:30",
            timeEnd: "19:00",
            name: "Viagem de Regresso a Lisboa",
            description: "Fim da road trip, subida pela autoestrada A2 em direção ao norte.",
            category: "Viagem / Na estrada",
            address: "Lisboa, Portugal",
            coordinates: { lat: 38.7223, lng: -9.1393 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Lisboa",
            wazeLink: "https://waze.com/ul?q=Lisboa",
            image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
            notes: "Fazer uma paragem técnica para carregar se necessário (ex: postos rápidos em Alcácer do Sal).",
            distanceFromPrev: "320 km",
            timeFromPrev: "3h 10m"
          }
        ]
      },
      expenses: [
        {
          id: "exp-hotel-1",
          category: "Alojamento",
          description: "Eco-Resort Herdade do Touril (3 noites)",
          amount: 360,
          date: "2026-07-10",
          isPlanned: true,
          supplier: "Herdade do Touril"
        },
        {
          id: "exp-tesla-aluguer",
          category: "Rent-a-Car",
          description: "Aluguer Tesla Model Y (4 dias)",
          amount: 240,
          date: "2026-07-10",
          isPlanned: true,
          supplier: "Hertz EV"
        },
        {
          id: "exp-almoco-1",
          category: "Restaurantes",
          description: "Almoço Porto Covo - Restaurante Zé Inácio",
          amount: 42.5,
          date: "2026-07-10",
          isPlanned: false, // despesa real
          supplier: "Zé Inácio Porto Covo"
        },
        {
          id: "exp-carregamento-fast",
          category: "Carregamentos",
          description: "Carregamento Rápido PCN Sines (35 kWh)",
          amount: 14.8,
          date: "2026-07-10",
          isPlanned: false, // despesa real
          supplier: "Mobi.E Sines"
        },
        {
          id: "exp-portagem-a2",
          category: "Portagens",
          description: "Portagem Lisboa → Sines",
          amount: 12.4,
          date: "2026-07-10",
          isPlanned: true
        }
      ],
      participants: [
        {
          id: "user-ricardo",
          name: "Ricardo Medeiros",
          email: "ricardojpmedeiros@gmail.com",
          role: "Planeador"
        },
        {
          id: "user-ana",
          name: "Ana Silva",
          email: "ana.silva@example.com",
          role: "Planeador"
        }
      ]
    },
    {
      id: "trip-aldeias-xisto",
      name: "Rota das Aldeias de Xisto 🌲",
      destination: "Coimbra → Lousã → Piódão",
      startDate: "2026-05-15",
      endDate: "2026-05-18",
      description: "Uma imersão na cultura e natureza serrana do centro de Portugal, visitando as acolhedoras Aldeias de Xisto aninhadas nas montanhas.",
      status: "archived",
      vehicle: {
        id: "car-diesel",
        name: "Volvo XC60 Diesel",
        type: "diesel",
        autonomyRange: 900,
        limitThreshold: 30,
        currentAutonomy: 850,
        fuelPercent: 95
      },
      accommodation: {
        name: "Casa de Campo Talasnal",
        address: "Talasnal, Serra da Lousã",
        checkIn: "2026-05-15",
        checkOut: "2026-05-18",
        price: 280
      },
      flights: [],
      documents: [],
      itinerary: {
        "2026-05-15": [
          {
            id: "x-1",
            timeStart: "10:00",
            timeEnd: "11:30",
            name: "Partida de Coimbra",
            description: "Encontro do grupo e início da subida para a Serra da Lousã.",
            category: "Atividade livre",
            address: "Coimbra, Portugal",
            coordinates: { lat: 40.2033, lng: -8.4103 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Coimbra",
            wazeLink: "https://waze.com/ul?q=Coimbra",
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
            notes: "Atestar o carro antes de subir a montanha."
          },
          {
            id: "x-2",
            timeStart: "12:00",
            timeEnd: "14:30",
            name: "Almoço e Chegada ao Talasnal",
            description: "Instalação na Aldeia de Xisto da Lousã e almoço tradicional no restaurante Ti Lena.",
            category: "Hotel",
            address: "Talasnal, Lousã",
            coordinates: { lat: 40.1032, lng: -8.2142 },
            googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Talasnal",
            wazeLink: "https://waze.com/ul?q=Talasnal",
            image: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80",
            notes: "Comer a famosa chanfana assada no forno de lenha.",
            distanceFromPrev: "35 km",
            timeFromPrev: "40m"
          }
        ]
      },
      expenses: [
        {
          id: "exp-xisto-hotel",
          category: "Alojamento",
          description: "Estadia Casa Talasnal",
          amount: 280,
          date: "2026-05-15",
          isPlanned: false,
          supplier: "Xisto Houses"
        },
        {
          id: "exp-xisto-combustivel",
          category: "Combustível",
          description: "Abastecimento Repsol Coimbra (45 L)",
          amount: 78.5,
          date: "2026-05-15",
          isPlanned: false,
          supplier: "Repsol Coimbra"
        },
        {
          id: "exp-xisto-jantar",
          category: "Restaurantes",
          description: "Jantar Ti Lena Lousã",
          amount: 65,
          date: "2026-05-15",
          isPlanned: false,
          supplier: "Restaurante Ti Lena"
        }
      ],
      participants: [
        {
          id: "user-ricardo",
          name: "Ricardo Medeiros",
          email: "ricardojpmedeiros@gmail.com",
          role: "Planeador"
        }
      ]
    }
  ]
};

// Initialize file database
function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
    console.log("Database initialized with seed data at " + DB_FILE);
  }
}
initDatabase();

// Database Helper Functions
function readDatabase(): DatabaseSchema {
  try {
    const content = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object") {
      return { trips: [] };
    }
    if (!Array.isArray(parsed.trips)) {
      parsed.trips = [];
    }
    return parsed;
  } catch (err) {
    console.error("Error reading database file, returning default data", err);
    // Deep clone initialData so we don't mutate the reference
    return JSON.parse(JSON.stringify(initialData));
  }
}

function writeDatabase(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// Enable JSON parsing with larger limit for invoice scans
app.use(express.json({ limit: "15mb" }));

// Initialize Gemini SDK with telemetry user-agent
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in the environment. Falling back to simulated smart features.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });
};

// --- API ROUTES ---

// 1. Get all trips
app.get("/api/trips", (req, res) => {
  const dbData = readDatabase();
  res.json(dbData.trips);
});

// 2. Create a new trip
app.post("/api/trips", (req, res) => {
  try {
    const dbData = readDatabase();
    const newTripData = req.body;

    const newTrip: Trip = {
      id: "trip-" + Date.now(),
      name: newTripData.name || "Nova Viagem 🗺️",
      destination: newTripData.destination || "Destino Desconhecido",
      startDate: newTripData.startDate || new Date().toISOString().split("T")[0],
      endDate: newTripData.endDate || new Date().toISOString().split("T")[0],
      description: newTripData.description || "",
      status: "active",
      homeAddress: newTripData.homeAddress || "",
      accommodationAddress: newTripData.accommodationAddress || "",
      accommodationMapLink: newTripData.accommodationMapLink || "",
      accommodationName: newTripData.accommodationName || "",
      accommodationContact: newTripData.accommodationContact || "",
      vehicle: newTripData.vehicle || null,
      accommodation: newTripData.accommodation || null,
      flights: newTripData.flights || [],
      documents: [],
      itinerary: {},
      expenses: [],
      participants: newTripData.participants || [
        {
          id: "user-ricardo",
          name: "Ricardo Medeiros",
          email: "ricardojpmedeiros@gmail.com",
          role: "Planeador"
        }
      ]
    };

    // Generate itinerary days safely
    try {
      const startParts = newTrip.startDate ? newTrip.startDate.split("-").map(Number) : [];
      const endParts = newTrip.endDate ? newTrip.endDate.split("-").map(Number) : [];
      
      if (startParts.length === 3 && endParts.length === 3 && !startParts.some(isNaN) && !endParts.some(isNaN)) {
        const startUTC = Date.UTC(startParts[0], startParts[1] - 1, startParts[2]);
        const endUTC = Date.UTC(endParts[0], endParts[1] - 1, endParts[2]);
        
        if (!isNaN(startUTC) && !isNaN(endUTC) && startUTC <= endUTC) {
          // Safety guard: max 366 days
          const limit = Math.min(366, Math.floor((endUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1);
          for (let i = 0; i < limit; i++) {
            const currentUTC = new Date(startUTC + i * 24 * 60 * 60 * 1000);
            if (!isNaN(currentUTC.getTime())) {
              const dateStr = currentUTC.toISOString().split("T")[0];
              if (dateStr) {
                newTrip.itinerary[dateStr] = [];
              }
            }
          }
        }
      } else {
        const start = new Date(newTrip.startDate);
        const end = new Date(newTrip.endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
          const current = new Date(start);
          let iterations = 0;
          while (current <= end && iterations < 366) {
            if (!isNaN(current.getTime())) {
              const dateStr = current.toISOString().split("T")[0];
              if (dateStr) {
                newTrip.itinerary[dateStr] = [];
              }
            }
            current.setDate(current.getDate() + 1);
            iterations++;
          }
        }
      }
    } catch (err) {
      console.error("Error generating itinerary days safely:", err);
    }

    dbData.trips.unshift(newTrip);
    writeDatabase(dbData);
    res.status(201).json(newTrip);
  } catch (err: any) {
    console.error("Error in POST /api/trips:", err);
    res.status(500).json({ error: err.message || "Erro ao gravar viagem no servidor" });
  }
});

// 3. Get single trip
app.get("/api/trips/:id", (req, res) => {
  const dbData = readDatabase();
  const trip = dbData.trips.find(t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ error: "Viagem não encontrada" });
  }
  res.json(trip);
});

// 4. Update trip
app.put("/api/trips/:id", (req, res) => {
  const dbData = readDatabase();
  const idx = dbData.trips.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Viagem não encontrada" });
  }

  const updatedTrip = { ...dbData.trips[idx], ...req.body };
  dbData.trips[idx] = updatedTrip;
  writeDatabase(dbData);
  res.json(updatedTrip);
});

// 5. Delete trip
app.delete("/api/trips/:id", (req, res) => {
  const dbData = readDatabase();
  const filtered = dbData.trips.filter(t => t.id !== req.params.id);
  dbData.trips = filtered;
  writeDatabase(dbData);
  res.json({ success: true });
});

// 6. Duplicate trip
app.post("/api/trips/:id/duplicate", (req, res) => {
  const dbData = readDatabase();
  const original = dbData.trips.find(t => t.id === req.params.id);
  if (!original) {
    return res.status(404).json({ error: "Viagem não encontrada" });
  }

  // Deep clone
  const clone: Trip = JSON.parse(JSON.stringify(original));
  clone.id = "trip-" + Date.now();
  clone.name = `Cópia de ${clone.name}`;
  clone.status = "active"; // Restore status to active
  
  // Clean real expenses to restart or copy them as planned
  clone.expenses = clone.expenses.map(exp => ({
    ...exp,
    id: "exp-" + Math.random().toString(36).substr(2, 9),
    isPlanned: true // Convert real to planned for planning purposes
  }));

  // Re-generate document ids
  clone.documents = clone.documents.map(doc => ({
    ...doc,
    id: "doc-" + Math.random().toString(36).substr(2, 9)
  }));

  dbData.trips.unshift(clone);
  writeDatabase(dbData);
  res.status(201).json(clone);
});

// 7. Toggle Trip Archive manual state
app.post("/api/trips/:id/archive", (req, res) => {
  const dbData = readDatabase();
  const trip = dbData.trips.find(t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ error: "Viagem não encontrada" });
  }

  trip.status = trip.status === "active" ? "archived" : "active";
  writeDatabase(dbData);
  res.json(trip);
});

// 8. Add event to itinerary
app.post("/api/trips/:id/events", (req, res) => {
  const { date, event } = req.body;
  const dbData = readDatabase();
  const trip = dbData.trips.find(t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ error: "Viagem não encontrada" });
  }

  if (!trip.itinerary[date]) {
    trip.itinerary[date] = [];
  }

  const newEvent: Event = {
    id: "event-" + Date.now(),
    timeStart: event.timeStart || "12:00",
    timeEnd: event.timeEnd || "13:00",
    name: event.name || "Novo Evento",
    description: event.description || "",
    category: event.category || "Atividade livre",
    address: event.address || "",
    coordinates: event.coordinates || null,
    googleMapsLink: event.googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address || event.name)}`,
    wazeLink: event.wazeLink || `https://waze.com/ul?q=${encodeURIComponent(event.address || event.name)}`,
    image: event.image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    notes: event.notes || "",
    distanceFromPrev: event.distanceFromPrev,
    timeFromPrev: event.timeFromPrev
  };

  trip.itinerary[date].push(newEvent);

  // Sort events by starting hour
  trip.itinerary[date].sort((a, b) => a.timeStart.localeCompare(b.timeStart));

  writeDatabase(dbData);
  res.status(201).json(trip);
});

// 9. Update event in itinerary
app.put("/api/trips/:id/events/:eventId", (req, res) => {
  const { date, event } = req.body;
  const dbData = readDatabase();
  const trip = dbData.trips.find(t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ error: "Viagem não encontrada" });
  }

  const dayEvents = trip.itinerary[date];
  if (!dayEvents) {
    return res.status(404).json({ error: "Data do itinerário não encontrada" });
  }

  const idx = dayEvents.findIndex(e => e.id === req.params.eventId);
  if (idx === -1) {
    return res.status(404).json({ error: "Evento não encontrado" });
  }

  dayEvents[idx] = { ...dayEvents[idx], ...event };
  dayEvents.sort((a, b) => a.timeStart.localeCompare(b.timeStart));

  writeDatabase(dbData);
  res.json(trip);
});

// 10. Delete event from itinerary
app.delete("/api/trips/:id/events/:eventId", (req, res) => {
  const { date } = req.query;
  const dbData = readDatabase();
  const trip = dbData.trips.find(t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ error: "Viagem não encontrada" });
  }

  const dateStr = String(date);
  const dayEvents = trip.itinerary[dateStr];
  if (!dayEvents) {
    return res.status(404).json({ error: "Data do itinerário não encontrada" });
  }

  trip.itinerary[dateStr] = dayEvents.filter(e => e.id !== req.params.eventId);
  writeDatabase(dbData);
  res.json(trip);
});

// 11. Manage Expenses
app.post("/api/trips/:id/expenses", (req, res) => {
  const expenseData = req.body;
  const dbData = readDatabase();
  const trip = dbData.trips.find(t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ error: "Viagem não encontrada" });
  }

  const newExpense: Expense = {
    id: "exp-" + Date.now(),
    category: expenseData.category || "Outros",
    description: expenseData.description || "Despesa",
    amount: Number(expenseData.amount) || 0,
    date: expenseData.date || new Date().toISOString().split("T")[0],
    isPlanned: expenseData.isPlanned !== undefined ? expenseData.isPlanned : false,
    supplier: expenseData.supplier || ""
  };

  trip.expenses.push(newExpense);
  writeDatabase(dbData);
  res.status(201).json(trip);
});

app.put("/api/trips/:id/expenses/:expenseId", (req, res) => {
  const expenseData = req.body;
  const dbData = readDatabase();
  const trip = dbData.trips.find(t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ error: "Viagem não encontrada" });
  }

  const idx = trip.expenses.findIndex(e => e.id === req.params.expenseId);
  if (idx === -1) {
    return res.status(404).json({ error: "Despesa não encontrada" });
  }

  trip.expenses[idx] = {
    ...trip.expenses[idx],
    ...expenseData,
    amount: Number(expenseData.amount) || trip.expenses[idx].amount
  };

  writeDatabase(dbData);
  res.json(trip);
});

app.delete("/api/trips/:id/expenses/:expenseId", (req, res) => {
  const dbData = readDatabase();
  const trip = dbData.trips.find(t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ error: "Viagem não encontrada" });
  }

  trip.expenses = trip.expenses.filter(e => e.id !== req.params.expenseId);
  writeDatabase(dbData);
  res.json(trip);
});

// 12. Upload Document meta endpoint
app.post("/api/trips/:id/documents", (req, res) => {
  const docData = req.body;
  const dbData = readDatabase();
  const trip = dbData.trips.find(t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ error: "Viagem não encontrada" });
  }

  const newDoc = {
    id: "doc-" + Date.now(),
    name: docData.name || "documento.pdf",
    type: docData.type || "application/pdf",
    dateUploaded: new Date().toISOString().split("T")[0],
    size: docData.size || "150 KB",
    allowedForConsultor: docData.allowedForConsultor !== undefined ? docData.allowedForConsultor : true
  };

  trip.documents.push(newDoc);
  writeDatabase(dbData);
  res.status(201).json(trip);
});

app.delete("/api/trips/:id/documents/:docId", (req, res) => {
  const dbData = readDatabase();
  const trip = dbData.trips.find(t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ error: "Viagem não encontrada" });
  }

  trip.documents = trip.documents.filter(d => d.id !== req.params.docId);
  writeDatabase(dbData);
  res.json(trip);
});

// 13. Gemini API Endpoint: Rapid Expense Scan via OCR
app.post("/api/ocr", async (req, res) => {
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "Nenhuma imagem de fatura fornecida." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant simulation fallback when API key is missing
    console.log("No API Key: executing simulation OCR...");
    // Return structured OCR details
    const possibleSimulations = [
      { amount: 48.60, category: "Combustível", description: "Abastecimento Repsol Lousã", supplier: "Repsol", date: new Date().toISOString().split("T")[0] },
      { amount: 18.90, category: "Carregamentos", description: "Carregamento Rápido Cepsa", supplier: "Cepsa Electro", date: new Date().toISOString().split("T")[0] },
      { amount: 32.50, category: "Restaurantes", description: "Almoço Tasca do Pescador", supplier: "Tasca do Pescador", date: new Date().toISOString().split("T")[0] },
      { amount: 8.50, category: "Portagens", description: "Portagem Via Verde A2", supplier: "Via Verde", date: new Date().toISOString().split("T")[0] }
    ];
    const picked = possibleSimulations[Math.floor(Math.random() * possibleSimulations.length)];
    return res.json(picked);
  }

  try {
    // Base64 cleaning
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: cleanBase64
          }
        },
        "Analise esta fatura/recibo de despesa de viagem. Extraia e devolva APENAS um objeto JSON válido correspondente às informações estruturadas da despesa. Traduza para português se necessário.\n\n" +
        "O formato do JSON deve respeitar rigorosamente este modelo:\n" +
        "{\n" +
        "  \"amount\": 42.50, // número decimal correspondente ao total pago\n" +
        "  \"category\": \"Restaurantes\", // Categoria estrita. Deve ser uma das seguintes: 'Combustível', 'Carregamentos', 'Restaurantes', 'Alojamento', 'Rent-a-Car', 'Voos', 'Portagens', 'Compras', 'Entradas', 'Outros'\n" +
        "  \"description\": \"Jantar de Peixe\", // breve descrição da despesa\n" +
        "  \"supplier\": \"Nome do Restaurante/Empresa\", // nome do fornecedor/comerciante\n" +
        "  \"date\": \"2026-07-05\" // data no formato YYYY-MM-DD. Se não indicada, use a data atual.\n" +
        "}"
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "Total amount paid on the invoice" },
            category: { type: Type.STRING, description: "Category of the expense. Must be exactly one of: 'Combustível', 'Carregamentos', 'Restaurantes', 'Alojamento', 'Rent-a-Car', 'Voos', 'Portagens', 'Compras', 'Entradas', 'Outros'" },
            description: { type: Type.STRING, description: "Brief summary or item description" },
            supplier: { type: Type.STRING, description: "The business or restaurant name" },
            date: { type: Type.STRING, description: "The invoice date formatted as YYYY-MM-DD" }
          },
          required: ["amount", "category", "description", "supplier", "date"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini OCR extraction failed:", err);
    res.status(500).json({ error: "Falha na análise da fatura com Inteligência Artificial: " + err.message });
  }
});

// Helper for parsing draft itinerary free-text when API key is missing
function fallbackParseDraft(text: string): any[] {
  const events: any[] = [];
  const lines = text.split("\n");
  
  for (let line of lines) {
    let cleanedLine = line.trim();
    if (!cleanedLine) continue;
    
    // Look for times like 09:00, 09h00, 9h00, 13:00, 13h, etc.
    const timeRegex = /\b(\d{1,2})[h:](\d{2})?\b/;
    const match = cleanedLine.match(timeRegex);
    
    let timeStart = "10:00";
    let name = cleanedLine;
    
    if (match) {
      const hr = match[1].padStart(2, "0");
      const min = match[2] ? match[2].padStart(2, "0") : "00";
      timeStart = `${hr}:${min}`;
      
      // Clean up the name by removing the time string and common symbols
      name = cleanedLine.replace(match[0], "").replace(/^\s*[-–—:;.]+\s*/, "").trim();
    }
    
    // Guess category from keywords
    let category = "Atividade livre";
    const lowerLine = cleanedLine.toLowerCase();
    if (lowerLine.includes("almoço") || lowerLine.includes("jantar") || lowerLine.includes("restaurante") || lowerLine.includes("comer") || lowerLine.includes("tasca")) {
      category = "Restaurante";
    } else if (lowerLine.includes("praia") || lowerLine.includes("mar") || lowerLine.includes("areal") || lowerLine.includes("banho")) {
      category = "Praia";
    } else if (lowerLine.includes("hotel") || lowerLine.includes("check-in") || lowerLine.includes("alojamento") || lowerLine.includes("dormida") || lowerLine.includes("estadia")) {
      category = "Hotel";
    } else if (lowerLine.includes("viagem") || lowerLine.includes("partida") || lowerLine.includes("saída") || lowerLine.includes("deslocação") || lowerLine.includes("transfer") || lowerLine.includes("autoestrada")) {
      category = "Viagem / Na estrada";
    } else if (lowerLine.includes("visitar") || lowerLine.includes("museu") || lowerLine.includes("monumento") || lowerLine.includes("exposição") || lowerLine.includes("castelo") || lowerLine.includes("fortaleza")) {
      category = "Museu";
    } else if (lowerLine.includes("miradouro") || lowerLine.includes("vista") || lowerLine.includes("pôr do sol") || lowerLine.includes("falésia")) {
      category = "Miradouro";
    } else if (lowerLine.includes("caminhada") || lowerLine.includes("trilho") || lowerLine.includes("passeio") || lowerLine.includes("explorar")) {
      category = "Passeio";
    }
    
    // If the clean name is too short or empty, keep original line
    if (name.length < 3) {
      name = cleanedLine;
    }
    
    events.push({
      id: "evt-draft-" + Math.random().toString(36).substr(2, 9),
      timeStart,
      timeEnd: "",
      duration: "",
      name: name.substring(0, 50) + (name.length > 50 ? "..." : ""),
      description: `Ponto importado do rascunho: "${cleanedLine}"`,
      category,
      address: "",
      googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
      wazeLink: `https://waze.com/ul?q=${encodeURIComponent(name)}`,
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
      notes: "Importado via rascunho de programa."
    });
  }
  
  // Sort events by starting hour
  events.sort((a, b) => a.timeStart.localeCompare(b.timeStart));
  return events;
}

// 13b. Gemini API Endpoint: Parse Draft Text Itinerary
app.post("/api/trips/:id/parse-draft", async (req, res) => {
  const { draftText } = req.body;
  if (!draftText) {
    return res.status(400).json({ error: "Nenhum texto de rascunho fornecido." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.log("No API Key: executing simulation draft parser...");
    const parsedEvents = fallbackParseDraft(draftText);
    return res.json({ events: parsedEvents });
  }

  try {
    const prompt = `Analise o seguinte rascunho de programa de viagem e extraia as atividades/eventos estruturados com as respetivas horas mencionadas.
    
    RASCUNHO DO PROGRAMA:
    """
    ${draftText}
    """

    Extraia e devolva APENAS uma lista de objetos JSON válidos para cada atividade encontrada. Se a atividade não mencionar hora de início, estime ou atribua uma hora padrão adequada ao fluxo do dia (ex: início da manhã às 09:00, almoço às 13:00, tarde às 15:00).
    Atribua uma categoria adequada de acordo com o tipo de atividade. As únicas categorias permitidas são:
    - 'Atividade livre'
    - 'Restaurante'
    - 'Praia'
    - 'Hotel'
    - 'Passeio'
    - 'Miradouro'
    - 'Museu'
    - 'Viagem / Na estrada'
    - 'Outro'

    O resultado deve ser EXCLUSIVAMENTE um objeto JSON estruturado neste formato de exemplo:
    {
      "events": [
        {
          "timeStart": "09:00", // hora de início no formato HH:MM (obrigatório)
          "timeEnd": "10:30", // hora de fim no formato HH:MM (opcional, pode ser vazio)
          "duration": "1h 30m", // duração estimada (opcional, pode ser vazio)
          "name": "Partida de Lisboa", // nome curto e descritivo da atividade (obrigatório)
          "description": "Início da road trip...", // descrição ou resumo dos detalhes associados no texto (obrigatório)
          "category": "Atividade livre", // categoria selecionada estritamente da lista indicada (obrigatório)
          "address": "Lisboa", // morada, local ou ponto de interesse se indicado no texto (opcional, se não houver use vazio)
          "notes": "" // notas adicionais se houver (opcional)
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeStart: { type: Type.STRING },
                  timeEnd: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  address: { type: Type.STRING },
                  notes: { type: Type.STRING }
                },
                required: ["timeStart", "name", "description", "category"]
              }
            }
          },
          required: ["events"]
        }
      }
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    
    // Fill in default properties for missing ones
    const finalEvents = (parsedResponse.events || []).map((evt: any) => ({
      id: "evt-draft-" + Math.random().toString(36).substr(2, 9),
      timeStart: evt.timeStart || "10:00",
      timeEnd: evt.timeEnd || "",
      duration: evt.duration || "",
      name: evt.name || "Evento Importado",
      description: evt.description || "Importado de rascunho",
      category: evt.category || "Atividade livre",
      address: evt.address || "",
      googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.address || evt.name || "Portugal")}`,
      wazeLink: `https://waze.com/ul?q=${encodeURIComponent(evt.address || evt.name || "Portugal")}`,
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
      notes: evt.notes || "Importado via Assistente Inteligente."
    }));

    res.json({ events: finalEvents });
  } catch (err: any) {
    console.error("Gemini draft parsing failed, using regex fallback:", err);
    try {
      const parsedEvents = fallbackParseDraft(draftText);
      res.json({ events: parsedEvents });
    } catch (fallbackErr) {
      res.status(500).json({ error: "Falha ao processar rascunho com IA e falha no processador alternativo." });
    }
  }
});

// 13c. Lookup Plate Auto-Fill (AutoDoc style) with smart era analysis and Google Search Grounding
function getSmartFallbackCar(cleanedPlate: string): { name: string; type: string; autonomyRange: number } {
  const isLetters = (char: string) => /[A-Z]/.test(char);
  const isNumbers = (char: string) => /[0-9]/.test(char);

  const absoluteDefault = { name: "Renault Clio 1.5 dCi", type: "diesel", autonomyRange: 850 };

  if (cleanedPlate.length !== 6) {
    return absoluteDefault;
  }

  const p = cleanedPlate.split("");

  // AA-00-00 (1937–1992)
  if (isLetters(p[0]) && isLetters(p[1]) && isNumbers(p[2]) && isNumbers(p[3]) && isNumbers(p[4]) && isNumbers(p[5])) {
    const classics = [
      { name: "Opel Corsa A 1.2 (1989)", type: "gasoline", autonomyRange: 550 },
      { name: "Renault 5 GTL (1985)", type: "gasoline", autonomyRange: 500 },
      { name: "Peugeot 205 GL (1988)", type: "gasoline", autonomyRange: 520 },
      { name: "Volkswagen Golf II 1.6 D (1987)", type: "diesel", autonomyRange: 800 }
    ];
    let hash = 0;
    for (let i = 0; i < cleanedPlate.length; i++) hash = (hash << 5) - hash + cleanedPlate.charCodeAt(i);
    return classics[Math.abs(hash) % classics.length];
  }

  // 00-AA-00 (1992–2005)
  if (isNumbers(p[0]) && isNumbers(p[1]) && isLetters(p[2]) && isLetters(p[3]) && isNumbers(p[4]) && isNumbers(p[5])) {
    const olderCars = [
      { name: "Renault Clio II 1.2 (1999)", type: "gasoline", autonomyRange: 600 },
      { name: "Peugeot 206 1.4 HDi (2002)", type: "diesel", autonomyRange: 900 },
      { name: "Opel Corsa B 1.0 (1997)", type: "gasoline", autonomyRange: 580 },
      { name: "Volkswagen Golf IV 1.9 TDI (2001)", type: "diesel", autonomyRange: 1050 },
      { name: "Seat Ibiza 1.9 TDI (2003)", type: "diesel", autonomyRange: 980 }
    ];
    let hash = 0;
    for (let i = 0; i < cleanedPlate.length; i++) hash = (hash << 5) - hash + cleanedPlate.charCodeAt(i);
    return olderCars[Math.abs(hash) % olderCars.length];
  }

  // 00-00-AA (2005–2020)
  if (isNumbers(p[0]) && isNumbers(p[1]) && isNumbers(p[2]) && isNumbers(p[3]) && isLetters(p[4]) && isLetters(p[5])) {
    const midCars = [
      { name: "Renault Megane III 1.5 dCi (2012)", type: "diesel", autonomyRange: 950 },
      { name: "Peugeot 308 1.6 BlueHDi (2015)", type: "diesel", autonomyRange: 1100 },
      { name: "Volkswagen Golf VII 1.6 TDI (2014)", type: "diesel", autonomyRange: 1000 },
      { name: "Toyota Auris Hybrid (2016)", type: "hybrid", autonomyRange: 800 },
      { name: "BMW 116d (2013)", type: "diesel", autonomyRange: 1050 },
      { name: "Nissan Leaf 40kWh (2018)", type: "electric", autonomyRange: 270 }
    ];
    let hash = 0;
    for (let i = 0; i < cleanedPlate.length; i++) hash = (hash << 5) - hash + cleanedPlate.charCodeAt(i);
    return midCars[Math.abs(hash) % midCars.length];
  }

  // AA-00-AA (2020–present)
  if (isLetters(p[0]) && isLetters(p[1]) && isNumbers(p[2]) && isNumbers(p[3]) && isLetters(p[4]) && isLetters(p[5])) {
    if (cleanedPlate.includes("EV") || cleanedPlate.startsWith("EV")) {
      const electrics = [
        { name: "Tesla Model 3 RWD (2023)", type: "electric", autonomyRange: 491 },
        { name: "Tesla Model Y RWD (2022)", type: "electric", autonomyRange: 455 },
        { name: "Renault Zoe ZE50 (2021)", type: "electric", autonomyRange: 385 },
        { name: "Dacia Spring (2022)", type: "electric", autonomyRange: 230 }
      ];
      let hash = 0;
      for (let i = 0; i < cleanedPlate.length; i++) hash = (hash << 5) - hash + cleanedPlate.charCodeAt(i);
      return electrics[Math.abs(hash) % electrics.length];
    }
    const modernCars = [
      { name: "Peugeot 2008 1.2 PureTech (2022)", type: "gasoline", autonomyRange: 650 },
      { name: "Renault Clio E-Tech Hybrid (2021)", type: "hybrid", autonomyRange: 820 },
      { name: "Tesla Model 3 RWD (2023)", type: "electric", autonomyRange: 491 },
      { name: "Dacia Sandero Stepway TCe (2022)", type: "gasoline", autonomyRange: 700 },
      { name: "BMW i4 eDrive40 (2022)", type: "electric", autonomyRange: 590 },
      { name: "Toyota Yaris Hybrid (2021)", type: "hybrid", autonomyRange: 750 }
    ];
    let hash = 0;
    for (let i = 0; i < cleanedPlate.length; i++) hash = (hash << 5) - hash + cleanedPlate.charCodeAt(i);
    return modernCars[Math.abs(hash) % modernCars.length];
  }

  return absoluteDefault;
}

// Rich Local Cars Database for Portuguese popular models
const LOCAL_CARS_DATABASE = [
  // SEAT Leon
  { name: "SEAT Leon 1.6 TDI (2018)", type: "diesel", autonomyRange: 950 },
  { name: "SEAT Leon 2.0 TDI (2020)", type: "diesel", autonomyRange: 1050 },
  { name: "SEAT Leon 1.5 TSI (2019)", type: "gasoline", autonomyRange: 720 },
  { name: "SEAT Leon 1.4 e-Hybrid (2021)", type: "hybrid", autonomyRange: 800 },
  { name: "SEAT Leon 1.0 TSI (2017)", type: "gasoline", autonomyRange: 750 },
  
  // SEAT Ibiza
  { name: "SEAT Ibiza 1.0 TSI (2019)", type: "gasoline", autonomyRange: 700 },
  { name: "SEAT Ibiza 1.6 TDI (2018)", type: "diesel", autonomyRange: 920 },
  { name: "SEAT Ibiza 1.2 TSI (2015)", type: "gasoline", autonomyRange: 680 },

  // Tesla
  { name: "Tesla Model 3 RWD (2023)", type: "electric", autonomyRange: 491 },
  { name: "Tesla Model 3 Long Range (2023)", type: "electric", autonomyRange: 602 },
  { name: "Tesla Model Y RWD (2023)", type: "electric", autonomyRange: 455 },
  { name: "Tesla Model Y Long Range (2023)", type: "electric", autonomyRange: 533 },

  // Peugeot 208 & 2008
  { name: "Peugeot 208 1.2 PureTech (2021)", type: "gasoline", autonomyRange: 680 },
  { name: "Peugeot 208 1.5 BlueHDi (2020)", type: "diesel", autonomyRange: 980 },
  { name: "Peugeot e-208 GT (50kWh) (2021)", type: "electric", autonomyRange: 340 },
  { name: "Peugeot 2008 1.2 PureTech (2022)", type: "gasoline", autonomyRange: 650 },
  { name: "Peugeot 2008 1.5 BlueHDi (2021)", type: "diesel", autonomyRange: 950 },
  { name: "Peugeot e-2008 (50kWh) (2022)", type: "electric", autonomyRange: 320 },

  // Renault Clio & Megane
  { name: "Renault Clio 1.5 dCi (2018)", type: "diesel", autonomyRange: 880 },
  { name: "Renault Clio 1.0 TCe (2020)", type: "gasoline", autonomyRange: 720 },
  { name: "Renault Clio E-Tech Hybrid (2021)", type: "hybrid", autonomyRange: 820 },
  { name: "Renault Megane III 1.5 dCi (2012)", type: "diesel", autonomyRange: 950 },
  { name: "Renault Megane IV 1.5 dCi (2018)", type: "diesel", autonomyRange: 1000 },
  { name: "Renault Megane E-Tech EV60 (2022)", type: "electric", autonomyRange: 450 },
  { name: "Renault Zoe ZE50 (2021)", type: "electric", autonomyRange: 385 },

  // VW Golf
  { name: "Volkswagen Golf VII 1.6 TDI (2015)", type: "diesel", autonomyRange: 1000 },
  { name: "Volkswagen Golf VII 2.0 TDI (2016)", type: "diesel", autonomyRange: 1100 },
  { name: "Volkswagen Golf VIII 1.5 eTSI (2020)", type: "hybrid", autonomyRange: 780 },
  { name: "Volkswagen Golf VIII GTE (2021)", type: "hybrid", autonomyRange: 800 },
  { name: "Volkswagen Golf VII 1.0 TSI (2017)", type: "gasoline", autonomyRange: 740 },

  // BMW
  { name: "BMW 320d Sedan (2016)", type: "diesel", autonomyRange: 1150 },
  { name: "BMW 116d 5p (2017)", type: "diesel", autonomyRange: 1020 },
  { name: "BMW i4 eDrive40 (2022)", type: "electric", autonomyRange: 590 },
  { name: "BMW 330e iPerformance (2018)", type: "hybrid", autonomyRange: 700 },

  // Others
  { name: "Toyota Yaris Hybrid (2021)", type: "hybrid", autonomyRange: 750 },
  { name: "Toyota Corolla Touring Sports Hybrid (2020)", type: "hybrid", autonomyRange: 820 },
  { name: "Nissan Leaf 40kWh (2018)", type: "electric", autonomyRange: 270 },
  { name: "Nissan Leaf 62kWh e+ (2020)", type: "electric", autonomyRange: 385 },
  { name: "Fiat 500 1.0 GSE Hybrid (2021)", type: "hybrid", autonomyRange: 600 },
  { name: "Fiat 500e Electric (2021)", type: "electric", autonomyRange: 320 },
  { name: "Dacia Spring Extreme (2023)", type: "electric", autonomyRange: 230 },
  { name: "Dacia Sandero Stepway TCe 90 (2021)", type: "gasoline", autonomyRange: 700 },
  { name: "Dacia Sandero ECO-G (GPL) (2022)", type: "hybrid", autonomyRange: 900 },
  { name: "Opel Corsa 1.2 Turbo (2021)", type: "gasoline", autonomyRange: 680 },
  { name: "Opel Corsa 1.5 Turbo D (2020)", type: "diesel", autonomyRange: 940 },
  { name: "Citroën C3 1.2 PureTech (2020)", type: "gasoline", autonomyRange: 650 },
  { name: "Hyundai Kauai EV 64kWh (2021)", type: "electric", autonomyRange: 484 }
];

function getSmartFallbackOptions(query: string): Array<{ name: string; type: string; autonomyRange: number }> {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return [];

  const queryWords = cleanQuery.split(/\s+/);
  // Match where all words in query are present in the name
  let matches = LOCAL_CARS_DATABASE.filter(car => {
    return queryWords.every(word => car.name.toLowerCase().includes(word));
  });

  // If no matches, match if ANY word matches
  if (matches.length === 0) {
    matches = LOCAL_CARS_DATABASE.filter(car => {
      return queryWords.some(word => car.name.toLowerCase().includes(word));
    });
  }

  if (matches.length > 0) {
    return matches.slice(0, 5);
  }

  // Absolute fallback
  return [
    { name: `${query} 1.0 Gasolina`, type: "gasoline", autonomyRange: 650 },
    { name: `${query} 1.6 Diesel`, type: "diesel", autonomyRange: 950 },
    { name: `${query} Plug-in Híbrido`, type: "hybrid", autonomyRange: 800 }
  ];
}

function getSmartFallbackPlateOptions(cleanedPlate: string): Array<{ name: string; type: string; autonomyRange: number }> {
  const isLetters = (char: string) => /[A-Z]/.test(char);
  const isNumbers = (char: string) => /[0-9]/.test(char);

  const absoluteDefault = [
    { name: "Renault Clio 1.5 dCi (2018)", type: "diesel", autonomyRange: 880 },
    { name: "Peugeot 2008 1.2 PureTech (2021)", type: "gasoline", autonomyRange: 650 },
    { name: "Tesla Model 3 RWD (2022)", type: "electric", autonomyRange: 491 }
  ];

  if (cleanedPlate.length !== 6) {
    return absoluteDefault;
  }

  const p = cleanedPlate.split("");

  // AA-00-00 (1937–1992)
  if (isLetters(p[0]) && isLetters(p[1]) && isNumbers(p[2]) && isNumbers(p[3]) && isNumbers(p[4]) && isNumbers(p[5])) {
    return [
      { name: "Opel Corsa A 1.2 (1989)", type: "gasoline", autonomyRange: 550 },
      { name: "Renault 5 GTL (1985)", type: "gasoline", autonomyRange: 500 },
      { name: "Peugeot 205 GL (1988)", type: "gasoline", autonomyRange: 520 },
      { name: "Volkswagen Golf II 1.6 D (1987)", type: "diesel", autonomyRange: 800 }
    ];
  }

  // 00-AA-00 (1992–2005)
  if (isNumbers(p[0]) && isNumbers(p[1]) && isLetters(p[2]) && isLetters(p[3]) && isNumbers(p[4]) && isNumbers(p[5])) {
    return [
      { name: "Renault Clio II 1.2 (1999)", type: "gasoline", autonomyRange: 600 },
      { name: "Peugeot 206 1.4 HDi (2002)", type: "diesel", autonomyRange: 900 },
      { name: "Opel Corsa B 1.0 (1997)", type: "gasoline", autonomyRange: 580 },
      { name: "Volkswagen Golf IV 1.9 TDI (2001)", type: "diesel", autonomyRange: 1050 },
      { name: "Seat Ibiza 1.9 TDI (2003)", type: "diesel", autonomyRange: 980 }
    ];
  }

  // 00-00-AA (2005–2020)
  if (isNumbers(p[0]) && isNumbers(p[1]) && isNumbers(p[2]) && isNumbers(p[3]) && isLetters(p[4]) && isLetters(p[5])) {
    return [
      { name: "Renault Megane III 1.5 dCi (2012)", type: "diesel", autonomyRange: 950 },
      { name: "Peugeot 308 1.6 BlueHDi (2015)", type: "diesel", autonomyRange: 1100 },
      { name: "Volkswagen Golf VII 1.6 TDI (2014)", type: "diesel", autonomyRange: 1000 },
      { name: "Toyota Auris Hybrid (2016)", type: "hybrid", autonomyRange: 800 },
      { name: "Nissan Leaf 40kWh (2018)", type: "electric", autonomyRange: 270 }
    ];
  }

  // AA-00-AA (2020–present)
  if (isLetters(p[0]) && isLetters(p[1]) && isNumbers(p[2]) && isNumbers(p[3]) && isLetters(p[4]) && isLetters(p[5])) {
    if (cleanedPlate.includes("EV") || cleanedPlate.startsWith("EV")) {
      return [
        { name: "Tesla Model 3 RWD (2023)", type: "electric", autonomyRange: 491 },
        { name: "Tesla Model Y RWD (2022)", type: "electric", autonomyRange: 455 },
        { name: "Renault Zoe ZE50 (2021)", type: "electric", autonomyRange: 385 },
        { name: "Dacia Spring (2022)", type: "electric", autonomyRange: 230 }
      ];
    }
    return [
      { name: "Peugeot 2008 1.2 PureTech (2022)", type: "gasoline", autonomyRange: 650 },
      { name: "Renault Clio E-Tech Hybrid (2021)", type: "hybrid", autonomyRange: 820 },
      { name: "Tesla Model 3 RWD (2023)", type: "electric", autonomyRange: 491 },
      { name: "Dacia Sandero Stepway TCe (2022)", type: "gasoline", autonomyRange: 700 },
      { name: "BMW i4 eDrive40 (2022)", type: "electric", autonomyRange: 590 },
      { name: "Toyota Yaris Hybrid (2021)", type: "hybrid", autonomyRange: 750 }
    ];
  }

  return absoluteDefault;
}

app.post("/api/lookup-plate", async (req, res) => {
  const { plate } = req.body;
  if (!plate) {
    return res.status(400).json({ error: "Nenhuma matrícula fornecida." });
  }

  const cleaned = plate.replace(/[^A-Z0-9]/g, "").toUpperCase();
  if (cleaned.length < 4) {
    return res.status(400).json({ error: "Matrícula inválida. Deve conter pelo menos 4 caracteres." });
  }

  const commonPlates: Record<string, { name: string; type: string; autonomyRange: number }> = {
    "00-EV-00": { name: "Tesla Model Y Long Range", type: "electric", autonomyRange: 533 },
    "11-EV-22": { name: "Tesla Model 3 Highland", type: "electric", autonomyRange: 513 },
    "44-TD-22": { name: "Renault Megane E-Tech", type: "electric", autonomyRange: 450 },
    "99-AA-99": { name: "Mercedes-Benz A200 d", type: "diesel", autonomyRange: 920 },
    "AB-12-CD": { name: "BMW i4 eDrive40", type: "electric", autonomyRange: 590 },
    "12-BC-34": { name: "Peugeot 208 1.2 PureTech", type: "gasoline", autonomyRange: 650 },
    "50-XY-50": { name: "Toyota RAV4 Hybrid", type: "hybrid", autonomyRange: 820 },
    "AA-99-XX": { name: "Porsche Taycan 4S", type: "electric", autonomyRange: 480 },
    "60-ZZ-90": { name: "Volvo XC40 Recharge EV", type: "electric", autonomyRange: 425 },
    "01-AA-01": { name: "Dacia Spring", type: "electric", autonomyRange: 230 }
  };

  const formattedPlate = cleaned.match(/.{1,2}/g)?.join("-") || cleaned;
  if (commonPlates[formattedPlate]) {
    const matched = commonPlates[formattedPlate];
    return res.json({
      ...matched,
      options: [matched]
    });
  }

  const fallbackOptions = getSmartFallbackPlateOptions(cleaned);
  const fallbackCar = fallbackOptions[0];

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      ...fallbackCar,
      options: fallbackOptions
    });
  }

  try {
    const prompt = `Considere que é um sistema integrado de bases de dados automóveis em Portugal (tipo AutoDoc/Matrículas.pt).
    O utilizador introduziu a matrícula portuguesa: ${formattedPlate}.

    Gere uma lista de 3 a 5 opções de veículos realistas que correspondem a esta matrícula ou à sua época.
    Por exemplo, se a matrícula for da época de 1992-2005, use modelos populares dessa época como Peugeot 206, Renault Clio II, Golf IV, etc.
    Para cada opção, indique o nome completo com motorização, tipo de motor ("electric", "gasoline", "diesel", "hybrid") e a autonomia combinada real em km.

    Responda EXCLUSIVAMENTE com um JSON neste formato:
    {
      "options": [
        {
          "name": "Marca Modelo Versão (Ano)",
          "type": "electric" | "gasoline" | "diesel" | "hybrid",
          "autonomyRange": number
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  autonomyRange: { type: Type.INTEGER }
                },
                required: ["name", "type", "autonomyRange"]
              }
            }
          },
          required: ["options"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    if (parsed && Array.isArray(parsed.options) && parsed.options.length > 0) {
      return res.json({
        ...parsed.options[0],
        options: parsed.options
      });
    }
    return res.json({
      ...fallbackCar,
      options: fallbackOptions
    });
  } catch (err) {
    console.error("Gemini plate lookup failed, using fallback:", err);
    return res.json({
      ...fallbackCar,
      options: fallbackOptions
    });
  }
});

// 13d. Lookup Model Auto-Fill (Search by Model name when plate doesn't exist)
app.post("/api/lookup-model", async (req, res) => {
  const { model } = req.body;
  if (!model) {
    return res.status(400).json({ error: "Nenhum modelo de veículo fornecido." });
  }

  const fallbackOptions = getSmartFallbackOptions(model);
  const fallbackCar = fallbackOptions[0];

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      ...fallbackCar,
      options: fallbackOptions
    });
  }

  try {
    const prompt = `Identifique as especificações técnicas e versões reais do modelo de veículo fornecido: "${model}".
    Gere de 3 a 5 opções das versões reais mais populares para este modelo em Portugal (ex: diferentes motorizações como Diesel, Gasolina, Híbrido, Elétrico).
    Para cada versão, indique o nome completo com a motorização, o tipo de combustível ("electric", "gasoline", "diesel", "hybrid") e a autonomia combinada real em km (depósito cheio ou bateria a 100%).

    Responda EXCLUSIVAMENTE com um JSON neste formato:
    {
      "options": [
        {
          "name": "Marca Modelo Versão (Ano)",
          "type": "electric" | "gasoline" | "diesel" | "hybrid",
          "autonomyRange": number
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  autonomyRange: { type: Type.INTEGER }
                },
                required: ["name", "type", "autonomyRange"]
              }
            }
          },
          required: ["options"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    if (parsed && Array.isArray(parsed.options) && parsed.options.length > 0) {
      return res.json({
        ...parsed.options[0],
        options: parsed.options
      });
    }
    return res.json({
      ...fallbackCar,
      options: fallbackOptions
    });
  } catch (err) {
    console.error("Gemini model lookup failed, using fallback:", err);
    return res.json({
      ...fallbackCar,
      options: fallbackOptions
    });
  }
});

// 14. Gemini API Endpoint: Smart Fuel/Charge Planner recommendations
app.post("/api/recommendations", async (req, res) => {
  const { tripId, currentAutonomy, limitThreshold, batteryPercent, fuelPercent, date } = req.body;

  const dbData = readDatabase();
  const trip = dbData.trips.find(t => t.id === tripId);
  if (!trip) {
    return res.status(404).json({ error: "Viagem não encontrada" });
  }

  const vehicle = trip.vehicle;
  if (!vehicle) {
    return res.status(400).json({ error: "Esta viagem não tem um veículo associado." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.log("No API Key: executing simulation vehicle planner...");
    // Fallback response with beautiful logical suggestions based on vehicle type
    const simulatedResponse = {
      needsRecharge: true,
      alertMessage: `Atenção: A autonomia atual (${currentAutonomy} km) está próxima ou abaixo do limite de segurança recomendado!`,
      recommendations: [] as any[]
    };

    if (vehicle.type === "electric") {
      simulatedResponse.recommendations = [
        {
          id: "rec-1",
          name: "Posto Ultra-Rápido Ionity Aljustrel",
          distance: "22 km",
          deviationTime: "3 min",
          power: "350 kW DC",
          chargingTime: "18 min (até 80%)",
          description: "Localizado na área de serviço da A2. Excelente potência para o seu Tesla, minimizando a paragem."
        },
        {
          id: "rec-2",
          name: "Supercharger Tesla Loulé",
          distance: "45 km",
          deviationTime: "6 min",
          power: "250 kW DC",
          chargingTime: "15 min (até 80%)",
          description: "Próximo ao Mar Shopping. Perfeito para uma paragem rápida, compras e um café."
        }
      ];
    } else {
      simulatedResponse.recommendations = [
        {
          id: "rec-1",
          name: "Posto Galp Sines",
          distance: "14 km",
          deviationTime: "1 min",
          power: "Gasóleo / Gasolina",
          chargingTime: "5 min",
          description: "Fácil acesso na estrada nacional secundária, preços competitivos com cartão de desconto."
        },
        {
          id: "rec-2",
          name: "Área de Serviço Repsol Grândola",
          distance: "32 km",
          deviationTime: "0 min",
          power: "Gasóleo / Gasolina",
          chargingTime: "5 min",
          description: "Localizado diretamente no seu percurso. Conveniência total com área de restauração completa."
        }
      ];
    }

    return res.json(simulatedResponse);
  }

  try {
    const itineraryDay = trip.itinerary[date] || [];
    const itineraryStr = itineraryDay.map(e => `- ${e.timeStart}: ${e.name} (${e.address || "Sem morada"})`).join("\n");

    const prompt = `Analise os dados do veículo e da road trip para fornecer recomendações inteligentes de abastecimento ou carregamento eléctrico.
    
    DADOS DO VEÍCULO:
    - Nome: ${vehicle.name}
    - Tipo: ${vehicle.type} (elétrico, diesel, gasolina ou híbrido)
    - Autonomia total com depósito/bateria cheio: ${vehicle.autonomyRange} km
    - Autonomia atual indicada pelo veículo: ${currentAutonomy} km
    - Percentagem atual: ${batteryPercent || fuelPercent || 50}%
    - Limite de segurança de autonomia padrão configurado: ${limitThreshold || 30}% (recomendar sempre se estiver próximo ou abaixo disto)

    ITINERÁRIO DO DIA (${date}):
    ${itineraryStr || "Nenhum evento agendado para hoje ainda."}

    Destino final da viagem: ${trip.destination}

    Analise as necessidades. Se a autonomia restante for perigosa ou insuficiente para completar o dia confortavelmente, recomende 2 locais ideais de carregamento (se elétrico) ou postos de combustível (se combustão/híbrido) próximos do trajeto, preferindo postos ultra-rápidos e locais de permanência longa (restaurantes ou shoppings previstos no itinerário).

    O resultado deve ser EXCLUSIVAMENTE um objeto JSON estruturado neste formato de exemplo:
    {
      "needsRecharge": true, // booleano se precisa ou não carregar/abastecer
      "alertMessage": "Sua bateria de 25% está próxima do limite de segurança (30%)...", // mensagem de alerta em português
      "recommendations": [
        {
          "id": "rec-uuid",
          "name": "Nome do Posto ou Carregador",
          "distance": "15 km", // distância aproximada
          "deviationTime": "2 min", // desvio necessário
          "power": "150 kW DC ou Gasóleo simples", // potência do carregador ou tipos de combustível
          "chargingTime": "20 min", // tempo estimado de paragem
          "description": "Explicação breve de porque este posto foi selecionado (ex: coincide com o almoço programado)"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            needsRecharge: { type: Type.BOOLEAN, description: "Whether the vehicle requires refueling or charging soon" },
            alertMessage: { type: Type.STRING, description: "Localized notification or warning alert text" },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  distance: { type: Type.STRING },
                  deviationTime: { type: Type.STRING },
                  power: { type: Type.STRING },
                  chargingTime: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["id", "name", "distance", "deviationTime", "power", "chargingTime", "description"]
              }
            }
          },
          required: ["needsRecharge", "alertMessage", "recommendations"]
        }
      }
    });

    const recommendationResult = JSON.parse(response.text || "{}");
    res.json(recommendationResult);
  } catch (err: any) {
    console.error("Gemini smart recommendations failed:", err);
    res.status(500).json({ error: "Falha na análise inteligente de autonomia: " + err.message });
  }
});

// Setup Vite & Frontend static routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      maxAge: "1d",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
