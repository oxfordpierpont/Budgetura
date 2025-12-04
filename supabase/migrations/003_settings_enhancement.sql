-- ============================================================================
-- Budgetura - Settings Enhancement Migration
-- Version: 003
-- Created: 2025-12-04
-- Description: Adds user settings, AI configuration, and Plaid admin config
-- ============================================================================

-- ============================================================================
-- 1. ENABLE ENCRYPTION EXTENSION
-- ============================================================================

-- Enable pgcrypto for encryption functionality
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 2. ENCRYPTION/DECRYPTION FUNCTIONS
-- ============================================================================

-- Function to encrypt sensitive data using Supabase Vault
CREATE OR REPLACE FUNCTION encrypt_secret(secret TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Retrieve encryption key from Supabase Vault
  -- Note: This requires setting up a secret in Supabase Vault named 'encryption_key'
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'encryption_key'
  LIMIT 1;

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in vault';
  END IF;

  -- Encrypt and encode as base64
  RETURN encode(
    pgp_sym_encrypt(secret, encryption_key),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data using Supabase Vault
CREATE OR REPLACE FUNCTION decrypt_secret(encrypted_secret TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Retrieve encryption key from Supabase Vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'encryption_key'
  LIMIT 1;

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in vault';
  END IF;

  -- Decode and decrypt
  RETURN pgp_sym_decrypt(
    decode(encrypted_secret, 'base64'),
    encryption_key
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. EXTEND USER_PROFILES TABLE
-- ============================================================================

-- Add general configuration columns to existing user_profiles table
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '$',
  ADD COLUMN IF NOT EXISTS default_interest_rate DECIMAL(5,2) DEFAULT 18.00
    CHECK (default_interest_rate >= 0 AND default_interest_rate <= 100),
  ADD COLUMN IF NOT EXISTS payoff_strategy TEXT DEFAULT 'avalanche'
    CHECK (payoff_strategy IN ('avalanche', 'snowball', 'custom')),
  ADD COLUMN IF NOT EXISTS snapshot_frequency TEXT DEFAULT 'monthly'
    CHECK (snapshot_frequency IN ('weekly', 'monthly', 'quarterly')),
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.currency_symbol IS 'User preferred currency symbol (e.g., $, €, £)';
COMMENT ON COLUMN user_profiles.default_interest_rate IS 'Default interest rate for calculations (percentage)';
COMMENT ON COLUMN user_profiles.payoff_strategy IS 'Debt payoff strategy: avalanche (highest interest first) or snowball (lowest balance first)';
COMMENT ON COLUMN user_profiles.snapshot_frequency IS 'How often to take debt snapshots for progress tracking';
COMMENT ON COLUMN user_profiles.email_notifications IS 'Whether to send email notifications for important events';

-- ============================================================================
-- 4. AI SETTINGS TABLE
-- ============================================================================

-- Create table for per-user AI configuration
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openrouter', 'openai', 'anthropic')),
  api_key_encrypted TEXT NOT NULL, -- Encrypted API key using pgcrypto
  model TEXT NOT NULL,
  custom_model_id TEXT,
  temperature DECIMAL(2,1) DEFAULT 0.7
    CHECK (temperature >= 0 AND temperature <= 1),
  max_tokens INTEGER DEFAULT 2000
    CHECK (max_tokens > 0 AND max_tokens <= 128000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add helpful comments
COMMENT ON TABLE ai_settings IS 'Stores per-user AI provider configuration with encrypted API keys';
COMMENT ON COLUMN ai_settings.provider IS 'AI provider: openrouter, openai, or anthropic';
COMMENT ON COLUMN ai_settings.api_key_encrypted IS 'Encrypted API key (never exposed to client)';
COMMENT ON COLUMN ai_settings.model IS 'Model identifier (e.g., anthropic/claude-3.5-sonnet)';
COMMENT ON COLUMN ai_settings.custom_model_id IS 'Custom model ID if using non-standard model';
COMMENT ON COLUMN ai_settings.temperature IS 'Sampling temperature (0.0 = deterministic, 1.0 = creative)';
COMMENT ON COLUMN ai_settings.max_tokens IS 'Maximum tokens for AI responses';

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_ai_settings_user_id ON ai_settings(user_id);

-- ============================================================================
-- 5. PLAID CONFIGURATION TABLE
-- ============================================================================

-- Create table for admin-managed Plaid API credentials
CREATE TABLE IF NOT EXISTS plaid_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id_encrypted TEXT NOT NULL,
  secret_encrypted TEXT NOT NULL,
  environment TEXT NOT NULL
    CHECK (environment IN ('sandbox', 'development', 'production')),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add helpful comments
COMMENT ON TABLE plaid_config IS 'Stores admin-managed Plaid API credentials (admin access only)';
COMMENT ON COLUMN plaid_config.client_id_encrypted IS 'Encrypted Plaid Client ID';
COMMENT ON COLUMN plaid_config.secret_encrypted IS 'Encrypted Plaid Secret';
COMMENT ON COLUMN plaid_config.environment IS 'Plaid environment: sandbox, development, or production';
COMMENT ON COLUMN plaid_config.is_active IS 'Whether this configuration is currently active';

-- Create index for environment lookups
CREATE INDEX IF NOT EXISTS idx_plaid_config_environment ON plaid_config(environment)
  WHERE is_active = TRUE;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AI Settings RLS Policies
-- ============================================================================

-- Users can view their own AI settings
CREATE POLICY "Users can view own AI settings"
ON ai_settings FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own AI settings
CREATE POLICY "Users can insert own AI settings"
ON ai_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own AI settings
CREATE POLICY "Users can update own AI settings"
ON ai_settings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own AI settings
CREATE POLICY "Users can delete own AI settings"
ON ai_settings FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- Plaid Config RLS Policies
-- ============================================================================

-- Only admins can view Plaid configuration
CREATE POLICY "Admins can view Plaid config"
ON plaid_config FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = users.id
    AND (users.raw_user_meta_data->>'role' = 'admin'
         OR users.raw_app_meta_data->>'role' = 'admin')
  )
);

-- Only admins can insert Plaid configuration
CREATE POLICY "Admins can insert Plaid config"
ON plaid_config FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = users.id
    AND (users.raw_user_meta_data->>'role' = 'admin'
         OR users.raw_app_meta_data->>'role' = 'admin')
  )
);

-- Only admins can update Plaid configuration
CREATE POLICY "Admins can update Plaid config"
ON plaid_config FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = users.id
    AND (users.raw_user_meta_data->>'role' = 'admin'
         OR users.raw_app_meta_data->>'role' = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = users.id
    AND (users.raw_user_meta_data->>'role' = 'admin'
         OR users.raw_app_meta_data->>'role' = 'admin')
  )
);

