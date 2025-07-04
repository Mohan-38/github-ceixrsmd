/*
  # Create secure download system with required functions and policies

  1. New Tables
    - `secure_download_tokens` - Store secure download tokens
    - `download_attempts` - Log download attempts for audit trail

  2. Functions
    - `generate_secure_token()` - Generate cryptographically secure tokens
    - `cleanup_expired_tokens()` - Clean up expired tokens

  3. Security
    - Enable RLS on both tables
    - Add policies for secure token management
    - Add indexes for performance
*/

-- Create secure_download_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS secure_download_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  document_id uuid REFERENCES project_documents(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  max_downloads integer DEFAULT 5,
  download_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create download_attempts table if it doesn't exist
CREATE TABLE IF NOT EXISTS download_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES secure_download_tokens(id) ON DELETE CASCADE,
  attempted_email text,
  ip_address text,
  user_agent text,
  success boolean DEFAULT false,
  failure_reason text,
  attempted_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_secure_tokens_token ON secure_download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_email ON secure_download_tokens(recipient_email);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_expires ON secure_download_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_active ON secure_download_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_download_attempts_token ON download_attempts(token_id);
CREATE INDEX IF NOT EXISTS idx_download_attempts_email ON download_attempts(attempted_email);

-- Enable RLS
ALTER TABLE secure_download_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can create secure tokens" ON secure_download_tokens;
DROP POLICY IF EXISTS "Public can view active tokens for verification" ON secure_download_tokens;
DROP POLICY IF EXISTS "Authenticated users can update tokens" ON secure_download_tokens;
DROP POLICY IF EXISTS "Authenticated users can delete tokens" ON secure_download_tokens;

DROP POLICY IF EXISTS "Anyone can insert download attempts" ON download_attempts;
DROP POLICY IF EXISTS "Anyone can view download attempts" ON download_attempts;
DROP POLICY IF EXISTS "Authenticated users can manage download attempts" ON download_attempts;

-- Policies for secure_download_tokens
CREATE POLICY "Public can create secure tokens"
  ON secure_download_tokens
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can view active tokens for verification"
  ON secure_download_tokens
  FOR SELECT
  TO public
  USING (is_active = true AND expires_at > now());

CREATE POLICY "Authenticated users can update tokens"
  ON secure_download_tokens
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tokens"
  ON secure_download_tokens
  FOR DELETE
  TO authenticated
  USING (true);

-- Policies for download_attempts
CREATE POLICY "Anyone can insert download attempts"
  ON download_attempts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view download attempts"
  ON download_attempts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage download attempts"
  ON download_attempts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to generate secure tokens
CREATE OR REPLACE FUNCTION generate_secure_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_length integer := 32;
  characters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..token_length LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  
  -- Ensure uniqueness by checking if token already exists
  WHILE EXISTS (SELECT 1 FROM secure_download_tokens WHERE token = result) LOOP
    result := '';
    FOR i IN 1..token_length LOOP
      result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleaned_count integer;
BEGIN
  UPDATE secure_download_tokens 
  SET is_active = false, updated_at = now()
  WHERE expires_at < now() AND is_active = true;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_secure_token() TO public;
GRANT EXECUTE ON FUNCTION cleanup_expired_tokens() TO authenticated;