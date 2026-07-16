export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          preferred_currency: string;
          preferred_language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          preferred_currency?: string;
          preferred_language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          preferred_currency?: string;
          preferred_language?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          destination: string | null;
          start_date: string | null;
          end_date: string | null;
          status: string | null;
          currency: string;
          budget: number | null;
          cover_image_url: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
          vehicle_data: Json | null; // Keep existing vehicle embedded data if any
          accommodation_data: Json | null; // Keep accommodation embedded data if any
          flights_data: Json | null; // Keep flights embedded data if any
          home_address: string | null;
          accommodation_address: string | null;
          accommodation_map_link: string | null;
          accommodation_name: string | null;
          accommodation_contact: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          destination?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: string | null;
          currency?: string;
          budget?: number | null;
          cover_image_url?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          vehicle_data?: Json | null;
          accommodation_data?: Json | null;
          flights_data?: Json | null;
          home_address?: string | null;
          accommodation_address?: string | null;
          accommodation_map_link?: string | null;
          accommodation_name?: string | null;
          accommodation_contact?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          destination?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: string | null;
          currency?: string;
          budget?: number | null;
          cover_image_url?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          vehicle_data?: Json | null;
          accommodation_data?: Json | null;
          flights_data?: Json | null;
          home_address?: string | null;
          accommodation_address?: string | null;
          accommodation_map_link?: string | null;
          accommodation_name?: string | null;
          accommodation_contact?: string | null;
        };
      };
      trip_members: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          role: string;
          joined_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          role: string;
          joined_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
          created_at?: string;
        };
      };
      trip_invitations: {
        Row: {
          id: string;
          trip_id: string;
          invited_by: string;
          invited_email: string;
          role: string;
          token: string;
          status: string;
          expires_at: string;
          accepted_by: string | null;
          accepted_at: string | null;
          created_at: string;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          trip_id: string;
          invited_by: string;
          invited_email: string;
          role?: string;
          token: string;
          status?: string;
          expires_at: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          trip_id?: string;
          invited_by?: string;
          invited_email?: string;
          role?: string;
          token?: string;
          status?: string;
          expires_at?: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          cancelled_at?: string | null;
        };
      };
      trip_days: {
        Row: {
          id: string;
          trip_id: string;
          date: string;
          title: string | null;
          notes: string | null;
          day_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          date: string;
          title?: string | null;
          notes?: string | null;
          day_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          date?: string;
          title?: string | null;
          notes?: string | null;
          day_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          trip_id: string;
          trip_day_id: string | null;
          title: string;
          description: string | null;
          category: string | null;
          status: string | null;
          location_name: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          start_time: string | null; // format HH:MM
          end_time: string | null;   // format HH:MM
          duration: string | null;   // custom duration text
          estimated_cost: number | null;
          actual_cost: number | null;
          currency: string;
          booking_reference: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          website_url: string | null;
          notes: string | null;
          activity_order: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          google_maps_link: string | null;
          waze_link: string | null;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          trip_id: string;
          trip_day_id?: string | null;
          title: string;
          description?: string | null;
          category?: string | null;
          status?: string | null;
          location_name?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          duration?: string | null;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          currency?: string;
          booking_reference?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          website_url?: string | null;
          notes?: string | null;
          activity_order?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          google_maps_link?: string | null;
          waze_link?: string | null;
          image_url?: string | null;
        };
        Update: {
          id?: string;
          trip_id?: string;
          trip_day_id?: string | null;
          title?: string;
          description?: string | null;
          category?: string | null;
          status?: string | null;
          location_name?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          duration?: string | null;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          currency?: string;
          booking_reference?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          website_url?: string | null;
          notes?: string | null;
          activity_order?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          google_maps_link?: string | null;
          waze_link?: string | null;
          image_url?: string | null;
        };
      };
      routes: {
        Row: {
          id: string;
          trip_id: string;
          trip_day_id: string | null;
          origin_activity_id: string | null;
          destination_activity_id: string | null;
          origin_name: string | null;
          destination_name: string | null;
          origin_latitude: number | null;
          origin_longitude: number | null;
          destination_latitude: number | null;
          destination_longitude: number | null;
          transport_mode: string | null;
          estimated_distance_km: number | null;
          estimated_duration_minutes: number | null;
          actual_distance_km: number | null;
          actual_duration_minutes: number | null;
          route_order: number;
          navigation_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          trip_day_id?: string | null;
          origin_activity_id?: string | null;
          destination_activity_id?: string | null;
          origin_name?: string | null;
          destination_name?: string | null;
          origin_latitude?: number | null;
          origin_longitude?: number | null;
          destination_latitude?: number | null;
          destination_longitude?: number | null;
          transport_mode?: string | null;
          estimated_distance_km?: number | null;
          estimated_duration_minutes?: number | null;
          actual_distance_km?: number | null;
          actual_duration_minutes?: number | null;
          route_order?: number;
          navigation_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          trip_day_id?: string | null;
          origin_activity_id?: string | null;
          destination_activity_id?: string | null;
          origin_name?: string | null;
          destination_name?: string | null;
          origin_latitude?: number | null;
          origin_longitude?: number | null;
          destination_latitude?: number | null;
          destination_longitude?: number | null;
          transport_mode?: string | null;
          estimated_distance_km?: number | null;
          estimated_duration_minutes?: number | null;
          actual_distance_km?: number | null;
          actual_duration_minutes?: number | null;
          route_order?: number;
          navigation_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          trip_day_id: string | null;
          activity_id: string | null;
          created_by: string | null;
          category: string | null;
          description: string;
          amount: number;
          currency: string;
          expense_date: string | null;
          payment_method: string | null;
          supplier: string | null;
          is_planned: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          trip_day_id?: string | null;
          activity_id?: string | null;
          created_by?: string | null;
          category?: string | null;
          description: string;
          amount: number;
          currency?: string;
          expense_date?: string | null;
          payment_method?: string | null;
          supplier?: string | null;
          is_planned?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          trip_day_id?: string | null;
          activity_id?: string | null;
          created_by?: string | null;
          category?: string | null;
          description?: string;
          amount?: number;
          currency?: string;
          expense_date?: string | null;
          payment_method?: string | null;
          supplier?: string | null;
          is_planned?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          trip_id: string;
          trip_day_id: string | null;
          activity_id: string | null;
          expense_id: string | null;
          uploaded_by: string | null;
          storage_path: string;
          original_filename: string;
          mime_type: string;
          file_size_bytes: number;
          document_type: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
          allowed_for_consultor: boolean;
        };
        Insert: {
          id?: string;
          trip_id: string;
          trip_day_id?: string | null;
          activity_id?: string | null;
          expense_id?: string | null;
          uploaded_by?: string | null;
          storage_path: string;
          original_filename: string;
          mime_type: string;
          file_size_bytes: number;
          document_type?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          allowed_for_consultor?: boolean;
        };
        Update: {
          id?: string;
          trip_id?: string;
          trip_day_id?: string | null;
          activity_id?: string | null;
          expense_id?: string | null;
          uploaded_by?: string | null;
          storage_path?: string;
          original_filename?: string;
          mime_type?: string;
          file_size_bytes?: number;
          document_type?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          allowed_for_consultor?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
