import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockGuidelines } from "@/lib/mock/mockGuidelines";
import { mockPsychoedSnippets } from "@/lib/mock/mockPsychoed";
import { Search, FileText, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const Library = () => {
  const [guidelineSearch, setGuidelineSearch] = useState("");
  const [psychoedSearch, setPsychoedSearch] = useState("");

  const filteredGuidelines = mockGuidelines.filter(g =>
    g.topic.toLowerCase().includes(guidelineSearch.toLowerCase()) ||
    g.source.toLowerCase().includes(guidelineSearch.toLowerCase()) ||
    g.tags.some(t => t.toLowerCase().includes(guidelineSearch.toLowerCase()))
  );

  const filteredPsychoed = mockPsychoedSnippets.filter(s =>
    s.title.toLowerCase().includes(psychoedSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(psychoedSearch.toLowerCase()) ||
    s.content.toLowerCase().includes(psychoedSearch.toLowerCase())
  );

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleAddToNotes = () => {
    toast.success("Added to SOAP notes");
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="bg-gradient-to-r from-indigo-600/5 via-primary/5 to-transparent rounded-2xl p-6 border border-indigo-600/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Resource Library</h1>
        </div>
        <p className="text-foreground/70 text-base ml-13">
          Evidence-based guidelines and psychoeducation resources
        </p>
      </div>

      <Tabs defaultValue="guidelines" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
          <TabsTrigger value="psychoed">Psychoeducation</TabsTrigger>
        </TabsList>

        <TabsContent value="guidelines" className="space-y-6">
          <Card className="card-hover border-l-4 border-l-indigo-600 bg-gradient-to-br from-indigo-600/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    Evidence-Based Guidelines
                  </CardTitle>
                  <CardDescription>Professional resources and best practices</CardDescription>
                </div>
                <Badge variant="secondary">{filteredGuidelines.length} items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search guidelines..."
                  value={guidelineSearch}
                  onChange={(e) => setGuidelineSearch(e.target.value)}
                  className="pl-9"
                  aria-label="Search guidelines"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {filteredGuidelines.map((guideline) => (
              <Card key={guideline.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{guideline.topic}</CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className="mt-1">
                          {guideline.source}
                        </Badge>
                      </CardDescription>
                    </div>
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{guideline.excerpt}</p>

                  <div className="flex flex-wrap gap-2">
                    {guideline.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="capitalize text-xs">
                        {tag.replace("-", " ")}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopySnippet(guideline.excerpt)}
                    >
                      <Copy className="w-3 h-3 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddToNotes}
                    >
                      <FileText className="w-3 h-3 mr-2" />
                      Add to Notes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={guideline.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-2" />
                        Source
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="psychoed" className="space-y-6">
          <Card className="card-hover border-l-4 border-l-accent bg-gradient-to-br from-accent/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-accent" />
                    </div>
                    Psychoeducation Resources
                  </CardTitle>
                  <CardDescription>Coping strategies and wellness techniques</CardDescription>
                </div>
                <Badge variant="secondary">{filteredPsychoed.length} items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={psychoedSearch}
                  onChange={(e) => setPsychoedSearch(e.target.value)}
                  className="pl-9"
                  aria-label="Search psychoeducation"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredPsychoed.map((snippet) => (
              <Card key={snippet.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{snippet.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="capitalize">
                          {snippet.category}
                        </Badge>
                        {snippet.duration && (
                          <Badge variant="secondary">{snippet.duration}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {snippet.content}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopySnippet(snippet.content)}
                    >
                      <Copy className="w-3 h-3 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddToNotes}
                    >
                      <FileText className="w-3 h-3 mr-2" />
                      Add to Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Library;
