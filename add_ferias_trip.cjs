const fs = require("fs");
const path = require("path");

const dbFile = path.join(process.cwd(), "db.json");
let db = { trips: [] };
if (fs.existsSync(dbFile)) {
  try {
    db = JSON.parse(fs.readFileSync(dbFile, "utf8"));
  } catch (e) {
    db = { trips: [] };
  }
}

const newTrip = {
  id: "trip-ferias-2026",
  name: "Férias 2026 🌴",
  destination: "Açores → Porto & Norte de Portugal",
  startDate: "2026-07-31",
  endDate: "2026-08-07",
  description: "Programa completo de férias com voo de Ponta Delgada para o Porto, levantamento de carro na Centauro, almoço na Maia, compras no Parque Nascente, alojamento na Corujeira, passeio no Gaia Park e jantar no Temple d'Ouro.",
  status: "active",
  homeAddress: "Ponta Delgada, Açores",
  accommodationAddress: "Rua Central da Corujeira 72, Porto, 4300-111 Campanhã",
  accommodationMapLink: "https://www.google.com/maps/search/?api=1&query=Rua+Central+da+Corujeira+72+Porto",
  accommodationName: "Casa da Corujeira - Campanhã",
  accommodationContact: "+351 910 000 000",
  vehicle: {
    id: "ev-centauro-peugeot",
    name: "Peugeot e-208 / EV Centauro",
    type: "electric",
    autonomyRange: 350,
    limitThreshold: 20,
    currentAutonomy: 300,
    batteryPercent: 85
  },
  accommodation: {
    name: "Alojamento Corujeira",
    address: "Rua Central da Corujeira 72, Porto",
    checkIn: "2026-07-31",
    checkOut: "2026-08-07",
    price: 520
  },
  flights: [
    {
      id: "flight-pdl-opo-2026",
      flightNumber: "S4 120 / TP 1862",
      airline: "SATA / TAP Air Portugal",
      origin: "Ponta Delgada (PDL)",
      destination: "Porto (OPO)",
      departureTime: "2026-07-31T08:20:00",
      arrivalTime: "2026-07-31T11:40:00",
      gateCloseTime: "07:45",
      price: 145
    }
  ],
  documents: [],
  expenses: [
    {
      id: "exp-centauro-car",
      category: "Rent-a-Car",
      description: "Aluguer de Carro Centauro Rent-a-Car",
      amount: 210,
      date: "2026-07-31",
      isPlanned: true,
      supplier: "Centauro Porto"
    },
    {
      id: "exp-temple-douro",
      category: "Restaurantes",
      description: "Jantar no Restaurante Temple d’Ouro (Gaia)",
      amount: 75,
      date: "2026-07-31",
      isPlanned: true,
      supplier: "Temple d’Ouro"
    }
  ],
  participants: [
    {
      id: "user-ricardo",
      name: "Ricardo Medeiros",
      email: "ricardojpmedeiros@gmail.com",
      role: "Planeador"
    }
  ],
  itinerary: {
    "2026-07-31": [
      {
        id: "ev-f26-1",
        timeStart: "06:20",
        timeEnd: "06:40",
        name: "Saída de Casa para o Aeroporto",
        description: "Saída de casa às 06:20 (máximo) rumo ao Aeroporto de Ponta Delgada. Chegada prevista ao aeroporto às 06:40.",
        category: "Viagem / Na estrada",
        address: "Ponta Delgada, Açores",
        coordinates: { lat: 37.7412, lng: -25.6679 },
        googleMapsLink: "https://maps.app.goo.gl/74tEXRd9h89GzYSt5",
        wazeLink: "https://waze.com/ul?q=Aeroporto+Ponta+Delgada",
        image: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=800&q=80",
        notes: "Garantir bagagem e documentos prontos na véspera."
      },
      {
        id: "ev-f26-2",
        timeStart: "07:45",
        timeEnd: "11:40",
        duration: "2h 20m",
        name: "Voo PDL → Porto (SATA / TAP)",
        description: "Fecho da porta de embarque às 07:45H. Partida de Ponta Delgada às 08:20H e chegada ao Aeroporto do Porto às 11:40H (fuso horário do continente +1h). Recolha de bagagens nas Chegadas.",
        category: "Viagem / Na estrada",
        address: "Aeroporto Francisco Sá Carneiro, Porto",
        coordinates: { lat: 41.2424, lng: -8.6786 },
        googleMapsLink: "https://maps.app.goo.gl/74tEXRd9h89GzYSt5",
        wazeLink: "https://waze.com/ul?q=Aeroporto+do+Porto",
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
        notes: "Fecho da porta: 07:45H | Partida: 08:20H | Chegada: 11:40H. Duração do voo: 2h20m."
      },
      {
        id: "ev-f26-3",
        timeStart: "11:40",
        timeEnd: "12:15",
        name: "Transfer e Levantamento de Carro na Centauro",
        description: "Recolha de bagagem e apanhar transfer das chegadas para a Centauro Rent-a-Car. Transfer: 3 min, 1 km. Levantamento do carro na rent-a-car.",
        category: "Rent-a-Car",
        address: "Centauro Rent a Car Porto Airport, Maia",
        coordinates: { lat: 41.2380, lng: -8.6710 },
        googleMapsLink: "https://maps.app.goo.gl/BG9CZZQZhxUo4ESc9",
        wazeLink: "https://waze.com/ul?q=Centauro+Rent+a+Car+Porto",
        image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
        notes: "Transfer das chegadas do aeroporto para a Centauro (12:05H, 3 min, 1km). Saída da Centauro às 12:15H.",
        distanceFromPrev: "1 km",
        timeFromPrev: "3 min"
      },
      {
        id: "ev-f26-4",
        timeStart: "12:15",
        timeEnd: "13:30",
        name: "Almoço na Maia (Mister Churrasco / Opções)",
        description: "Viagem de ida para a Maia (12:15H às 12:25H, ~10 min).\n• Opção 1: Mister Churrasco (Google: https://maps.app.goo.gl/HRief7r1YAJbxo2W9)\n• Opção 2: Restaurante alternativo na Maia\n• Opção 3: Restaurante local\nDar uma volta nos arredores caso apeteça.",
        category: "Restaurante",
        address: "Mister Churrasco, Maia, Porto",
        coordinates: { lat: 41.2300, lng: -8.6250 },
        googleMapsLink: "https://maps.app.goo.gl/HRief7r1YAJbxo2W9",
        wazeLink: "https://waze.com/ul?q=Mister+Churrasco+Maia",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        notes: "Estimativa desde a Centauro: 10 min. Opção principal: Mister Churrasco.",
        distanceFromPrev: "7 km",
        timeFromPrev: "10 min"
      },
      {
        id: "ev-f26-5",
        timeStart: "13:30",
        timeEnd: "17:00",
        name: "Compras no Parque Nascente Shopping & Carregamento EV",
        description: "Deslocação para o Parque Nascente Shopping (13:30H às 13:50H, ~20 min). Compras (~3h) e lanche no final. O carro fica a carregar nos postos EV do shopping durante a visita.",
        category: "Passeio",
        address: "Parque Nascente Shopping, Rio Tinto",
        coordinates: { lat: 41.1764, lng: -8.5661 },
        googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Parque+Nascente+Shopping",
        wazeLink: "https://waze.com/ul?q=Parque+Nascente+Shopping",
        image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80",
        notes: "Deixar o carro elétrico a carregar no parque do shopping enquanto faz compras e lancha.",
        distanceFromPrev: "11 km",
        timeFromPrev: "20 min"
      },
      {
        id: "ev-f26-6",
        timeStart: "17:00",
        timeEnd: "17:15",
        name: "Viagem do Shopping para Casa (Corujeira)",
        description: "Viagem do Parque Nascente Shopping para a casa de acolhimento na Rua Central da Corujeira 72, 4300-111 Campanhã, Porto.",
        category: "Viagem / Na estrada",
        address: "Rua Central da Corujeira 72, Porto, 4300-111 Campanhã",
        coordinates: { lat: 41.1585, lng: -8.5790 },
        googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Rua+Central+da+Corujeira+72+Porto",
        wazeLink: "https://waze.com/ul?q=Rua+Central+da+Corujeira+72+Porto",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
        distanceFromPrev: "4 km",
        timeFromPrev: "15 min"
      },
      {
        id: "ev-f26-7",
        timeStart: "17:15",
        timeEnd: "18:15",
        name: "Check-in, Ver a Casa, Desfazer Malas & Banho",
        description: "Conhecer a casa na Corujeira, desfazer as malas, arrumar as compras e tomar um duche rápido antes de sair para o final da tarde.",
        category: "Hotel",
        address: "Rua Central da Corujeira 72, Porto, 4300-111 Campanhã",
        coordinates: { lat: 41.1585, lng: -8.5790 },
        googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Rua+Central+da+Corujeira+72+Porto",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        notes: "Alojamento principal no Porto."
      },
      {
        id: "ev-f26-8",
        timeStart: "18:15",
        timeEnd: "20:30",
        name: "Visita ao Gaia Park (Mercadona & Action)",
        description: "Viagem de casa ao Gaia Park (18:15H às 18:30H, 15 min). Visita a lojas como Mercadona e Action.",
        category: "Passeio",
        address: "Gaia Park, Vila Nova de Gaia",
        coordinates: { lat: 41.1180, lng: -8.6080 },
        googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Gaia+Park+Vila+Nova+de+Gaia",
        wazeLink: "https://waze.com/ul?q=Gaia+Park+Vila+Nova+de+Gaia",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
        notes: "Lojas de interesse: Mercadona, Action.",
        distanceFromPrev: "8 km",
        timeFromPrev: "15 min"
      },
      {
        id: "ev-f26-9",
        timeStart: "20:30",
        timeEnd: "20:45",
        name: "Deslocação para o Cais de Gaia",
        description: "Viagem de carro do Gaia Park para a zona ribeirinha do Cais de Gaia para jantar.",
        category: "Viagem / Na estrada",
        address: "Cais de Gaia, Vila Nova de Gaia",
        coordinates: { lat: 41.1375, lng: -8.6130 },
        googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Cais+de+Gaia",
        wazeLink: "https://waze.com/ul?q=Cais+de+Gaia",
        distanceFromPrev: "5 km",
        timeFromPrev: "15 min"
      },
      {
        id: "ev-f26-10",
        timeStart: "21:00",
        timeEnd: "22:30",
        name: "Jantar no Restaurante Temple d’Ouro",
        description: "Jantar no Restaurante Temple d'Ouro no Cais de Gaia com vista para o Rio Douro e a cidade do Porto.",
        category: "Restaurante",
        address: "Temple d'Ouro, Cais de Gaia",
        coordinates: { lat: 41.1372, lng: -8.6135 },
        googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Restaurante+Temple+d%27Ouro+Gaia",
        wazeLink: "https://waze.com/ul?q=Restaurante+Temple+d%27Ouro+Gaia",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        notes: "Reserva de jantar entre as 21:00H e as 22:30H."
      },
      {
        id: "ev-f26-11",
        timeStart: "22:30",
        timeEnd: "23:59",
        name: "Passeio Noturno Cais de Gaia & Cais da Ribeira",
        description: "Passeio pedestre a beira-rio, travessia da Ponte D. Luís I e caminhada pelo Cais da Ribeira iluminado. Regresso a casa na Corujeira para descansar.",
        category: "Passeio",
        address: "Cais da Ribeira, Porto",
        coordinates: { lat: 41.1408, lng: -8.6112 },
        googleMapsLink: "https://www.google.com/maps/search/?api=1&query=Cais+da+Ribeira+Porto",
        wazeLink: "https://waze.com/ul?q=Cais+da+Ribeira+Porto",
        image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=800&q=80",
        notes: "Regresso a casa para descansar após o passeio."
      }
    ],
    "2026-08-01": [],
    "2026-08-02": [],
    "2026-08-03": [],
    "2026-08-04": [],
    "2026-08-05": [],
    "2026-08-06": [],
    "2026-08-07": []
  }
};

db.trips = [newTrip, ...(db.trips || []).filter(t => t.id !== "trip-ferias-2026")];
fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), "utf8");
console.log("Successfully wrote Férias 2026 to db.json");
