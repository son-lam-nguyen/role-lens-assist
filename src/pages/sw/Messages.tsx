import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { conversationStore, messageStore, Conversation, Message } from "@/lib/messages/store";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Clock, CheckCircle2, User } from "lucide-react";

const Messages = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [waitingConversations, setWaitingConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadConversations();
      loadWaitingConversations();
    }
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      
      const channel = messageStore.subscribeToMessages(selectedConversation.id, (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
      });

      return () => {
        channel.unsubscribe();
      };
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    if (!userId) return;
    const { data, error } = await conversationStore.getWorkerConversations(userId);
    if (error) {
      toast({
        title: "Error loading conversations",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      setConversations(data);
    }
  };

  const loadWaitingConversations = async () => {
    const { data, error } = await conversationStore.getWaitingConversations();
    if (error) {
      toast({
        title: "Error loading waiting conversations",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      setWaitingConversations(data);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await messageStore.getMessages(conversationId);
    if (error) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      setMessages(data);
    }
  };

  const handleClaimConversation = async (conversationId: string) => {
    if (!userId) return;
    const { data, error } = await conversationStore.claimConversation(conversationId, userId);
    if (error) {
      toast({
        title: "Error claiming conversation",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      toast({
        title: "Conversation claimed",
        description: "You can now chat with the client"
      });
      loadConversations();
      loadWaitingConversations();
      setSelectedConversation(data);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedConversation || !userId || isLoading) return;

    setIsLoading(true);
    const { error } = await messageStore.sendMessage(
      selectedConversation.id,
      userId,
      input.trim(),
      'worker'
    );

    if (error) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setInput("");
    }
    setIsLoading(false);
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation) return;
    const { error } = await conversationStore.closeConversation(selectedConversation.id);
    if (error) {
      toast({
        title: "Error closing conversation",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Conversation closed",
        description: "The conversation has been marked as closed"
      });
      setSelectedConversation(null);
      loadConversations();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Client Messages</h1>
        <p className="text-muted-foreground text-lg">
          Respond to client requests for human support
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
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

        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
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
                <ScrollArea className="flex-1 pr-4 min-h-[400px]">
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
