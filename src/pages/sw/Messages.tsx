import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Conversation, Message } from "@/lib/messages/store";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Clock, CheckCircle2, User } from "lucide-react";

const Messages = () => {
  const { toast } = useToast();
  const [workerSessionId] = useState(() => {
    // Create or retrieve worker session ID
    let sessionId = localStorage.getItem('worker_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('worker_session_id', sessionId);
    }
    return sessionId;
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [waitingConversations, setWaitingConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);

  useEffect(() => {
    loadConversations();
    // Poll for new conversations every 5 seconds
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [workerSessionId]);

  useEffect(() => {
    // Only auto-scroll if a new message arrived AND user is at bottom
    const hasNewMessage = messages.length > previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;

    if (!hasNewMessage) return;

    const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollArea) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const isAtBottom = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < 100;
    
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => loadMessages(selectedConversation.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-worker-conversations', {
        body: { worker_session_id: workerSessionId }
      });

      if (error) throw error;
      
      if (data) {
        setWaitingConversations(data.waiting || []);
        setConversations(data.active || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-conversation-messages', {
        body: {
          conversation_id: conversationId,
          worker_session_id: workerSessionId
        }
      });

      if (error) throw error;
      
      if (data?.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleClaimConversation = async (conversationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('claim-conversation', {
        body: {
          conversation_id: conversationId,
          worker_session_id: workerSessionId
        }
      });

      if (error) throw error;
      
      if (data?.conversation) {
        toast({
          title: "Conversation claimed",
          description: "You can now chat with the client"
        });
        loadConversations();
        setSelectedConversation(data.conversation);
      }
    } catch (error) {
      console.error('Error claiming conversation:', error);
      toast({
        title: "Error claiming conversation",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedConversation || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-worker-message', {
        body: {
          conversation_id: selectedConversation.id,
          worker_session_id: workerSessionId,
          content: input.trim()
        }
      });

      if (error) throw error;
      
      setInput("");
      loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation) return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'closed' })
        .eq('id', selectedConversation.id);
        
      if (error) throw error;
      
      toast({
        title: "Conversation closed",
        description: "The conversation has been marked as closed"
      });
      setSelectedConversation(null);
      loadConversations();
    } catch (error) {
      console.error('Error closing conversation:', error);
      toast({
        title: "Error closing conversation",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="bg-gradient-to-r from-pink-600/5 via-primary/5 to-transparent rounded-2xl p-6 border border-pink-600/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Client Messages</h1>
        </div>
        <p className="text-foreground/70 text-base ml-13">
          Respond to client requests for human support
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 card-hover border-l-4 border-l-warning bg-gradient-to-br from-warning/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              Waiting for Support
            </CardTitle>
            <CardDescription>
              {waitingConversations.length} client(s) waiting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {waitingConversations.map((conv) => (
                  <Card
                    key={conv.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleClaimConversation(conv.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm">Client Request</span>
                        </div>
                        <Badge variant="outline">Claim</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(conv.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {waitingConversations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No waiting conversations
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <Separator className="my-4" />

          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Your Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <Card
                    key={conv.id}
                    className={`cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">Client Chat</span>
                        </div>
                        <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                          {conv.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(conv.updated_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {conversations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active conversations
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col card-hover border-l-4 border-l-pink-600 bg-gradient-to-br from-pink-600/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-600/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-pink-600" />
                  </div>
                  Chat
                </CardTitle>
                <CardDescription>
                  {selectedConversation ? "Active conversation with client" : "Select a conversation to start"}
                </CardDescription>
              </div>
              {selectedConversation && selectedConversation.status === 'active' && (
                <Button variant="outline" size="sm" onClick={handleCloseConversation}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Close Chat
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-4">
            {selectedConversation ? (
              <>
                <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4 min-h-[400px]">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.sender_type === 'worker' ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.sender_type === 'client' && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                            message.sender_type === 'worker'
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        {message.sender_type === 'worker' && (
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                            <MessageSquare className="w-5 h-5 text-accent" />
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {selectedConversation.status === 'active' && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Select a conversation to view messages</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
