import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_currency: string;
  preferred_language: string;
}

const MOCK_USER = {
  id: "user-ricardo",
  email: "ricardojpmedeiros@gmail.com",
  user_metadata: {
    full_name: "Ricardo Medeiros"
  }
};

const MOCK_SESSION = {
  user: MOCK_USER,
  access_token: "mock-token",
  refresh_token: "mock-token-refresh"
};

export const authService = {
  // Get active session
  async getSession() {
    if (!isSupabaseConfigured) {
      return { data: { session: MOCK_SESSION } };
    }
    try {
      const { data } = await supabase.auth.getSession();
      return { data };
    } catch (err) {
      console.error("Error fetching session:", err);
      return { data: { session: null } };
    }
  },

  // Get active session user
  async getCurrentUser() {
    if (!isSupabaseConfigured) {
      return MOCK_USER;
    }
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  },

  // Get profile data for a user
  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured) {
      const saved = localStorage.getItem("trippilot_mock_profile");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
      return {
        id: "user-ricardo",
        full_name: "Ricardo Medeiros",
        avatar_url: null,
        preferred_currency: "EUR",
        preferred_language: "pt"
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data;
  },

  // Update profile
  async updateProfile(profile: Partial<Profile> & { id: string }) {
    if (!isSupabaseConfigured) {
      const current = await this.getProfile(profile.id);
      const updated = { ...current, ...profile, id: profile.id } as Profile;
      localStorage.setItem("trippilot_mock_profile", JSON.stringify(updated));
      return updated;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        preferred_currency: profile.preferred_currency,
        preferred_language: profile.preferred_language,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (error) {
      throw new Error(this.mapError(error.message));
    }
    return data;
  },

  // Register user
  async register(email: string, password: string, fullName: string) {
    if (!isSupabaseConfigured) {
      return MOCK_USER;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new Error(this.mapError(error.message));
    }

    return data.user;
  },

  // Login
  async login(email: string, password: string) {
    if (!isSupabaseConfigured) {
      return MOCK_USER;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(this.mapError(error.message));
    }

    return data.user;
  },

  // Sign out
  async logout() {
    if (!isSupabaseConfigured) {
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(this.mapError(error.message));
    }
  },

  // Password recovery
  async recoverPassword(email: string, redirectTo: string) {
    if (!isSupabaseConfigured) {
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw new Error(this.mapError(error.message));
    }
  },

  // Update password (used during password recovery reset)
  async updatePassword(password: string) {
    if (!isSupabaseConfigured) {
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw new Error(this.mapError(error.message));
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!isSupabaseConfigured) {
      // Trigger callback with active session asynchronously
      setTimeout(() => {
        callback("SIGNED_IN", MOCK_SESSION);
      }, 0);
      return {
        unsubscribe: () => {}
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  },

  // Translate Supabase errors to Portuguese of Portugal
  mapError(errStr: string): string {
    const lower = errStr.toLowerCase();
    if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
      return "E-mail ou palavra-passe incorretos. Por favor, tente novamente.";
    }
    if (lower.includes("user already exists") || lower.includes("already registered")) {
      return "Este endereço de e-mail já está registado no sistema.";
    }
    if (lower.includes("password should be")) {
      return "A palavra-passe deve conter pelo menos 6 caracteres.";
    }
    if (lower.includes("email not confirmed") || lower.includes("email confirmation")) {
      return "Por favor, confirme o seu e-mail antes de iniciar sessão.";
    }
    if (lower.includes("rate limit")) {
      return "Muitas tentativas em pouco tempo. Aguarde alguns minutos.";
    }
    if (lower.includes("network")) {
      return "Erro de ligação à rede. Verifique a sua internet.";
    }
    return errStr;
  }
};
