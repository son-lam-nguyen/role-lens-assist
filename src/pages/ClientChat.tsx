import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

      // Send notification webhook
      try {
        await fetch("https://n8n.birthdaymessaging.space/webhook/send-notification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversation_id: conversationIdResult,
            client_id: clientId,
            timestamp: new Date().toISOString(),
            type: "support_request"
          })
        });
      } catch (error) {
        console.error("Failed to send notification webhook:", error);
      }

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

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height (max 5 lines ~120px on mobile, ~140px on desktop)
    const maxHeight = window.innerWidth < 768 ? 120 : 140;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    
    textarea.style.height = `${newHeight}px`;
    
    // Keep chat scrolled to bottom when input expands
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

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
    <div className="min-h-screen warm-texture">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-7xl mx-auto fade-in">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome to Your Support Space
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              You're not alone. We're here to listen, support, and help you find the right resources.
            </p>
          </div>

          {showCrisisBanner && (
            <div className="mb-6">
              <CrisisBanner onShowContacts={() => setShowContacts(true)} />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="flex flex-col min-h-[calc(100vh-280px)] md:min-h-[calc(100vh-280px)] h-[calc(100vh-180px)] md:h-auto empathy-glow border-border/30 bg-card/95 backdrop-blur-sm">
              <CardHeader className="pb-3 md:pb-6 border-b border-border/30 px-4 md:px-6 pt-4 md:pt-6">
                  <div className="flex items-center justify-between flex-wrap gap-2 md:gap-4">
                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-calm-blue to-warm-teal flex items-center justify-center shadow-warm">
                        {humanSupportMode ? <MessageSquare className="w-5 h-5 md:w-7 md:h-7 text-white" /> : <Bot className="w-5 h-5 md:w-7 md:h-7 text-white" />}
                      </div>
                      <div>
                        <CardTitle className="text-base md:text-2xl mb-0.5 md:mb-1 font-semibold leading-tight">
                          {humanSupportMode ? "Support Worker" : "Support Companion"}
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm leading-snug hidden sm:block">
                          {humanSupportMode ? "You're now chatting with a real person" : "Safe space to talk and find support"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!humanSupportMode && (
                        <Button 
                          variant="default" 
                          onClick={requestHumanSupport} 
                          disabled={isLoading}
                          className="shadow-warm bg-gradient-to-r from-accent to-calm-green hover:opacity-90 transition-opacity text-xs md:text-sm h-8 md:h-10 px-3 md:px-4"
                        >
                          <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                          <span className="hidden sm:inline">Chat to </span>Support Worker
                        </Button>
                      )}
                      {humanSupportMode && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-border/50 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3">
                              <X className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                              End
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>End this conversation?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will close your chat with the support worker. You can start a new conversation anytime you need support.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Keep Chatting</AlertDialogCancel>
                              <AlertDialogAction onClick={handleCloseHumanSupport} className="rounded-xl">
                                End Chat
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-3 md:gap-6 overflow-hidden p-3 md:p-8 pb-0">
                <ScrollArea ref={scrollRef} className="flex-1 pr-2 md:pr-6">
                  <div className="space-y-3 md:space-y-6 pb-3 md:pb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-2 md:gap-4 ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/15 to-warm-teal/15 flex items-center justify-center shrink-0 shadow-soft">
                            <Bot className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                          </div>
                        )}
                        <div className="flex flex-col gap-1 md:gap-2 max-w-[85%] md:max-w-[80%]">
                          <div
                            className={`rounded-2xl md:rounded-3xl px-3 py-2 md:px-5 md:py-3.5 transition-all ${
                              message.role === "user" 
                                ? "message-bubble-user text-white shadow-md" 
                                : "message-bubble-assistant border border-border/20 shadow-sm"
                            }`}
                          >
                            <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          </div>
                          <p className="text-[10px] md:text-xs text-muted-foreground/60 px-1 md:px-2">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-accent/15 to-calm-green/15 flex items-center justify-center shrink-0 shadow-soft">
                            <User className="w-4 h-4 md:w-6 md:h-6 text-accent" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-2 md:gap-4 justify-start animate-fade-in">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/15 to-warm-teal/15 flex items-center justify-center shrink-0 shadow-soft">
                          <Bot className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                        </div>
                        <div className="rounded-2xl md:rounded-3xl px-3 py-2 md:px-5 md:py-3.5 message-bubble-assistant border border-border/20">
                          <div className="flex gap-1.5 md:gap-2">
                            <div
                              className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-primary/60 animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <div
                              className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-primary/60 animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <div
                              className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-primary/60 animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="border-t border-border/30 pt-3 md:pt-6 pb-3 md:pb-0 bg-card/95 backdrop-blur-sm sticky bottom-0 -mx-3 md:-mx-8 px-3 md:px-8">
                  <div className="flex flex-wrap gap-1.5 md:gap-2.5 mb-2.5 md:mb-5">
                    {quickReplies.map((reply) => (
                      <Badge
                        key={reply.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-gradient-to-r hover:from-primary hover:to-calm-blue hover:text-white hover:border-transparent transition-all hover:shadow-soft px-2.5 md:px-4 py-1 md:py-2 text-xs md:text-sm rounded-full border-border/40"
                        onClick={() => handleQuickReply(reply.query)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && handleQuickReply(reply.query)}
                      >
                        {reply.text}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2 md:gap-3 items-end">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Share what's on your mind..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={isLoading || isRecording}
                      aria-label="Chat message"
                      rows={1}
                      className="rounded-xl md:rounded-2xl shadow-soft border-border/40 min-h-[40px] md:min-h-[48px] max-h-[120px] md:max-h-[140px] px-3 md:px-5 py-2.5 md:py-3 text-sm md:text-base resize-none transition-all duration-200 overflow-y-auto"
                    />
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      variant={isRecording ? "destructive" : "outline"}
                      size="icon"
                      aria-label={isRecording ? "Stop recording" : "Record audio"}
                      disabled={isLoading}
                      className="rounded-xl md:rounded-2xl shadow-soft shrink-0 h-10 w-10 md:h-12 md:w-12 border-border/40"
                    >
                      {isRecording ? <Square className="w-4 h-4 md:w-5 md:h-5" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
                    </Button>
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading || isRecording}
                      size="icon"
                      aria-label="Send message"
                      className="rounded-xl md:rounded-2xl shadow-warm shrink-0 h-10 w-10 md:h-12 md:w-12 bg-gradient-to-r from-primary to-calm-blue hover:opacity-90 transition-opacity"
                    >
                      <Send className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <aside className="space-y-5 flex flex-col">
              <div className="text-center mb-2">
                <p className="text-sm text-muted-foreground font-medium">Quick Actions</p>
              </div>
              
              <Card
                className="cursor-pointer hover:shadow-warm hover:scale-[1.02] transition-all duration-300 rounded-3xl border-primary/20 bg-gradient-to-br from-calm-blue/8 to-warm-teal/8 empathy-glow"
                onClick={() => window.location.href = 'tel:+61468057907'}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && (window.location.href = 'tel:+61468057907')}
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-calm-blue flex items-center justify-center shadow-warm">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-base font-semibold">Book Appointment</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-center">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Speak with our caring team directly
                  </p>
                </CardContent>
              </Card>

              <Sheet>
                <SheetTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-warm hover:scale-[1.02] transition-all duration-300 rounded-3xl border-border/20 empathy-glow bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-calm-green to-accent flex items-center justify-center shadow-warm">
                          <Library className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-base font-semibold">Coping Library</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 text-center">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Explore self-help techniques and strategies
                      </p>
                    </CardContent>
                  </Card>
                </SheetTrigger>
                <SheetContent className="rounded-l-3xl">
                  <SheetHeader>
                    <SheetTitle className="text-xl">Coping Strategies</SheetTitle>
                    <SheetDescription>Click any technique to add it to your chat</SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-150px)] mt-6 pr-4">
                    <div className="space-y-4">
                      {mockPsychoedSnippets.map((snippet) => (
                        <Card
                          key={snippet.id}
                          className="cursor-pointer hover:shadow-soft hover:border-primary/30 transition-all rounded-2xl border-border/30"
                          onClick={() => handleInsertSnippet(snippet.content)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && handleInsertSnippet(snippet.content)}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">{snippet.title}</CardTitle>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="capitalize text-xs rounded-full border-primary/30">
                                {snippet.category}
                              </Badge>
                              {snippet.duration && (
                                <Badge variant="secondary" className="text-xs rounded-full">
                                  {snippet.duration}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{snippet.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <Card
                className="cursor-pointer hover:shadow-warm hover:scale-[1.02] transition-all duration-300 rounded-3xl border-destructive/20 bg-gradient-to-br from-destructive/8 to-warning/8 empathy-glow"
                onClick={() => setShowContacts(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setShowContacts(true)}
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-destructive to-warning flex items-center justify-center shadow-warm">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-base font-semibold text-destructive">Crisis Support</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-center">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    24/7 emergency support is always available
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-soft-lavender/10 to-calm-blue/5 border-accent/20 rounded-3xl empathy-glow mt-auto">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-center">💙 Remember</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed text-center">
                    This is a supportive space for general information. For personalized care, connect with your support worker or healthcare provider.
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <Sheet open={showContacts} onOpenChange={setShowContacts}>
        <SheetContent className="rounded-l-3xl">
          <SheetHeader>
            <SheetTitle className="text-xl">Crisis Support Contacts</SheetTitle>
            <SheetDescription className="text-base">Help is available 24/7 - you're not alone</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-150px)] mt-6 pr-4">
            <div className="space-y-4">
              {crisisContactsAU.map((contact) => (
                <Card key={contact.id} className="empathy-glow rounded-2xl border-border/30">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold">{contact.name}</CardTitle>
                      <Badge 
                        variant={contact.available === "24/7" ? "default" : "secondary"}
                        className="rounded-full"
                      >
                        {contact.available}
                      </Badge>
                    </div>
                    <CardDescription className="leading-relaxed">{contact.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="w-full rounded-xl shadow-warm bg-gradient-to-r from-primary to-calm-blue hover:opacity-90 transition-opacity" 
                      asChild
                    >
                      <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                        <Phone className="w-4 h-4 mr-2" />
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
