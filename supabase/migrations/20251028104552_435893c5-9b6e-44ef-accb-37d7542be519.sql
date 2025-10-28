-- Add a client_secret to conversations to authenticate guest clients via edge functions
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS client_secret uuid NOT NULL DEFAULT gen_random_uuid();

-- No policy changes needed; edge functions will use service role for guest actions