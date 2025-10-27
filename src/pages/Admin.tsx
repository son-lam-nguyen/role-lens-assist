import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/supportlens/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto fade-in">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground text-lg">Manage library content and resources</p>
          </div>

          <Tabs defaultValue="guidelines">
            <TabsList>
              <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
              <TabsTrigger value="cases">Cases</TabsTrigger>
            </TabsList>

            <TabsContent value="guidelines" className="space-y-4">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-xl">Add New Guideline</CardTitle>
                  <CardDescription>All changes are session-only (demo mode)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input placeholder="Guideline title" />
                  </div>
                  <div>
                    <Label>Source</Label>
                    <Input placeholder="e.g., NDIS, Beyond Blue" />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea placeholder="Guideline content..." rows={4} />
                  </div>
                  <div>
                    <Label>Tags (comma-separated)</Label>
                    <Input placeholder="mental-health, crisis, housing" />
                  </div>
                  <Button onClick={() => toast.success("Guideline added (demo)")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Guideline
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cases" className="space-y-4">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="text-xl">Add New Case</CardTitle>
                  <CardDescription>Mock case for retrieval testing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Case Title</Label>
                    <Input placeholder="Brief case description" />
                  </div>
                  <div>
                    <Label>Summary</Label>
                    <Textarea placeholder="Case summary..." rows={3} />
                  </div>
                  <Button onClick={() => toast.success("Case added (demo)")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Case
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
