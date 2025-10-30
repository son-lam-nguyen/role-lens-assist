-- Allow clients to view their own conversations
CREATE POLICY "Clients can view their own conversations"
ON conversations
FOR SELECT
TO public
USING (auth.uid() = client_id);

-- Allow clients to update their own conversations (for closing)
CREATE POLICY "Clients can update their own conversations"
ON conversations
FOR UPDATE
TO public
USING (auth.uid() = client_id);