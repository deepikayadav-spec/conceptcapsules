
-- Create user_sessions table
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_identifier TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'fingerprint',
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on user_identifier to allow upsert
CREATE UNIQUE INDEX idx_user_sessions_identifier ON public.user_sessions (user_identifier);

-- Create index for active users query
CREATE INDEX idx_user_sessions_last_active ON public.user_sessions (last_active_at);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Public insert (upsert) - no auth required
CREATE POLICY "Anyone can insert sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (true);

-- Public select for admin analytics
CREATE POLICY "Anyone can view sessions"
ON public.user_sessions
FOR SELECT
USING (true);

-- Public update for heartbeat
CREATE POLICY "Anyone can update sessions"
ON public.user_sessions
FOR UPDATE
USING (true);
