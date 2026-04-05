CREATE TABLE IF NOT EXISTS client_beauty_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    client_id UUID NOT NULL,
    salon_id UUID NOT NULL,

    hair_profile JSONB DEFAULT '{}'::jsonb,
    skin_profile JSONB DEFAULT '{}'::jsonb,

    allergies TEXT[],
    stylist_preferences JSONB DEFAULT '{}'::jsonb,

    notes TEXT,

    color_formula_history JSONB DEFAULT '[]'::jsonb,
    photo_references JSONB DEFAULT '[]'::jsonb,

    last_visit TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_profile_client
        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_profile_salon
        FOREIGN KEY (salon_id)
        REFERENCES salons(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_client_profile
        UNIQUE (client_id, salon_id)
);

CREATE INDEX IF NOT EXISTS idx_beauty_profile_client
ON client_beauty_profiles(client_id);

CREATE INDEX IF NOT EXISTS idx_beauty_profile_salon
ON client_beauty_profiles(salon_id);

CREATE INDEX IF NOT EXISTS idx_beauty_profile_last_visit
ON client_beauty_profiles(last_visit);