-- Only admins can delete Plaid configuration
CREATE POLICY "Admins can delete Plaid config"
ON plaid_config FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = users.id
    AND (users.raw_user_meta_data->>'role' = 'admin'
         OR users.raw_app_meta_data->>'role' = 'admin')
  )
);

-- ============================================================================
-- 7. UPDATED_AT TRIGGER FUNCTIONS
-- ============================================================================

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to ai_settings table
DROP TRIGGER IF EXISTS update_ai_settings_updated_at ON ai_settings;
CREATE TRIGGER update_ai_settings_updated_at
  BEFORE UPDATE ON ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to plaid_config table
DROP TRIGGER IF EXISTS update_plaid_config_updated_at ON plaid_config;
CREATE TRIGGER update_plaid_config_updated_at
  BEFORE UPDATE ON plaid_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. HELPER FUNCTIONS FOR AI SETTINGS
-- ============================================================================

-- Function to get AI settings with decrypted key (service role only)
CREATE OR REPLACE FUNCTION get_ai_settings_decrypted(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  provider TEXT,
  api_key TEXT,
  model TEXT,
  custom_model_id TEXT,
  temperature DECIMAL,
  max_tokens INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai_settings.id,
    ai_settings.provider,
    decrypt_secret(ai_settings.api_key_encrypted) as api_key,
    ai_settings.model,
    ai_settings.custom_model_id,
    ai_settings.temperature,
    ai_settings.max_tokens
  FROM ai_settings
  WHERE ai_settings.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save AI settings with encryption
CREATE OR REPLACE FUNCTION save_ai_settings_encrypted(
  p_user_id UUID,
  p_provider TEXT,
  p_api_key TEXT,
  p_model TEXT,
  p_custom_model_id TEXT,
  p_temperature DECIMAL,
  p_max_tokens INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Insert or update AI settings
  INSERT INTO ai_settings (
    user_id,
    provider,
    api_key_encrypted,
    model,
    custom_model_id,
    temperature,
    max_tokens
  ) VALUES (
    p_user_id,
    p_provider,
    encrypt_secret(p_api_key),
    p_model,
    p_custom_model_id,
    p_temperature,
    p_max_tokens
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    provider = EXCLUDED.provider,
    api_key_encrypted = EXCLUDED.api_key_encrypted,
    model = EXCLUDED.model,
    custom_model_id = EXCLUDED.custom_model_id,
    temperature = EXCLUDED.temperature,
    max_tokens = EXCLUDED.max_tokens,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. HELPER FUNCTIONS FOR PLAID CONFIG
-- ============================================================================

-- Function to get active Plaid config with decrypted credentials (service role only)
CREATE OR REPLACE FUNCTION get_plaid_config_decrypted()
RETURNS TABLE (
  id UUID,
  client_id TEXT,
  secret TEXT,
  environment TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    plaid_config.id,
    decrypt_secret(plaid_config.client_id_encrypted) as client_id,
    decrypt_secret(plaid_config.secret_encrypted) as secret,
    plaid_config.environment,
    plaid_config.is_active
  FROM plaid_config
  WHERE plaid_config.is_active = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save Plaid config with encryption
CREATE OR REPLACE FUNCTION save_plaid_config_encrypted(
  p_client_id TEXT,
  p_secret TEXT,
  p_environment TEXT,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Deactivate all existing configs
  UPDATE plaid_config SET is_active = FALSE;

  -- Insert new config
  INSERT INTO plaid_config (
    client_id_encrypted,
    secret_encrypted,
    environment,
    is_active,
    created_by
  ) VALUES (
    encrypt_secret(p_client_id),
    encrypt_secret(p_secret),
    p_environment,
    TRUE,
    p_created_by
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. GRANTS
-- ============================================================================

-- Grant execute permissions on encryption functions to authenticated users
GRANT EXECUTE ON FUNCTION encrypt_secret(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_secret(TEXT) TO service_role;

-- Grant execute permissions on AI settings functions
GRANT EXECUTE ON FUNCTION get_ai_settings_decrypted(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION save_ai_settings_encrypted(UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL, INTEGER) TO authenticated;

-- Grant execute permissions on Plaid config functions
GRANT EXECUTE ON FUNCTION get_plaid_config_decrypted() TO service_role;
GRANT EXECUTE ON FUNCTION save_plaid_config_encrypted(TEXT, TEXT, TEXT, UUID) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Settings Enhancement Migration (003) completed successfully';
  RAISE NOTICE '- Extended user_profiles with general settings columns';
  RAISE NOTICE '- Created ai_settings table with encrypted API keys';
  RAISE NOTICE '- Created plaid_config table with encrypted credentials';
  RAISE NOTICE '- Applied RLS policies for security';
  RAISE NOTICE '- Created helper functions for encryption/decryption';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Set up encryption_key in Supabase Vault before using AI/Plaid features';
  RAISE NOTICE 'IMPORTANT: Configure Google OAuth in Supabase Dashboard for Google sign-in';
END $$;
