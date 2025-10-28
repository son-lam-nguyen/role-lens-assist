-- Remove the foreign key constraint on worker_id since workers use mock auth
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_worker_id_fkey;

-- worker_id will now just be a UUID field without foreign key constraint
-- This allows worker session IDs (stored in localStorage) to be used directly