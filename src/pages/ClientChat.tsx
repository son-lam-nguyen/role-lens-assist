import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Navbar } from "@/components/supportlens/Navbar";
import { CrisisBanner } from "@/components/supportlens/CrisisBanner";
import { ChatMessage, generateChatbotResponse, quickReplies, detectCrisis } from "@/lib/mock/mockChatbot";
import { mockPsychoedSnippets } from "@/lib/mock/mockPsychoed";
import { crisisContactsAU } from "@/lib/mock/mockSettings";
import { conversationStore, messageStore, Message } from "@/lib/messages/store";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, User, Library, Phone, Mic, Square, MessageSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ClientChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm here to provide mental health information and coping strategies. I can't diagnose or prescribe, but I can share evidence-based techniques and connect you with professional support. How can I help today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [humanSupportMode, setHumanSupportMode] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef<string>("");
  const previousMessageCountRef = useRef(0);

  // Initialize or retrieve session ID
  useEffect(() => {
    let sessionId = localStorage.getItem("client_chat_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("client_chat_session_id", sessionId);
    }
    sessionIdRef.current = sessionId;
  }, []);

  useEffect(() => {
    // Only auto-scroll if a new message arrived AND user is at bottom
    const hasNewMessage = messages.length > previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;

    if (!hasNewMessage) return;

    const scrollArea = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
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
    if (conversationId && humanSupportMode) {
      // Check if this is a guest conversation
      const guestData = localStorage.getItem('guest_conversation');
      const isGuest = !!guestData;

      if (isGuest) {
        // Poll for messages for guest users
        const pollInterval = setInterval(async () => {
          try {
            const guest = JSON.parse(guestData);
            const { data, error } = await supabase.functions.invoke('get-guest-messages', {
              body: {
                conversation_id: guest.conversation_id,
                client_secret: guest.client_secret,
                guest_id: guest.guest_id
              }
            });

            if (error) throw error;
            if (data?.messages) {
              const workerMessages = data.messages
                .filter((m: Message) => m.sender_type === 'worker')
                .map((m: Message) => ({
                  id: m.id,
                  role: "assistant" as const,
                  content: m.content,
                  timestamp: m.created_at,
                }));
              
              setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newMessages = workerMessages.filter((m: ChatMessage) => !existingIds.has(m.id));
                return [...prev, ...newMessages];
              });
            }
          } catch (error) {
            console.error('Error polling messages:', error);
          }
        }, 3000);

        return () => clearInterval(pollInterval);
      } else {
        // Use realtime for authenticated users
        const channel = messageStore.subscribeToMessages(conversationId, (newMessage: Message) => {
          if (newMessage.sender_type === 'worker') {
            const assistantMessage: ChatMessage = {
              id: newMessage.id,
              role: "assistant",
              content: newMessage.content,
              timestamp: newMessage.created_at,
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }
        });

        return () => {
          channel.unsubscribe();
        };
      }
    }
  }, [conversationId, humanSupportMode]);

  const requestHumanSupport = async () => {
    setIsLoading(true);
    try {
      // Try authenticated user first
      const { data: { user } } = await supabase.auth.getUser();
      
      let clientId: string;
      let clientSecret: string | undefined;
      let conversationIdResult: string;

      if (user?.id) {
        // Authenticated user - use normal flow
        clientId = user.id;
        const { data, error } = await conversationStore.createConversation(clientId);
        if (error) throw error;
        if (!data) throw new Error("Failed to create conversation");
        conversationIdResult = data.id;
      } else {
        // Guest user - use edge function
        const { data, error } = await supabase.functions.invoke('create-guest-conversation');
        
        if (error) throw error;
        if (!data) throw new Error("Failed to create conversation");
        
        conversationIdResult = data.conversation_id;
        clientSecret = data.client_secret;
        clientId = data.guest_id;
        
        // Store guest credentials in localStorage
        localStorage.setItem('guest_conversation', JSON.stringify({
          conversation_id: conversationIdResult,
          client_secret: clientSecret,
          guest_id: clientId
        }));
      }

      setConversationId(conversationIdResult);
      setHumanSupportMode(true);
      
      const systemMessage: ChatMessage = {
        id: `system_${Date.now()}`,
        role: "assistant",
        content: "You've been connected to the support request queue. A support worker will join the chat shortly.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, systemMessage]);

      toast({
        title: "Support Requested",
        description: "A support worker will join shortly"
      });
    } catch (error) {
      console.error("Failed to request human support:", error);
      toast({
        title: "Error",
        description: "Failed to request support. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseHumanSupport = async () => {
    if (!conversationId) return;

    try {
      // Close the conversation in database
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'closed' })
        .eq('id', conversationId);

      if (error) throw error;

      // Clear guest conversation data
      localStorage.removeItem('guest_conversation');

      // Post system message
      const systemMessage: ChatMessage = {
        id: `system_${Date.now()}`,
        role: "assistant",
        content: "You have ended the support worker chat. You're now back with the AI assistant. How can I help you?",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, systemMessage]);

      // Switch back to AI mode
      setHumanSupportMode(false);
      setConversationId(null);

      toast({
        title: "Chat Ended",
        description: "You're now back with the AI assistant"
      });
    } catch (error) {
      console.error("Failed to close conversation:", error);
      toast({
        title: "Error",
        description: "Failed to close chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input;
    setInput("");
    setIsLoading(true);

    // Check for crisis keywords
    if (detectCrisis(messageText)) {
      setShowCrisisBanner(true);
    }

    // If in human support mode, send to support worker
    if (humanSupportMode && conversationId) {
      try {
        // Check if this is a guest conversation
        const guestData = localStorage.getItem('guest_conversation');
        
        if (guestData) {
          // Guest user - use edge function
          const guest = JSON.parse(guestData);
          const { error } = await supabase.functions.invoke('send-guest-message', {
            body: {
              conversation_id: guest.conversation_id,
              client_secret: guest.client_secret,
              guest_id: guest.guest_id,
              content: messageText
            }
          });
          
          if (error) throw error;
        } else {
          // Authenticated user - use normal flow
          const { data: { user } } = await supabase.auth.getUser();
          if (!user?.id) {
            throw new Error("User session not found");
          }
          
          await messageStore.sendMessage(conversationId, user.id, messageText, 'client');
        }
        
        setIsLoading(false);
        return;
      } catch (error) {
        console.error("Failed to send message to worker:", error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
    }

    // Send text to n8n webhook and get response
    try {
      const formData = new FormData();
      formData.append("text", messageText);
      formData.append("type", "text");
      formData.append("timestamp", new Date().toISOString());
      formData.append("session_id", sessionIdRef.current);

      const webhookResponse = await fetch(
        "https://n8n.birthdaymessaging.space/webhook/913c546c-124f-4347-a34d-1b70a6f89d4d",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!webhookResponse.ok) {
        throw new Error(`Webhook returned ${webhookResponse.status}`);
      }

      const responseData = await webhookResponse.json();

      // Extract the response text from webhook
      const responseText =
        responseData.output ||
        responseData.response ||
        responseData.message ||
        responseData.text ||
        "I received your message.";

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: responseText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to get response from webhook:", error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content:
          "I apologize, but I encountered an error. Please try again or contact your support worker for assistance.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await sendAudioToWebhook(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Click again to stop and send",
      });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToWebhook = async (audioBlob: Blob) => {
    setIsLoading(true);

    // Add a message to the chat showing audio was sent
    const audioMessage: ChatMessage = {
      id: `audio_${Date.now()}`,
      role: "user",
      content: "🎤 Audio message sent",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, audioMessage]);

    try {
      const formData = new FormData();
      const filename = `client_audio_${Date.now()}.webm`;
      formData.append("data", audioBlob, filename);
      formData.append("filename", filename);
      formData.append("filesize", audioBlob.size.toString());
      formData.append("type", "audio");
      formData.append("timestamp", new Date().toISOString());
      formData.append("session_id", sessionIdRef.current);

      const response = await fetch("https://n8n.birthdaymessaging.space/webhook/913c546c-124f-4347-a34d-1b70a6f89d4d", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      const responseData = await response.json();

      // Extract the response text from webhook
      const responseText =
        responseData.output ||
        responseData.response ||
        responseData.message ||
        responseData.text ||
        "I received your audio message.";

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: responseText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      toast({
        title: "Response received",
        description: "Audio processed successfully",
      });
    } catch (error) {
      console.error("Failed to send audio to webhook:", error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content:
          "I apologize, but I encountered an error processing your audio. Please try again or type your message instead.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to process audio message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = async (query: string) => {
    setInput(query);
    // Trigger send after a brief delay to show the input
    setTimeout(() => handleSend(), 100);
  };

  const handleInsertSnippet = (content: string) => {
    const snippetMessage: ChatMessage = {
      id: `snippet_${Date.now()}`,
      role: "assistant",
      content: content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, snippetMessage]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-6xl mx-auto fade-in">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">Client Support Portal</h1>
            <p className="text-muted-foreground text-lg">
              Safe, AI-guided access to mental health information and coping strategies
            </p>
          </div>

          {showCrisisBanner && (
            <div className="mb-6">
              <CrisisBanner onShowContacts={() => setShowContacts(true)} />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-4">
            <Card className="lg:col-span-3 flex flex-col min-h-[calc(100vh-220px)] card-hover">
              <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        {humanSupportMode ? <MessageSquare className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {humanSupportMode ? "Support Worker Chat" : "Mental Health Support Chat"}
                        </CardTitle>
                        <CardDescription>
                          {humanSupportMode ? "Connected with human support" : "Ask questions, learn coping strategies, and access resources"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!humanSupportMode && (
                        <Button variant="outline" onClick={requestHumanSupport} disabled={isLoading}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Talk to Support Worker
                        </Button>
                      )}
                      {humanSupportMode && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <X className="w-4 h-4 mr-2" />
                              Close Chat
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>End chat and return to AI assistant?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will close your conversation with the support worker. You can start a new conversation anytime.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleCloseHumanSupport}>
                                End Chat
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                <ScrollArea ref={scrollRef} className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                            message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          <p className="text-xs opacity-70 mt-2">{new Date(message.timestamp).toLocaleTimeString()}</p>
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-accent" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div className="rounded-2xl px-4 py-3 bg-muted">
                          <div className="flex gap-1">
                            <div
                              className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <div
                              className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <div
                              className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {quickReplies.map((reply) => (
                      <Badge
                        key={reply.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleQuickReply(reply.query)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && handleQuickReply(reply.query)}
                      >
                        {reply.text}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      disabled={isLoading || isRecording}
                      aria-label="Chat message"
                    />
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      variant={isRecording ? "destructive" : "outline"}
                      size="icon"
                      aria-label={isRecording ? "Stop recording" : "Record audio"}
                      disabled={isLoading}
                    >
                      {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading || isRecording}
                      size="icon"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Card className="cursor-pointer card-hover">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Library className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-base font-semibold">Coping Library</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Browse self-help techniques and strategies</p>
                    </CardContent>
                  </Card>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Coping Strategies</SheetTitle>
                    <SheetDescription>Click any technique to add it to the chat</SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-150px)] mt-6">
                    <div className="space-y-4">
                      {mockPsychoedSnippets.map((snippet) => (
                        <Card
                          key={snippet.id}
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => handleInsertSnippet(snippet.content)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && handleInsertSnippet(snippet.content)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{snippet.title}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="capitalize text-xs">
                                {snippet.category}
                              </Badge>
                              {snippet.duration && (
                                <Badge variant="secondary" className="text-xs">
                                  {snippet.duration}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-muted-foreground line-clamp-3">{snippet.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <Card
                className="cursor-pointer card-hover border-destructive/30 bg-gradient-to-br from-destructive/5 to-destructive/10"
                onClick={() => setShowContacts(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setShowContacts(true)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-destructive" />
                    </div>
                    <CardTitle className="text-base font-semibold text-destructive">Crisis Contacts</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">24/7 emergency and crisis support</p>
                </CardContent>
              </Card>

              <Card className="bg-accent/5 border-accent">
                <CardHeader>
                  <CardTitle className="text-sm">Important</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This chatbot provides general information only. It cannot diagnose conditions or prescribe
                    medications. For personalized support, please contact your support worker or healthcare provider.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Sheet open={showContacts} onOpenChange={setShowContacts}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Crisis Support Contacts</SheetTitle>
            <SheetDescription>24/7 support services available in Australia</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-150px)] mt-6">
            <div className="space-y-4">
              {crisisContactsAU.map((contact) => (
                <Card key={contact.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{contact.name}</CardTitle>
                      <Badge variant={contact.available === "24/7" ? "default" : "secondary"}>
                        {contact.available}
                      </Badge>
                    </div>
                    <CardDescription>{contact.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                        <Phone className="w-3 h-3 mr-2" />
                        {contact.phone}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ClientChat;
