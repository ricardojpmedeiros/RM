-- 001_initial_schema.sql
-- Migration for TripPilot Pro Supabase integration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------
-- 1. TABELAS
-- ----------------------------------------------------

-- profiles
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    preferred_currency text DEFAULT 'EUR' NOT NULL,
    preferred_language text DEFAULT 'pt-PT' NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- trips
CREATE TABLE public.trips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    destination text,
    start_date date,
    end_date date,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'active', 'completed', 'archived')),
    currency text DEFAULT 'EUR' NOT NULL,
    budget numeric,
    cover_image_url text,
    archived_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    vehicle_data jsonb,
    accommodation_data jsonb,
    flights_data jsonb,
    home_address text,
    accommodation_address text,
    accommodation_map_link text,
    accommodation_name text,
    accommodation_contact text,
    num_adults integer DEFAULT 2,
    num_children integer DEFAULT 0,
    num_babies integer DEFAULT 0
);

-- trip_members
CREATE TABLE public.trip_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role text CHECK (role IN ('owner', 'viewer')) NOT NULL,
    joined_at timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_trip_user UNIQUE (trip_id, user_id)
);

-- trip_invitations
CREATE TABLE public.trip_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    invited_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    invited_email text NOT NULL,
    role text DEFAULT 'viewer' CHECK (role IN ('owner', 'viewer')) NOT NULL,
    token text UNIQUE NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')) NOT NULL,
    expires_at timestamptz NOT NULL,
    accepted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    accepted_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    cancelled_at timestamptz
);

-- trip_days
CREATE TABLE public.trip_days (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    title text,
    notes text,
    day_order integer DEFAULT 1 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_trip_date UNIQUE (trip_id, date)
);

-- activities
CREATE TABLE public.activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    trip_day_id uuid REFERENCES public.trip_days(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    category text,
    status text,
    location_name text,
    address text,
    latitude double precision,
    longitude double precision,
    start_time text, -- stored as text to match interface "HH:MM"
    end_time text,   -- stored as text to match interface "HH:MM"
    duration text,
    estimated_cost numeric,
    actual_cost numeric,
    currency text DEFAULT 'EUR' NOT NULL,
    booking_reference text,
    contact_name text,
    contact_phone text,
    contact_email text,
    website_url text,
    notes text,
    activity_order integer DEFAULT 1 NOT NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    google_maps_link text,
    waze_link text,
    image_url text
);

-- routes
CREATE TABLE public.routes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    trip_day_id uuid REFERENCES public.trip_days(id) ON DELETE CASCADE,
    origin_activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
    destination_activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
    origin_name text,
    destination_name text,
    origin_latitude double precision,
    origin_longitude double precision,
    destination_latitude double precision,
    destination_longitude double precision,
    transport_mode text,
    estimated_distance_km numeric,
    estimated_duration_minutes integer,
    actual_distance_km numeric,
    actual_duration_minutes integer,
    route_order integer DEFAULT 1 NOT NULL,
    navigation_url text,
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- expenses
CREATE TABLE public.expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    trip_day_id uuid REFERENCES public.trip_days(id) ON DELETE SET NULL,
    activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    category text,
    description text NOT NULL,
    amount numeric NOT NULL,
    currency text DEFAULT 'EUR' NOT NULL,
    expense_date date,
    payment_method text,
    supplier text,
    is_planned boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- documents
CREATE TABLE public.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    trip_day_id uuid REFERENCES public.trip_days(id) ON DELETE SET NULL,
    activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
    expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
    uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    storage_path text UNIQUE NOT NULL,
    original_filename text NOT NULL,
    mime_type text NOT NULL,
    file_size_bytes bigint NOT NULL,
    document_type text,
    description text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    allowed_for_consultor boolean DEFAULT true NOT NULL
);

-- ----------------------------------------------------
-- 2. ÍNDICES
-- ----------------------------------------------------
CREATE INDEX idx_trips_owner ON public.trips(owner_id);
CREATE INDEX idx_trip_members_trip ON public.trip_members(trip_id);
CREATE INDEX idx_trip_members_user ON public.trip_members(user_id);
CREATE INDEX idx_trip_invitations_trip ON public.trip_invitations(trip_id);
CREATE INDEX idx_trip_invitations_email ON public.trip_invitations(invited_email);
CREATE INDEX idx_trip_invitations_token ON public.trip_invitations(token);
CREATE INDEX idx_trip_days_trip ON public.trip_days(trip_id);
CREATE INDEX idx_activities_trip ON public.activities(trip_id);
CREATE INDEX idx_activities_day ON public.activities(trip_day_id);
CREATE INDEX idx_routes_trip ON public.routes(trip_id);
CREATE INDEX idx_expenses_trip ON public.expenses(trip_id);
CREATE INDEX idx_documents_trip ON public.documents(trip_id);

