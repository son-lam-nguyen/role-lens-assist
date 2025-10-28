-- Remove the foreign key constraint on sender_id since workers use mock auth
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- sender_id will now just be a UUID field without foreign key constraint
-- This allows both client secrets and worker session IDs to be used directly