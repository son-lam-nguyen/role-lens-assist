import { supabase } from "@/integrations/supabase/client";

export interface Conversation {
  id: string;
  client_id: string;
  worker_id: string | null;
  status: 'waiting' | 'active' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sender_type: 'client' | 'worker';
  created_at: string;
}

export const conversationStore = {
  async createConversation(clientId: string): Promise<{ data: Conversation | null; error: any }> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        client_id: clientId,
        status: 'waiting'
      })
      .select()
      .single();
    
    return { data: data as Conversation | null, error };
  },

  async getWorkerConversations(workerId: string): Promise<{ data: Conversation[] | null; error: any }> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('worker_id', workerId)
      .order('updated_at', { ascending: false });
    
    return { data: data as Conversation[] | null, error };
  },

  async getWaitingConversations(): Promise<{ data: Conversation[] | null; error: any }> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: true });
    
    return { data: data as Conversation[] | null, error };
  },

  async claimConversation(conversationId: string, workerId: string): Promise<{ data: Conversation | null; error: any }> {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        worker_id: workerId,
        status: 'active'
      })
      .eq('id', conversationId)
      .select()
      .single();
    
    return { data: data as Conversation | null, error };
  },

  async closeConversation(conversationId: string): Promise<{ data: Conversation | null; error: any }> {
    const { data, error } = await supabase
      .from('conversations')
      .update({ status: 'closed' })
      .eq('id', conversationId)
      .select()
      .single();
    
    return { data: data as Conversation | null, error };
  }
};

export const messageStore = {
  async getMessages(conversationId: string): Promise<{ data: Message[] | null; error: any }> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    return { data: data as Message[] | null, error };
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    senderType: 'client' | 'worker'
  ): Promise<{ data: Message | null; error: any }> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        sender_type: senderType
      })
      .select()
      .single();
    
    return { data: data as Message | null, error };
  },

  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => callback(payload.new as Message)
      )
      .subscribe();
    
    return channel;
  }
};
