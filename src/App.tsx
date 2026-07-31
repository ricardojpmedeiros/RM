/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from "react";
import { Trip, UserProfile } from "./types";
import Dashboard from "./components/Dashboard";
import TripDetails from "./components/TripDetails";
import ReportModal from "./components/ReportModal";
import AuthScreen from "./components/AuthScreen";
import { authService } from "./services/authService";
import { tripService, reconcileItineraries } from "./services/tripService";
import { invitationService } from "./services/invitationService";
import { Compass, RefreshCw } from "lucide-react";

// Helper for localStorage persistence across server/session restarts
function saveTripsToLocalStorage(tripsToSave: Trip[]) {
  try {
    localStorage.setItem("trippilot_user_trips", JSON.stringify(tripsToSave));
  } catch (e) {
    console.warn("Could not save trips to localStorage:", e);
  }
}

function loadTripsFromLocalStorage(): Trip[] {
  try {
    const raw = localStorage.getItem("trippilot_user_trips");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not load trips from localStorage:", e);
  }
  return [];
}

function mergeServerAndLocalTrips(serverTrips: Trip[], localTrips: Trip[]): Trip[] {
  if (!localTrips || localTrips.length === 0) return serverTrips;
  if (!serverTrips || serverTrips.length === 0) return localTrips;

  const resultMap = new Map<string, Trip>();

  for (const sTrip of serverTrips) {
    resultMap.set(sTrip.id, sTrip);
  }

  for (const lTrip of localTrips) {
    const existingServer = resultMap.get(lTrip.id);
    if (!existingServer) {
      resultMap.set(lTrip.id, lTrip);
    } else {
      const mergedItinerary = reconcileItineraries(lTrip.itinerary || {}, existingServer.itinerary || {});
      
      const mergedTrip: Trip = {
        ...existingServer,
        ...lTrip,
        startDate: lTrip.startDate || existingServer.startDate,
        endDate: lTrip.endDate || existingServer.endDate,
        name: lTrip.name || existingServer.name,
        destination: lTrip.destination || existingServer.destination,
        description: lTrip.description || existingServer.description,
        itinerary: mergedItinerary,
        expenses: lTrip.expenses && lTrip.expenses.length >= (existingServer.expenses || []).length ? lTrip.expenses : existingServer.expenses,
        documents: lTrip.documents && lTrip.documents.length >= (existingServer.documents || []).length ? lTrip.documents : existingServer.documents,
      };
      resultMap.set(lTrip.id, mergedTrip);
    }
  }

  return Array.from(resultMap.values());
}

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showReportTrip, setShowReportTrip] = useState<Trip | null>(null);
  const [inviteToken, setInviteToken] = useState<string>("");

  // 1. Initial Auth and State listener
  useEffect(() => {
    // Check for invite token in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setInviteToken(token);
    }

    // Monitor auth state changes
    const subscription = authService.onAuthStateChange(async (event, session) => {
      // Ignore background auth events like token refreshes or tab focus re-auths
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        return;
      }
      if (session?.user) {
        // If activeUser is already set, do NOT set loading=true (pass isSilent = true)
        const isSilent = Boolean(activeUser);
        await loadUserAndTrips(session.user, undefined, isSilent);
      } else {
        setActiveUser(null);
        setTrips([]);
        setLoading(false);
      }
    });

    // Check current session
    authService.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserAndTrips(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper to load user profile and trips from Supabase
  const loadUserAndTrips = async (authUser: any, syncSelectedId?: string | null, isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      // Fetch or ensure profile exists
      const profile = await authService.getProfile(authUser.id);
      
      const userObj: UserProfile = {
        id: authUser.id,
        name: profile?.full_name || authUser.user_metadata?.full_name || "Utilizador",
        email: authUser.email || "",
        role: "Planeador" // Default, dynamically overridden per-trip
      };
      
      setActiveUser(userObj);

      // Handle any active invitation acceptance on login/signup
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (token) {
        try {
          await invitationService.acceptInvitation(token);
          alert("Parabéns! O convite foi aceite e a viagem foi adicionada à sua conta.");
          // Clear query parameter
          window.history.replaceState(null, "", window.location.pathname);
          setInviteToken("");
        } catch (inviteErr: any) {
          console.error("Failed to auto-accept invitation:", inviteErr);
          alert(`Convite não aceite: ${inviteErr.message}`);
        }
      }

      // Fetch all trips from server and merge with local persistence fallback
      const fetched = await tripService.fetchAllTrips();
      const localTrips = loadTripsFromLocalStorage();
      const mergedTrips = mergeServerAndLocalTrips(fetched, localTrips);
      
      setTrips(mergedTrips);
      saveTripsToLocalStorage(mergedTrips);

      // Background sync merged trips to server if missing or updated
      mergedTrips.forEach(t => {
        tripService.updateTrip(t).catch(e => console.warn("Background trip sync warning:", e));
      });

      // Synchronize currently selected trip if active
      const savedTripId = localStorage.getItem("selected_trip_id");
      const targetId = syncSelectedId !== undefined ? syncSelectedId : (selectedTrip?.id || savedTripId);
      if (targetId) {
        const fresh = mergedTrips.find((t) => t.id === targetId);
        if (fresh) {
          // Adjust activeUser role based on their membership role in this specific trip
          const role = await tripService.getMemberRole(fresh.id);
          setActiveUser(prev => prev ? {
            ...prev,
            role: role === "owner" ? "Planeador" : "Consultor"
          } : {
            ...userObj,
            role: role === "owner" ? "Planeador" : "Consultor"
          });

          setSelectedTrip(prev => {
            if (prev && prev.id === fresh.id) {
              const mergedItinerary = reconcileItineraries(prev.itinerary || {}, fresh.itinerary || {});
              return {
                ...fresh,
                ...prev,
                itinerary: mergedItinerary
              };
            }
            return fresh;
          });
          localStorage.setItem("selected_trip_id", fresh.id);
        } else {
          setSelectedTrip(null);
          localStorage.removeItem("selected_trip_id");
        }
      }
    } catch (err) {
      console.error("Error loading user profile or trips:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrips = async (syncSelected = true) => {
    const user = await authService.getCurrentUser();
    if (user) {
      await loadUserAndTrips(user, syncSelected ? selectedTrip?.id : null);
    }
  };

  // Profile switching / Logout
  const handleChangeUser = async (user: UserProfile | null) => {
    if (user === null) {
      setLoading(true);
      await authService.logout();
      setSelectedTrip(null);
      setActiveUser(null);
      setTrips([]);
      setLoading(false);
    }
  };

  // Sync updates back to server/Supabase
  const handleUpdateTrip = async (updated: Trip) => {
    // Optimistic UI state update so changes are instant and persistent locally
    setTrips(prev => {
      const nextTrips = prev.map(t => t.id === updated.id ? updated : t);
      saveTripsToLocalStorage(nextTrips);
      return nextTrips;
    });
    setSelectedTrip(updated);

    try {
      const freshTrip = await tripService.updateTrip(updated);
      if (freshTrip) {
        const finalItinerary = reconcileItineraries(updated.itinerary, freshTrip.itinerary || {});
        const finalTrip: Trip = {
          ...freshTrip,
          itinerary: finalItinerary
        };
        setTrips(prev => {
          const nextTrips = prev.map(t => t.id === updated.id ? finalTrip : t);
          saveTripsToLocalStorage(nextTrips);
          return nextTrips;
        });
        setSelectedTrip(finalTrip);
      }
    } catch (err) {
      console.error("Failed to update trip on backend:", err);
    }
  };

  // Create Trip
  const handleCreateTrip = async (tripData: any) => {
    if (!activeUser) return;
    setLoading(true);
    try {
      const newTrip = await tripService.createTrip(tripData);
      if (newTrip) {
        setTrips(prev => {
          const nextTrips = [newTrip, ...prev];
          saveTripsToLocalStorage(nextTrips);
          return nextTrips;
        });
        alert("Viagem criada com sucesso na nuvem!");
      }
    } catch (err: any) {
      console.error("Error creating trip:", err);
      alert(`Não foi possível criar a viagem: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Duplicate Trip
  const handleDuplicateTrip = async (id: string) => {
    setLoading(true);
    try {
      const duplicated = await tripService.duplicateTrip(id);
      if (duplicated) {
        setTrips(prev => {
          const nextTrips = [duplicated, ...prev];
          saveTripsToLocalStorage(nextTrips);
          return nextTrips;
        });
        alert("Viagem duplicada com sucesso!");
      }
    } catch (err: any) {
      console.error("Error duplicating trip:", err);
      alert(`Não foi possível duplicar a viagem: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Archive / Restore
  const handleToggleArchive = async (id: string) => {
    const trip = trips.find(t => t.id === id);
    if (!trip) return;

    const newStatus = trip.status === "active" ? "archived" : "active";
    setLoading(true);
    try {
      const updated = { ...trip, status: newStatus as any };
      const fresh = await tripService.updateTrip(updated);
      const finalTrip = fresh || updated;
      setTrips(prev => {
        const nextTrips = prev.map(t => t.id === id ? finalTrip : t);
        saveTripsToLocalStorage(nextTrips);
        return nextTrips;
      });
    } catch (err) {
      console.error("Error updating archive status:", err);
      alert("Não foi possível alterar o estado da viagem.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Trip
  const handleDeleteTrip = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar permanentemente esta viagem e todos os seus dados?")) {
      return;
    }
    setLoading(true);
    try {
      await tripService.deleteTrip(id);
      setTrips(prev => {
        const nextTrips = prev.filter(t => t.id !== id);
        saveTripsToLocalStorage(nextTrips);
        return nextTrips;
      });
      setSelectedTrip(null);
      localStorage.removeItem("selected_trip_id");
      alert("Viagem eliminada com sucesso.");
    } catch (err: any) {
      console.error("Error deleting trip:", err);
      alert(`Erro ao eliminar viagem: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Route to select trip and dynamically configure activeUser permission role
  const handleSelectTrip = async (trip: Trip) => {
    setSelectedTrip(trip);
    localStorage.setItem("selected_trip_id", trip.id);
    try {
      const role = await tripService.getMemberRole(trip.id);
      if (activeUser) {
        setActiveUser(prev => prev ? {
          ...prev,
          role: role === "owner" ? "Planeador" : "Consultor"
        } : null);
      }
    } catch (err) {
      console.error("Error setting active user role for selected trip:", err);
    }
  };

  // Authenticate view if session does not exist
  if (!activeUser && !loading) {
    return (
      <AuthScreen 
        onAuthSuccess={() => fetchTrips(false)} 
        initialInviteToken={inviteToken}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 flex flex-col justify-between" id="app-root-shell">
      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-gray-500 font-semibold">A carregar o TripPilot...</p>
          </div>
        ) : selectedTrip ? (
          <TripDetails
            trip={selectedTrip}
            activeUser={activeUser}
            onBack={() => {
              setSelectedTrip(null);
              localStorage.removeItem("selected_trip_id");
              fetchTrips(false);
            }}
            onUpdateTrip={handleUpdateTrip}
            onOpenReport={() => setShowReportTrip(selectedTrip)}
          />
        ) : (
          <Dashboard
            trips={trips}
            activeUser={activeUser}
            onChangeUser={handleChangeUser}
            onSelectTrip={handleSelectTrip}
            onCreateTrip={handleCreateTrip}
            onDuplicateTrip={handleDuplicateTrip}
            onToggleArchive={handleToggleArchive}
            onDeleteTrip={handleDeleteTrip}
          />
        )}
      </div>

      <footer className="py-6 border-t border-gray-200 text-center text-xs text-gray-400 no-print" id="global-footer">
        <p>© 2026 TripPilot Corporation. Todos os direitos reservados. Desenvolvido por Ricardo Medeiros. Sistema Inteligente de Itinerários.</p>
      </footer>

      {/* Report Modal */}
      {showReportTrip && (
        <ReportModal
          trip={showReportTrip}
          activeUser={activeUser}
          onClose={() => setShowReportTrip(null)}
        />
      )}
    </div>
  );
}

