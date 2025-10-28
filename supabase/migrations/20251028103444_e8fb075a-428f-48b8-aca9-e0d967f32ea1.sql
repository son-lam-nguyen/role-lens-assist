-- Create conversations table to track client-worker chats
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  worker_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, active, closed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  sender_type TEXT NOT NULL, -- 'client' or 'worker'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Workers can view conversations assigned to them"
ON public.conversations
FOR SELECT
USING (auth.uid() = worker_id);

CREATE POLICY "Workers can update their conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() = worker_id);

CREATE POLICY "Anyone can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (client_id = auth.uid() OR worker_id = auth.uid())
  )
);

CREATE POLICY "Users can create messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (client_id = auth.uid() OR worker_id = auth.uid())
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;