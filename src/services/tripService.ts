import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Trip, Event, Expense, Document, UserProfile } from "../types";

function isUUID(str: any): boolean {
  if (typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Helper functions to handle transportType and eventDate persistence across database schemas
function extractTransportType(act: any): string | undefined {
  if (act.transport_type) return act.transport_type;
  if (act.transportType) return act.transportType;
  if (act.notes && act.notes.includes("[TransportMode:")) {
    const match = act.notes.match(/\[TransportMode:\s*([^\]]+)\]/);
    if (match) return match[1].trim();
  }
  return undefined;
}

function extractDateFromNotes(notes?: string): string | undefined {
  if (!notes) return undefined;
  const match = notes.match(/\[EventDate:\s*([^\]]+)\]/);
  if (match) return match[1].trim();
  return undefined;
}

function cleanNotes(notes?: string): string {
  if (!notes) return "";
  return notes
    .replace(/\[TransportMode:\s*[^\]]+\]/g, "")
    .replace(/\[EventDate:\s*[^\]]+\]/g, "")
    .trim();
}

function embedDateAndTransportInNotes(notes?: string, transportType?: string, eventDate?: string): string {
  let base = cleanNotes(notes);
  if (transportType) {
    base = base ? `${base} [TransportMode: ${transportType}]` : `[TransportMode: ${transportType}]`;
  }
  if (eventDate) {
    const cleanD = eventDate.split("T")[0].trim();
    base = base ? `${base} [EventDate: ${cleanD}]` : `[EventDate: ${cleanD}]`;
  }
  return base;
}

