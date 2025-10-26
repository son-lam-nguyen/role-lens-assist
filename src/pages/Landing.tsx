import { Stethoscope, MessageCircle, UserCircle } from "lucide-react";
import { RoleCard } from "@/components/supportlens/RoleCard";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">SupportLens</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <section className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Empowering Support Work with AI
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline documentation, access evidence-based guidelines, and provide safe client support
            with our dual-role platform.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
            features={[
              "Chat with AI for mental health information",
              "Access coping strategies and techniques",
              "Crisis detection with immediate support contacts",
              "Guardrails prevent diagnosis or medication advice",
              "Evidence-based psychoeducation resources"
            ]}
          />
        </section>

        <section className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
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
