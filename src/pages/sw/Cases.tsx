import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CaseCard } from "@/components/supportlens/CaseCard";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { searchCases } from "@/lib/mock/mockCases";
import { getGuidelineById } from "@/lib/mock/mockGuidelines";
import { Search, X } from "lucide-react";
import { toast } from "sonner";

const allTags = ["finance", "housing", "family", "addiction", "employment", "anxiety", "youth", "older-adults"];

const Cases = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGuidelineId, setSelectedGuidelineId] = useState<string | null>(null);

  const results = searchCases(searchQuery, selectedTags);
  const selectedGuideline = selectedGuidelineId ? getGuidelineById(selectedGuidelineId) : null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleInsertToNotes = () => {
    toast.success("Guideline inserted to SOAP notes");
    setSelectedGuidelineId(null);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="bg-gradient-to-r from-accent/5 via-primary/5 to-transparent rounded-2xl p-6 border border-accent/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Search className="w-5 h-5 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Similar Cases</h1>
        </div>
        <p className="text-foreground/70 text-base ml-13">
          Find relevant cases and evidence-based guidelines
        </p>
      </div>

      <Card className="card-hover border-l-4 border-l-accent bg-gradient-to-br from-accent/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Search className="w-4 h-4 text-accent" />
            </div>
            Search & Filter
          </CardTitle>
          <CardDescription>Search by keywords or filter by topic tags</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search cases by keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search cases"
            />
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Filter by topics</h4>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer capitalize hover:scale-105 transition-transform"
                  onClick={() => toggleTag(tag)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && toggleTag(tag)}
                >
                  {tag.replace("-", " ")}
                  {selectedTags.includes(tag) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Results {results.length > 0 && `(${results.length})`}
        </h2>

        {results.length === 0 ? (
          <Card className="card-hover">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No matching cases found</h3>
              <p className="text-muted-foreground">
                Try different keywords or tags to find relevant cases.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {results.map((caseData, idx) => (
              <div key={caseData.id} style={{ animationDelay: `${idx * 0.05}s` }} className="fade-in">
                <CaseCard
                  case={caseData}
                  onOpenGuideline={() => setSelectedGuidelineId(caseData.guidelineId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!selectedGuidelineId} onOpenChange={(open) => !open && setSelectedGuidelineId(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedGuideline?.topic}</SheetTitle>
            <SheetDescription>
              <Badge variant="secondary" className="mt-2">
                {selectedGuideline?.source}
              </Badge>
            </SheetDescription>
          </SheetHeader>

          {selectedGuideline && (
            <div className="mt-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Guideline Content</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {selectedGuideline.excerpt}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedGuideline.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="capitalize">
                      {tag.replace("-", " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <Button onClick={handleInsertToNotes} className="w-full">
                  Insert to SOAP Notes
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <a href={selectedGuideline.url} target="_blank" rel="noopener noreferrer">
                    View Full Source
                  </a>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Cases;