export function ensureUUID(id?: string): string {
  if (id && isUUID(id)) return id;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // ignore fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to reconcile local user itinerary state with backend server itinerary state
export function reconcileItineraries(
  userItinerary: { [date: string]: Event[] } = {},
  serverItinerary: { [date: string]: Event[] } = {}
): { [date: string]: Event[] } {
  const result: { [date: string]: Event[] } = {};

  // Normalize userItinerary keys to YYYY-MM-DD
  const normUser: { [date: string]: Event[] } = {};
  for (const k of Object.keys(userItinerary || {})) {
    const cleanK = k.split("T")[0].trim();
    if (!cleanK) continue;
    if (!normUser[cleanK]) normUser[cleanK] = [];
    const evts = userItinerary[k] || [];
    evts.forEach(e => {
      if (!normUser[cleanK].some(x => x.id === e.id || (x.name === e.name && x.timeStart === e.timeStart))) {
        normUser[cleanK].push(e);
      }
    });
  }

  // Normalize serverItinerary keys to YYYY-MM-DD
  const normServer: { [date: string]: Event[] } = {};
  for (const k of Object.keys(serverItinerary || {})) {
    const cleanK = k.split("T")[0].trim();
    if (!cleanK) continue;
    if (!normServer[cleanK]) normServer[cleanK] = [];
    const evts = serverItinerary[k] || [];
    evts.forEach(e => {
      if (!normServer[cleanK].some(x => x.id === e.id || (x.name === e.name && x.timeStart === e.timeStart))) {
        normServer[cleanK].push(e);
      }
    });
  }

  const allDates = Array.from(new Set([
    ...Object.keys(normUser),
    ...Object.keys(normServer)
  ])).filter(Boolean);

  for (const date of allDates) {
    const userEvents = normUser[date] || [];
    const serverEvents = normServer[date] || [];

    if (userEvents.length === 0 && serverEvents.length === 0) {
      result[date] = [];
      continue;
    }

    const reconciledList: Event[] = [];
    const usedServerIds = new Set<string>();

    for (const uEvt of userEvents) {
      const matchedServerEvt = serverEvents.find(
        s => (s.id === uEvt.id || (s.name === uEvt.name && s.timeStart === uEvt.timeStart)) && !usedServerIds.has(s.id)
      );
      if (matchedServerEvt) {
        usedServerIds.add(matchedServerEvt.id);
        reconciledList.push({
          ...uEvt,
          id: matchedServerEvt.id
        });
      } else {
        reconciledList.push(uEvt);
      }
    }

    for (const sEvt of serverEvents) {
      if (!usedServerIds.has(sEvt.id)) {
        const alreadyIn = reconciledList.some(r => r.id === sEvt.id || (r.name === sEvt.name && r.timeStart === sEvt.timeStart));
        if (!alreadyIn) {
          reconciledList.push(sEvt);
        }
      }
    }

    reconciledList.sort((a, b) => (a.timeStart || "00:00").localeCompare(b.timeStart || "00:00"));
    result[date] = reconciledList;
  }

  return result;
}

export const tripService = {
  // 1. Fetch all trips where the user is a participant
  async fetchAllTrips(): Promise<Trip[]> {
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get trip IDs that user is a member of
          const { data: memberships, error: memError } = await supabase
            .from("trip_members")
            .select("trip_id, role")
            .eq("user_id", user.id);

          if (!memError && memberships && memberships.length > 0) {
            const tripIds = memberships.map(m => m.trip_id);

            // Fetch the trip rows
            const { data: tripRows, error: tripError } = await supabase
              .from("trips")
              .select("*")
              .in("id", tripIds)
              .order("created_at", { ascending: false });

            if (!tripError && tripRows) {
              const compiledTrips: Trip[] = [];
              for (const row of tripRows) {
                const trip = await this.assembleTrip(row);
                if (trip) {
                  compiledTrips.push(trip);
                }
              }
              return compiledTrips;
            }
          }
        }
      } catch (err) {
        console.warn("Supabase fetchAllTrips network error, falling back to local backend:", err);
      }
    }

    try {
      const resp = await fetch("/api/trips");
      if (!resp.ok) throw new Error("HTTP error " + resp.status);
      const data = await resp.json();
      return data;
    } catch (err) {
      console.error("Local fetchAllTrips failed:", err);
      return [];
    }
  },

  // Helper to assemble full Trip object with its relations
  async assembleTrip(row: any): Promise<Trip | null> {
    const tripId = row.id;

    // Fetch members (participants)
    const { data: members } = await supabase
      .from("trip_members")
      .select("role, profiles(id, full_name, preferred_currency, preferred_language)")
      .eq("trip_id", tripId);

    const participants: UserProfile[] = (members || []).map((m: any) => {
      const p = m.profiles;
      return {
        id: p.id,
        name: p.full_name || "Utilizador",
        email: "", // Can be empty or fetch from meta
        role: m.role === "owner" ? "Planeador" : "Consultor"
      };
    });

    // Fetch itinerary days
    const { data: days } = await supabase
      .from("trip_days")
      .select("*")
      .eq("trip_id", tripId)
      .order("date", { ascending: true });

    // Fetch itinerary activities
    const { data: activities } = await supabase
      .from("activities")
      .select("*")
      .eq("trip_id", tripId)
      .order("activity_order", { ascending: true });

    // Build itinerary map
    const itinerary: { [date: string]: Event[] } = {};

    // Ensure start_date to end_date range keys exist
    if (row.start_date && row.end_date) {
      try {
        const sParts = row.start_date.split("T")[0].split("-").map(Number);
        const eParts = row.end_date.split("T")[0].split("-").map(Number);
        if (sParts.length === 3 && eParts.length === 3) {
          const sUTC = Date.UTC(sParts[0], sParts[1] - 1, sParts[2]);
          const eUTC = Date.UTC(eParts[0], eParts[1] - 1, eParts[2]);
          if (!isNaN(sUTC) && !isNaN(eUTC) && sUTC <= eUTC) {
            const limit = Math.min(366, Math.floor((eUTC - sUTC) / (1000 * 60 * 60 * 24)) + 1);
            for (let i = 0; i < limit; i++) {
              const curUTC = new Date(sUTC + i * 24 * 60 * 60 * 1000);
              const dStr = curUTC.toISOString().split("T")[0];
              if (dStr) itinerary[dStr] = [];
            }
          }
        }
      } catch (err) {
        console.error("Error building default date range in assembleTrip:", err);
      }
    }

    if (days) {
      for (const d of days) {
        const cleanDayDate = (d.date || "").split("T")[0];
        if (cleanDayDate && !itinerary[cleanDayDate]) {
          itinerary[cleanDayDate] = [];
        }
      }
    }

    if (activities) {
      for (const act of activities) {
        // Find corresponding day date
        let dayDate = "";
        if (act.trip_day_id) {
          const matchedDay = days?.find(d => d.id === act.trip_day_id);
          if (matchedDay) dayDate = (matchedDay.date || "").split("T")[0].trim();
        }

        const noteDate = extractDateFromNotes(act.notes);
        if (!dayDate && noteDate) {
          dayDate = noteDate.split("T")[0].trim();
        }

        const fallbackDate = (days?.[0]?.date || row.start_date || new Date().toISOString().split("T")[0]).split("T")[0].trim();
        const finalDate = dayDate || fallbackDate;
        if (!itinerary[finalDate]) {
          itinerary[finalDate] = [];
        }

        const rawNotes = act.notes || "";
        const transportType = extractTransportType(act);
        const isCompleted = rawNotes.includes("[COMPLETED]");
        const displayNotes = cleanNotes(rawNotes.replace("[COMPLETED]", ""));

        itinerary[finalDate].push({
          id: act.id,
          timeStart: act.start_time || "12:00",
          timeEnd: act.end_time || undefined,
          duration: act.duration || undefined,
          name: act.title,
          description: act.description || "",
          category: act.category || "Atividade livre",
          address: act.address || "",
          coordinates: act.latitude && act.longitude ? { lat: act.latitude, lng: act.longitude } : null,
          googleMapsLink: act.google_maps_link || "",
          wazeLink: act.waze_link || "",
          image: act.image_url || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
          notes: displayNotes,
          transportType: transportType,
          completed: isCompleted
        });
      }
    }

    // Fetch expenses
    const { data: expenseRows } = await supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true });

    const expenses: Expense[] = (expenseRows || []).map(exp => ({
      id: exp.id,
      category: exp.category || "Outros",
      description: exp.description,
      amount: Number(exp.amount),
      date: exp.expense_date || row.start_date || "",
      isPlanned: exp.is_planned,
      supplier: exp.supplier || undefined
    }));

    // Fetch documents
    const { data: docRows } = await supabase
      .from("documents")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true });

    const documents: Document[] = (docRows || []).map(doc => ({
      id: doc.id,
      name: doc.original_filename,
      type: doc.mime_type,
      fileUrl: doc.storage_path, // Storage path key or full url
      dateUploaded: doc.created_at.split("T")[0],
      size: `${Math.round(doc.file_size_bytes / 1024)} KB`,
      allowedForConsultor: doc.allowed_for_consultor
    }));

    // Map embedded fields
    let vehicle = null;
    let fallbackAdults = 2;
    let fallbackChildren = 0;
    let fallbackBabies = 0;

    if (row.vehicle_data) {
      try {
        const parsed = typeof row.vehicle_data === "string" ? JSON.parse(row.vehicle_data) : row.vehicle_data;
        if (parsed) {
          if (parsed.numAdults !== undefined) fallbackAdults = Number(parsed.numAdults);
          if (parsed.numChildren !== undefined) fallbackChildren = Number(parsed.numChildren);
          if (parsed.numBabies !== undefined) fallbackBabies = Number(parsed.numBabies);

          if (parsed.id || parsed.name || parsed.type) {
            const { numAdults, numChildren, numBabies, ...cleanVehicle } = parsed;
            vehicle = cleanVehicle;
          }
        }
      } catch {}
    }

    let accommodation = null;
    if (row.accommodation_data) {
      try {
        accommodation = typeof row.accommodation_data === "string" ? JSON.parse(row.accommodation_data) : row.accommodation_data;
      } catch {}
    }

    let flights = [];
    if (row.flights_data) {
      try {
        flights = typeof row.flights_data === "string" ? JSON.parse(row.flights_data) : row.flights_data;
      } catch {}
    }

    return {
      id: row.id,
      name: row.title,
      destination: row.destination || "",
      startDate: row.start_date || "",
      endDate: row.end_date || "",
      description: row.description || "",
      status: row.status === "archived" ? "archived" : "active",
      homeAddress: row.home_address || undefined,
      accommodationAddress: row.accommodation_address || undefined,
      accommodationMapLink: row.accommodation_map_link || undefined,
      accommodationName: row.accommodation_name || undefined,
      accommodationContact: row.accommodation_contact || undefined,
      numAdults: row.num_adults !== undefined && row.num_adults !== null ? Number(row.num_adults) : fallbackAdults,
      numChildren: row.num_children !== undefined && row.num_children !== null ? Number(row.num_children) : fallbackChildren,
      numBabies: row.num_babies !== undefined && row.num_babies !== null ? Number(row.num_babies) : fallbackBabies,
      vehicle,
      accommodation,
      flights,
      itinerary,
      expenses,
      documents,
      participants
    };
  },

  // 2. Create a new trip
  async createTrip(tripData: Partial<Trip>): Promise<Trip | null> {
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const title = tripData.name || "Nova Viagem 🗺️";
          const { data: newTripId, error } = await supabase.rpc("create_trip_secure", {
            p_title: title,
            p_description: tripData.description || "",
            p_destination: tripData.destination || "",
            p_start_date: tripData.startDate || new Date().toISOString().split("T")[0],
            p_end_date: tripData.endDate || new Date().toISOString().split("T")[0]
          });

          if (!error && newTripId) {
            const combinedVehicleData = {
              ...(tripData.vehicle || {}),
              numAdults: tripData.numAdults || 2,
              numChildren: tripData.numChildren || 0,
              numBabies: tripData.numBabies || 0
            };

            await supabase
              .from("trips")
              .update({
                vehicle_data: combinedVehicleData,
                accommodation_data: tripData.accommodation || null,
                flights_data: tripData.flights || [],
                home_address: tripData.homeAddress || null,
                accommodation_address: tripData.accommodationAddress || null,
                accommodation_map_link: tripData.accommodationMapLink || null,
                accommodation_name: tripData.accommodationName || null,
                accommodation_contact: tripData.accommodationContact || null,
              })
              .eq("id", newTripId);

            const start = tripData.startDate;
            const end = tripData.endDate;
            if (start && end) {
              try {
                const startParts = start.split("-").map(Number);
                const endParts = end.split("-").map(Number);
                if (startParts.length === 3 && endParts.length === 3) {
                  const startUTC = Date.UTC(startParts[0], startParts[1] - 1, startParts[2]);
                  const endUTC = Date.UTC(endParts[0], endParts[1] - 1, endParts[2]);
                  if (!isNaN(startUTC) && !isNaN(endUTC) && startUTC <= endUTC) {
                    const limit = Math.min(366, Math.floor((endUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1);
                    const daysToInsert = [];
                    for (let i = 0; i < limit; i++) {
                      const currentUTC = new Date(startUTC + i * 24 * 60 * 60 * 1000);
                      const dateStr = currentUTC.toISOString().split("T")[0];
                      daysToInsert.push({
                        trip_id: newTripId,
                        date: dateStr,
                        day_order: i + 1,
                      });
                    }
                    if (daysToInsert.length > 0) {
                      await supabase.from("trip_days").insert(daysToInsert);
                    }
                  }
                }
              } catch (err) {
                console.error("Error creating itinerary days in DB:", err);
              }
            }

            const { data: fullRow } = await supabase.from("trips").select("*").eq("id", newTripId).single();
            if (fullRow) {
              const assembled = await this.assembleTrip(fullRow);
              if (assembled) return assembled;
            }
          }
        }
      } catch (err) {
        console.warn("Supabase createTrip network error, falling back to local backend:", err);
      }
    }

    // Local fallback
    try {
      const resp = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData)
      });
      if (!resp.ok) throw new Error("HTTP error " + resp.status);
      const data = await resp.json();
      return data;
    } catch (err) {
      console.error("Local createTrip failed:", err);
      throw err;
    }
  },

  // 3. Update an existing trip relationally
  async updateTrip(trip: Trip): Promise<Trip | null> {
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const combinedVehicleData = {
            ...(trip.vehicle || {}),
            numAdults: (trip.numAdults !== undefined && trip.numAdults !== null) ? Number(trip.numAdults) : 2,
            numChildren: (trip.numChildren !== undefined && trip.numChildren !== null) ? Number(trip.numChildren) : 0,
            numBabies: (trip.numBabies !== undefined && trip.numBabies !== null) ? Number(trip.numBabies) : 0,
          };

          const { error: tripUpdateErr } = await supabase
            .from("trips")
            .update({
              title: trip.name || "Sem Nome",
              destination: (trip.destination && trip.destination.trim() !== "") ? trip.destination : null,
              start_date: (trip.startDate && trip.startDate.trim() !== "") ? trip.startDate : null,
              end_date: (trip.endDate && trip.endDate.trim() !== "") ? trip.endDate : null,
              description: (trip.description && trip.description.trim() !== "") ? trip.description : null,
              status: trip.status === "archived" ? "archived" : "active",
              home_address: trip.homeAddress || null,
              accommodation_address: trip.accommodationAddress || null,
              accommodation_map_link: trip.accommodationMapLink || null,
              accommodation_name: trip.accommodationName || null,
              accommodation_contact: trip.accommodationContact || null,
              vehicle_data: combinedVehicleData,
              accommodation_data: trip.accommodation,
              flights_data: trip.flights,
              updated_at: new Date().toISOString()
            })
            .eq("id", trip.id);

          if (!tripUpdateErr) {
            const { data: existingDays } = await supabase
              .from("trip_days")
              .select("id, date")
              .eq("trip_id", trip.id);

            const itineraryDates = Object.keys(trip.itinerary || {}).filter(d => Boolean(d) && d.trim() !== "");
            for (const date of itineraryDates) {
              const cleanDateKey = date.split("T")[0].trim();
              let matchedDay = existingDays?.find(d => (d.date || "").split("T")[0].trim() === cleanDateKey);
              if (!matchedDay) {
                const { data: newDay } = await supabase
                  .from("trip_days")
                  .insert({
                    trip_id: trip.id,
                    date: cleanDateKey,
                    day_order: 1
                  })
                  .select()
                  .single();
                if (newDay && existingDays) {
                  existingDays.push(newDay);
                }
              }
            }

            const { data: updatedDays } = await supabase
              .from("trip_days")
              .select("id, date")
              .eq("trip_id", trip.id);

            const incomingActivities: any[] = [];
            for (const date of itineraryDates) {
              const cleanDateKey = date.split("T")[0].trim();
              const matchedDay = updatedDays?.find(d => (d.date || "").split("T")[0].trim() === cleanDateKey);
              const events = trip.itinerary[date] || [];
              events.forEach((evt, idx) => {
                let noteStr = embedDateAndTransportInNotes(evt.notes, evt.transportType, cleanDateKey);
                if (evt.completed && !noteStr.includes("[COMPLETED]")) {
                  noteStr = noteStr ? `${noteStr} [COMPLETED]` : "[COMPLETED]";
                } else if (!evt.completed && noteStr.includes("[COMPLETED]")) {
                  noteStr = noteStr.replace("[COMPLETED]", "").trim();
                }

                incomingActivities.push({
                  id: ensureUUID(evt.id),
                  trip_id: trip.id,
                  trip_day_id: matchedDay?.id || null,
                  title: evt.name,
                  description: evt.description,
                  category: evt.category,
                  address: evt.address,
                  latitude: evt.coordinates?.lat || null,
                  longitude: evt.coordinates?.lng || null,
                  start_time: evt.timeStart,
                  end_time: evt.timeEnd || null,
                  duration: evt.duration || null,
                  google_maps_link: evt.googleMapsLink,
                  waze_link: evt.wazeLink,
                  image_url: evt.image,
                  notes: noteStr,
                  transport_type: evt.transportType || null,
                  activity_order: idx + 1
                });
              });
            }

            const { data: currentActivities } = await supabase
              .from("activities")
              .select("id")
              .eq("trip_id", trip.id);

            const incomingIds = incomingActivities.map(a => a.id).filter(Boolean);
            const activitiesToDelete = (currentActivities || [])
              .map(a => a.id)
              .filter(id => !incomingIds.includes(id));

            if (activitiesToDelete.length > 0) {
              await supabase.from("activities").delete().in("id", activitiesToDelete);
            }

            for (const act of incomingActivities) {
              if (act.id) {
                await supabase.from("activities").upsert(act);
              } else {
                const { id, ...newAct } = act;
                await supabase.from("activities").insert(newAct);
              }
            }

            const incomingExpenses = (trip.expenses || []).map(exp => ({
              id: ensureUUID(exp.id),
              trip_id: trip.id,
              category: exp.category,
              description: exp.description,
              amount: exp.amount,
              expense_date: exp.date || null,
              is_planned: exp.isPlanned,
              supplier: exp.supplier || null
            }));

            const { data: currentExpenses } = await supabase
              .from("expenses")
              .select("id")
              .eq("trip_id", trip.id);

            const incomingExpIds = incomingExpenses.map(e => e.id).filter(Boolean);
            const expensesToDelete = (currentExpenses || [])
              .map(e => e.id)
              .filter(id => !incomingExpIds.includes(id));

            if (expensesToDelete.length > 0) {
              await supabase.from("expenses").delete().in("id", expensesToDelete);
            }

            for (const exp of incomingExpenses) {
              if (exp.id) {
                await supabase.from("expenses").upsert(exp);
              } else {
                const { id, ...newExp } = exp;
                await supabase.from("expenses").insert(newExp);
              }
            }

            const { data: fullRow } = await supabase.from("trips").select("*").eq("id", trip.id).single();
            if (fullRow) {
              const assembled = await this.assembleTrip(fullRow);
              if (assembled) {
                assembled.itinerary = reconcileItineraries(trip.itinerary, assembled.itinerary);
                return assembled;
              }
            }
          }
        }
      } catch (err) {
        console.warn("Supabase updateTrip network error, falling back to local backend:", err);
      }
    }

    // Local Express fallback
    try {
      const resp = await fetch(`/api/trips/${trip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trip)
      });
      if (!resp.ok) throw new Error("HTTP error " + resp.status);
      const data: Trip = await resp.json();
      if (data && data.itinerary) {
        data.itinerary = reconcileItineraries(trip.itinerary, data.itinerary);
      }
      return data;
    } catch (err) {
      console.error("Local updateTrip failed:", err);
      // Return updated trip so state remains updated
      return trip;
    }
  },

  // 4. Duplicate Trip
  async duplicateTrip(id: string): Promise<Trip | null> {
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: sourceTrip } = await supabase.from("trips").select("*").eq("id", id).single();
          if (sourceTrip) {
            const newTitle = `${sourceTrip.title} (Cópia)`;
            const newTrip = await this.createTrip({
              name: newTitle,
              description: sourceTrip.description,
              destination: sourceTrip.destination,
              startDate: sourceTrip.start_date,
              endDate: sourceTrip.end_date,
              vehicle: sourceTrip.vehicle_data,
              accommodation: sourceTrip.accommodation_data,
              flights: sourceTrip.flights_data,
              homeAddress: sourceTrip.home_address,
              accommodationAddress: sourceTrip.accommodation_address,
              accommodationMapLink: sourceTrip.accommodation_map_link,
              accommodationName: sourceTrip.accommodation_name,
              accommodationContact: sourceTrip.accommodation_contact
            });

            if (newTrip) {
              const sourceCompiled = await this.assembleTrip(sourceTrip);
              if (sourceCompiled) {
                const updatedWithActivities = {
                  ...newTrip,
                  itinerary: sourceCompiled.itinerary,
                  expenses: sourceCompiled.expenses
                };
                return await this.updateTrip(updatedWithActivities);
              }
              return newTrip;
            }
          }
        }
      } catch (err) {
        console.warn("Supabase duplicateTrip network error, falling back to local backend:", err);
      }
    }

    try {
      const resp = await fetch(`/api/trips/${id}/duplicate`, {
        method: "POST"
      });
      if (!resp.ok) throw new Error("HTTP error " + resp.status);
      const data = await resp.json();
      return data;
    } catch (err) {
      console.error("Local duplicateTrip failed:", err);
      throw err;
    }
  },

  // 5. Delete Trip
  async deleteTrip(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { data: docs } = await supabase.from("documents").select("storage_path").eq("trip_id", id);
        if (docs && docs.length > 0) {
          const paths = docs.map(d => d.storage_path);
          await supabase.storage.from("trip-documents").remove(paths);
        }

        const { error } = await supabase.from("trips").delete().eq("id", id);
        if (!error) return;
      } catch (err) {
        console.warn("Supabase deleteTrip network error, falling back to local backend:", err);
      }
    }

    try {
      const resp = await fetch(`/api/trips/${id}`, {
        method: "DELETE"
      });
      if (!resp.ok) throw new Error("HTTP error " + resp.status);
    } catch (err) {
      console.error("Local deleteTrip failed:", err);
      throw err;
    }
  },

  // 6. Get member role for trip
  async getMemberRole(tripId: string): Promise<"owner" | "viewer" | null> {
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("trip_members")
            .select("role")
            .eq("trip_id", tripId)
            .eq("user_id", user.id)
            .single();

          if (!error && data) {
            return data.role as "owner" | "viewer";
          }
        }
      } catch (err) {
        console.warn("Supabase getMemberRole network error, falling back to local check:", err);
      }
    }

    try {
      const resp = await fetch("/api/trips");
      if (resp.ok) {
        const trips: Trip[] = await resp.json();
        const trip = trips.find(t => t.id === tripId);
        if (trip) {
          const p = trip.participants?.find(part => part.id === "user-ricardo" || part.email === "ricardojpmedeiros@gmail.com");
          if (p) {
            return p.role === "Planeador" ? "owner" : "viewer";
          }
        }
      }
    } catch (err) {
      console.error("Local getMemberRole failed:", err);
    }
    return "owner";
  }
};
export { type Trip, type Event, type Expense, type Document, type UserProfile };
