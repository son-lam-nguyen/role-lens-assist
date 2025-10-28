-- Add client_id to recordings table
ALTER TABLE public.recordings 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_recordings_client_id ON public.recordings(client_id);

-- Update RLS policy to include client access
DROP POLICY IF EXISTS "Users can view their own recordings" ON public.recordings;

CREATE POLICY "Users can view their own recordings" 
ON public.recordings 
FOR SELECT 
USING (auth.uid() = user_id);