-- ----------------------------------------------------
-- 3. TRIGGERS & AUTOMATION
-- ----------------------------------------------------

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER tr_profiles_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER tr_trips_update BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER tr_trip_days_update BEFORE UPDATE ON public.trip_days FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER tr_activities_update BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER tr_routes_update BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER tr_expenses_update BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER tr_documents_update BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- Profile creation automation on auth.user registration
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, preferred_currency, preferred_language)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador'),
        NEW.raw_user_meta_data->>'avatar_url',
        'EUR',
        'pt-PT'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user registration trigger
CREATE TRIGGER tr_auth_user_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- ----------------------------------------------------
-- 4. FUNÇÕES DE SEGURANÇA E AUXILIARES
-- ----------------------------------------------------

-- check if user is a member of the trip (owner or viewer)
CREATE OR REPLACE FUNCTION public.is_trip_member(p_trip_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.trip_members
        WHERE trip_id = p_trip_id AND user_id = auth.uid()
    );
$$;

-- check if user is owner of the trip
CREATE OR REPLACE FUNCTION public.is_trip_owner(p_trip_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.trip_members
        WHERE trip_id = p_trip_id AND user_id = auth.uid() AND role = 'owner'
    );
$$;

-- check can view trip (members and owners can view)
CREATE OR REPLACE FUNCTION public.can_view_trip(p_trip_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.trip_members
        WHERE trip_id = p_trip_id AND user_id = auth.uid()
    );
$$;

-- check can edit trip (only owners can edit)
CREATE OR REPLACE FUNCTION public.can_edit_trip(p_trip_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.trip_members
        WHERE trip_id = p_trip_id AND user_id = auth.uid() AND role = 'owner'
    );
$$;

-- ----------------------------------------------------
-- 5. SECURE RPC TRANSACTIONS
-- ----------------------------------------------------

-- Secure RPC to create a trip and add the creator as owner in a single transaction
CREATE OR REPLACE FUNCTION public.create_trip_secure(
    p_title text,
    p_description text,
    p_destination text,
    p_start_date date,
    p_end_date date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_trip_id uuid;
    v_uid uuid;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Utilizador não autenticado.';
    END IF;

    -- 1. Insert Trip
    INSERT INTO public.trips (
        owner_id,
        title,
        description,
        destination,
        start_date,
        end_date,
        status
    )
    VALUES (
        v_uid,
        p_title,
        p_description,
        p_destination,
        p_start_date,
        p_end_date,
        'draft'
    )
    RETURNING id INTO v_new_trip_id;

    -- 2. Insert creator in trip_members as owner
    INSERT INTO public.trip_members (
        trip_id,
        user_id,
        role
    )
    VALUES (
        v_new_trip_id,
        v_uid,
        'owner'
    );

    RETURN v_new_trip_id;
END;
$$;

-- Secure RPC to accept a trip invitation in a transaction
CREATE OR REPLACE FUNCTION public.accept_trip_invitation(
    p_token text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation record;
    v_uid uuid;
    v_user_email text;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Inicie sessão para aceitar este convite.';
    END IF;

    -- Get authenticated user email (lowercase)
    SELECT LOWER(email) INTO v_user_email FROM auth.users WHERE id = v_uid;

    -- Select and lock invitation row
    SELECT * INTO v_invitation
    FROM public.trip_invitations
    WHERE token = p_token
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Convite não encontrado.';
    END IF;

    IF v_invitation.status <> 'pending' THEN
        RAISE EXCEPTION 'Este convite já não está pendente.';
    END IF;

    IF v_invitation.expires_at < now() THEN
        RAISE EXCEPTION 'Este convite expirou.';
    END IF;

    -- Compare normalized emails
    IF LOWER(v_invitation.invited_email) <> v_user_email THEN
        RAISE EXCEPTION 'E-mail incorreto: este convite foi enviado para outro endereço.';
    END IF;

    -- Insert member as viewer
    INSERT INTO public.trip_members (trip_id, user_id, role)
    VALUES (v_invitation.trip_id, v_uid, v_invitation.role)
    ON CONFLICT (trip_id, user_id) DO NOTHING;

    -- Mark invitation accepted
    UPDATE public.trip_invitations
    SET status = 'accepted',
        accepted_by = v_uid,
        accepted_at = now()
    WHERE id = v_invitation.id;

    RETURN v_invitation.trip_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_trip_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_trip_invitation TO authenticated;

-- ----------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "profiles_select_self" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_select_shared" ON public.profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.trip_members tm1
        JOIN public.trip_members tm2 ON tm1.trip_id = tm2.trip_id
        WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id
    )
);

-- Trips Policies
CREATE POLICY "trips_select" ON public.trips FOR SELECT USING (public.can_view_trip(id));
CREATE POLICY "trips_insert" ON public.trips FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "trips_update" ON public.trips FOR UPDATE USING (public.can_edit_trip(id));
CREATE POLICY "trips_delete" ON public.trips FOR DELETE USING (public.can_edit_trip(id));

