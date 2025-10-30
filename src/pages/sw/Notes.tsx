import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Download, Save, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

const Notes = () => {
  const [note, setNote] = useState<SOAPNote>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  });

  const [references, setReferences] = useState<string[]>([
    "NDIS Housing & Support Guidelines",
    "Financial Counselling Australia - Emergency Relief"
  ]);

  const handleUpdateSection = (section: keyof SOAPNote, value: string) => {
    setNote(prev => ({ ...prev, [section]: value }));
  };

  const handleSaveDraft = () => {
    toast.success("Draft saved successfully");
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all notes?")) {
      setNote({
        subjective: "",
        objective: "",
        assessment: "",
        plan: ""
      });
      setReferences([]);
      toast.success("Notes cleared");
    }
  };

  const handleExportPDF = () => {
    const isEmpty = !note.subjective && !note.objective && !note.assessment && !note.plan;
    
    if (isEmpty) {
      toast.error("Cannot export empty notes. Please add content first.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SOAP Note", margin, yPosition);
    yPosition += lineHeight * 2;

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += lineHeight * 2;

    // Helper function to add section
    const addSection = (title: string, content: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(content || "[No content]", pageWidth - margin * 2);
      
      lines.forEach((line: string) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      
      yPosition += lineHeight;
    };

    addSection("SUBJECTIVE", note.subjective);
    addSection("OBJECTIVE", note.objective);
    addSection("ASSESSMENT", note.assessment);
    addSection("PLAN", note.plan);

    // References
    if (references.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("References", margin, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      references.forEach((ref, index) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(`${index + 1}. ${ref}`, margin + 5, yPosition);
        yPosition += lineHeight;
      });
    }

    doc.save(`SOAP-Note-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("PDF exported successfully");
  };

  const removeReference = (index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="bg-gradient-to-r from-orange-600/5 via-primary/5 to-transparent rounded-2xl p-6 border border-orange-600/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold">SOAP Notes</h1>
        </div>
        <p className="text-foreground/70 text-base ml-13">
          Create structured case notes with evidence-based citations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-hover border-l-4 border-l-orange-600 bg-gradient-to-br from-orange-600/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                Subjective
              </CardTitle>
              <CardDescription>Client's reported experience and concerns</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What the client says... (symptoms, feelings, concerns)"
                value={note.subjective}
                onChange={(e) => handleUpdateSection("subjective", e.target.value)}
                rows={6}
                aria-label="Subjective section"
              />
            </CardContent>
          </Card>

          <Card className="card-hover border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                Objective
              </CardTitle>
              <CardDescription>Observable information and measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What you observe... (behavior, appearance, assessment results)"
                value={note.objective}
                onChange={(e) => handleUpdateSection("objective", e.target.value)}
                rows={6}
                aria-label="Objective section"
              />
            </CardContent>
          </Card>

          <Card className="card-hover border-l-4 border-l-accent bg-gradient-to-br from-accent/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-accent" />
                </div>
                Assessment
              </CardTitle>
              <CardDescription>Professional interpretation and analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Your assessment... (analysis, diagnosis considerations, risk factors)"
                value={note.assessment}
                onChange={(e) => handleUpdateSection("assessment", e.target.value)}
                rows={6}
                aria-label="Assessment section"
              />
            </CardContent>
          </Card>

          <Card className="card-hover border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-600/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                Plan
              </CardTitle>
              <CardDescription>Intervention strategies and next steps</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Action plan... (interventions, referrals, follow-up, goals)"
                value={note.plan}
                onChange={(e) => handleUpdateSection("plan", e.target.value)}
                rows={6}
                aria-label="Plan section"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-lg">References</CardTitle>
              <CardDescription>Inserted guidelines and citations</CardDescription>
            </CardHeader>
            <CardContent>
              {references.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No references added yet. Add guidelines from Similar Cases.
                </p>
              ) : (
                <div className="space-y-2">
                  {references.map((ref, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 rounded-lg border bg-card"
                    >
                      <Badge variant="secondary" className="shrink-0">
                        {index + 1}
                      </Badge>
                      <p className="text-sm flex-1">{ref}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeReference(index)}
                        aria-label="Remove reference"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleExportPDF} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
              <Button onClick={handleSaveDraft} variant="outline" className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleClear} variant="outline" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent">
            <CardHeader>
              <CardTitle className="text-sm">Disclaimer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Guidelines are for reference only. Clinical decisions remain the responsibility
                of qualified professionals. Always follow organizational protocols and seek
                supervision when needed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Notes;
