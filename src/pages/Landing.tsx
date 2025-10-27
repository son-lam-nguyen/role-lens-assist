import { Stethoscope, MessageCircle, UserCircle } from "lucide-react";
import { RoleCard } from "@/components/supportlens/RoleCard";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 animate-fadeIn">
      <header className="border-b bg-card/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">SupportLens</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <section className="text-center mb-16 space-y-6 fade-in">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse mr-2"></span>
            AI-Powered Support Work Platform
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Empowering Support Work with AI
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Streamline documentation, access evidence-based guidelines, and provide safe client support
            with our dual-role platform.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto fade-in" style={{ animationDelay: "0.2s" }}>
          <RoleCard
            title="Support Worker"
            description="Professional tools for case documentation and evidence-based support"
            icon={UserCircle}
            route="/sw"
            features={[
              "Upload and transcribe session audio with risk detection",
              "Find similar cases and evidence-based guidelines",
              "Create structured SOAP notes with citations",
              "Export comprehensive reports as PDF",
              "Access psychoeducation library"
            ]}
          />

          <RoleCard
            title="Client Portal"
            description="Safe, guided access to mental health information and support"
            icon={MessageCircle}
            route="/client"
            buttonText="Go to Portal"
            features={[
              "Chat with AI for mental health information",
              "Access coping strategies and techniques",
              "Crisis detection with immediate support contacts",
              "Guardrails prevent diagnosis or medication advice",
              "Evidence-based psychoeducation resources"
            ]}
          />
        </section>

        <section className="mt-20 text-center fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30 text-accent text-sm font-medium shadow-lg">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Australian-focused resources & crisis contacts
          </div>
        </section>
      </main>

      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>SupportLens - Demo Platform • Crisis: Lifeline 13 11 14 • Emergency: 000</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
