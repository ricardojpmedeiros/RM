export type UserRole = "Planeador" | "Consultor";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pin?: string;
}

export interface Event {
  id: string;
  timeStart: string;
  timeEnd?: string;
  duration?: string;
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
  transportType?: string;
  transportCost?: number;
  transportError?: string | null;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  isPlanned: boolean; // true = prevista, false = real
  supplier?: string;
  invoiceUrl?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  fileUrl?: string;
  dateUploaded: string;
  size?: string;
  allowedForConsultor: boolean;
}

export interface Vehicle {
  id: string;
  name: string;
  type: "electric" | "gasoline" | "diesel" | "hybrid";
  autonomyRange: number; // in km
  limitThreshold?: number; // threshold percent (default 30)
  currentAutonomy?: number; // km remaining indicated by the vehicle
  batteryPercent?: number; // e.g. 80%
  fuelPercent?: number; // e.g. 80%
}

export interface Accommodation {
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  price: number;
}

export interface Flight {
  flightNo: string;
  airline: string;
  departure: string;
  arrival: string;
  date: string;
  passengers: number;
  pricePerPassenger: number;
  totalPrice: number;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  status: "active" | "archived";
  vehicle: Vehicle | null;
  accommodation: Accommodation | null;
  flights: Flight[];
  documents: Document[];
  itinerary: {
    [date: string]: Event[];
  };
  expenses: Expense[];
  participants: UserProfile[];
  homeAddress?: string;
  accommodationAddress?: string;
  accommodationMapLink?: string;
  accommodationName?: string;
  accommodationContact?: string;
}

export interface SmartRecommendation {
  needsRecharge: boolean;
  alertMessage: string;
  recommendations: {
    id: string;
    name: string;
    distance: string;
    deviationTime: string;
    power: string;
    chargingTime: string;
    description: string;
  }[];
}
