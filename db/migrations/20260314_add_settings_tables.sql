-- Add settings tables for profile, notifications, 2FA, and billing

-- User settings table (for owner and staff)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('owner', 'staff')),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    profile_data JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, user_type)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_user_settings_salon ON user_settings(salon_id);

-- 2FA settings table
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('owner', 'staff')),
    secret VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, user_type)
);

CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user ON two_factor_auth(user_id, user_type);

-- Billing information table
CREATE TABLE IF NOT EXISTS billing_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
    plan VARCHAR(50) DEFAULT 'free',
    payment_method JSONB,
    billing_address JSONB,
    subscription_start TIMESTAMP WITH TIME ZONE,
    subscription_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_info_salon ON billing_info(salon_id);
CREATE INDEX IF NOT EXISTS idx_billing_info_owner ON billing_info(owner_id);

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'push')),
    subject TEXT,
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_salon ON notification_templates(salon_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);

-- Notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    user_id UUID,
    user_type VARCHAR(20) CHECK (user_type IN ('owner', 'staff', 'client')),
    template_id UUID REFERENCES notification_templates(id),
    type VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_salon ON notification_logs(salon_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at);
