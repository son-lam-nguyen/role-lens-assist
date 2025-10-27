import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Navbar } from "@/components/supportlens/Navbar";
import { CrisisBanner } from "@/components/supportlens/CrisisBanner";
import { ChatMessage, generateChatbotResponse, quickReplies, detectCrisis } from "@/lib/mock/mockChatbot";
import { mockPsychoedSnippets } from "@/lib/mock/mockPsychoed";
import { crisisContactsAU } from "@/lib/mock/mockSettings";
import { Send, Bot, User, Library, Phone } from "lucide-react";

const ClientChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm here to provide mental health information and coping strategies. I can't diagnose or prescribe, but I can share evidence-based techniques and connect you with professional support. How can I help today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Check for crisis keywords
    if (detectCrisis(input)) {
      setShowCrisisBanner(true);
    }

    try {
      const response = await generateChatbotResponse(input);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again or contact your support worker for assistance.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
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
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, snippetMessage]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
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
            <Card className="lg:col-span-3 flex flex-col h-[calc(100vh-300px)] card-hover">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Mental Health Support Chat</CardTitle>
                </div>
                <CardDescription>
                  Ask questions, learn coping strategies, and access resources
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                <ScrollArea ref={scrollRef} className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                          <p className="text-xs opacity-70 mt-2">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
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
                            <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
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
                      disabled={isLoading}
                      aria-label="Chat message"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
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
                      <p className="text-sm text-muted-foreground">
                        Browse self-help techniques and strategies
                      </p>
                    </CardContent>
                  </Card>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Coping Strategies</SheetTitle>
                    <SheetDescription>
                      Click any technique to add it to the chat
                    </SheetDescription>
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
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {snippet.content}
                            </p>
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
                  <p className="text-sm text-muted-foreground">
                    24/7 emergency and crisis support
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-accent/5 border-accent">
                <CardHeader>
                  <CardTitle className="text-sm">Important</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This chatbot provides general information only. It cannot diagnose conditions
                    or prescribe medications. For personalized support, please contact your
                    support worker or healthcare provider.
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
            <SheetDescription>
              24/7 support services available in Australia
            </SheetDescription>
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
                      <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>
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
