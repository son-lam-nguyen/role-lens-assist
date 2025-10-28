-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Workers can view conversations assigned to them" ON public.conversations;

-- Create new policy that allows workers to see both assigned AND waiting conversations
CREATE POLICY "Workers can view their conversations and waiting ones"
ON public.conversations
FOR SELECT
USING (
  auth.uid() = worker_id OR status = 'waiting'
);