/**
 * Extension Sessions Table
 * 
 * Stores active extension sessions for secure token management
 * Enables:
 * - Device-level logout
 * - Token revocation
 * - Session tracking
 * - Multi-device management
 */

-- Create extension_sessions table
CREATE TABLE IF NOT EXISTS extension_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session identification
  session_token_hash TEXT NOT NULL UNIQUE, -- Hash of the JWT (for DB lookup)
  device_name TEXT, -- e.g., "Chrome on MacOS", "Safari on iPhone"
  device_id TEXT, -- Unique device identifier
  browser TEXT, -- Browser name and version
  os TEXT, -- OS name and version
  
  -- Session state
  is_active BOOLEAN DEFAULT TRUE,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoke_reason TEXT, -- e.g., "user_logout", "token_expired", "suspicious_activity"
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Indexes for fast lookups
  CONSTRAINT valid_session CHECK (
    (is_active AND NOT is_revoked) OR (NOT is_active OR is_revoked)
  )
);

-- Create indexes for common queries
CREATE INDEX idx_extension_sessions_user_id ON extension_sessions(user_id);
CREATE INDEX idx_extension_sessions_user_active ON extension_sessions(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_extension_sessions_token_hash ON extension_sessions(session_token_hash);
CREATE INDEX idx_extension_sessions_device_id ON extension_sessions(device_id);
CREATE INDEX idx_extension_sessions_expires_at ON extension_sessions(expires_at);
CREATE INDEX idx_extension_sessions_last_used ON extension_sessions(last_used_at DESC);

-- Enable RLS
ALTER TABLE extension_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own sessions
CREATE POLICY "Users can view their own sessions"
  ON extension_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only the backend can create/update sessions
CREATE POLICY "Only service role can manage sessions"
  ON extension_sessions
  FOR ALL
  USING (FALSE) -- Prevents direct access; backend Edge Functions will bypass with service_role key
  WITH CHECK (FALSE);

-- Create function to hash tokens (for security)
CREATE OR REPLACE FUNCTION hash_extension_token(token TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use PostgreSQL pgcrypto extension for hashing
  RETURN encode(digest(token, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_extension_sessions()
RETURNS void AS $$
BEGIN
  -- Mark expired sessions as inactive
  UPDATE extension_sessions
  SET is_active = FALSE
  WHERE expires_at < NOW() AND is_active = TRUE;
  
  -- Delete old revoked sessions (older than 30 days)
  DELETE FROM extension_sessions
  WHERE is_revoked = TRUE 
    AND revoked_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_used_at
CREATE OR REPLACE FUNCTION update_extension_session_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE extension_sessions IS 'Stores extension session tokens for secure authentication and device management';
COMMENT ON COLUMN extension_sessions.session_token_hash IS 'SHA256 hash of JWT token - used for DB lookup without exposing token';
COMMENT ON COLUMN extension_sessions.is_active IS 'Session is currently valid and not expired';
COMMENT ON COLUMN extension_sessions.is_revoked IS 'Session has been explicitly revoked (logout/suspicious activity)';
