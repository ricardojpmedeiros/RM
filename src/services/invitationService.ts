import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface TripInvitation {
  id: string;
  trip_id: string;
  invited_by: string;
  invited_email: string;
  role: "viewer" | "owner";
  status: "pending" | "accepted" | "cancelled" | "expired";
  expires_at: string;
  created_at: string;
}

export const invitationService = {
  // 1. Create a new invitation (viewer by default)
  async createInvitation(tripId: string, email: string): Promise<TripInvitation> {
    if (!isSupabaseConfigured) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const tokenArray = new Uint8Array(24);
      window.crypto.getRandomValues(tokenArray);
      const token = Array.from(tokenArray, dec => dec.toString(16).padStart(2, "0")).join("");

      const mockInvite: TripInvitation = {
        id: "invite-" + Date.now(),
        trip_id: tripId,
        invited_by: "user-ricardo",
        invited_email: email.toLowerCase().trim(),
        role: "viewer",
        status: "pending",
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      };

      const current = localStorage.getItem("trippilot_mock_invitations");
      const list = current ? JSON.parse(current) : [];
      list.push({ ...mockInvite, token });
      localStorage.setItem("trippilot_mock_invitations", JSON.stringify(list));
      return mockInvite;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado.");

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Generate crypto-secure random hex string for token
    const tokenArray = new Uint8Array(24);
    window.crypto.getRandomValues(tokenArray);
    const token = Array.from(tokenArray, dec => dec.toString(16).padStart(2, "0")).join("");

    // Expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from("trip_invitations")
      .insert({
        trip_id: tripId,
        invited_by: user.id,
        invited_email: normalizedEmail,
        token,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting invitation:", error);
      throw new Error(error.message);
    }

    return data;
  },

  // 2. Fetch invitations for a trip
  async fetchInvitations(tripId: string): Promise<TripInvitation[]> {
    if (!isSupabaseConfigured) {
      const current = localStorage.getItem("trippilot_mock_invitations");
      const list: TripInvitation[] = current ? JSON.parse(current) : [];
      return list.filter(inv => inv.trip_id === tripId && inv.status === "pending");
    }

    const { data, error } = await supabase
      .from("trip_invitations")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitations:", error);
      return [];
    }

    return data as TripInvitation[];
  },

  // 3. Cancel an invitation
  async cancelInvitation(invitationId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const current = localStorage.getItem("trippilot_mock_invitations");
      const list: any[] = current ? JSON.parse(current) : [];
      const matched = list.find(inv => inv.id === invitationId);
      if (matched) {
        matched.status = "cancelled";
      }
      localStorage.setItem("trippilot_mock_invitations", JSON.stringify(list));
      return;
    }

    const { error } = await supabase
      .from("trip_invitations")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString()
      })
      .eq("id", invitationId);

    if (error) {
      throw new Error(error.message);
    }
  },

  // 4. Fetch invitation details securely using token (for non-authenticated views)
  async fetchInvitationByToken(token: string) {
    if (!isSupabaseConfigured) {
      const current = localStorage.getItem("trippilot_mock_invitations");
      const list: any[] = current ? JSON.parse(current) : [];
      const matched = list.find(inv => inv.token === token && inv.status === "pending");
      if (!matched) return null;
      if (new Date(matched.expires_at) < new Date()) return null;
      return { ...matched, trips: { title: "Viagem Simulada" } };
    }

    const { data, error } = await supabase
      .from("trip_invitations")
      .select("*, trips(title)")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (error) {
      console.error("Error checking token:", error);
      return null;
    }

    // Check expiration
    const now = new Date();
    if (new Date(data.expires_at) < now) {
      return null;
    }

    return data;
  },

  // 5. Accept trip invitation via SQL RPC transaction
  async acceptInvitation(token: string): Promise<string> {
    if (!isSupabaseConfigured) {
      const currentInv = localStorage.getItem("trippilot_mock_invitations");
      const listInv: any[] = currentInv ? JSON.parse(currentInv) : [];
      const matched = listInv.find(inv => inv.token === token && inv.status === "pending");
      if (!matched) throw new Error("Convite não encontrado ou já expirado.");
      
      matched.status = "accepted";
      localStorage.setItem("trippilot_mock_invitations", JSON.stringify(listInv));

      try {
        const tripsResp = await fetch("/api/trips");
        if (tripsResp.ok) {
          const trips = await tripsResp.json();
          const trip = trips.find((t: any) => t.id === matched.trip_id);
          if (trip) {
            const alreadyPart = trip.participants?.some((p: any) => p.id === "user-ricardo");
            if (!alreadyPart) {
              trip.participants = [
                ...(trip.participants || []),
                {
                  id: "user-ricardo",
                  name: "Ricardo Medeiros",
                  email: "ricardojpmedeiros@gmail.com",
                  role: "Consultor"
                }
              ];
              await fetch(`/api/trips/${trip.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(trip)
              });
            }
          }
        }
      } catch (err) {
        console.error("Local acceptInvitation update failed:", err);
      }
      
      return matched.trip_id;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Inicie sessão para aceitar este convite.");

    // Call acceptance RPC
    const { data: tripId, error } = await supabase.rpc("accept_trip_invitation", {
      p_token: token
    });

    if (error) {
      console.error("Error accepting invitation via RPC:", error);
      throw new Error(this.mapError(error.message));
    }

    return tripId;
  },

  // Map database exceptions to Portuguese
  mapError(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes("invitation not found")) {
      return "Convite não encontrado ou já expirado/cancelado.";
    }
    if (lower.includes("email mismatch")) {
      return "Este convite foi enviado para outro e-mail. Inicie sessão com o e-mail correto.";
    }
    if (lower.includes("already accepted")) {
      return "Este convite já foi aceito anteriormente.";
    }
    if (lower.includes("expired")) {
      return "Este convite expirou (limite de 7 dias). Peça um novo convite.";
    }
    return message;
  }
};