-- Trip Members Policies
CREATE POLICY "members_select" ON public.trip_members FOR SELECT USING (public.can_view_trip(trip_id));
CREATE POLICY "members_insert" ON public.trip_members FOR INSERT WITH CHECK (public.can_edit_trip(trip_id));
-- owner can update or delete members, except they cannot delete themselves if they are the only owner
CREATE POLICY "members_update" ON public.trip_members FOR UPDATE USING (public.can_edit_trip(trip_id));
CREATE POLICY "members_delete" ON public.trip_members FOR DELETE USING (public.can_edit_trip(trip_id) OR user_id = auth.uid());

-- Trip Invitations Policies
CREATE POLICY "invitations_select" ON public.trip_invitations FOR SELECT USING (public.can_view_trip(trip_id));
CREATE POLICY "invitations_insert" ON public.trip_invitations FOR INSERT WITH CHECK (public.can_edit_trip(trip_id));
CREATE POLICY "invitations_update" ON public.trip_invitations FOR UPDATE USING (public.can_edit_trip(trip_id));
CREATE POLICY "invitations_delete" ON public.trip_invitations FOR DELETE USING (public.can_edit_trip(trip_id));

-- Trip Days Policies
CREATE POLICY "days_select" ON public.trip_days FOR SELECT USING (public.can_view_trip(trip_id));
CREATE POLICY "days_insert" ON public.trip_days FOR INSERT WITH CHECK (public.can_edit_trip(trip_id));
CREATE POLICY "days_update" ON public.trip_days FOR UPDATE USING (public.can_edit_trip(trip_id));
CREATE POLICY "days_delete" ON public.trip_days FOR DELETE USING (public.can_edit_trip(trip_id));

-- Activities Policies
CREATE POLICY "activities_select" ON public.activities FOR SELECT USING (public.can_view_trip(trip_id));
CREATE POLICY "activities_insert" ON public.activities FOR INSERT WITH CHECK (public.can_edit_trip(trip_id));
CREATE POLICY "activities_update" ON public.activities FOR UPDATE USING (public.can_edit_trip(trip_id));
CREATE POLICY "activities_delete" ON public.activities FOR DELETE USING (public.can_edit_trip(trip_id));

-- Routes Policies
CREATE POLICY "routes_select" ON public.routes FOR SELECT USING (public.can_view_trip(trip_id));
CREATE POLICY "routes_insert" ON public.routes FOR INSERT WITH CHECK (public.can_edit_trip(trip_id));
CREATE POLICY "routes_update" ON public.routes FOR UPDATE USING (public.can_edit_trip(trip_id));
CREATE POLICY "routes_delete" ON public.routes FOR DELETE USING (public.can_edit_trip(trip_id));

-- Expenses Policies
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT USING (public.can_view_trip(trip_id));
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT WITH CHECK (public.can_edit_trip(trip_id));
CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE USING (public.can_edit_trip(trip_id));
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE USING (public.can_edit_trip(trip_id));

-- Documents Policies
CREATE POLICY "documents_select" ON public.documents FOR SELECT
USING (
    public.can_view_trip(trip_id) AND (
        allowed_for_consultor = true OR public.can_edit_trip(trip_id)
    )
);
CREATE POLICY "documents_insert" ON public.documents FOR INSERT WITH CHECK (public.can_edit_trip(trip_id));
CREATE POLICY "documents_update" ON public.documents FOR UPDATE USING (public.can_edit_trip(trip_id));
CREATE POLICY "documents_delete" ON public.documents FOR DELETE USING (public.can_edit_trip(trip_id));

-- ----------------------------------------------------
-- 7. STORAGE BUCKET & RLS POLICIES
-- ----------------------------------------------------

-- Insert 'trip-documents' into storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'trip-documents',
    'trip-documents',
    false, -- Private bucket
    10485760, -- 10 MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Objects Policies (RLS is enabled on storage.objects by default in Supabase)

-- 1. SELECT Policy: check if user has read access via can_view_trip.
-- The path structure is: trip_id/document_id/filename.
-- We can split the storage object's name to extract the trip_id.
CREATE POLICY "select_trip_document" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'trip-documents' AND
    public.can_view_trip((string_to_array(name, '/'))[1]::uuid)
);

-- 2. INSERT Policy: check if user has edit access via can_edit_trip.
CREATE POLICY "insert_trip_document" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'trip-documents' AND
    public.can_edit_trip((string_to_array(name, '/'))[1]::uuid) AND
    (owner = auth.uid() OR owner IS NULL)
);

-- 3. UPDATE Policy
CREATE POLICY "update_trip_document" ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'trip-documents' AND
    public.can_edit_trip((string_to_array(name, '/'))[1]::uuid)
);

-- 4. DELETE Policy
CREATE POLICY "delete_trip_document" ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'trip-documents' AND
    public.can_edit_trip((string_to_array(name, '/'))[1]::uuid)
);
