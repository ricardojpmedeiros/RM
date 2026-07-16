import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Trip, Event, Expense, Document, UserProfile } from "../types";

export const tripService = {
  // 1. Fetch all trips where the user is a participant
  async fetchAllTrips(): Promise<Trip[]> {
    if (!isSupabaseConfigured) {
      try {
        const resp = await fetch("/api/trips");
        if (!resp.ok) throw new Error("HTTP error " + resp.status);
        const data = await resp.json();
        return data;
      } catch (err) {
        console.error("Local fetchAllTrips failed:", err);
        return [];
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get trip IDs that user is a member of
    const { data: memberships, error: memError } = await supabase
      .from("trip_members")
      .select("trip_id, role")
      .eq("user_id", user.id);

    if (memError || !memberships || memberships.length === 0) {
      return [];
    }

    const tripIds = memberships.map(m => m.trip_id);

    // Fetch the trip rows
    const { data: tripRows, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .in("id", tripIds)
      .order("created_at", { ascending: false });

    if (tripError || !tripRows) {
      console.error("Error loading trips:", tripError);
      return [];
    }

    const compiledTrips: Trip[] = [];

    for (const row of tripRows) {
      const trip = await this.assembleTrip(row);
      if (trip) {
        compiledTrips.push(trip);
      }
    }

    return compiledTrips;
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
    if (days) {
      for (const d of days) {
        itinerary[d.date] = [];
      }
    }

    if (activities) {
      for (const act of activities) {
        // Find corresponding day date
        let dayDate = "";
        if (act.trip_day_id) {
          const matchedDay = days?.find(d => d.id === act.trip_day_id);
          if (matchedDay) dayDate = matchedDay.date;
        }

        if (dayDate) {
          if (!itinerary[dayDate]) {
            itinerary[dayDate] = [];
          }

          itinerary[dayDate].push({
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
            notes: act.notes || ""
          });
        }
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
    if (row.vehicle_data) {
      try {
        vehicle = typeof row.vehicle_data === "string" ? JSON.parse(row.vehicle_data) : row.vehicle_data;
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
    if (!isSupabaseConfigured) {
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
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado.");

    // We can use RPC or call direct. Since user requests:
    // "Criar uma função ou transação segura para: 1. inserir a viagem; 2. adicionar automaticamente o criador a trip_members; 3. definir o papel como owner; 4. devolver a viagem criada."
    // Let's call the RPC function `create_trip_secure` that we will define in the migration!
    // The RPC function parameters:
    // title, description, destination, start_date, end_date, cover_image_url
    const title = tripData.name || "Nova Viagem 🗺️";
    const { data: newTripId, error } = await supabase.rpc("create_trip_secure", {
      p_title: title,
      p_description: tripData.description || "",
      p_destination: tripData.destination || "",
      p_start_date: tripData.startDate || new Date().toISOString().split("T")[0],
      p_end_date: tripData.endDate || new Date().toISOString().split("T")[0]
    });

    if (error || !newTripId) {
      console.error("Error creating trip via RPC:", error);
      throw new Error(error?.message || "Erro ao criar viagem");
    }

    // Now update optional fields (vehicle, accommodation, etc.)
    const { data: row, error: updateError } = await supabase
      .from("trips")
      .update({
        vehicle_data: tripData.vehicle || null,
        accommodation_data: tripData.accommodation || null,
        flights_data: tripData.flights || [],
        home_address: tripData.homeAddress || null,
        accommodation_address: tripData.accommodationAddress || null,
        accommodation_map_link: tripData.accommodationMapLink || null,
        accommodation_name: tripData.accommodationName || null,
        accommodation_contact: tripData.accommodationContact || null,
      })
      .eq("id", newTripId)
      .select()
      .single();

    if (updateError || !row) {
      console.error("Error updating trip meta details:", updateError);
    }

    // Generate itinerary days in SQL relational table
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

    // Refetch full compiled trip
    const { data: fullRow } = await supabase.from("trips").select("*").eq("id", newTripId).single();
    return await this.assembleTrip(fullRow);
  },

  // 3. Update an existing trip relationally
  async updateTrip(trip: Trip): Promise<Trip | null> {
    if (!isSupabaseConfigured) {
      try {
        const resp = await fetch(`/api/trips/${trip.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(trip)
        });
        if (!resp.ok) throw new Error("HTTP error " + resp.status);
        const data = await resp.json();
        return data;
      } catch (err) {
        console.error("Local updateTrip failed:", err);
        throw err;
      }
    }

    // Check if user is owner of the trip
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado.");

    // Update main trips table
    const { error: tripUpdateErr } = await supabase
      .from("trips")
      .update({
        title: trip.name,
        destination: trip.destination,
        start_date: trip.startDate,
        end_date: trip.endDate,
        description: trip.description,
        status: trip.status === "archived" ? "archived" : "active",
        home_address: trip.homeAddress || null,
        accommodation_address: trip.accommodationAddress || null,
        accommodation_map_link: trip.accommodationMapLink || null,
        accommodation_name: trip.accommodationName || null,
        accommodation_contact: trip.accommodationContact || null,
        vehicle_data: trip.vehicle,
        accommodation_data: trip.accommodation,
        flights_data: trip.flights,
        updated_at: new Date().toISOString()
      })
      .eq("id", trip.id);

    if (tripUpdateErr) {
      console.error("Error updating trip row:", tripUpdateErr);
      throw tripUpdateErr;
    }

    // Sync trip days and activities
    // 1. Get existing trip days
    const { data: existingDays } = await supabase
      .from("trip_days")
      .select("id, date")
      .eq("trip_id", trip.id);

    // Ensure all dates in itinerary exist as trip_days
    const itineraryDates = Object.keys(trip.itinerary);
    for (const date of itineraryDates) {
      let matchedDay = existingDays?.find(d => d.date === date);
      if (!matchedDay) {
        const { data: newDay } = await supabase
          .from("trip_days")
          .insert({
            trip_id: trip.id,
            date,
            day_order: 1 // default
          })
          .select()
          .single();
        if (newDay) {
          existingDays?.push(newDay);
        }
      }
    }

    // Re-fetch trip days to have full IDs
    const { data: updatedDays } = await supabase
      .from("trip_days")
      .select("id, date")
      .eq("trip_id", trip.id);

    // Save/Sync activities
    const incomingActivities: any[] = [];
    for (const date of itineraryDates) {
      const matchedDay = updatedDays?.find(d => d.date === date);
      const events = trip.itinerary[date] || [];
      events.forEach((evt, idx) => {
        incomingActivities.push({
          id: evt.id.startsWith("evt-") && evt.id.length > 25 ? undefined : evt.id, // clean temp IDs if any
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
          notes: evt.notes,
          activity_order: idx + 1
        });
      });
    }

    // Query existing activities to see what to delete
    const { data: currentActivities } = await supabase
      .from("activities")
      .select("id")
      .eq("trip_id", trip.id);

    const incomingIds = incomingActivities.map(a => a.id).filter(Boolean);
    const activitiesToDelete = (currentActivities || [])
      .map(a => a.id)
      .filter(id => !incomingIds.includes(id));

    // Delete unused activities
    if (activitiesToDelete.length > 0) {
      await supabase.from("activities").delete().in("id", activitiesToDelete);
    }

    // Upsert incoming activities
    for (const act of incomingActivities) {
      if (act.id) {
        await supabase.from("activities").upsert(act);
      } else {
        // Create new
        const { id, ...newAct } = act;
        await supabase.from("activities").insert(newAct);
      }
    }

    // Sync expenses
    const incomingExpenses = trip.expenses.map(exp => ({
      id: exp.id.startsWith("exp-") && exp.id.length > 25 ? undefined : exp.id,
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

    // Refetch full compiled trip
    const { data: fullRow } = await supabase.from("trips").select("*").eq("id", trip.id).single();
    return await this.assembleTrip(fullRow);
  },

  // 4. Duplicate Trip
  async duplicateTrip(id: string): Promise<Trip | null> {
    if (!isSupabaseConfigured) {
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
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado.");

    // Insert copy of the trip via RPC or manually. We can call direct:
    const { data: sourceTrip } = await supabase.from("trips").select("*").eq("id", id).single();
    if (!sourceTrip) throw new Error("Viagem origem não encontrada");

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

    if (!newTrip) throw new Error("Falha ao duplicar viagem");

    // Also copy activities, expenses
    const sourceCompiled = await this.assembleTrip(sourceTrip);
    if (sourceCompiled) {
      // Copy activities
      const updatedWithActivities = {
        ...newTrip,
        itinerary: sourceCompiled.itinerary,
        expenses: sourceCompiled.expenses
      };
      return await this.updateTrip(updatedWithActivities);
    }

    return newTrip;
  },

  // 5. Delete Trip
  async deleteTrip(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      try {
        const resp = await fetch(`/api/trips/${id}`, {
          method: "DELETE"
        });
        if (!resp.ok) throw new Error("HTTP error " + resp.status);
      } catch (err) {
        console.error("Local deleteTrip failed:", err);
        throw err;
      }
      return;
    }

    // Delete documents first to avoid storage orphans
    const { data: docs } = await supabase.from("documents").select("storage_path").eq("trip_id", id);
    if (docs && docs.length > 0) {
      const paths = docs.map(d => d.storage_path);
      await supabase.storage.from("trip-documents").remove(paths);
    }

    // Delete trip row (Cascade deletes members, trip_days, activities, expenses, documents)
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      throw new Error(error.message);
    }
  },

  // 6. Get member role for trip
  async getMemberRole(tripId: string): Promise<"owner" | "viewer" | null> {
    if (!isSupabaseConfigured) {
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("trip_members")
      .select("role")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) return null;
    return data.role as "owner" | "viewer";
  }
};
export { type Trip, type Event, type Expense, type Document, type UserProfile };
