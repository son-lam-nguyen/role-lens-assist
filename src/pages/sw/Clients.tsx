import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, Mic, ChevronDown, FileText, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { clientStore, type Client, type RiskLevel } from "@/lib/clients/store";
import { recordingsStore, type Recording } from "@/lib/recordings/store";
import { RecorderModal } from "@/components/recorder/RecorderModal";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [selectedClientForRecording, setSelectedClientForRecording] = useState<string>("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [analysisDetailOpen, setAnalysisDetailOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [deleteAnalysisDialogOpen, setDeleteAnalysisDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<{ clientId: string; analysisId: string } | null>(null);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    contact: "",
    notes: "",
    riskLevel: "low" as RiskLevel,
    assignedWorker: "",
  });

  useEffect(() => {
    loadClients();
    loadRecordings();
  }, []);

  useEffect(() => {
    if (!recorderOpen) {
      loadRecordings();
    }
  }, [recorderOpen]);

  const loadClients = async () => {
    const clients = await clientStore.listAll();
    setClients(clients);
  };

  const loadRecordings = async () => {
    const data = await recordingsStore.getAll();
    setRecordings(data);
  };

  const getClientRecordings = (clientId: string) => {
    return recordings.filter(rec => rec.clientId === clientId);
  };

  const handleRecordForClient = (clientId: string) => {
    setSelectedClientForRecording(clientId);
    setRecorderOpen(true);
  };

  const handleViewDetails = (client: Client) => {
    setViewingClient(client);
    setDetailsDialogOpen(true);
  };

  const handleEditFromDetails = () => {
    if (viewingClient) {
      setDetailsDialogOpen(false);
      handleEdit(viewingClient);
    }
  };

  const handleAdd = () => {
    setEditingClient(null);
    setFormData({
      name: "",
      age: "",
      gender: "",
      contact: "",
      notes: "",
      riskLevel: "low",
      assignedWorker: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      age: client.age.toString(),
      gender: client.gender,
      contact: client.contact,
      notes: client.notes,
      riskLevel: client.riskLevel,
      assignedWorker: client.assignedWorker,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.age || !formData.contact.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name, age, and contact are required fields.",
      });
      return;
    }

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 0 || age > 120) {
      toast({
        variant: "destructive",
        title: "Invalid Age",
        description: "Please enter a valid age between 0 and 120.",
      });
      return;
    }

    try {
      if (editingClient) {
        const result = await clientStore.update(editingClient.id, {
          name: formData.name,
          age,
          gender: formData.gender,
          contact: formData.contact,
          notes: formData.notes,
          riskLevel: formData.riskLevel,
          assignedWorker: formData.assignedWorker,
        });

        if (!result) {
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Failed to update client. Please ensure you are logged in and try again.",
          });
          return;
        }

        toast({
          title: "Client Updated",
          description: `${formData.name}'s profile has been updated.`,
        });
      } else {
        const result = await clientStore.add({
          name: formData.name,
          age,
          gender: formData.gender,
          contact: formData.contact,
          notes: formData.notes,
          riskLevel: formData.riskLevel,
          assignedWorker: formData.assignedWorker,
        });

        if (!result) {
          toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Failed to add client. Please ensure you are logged in and try again.",
          });
          return;
        }

        toast({
          title: "Client Added",
          description: `${formData.name} has been added to your client list.`,
        });
      }

      await loadClients();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving client:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (clientToDelete) {
      const client = await clientStore.getById(clientToDelete);
      await clientStore.remove(clientToDelete);
      loadClients();
      toast({
        title: "Client Removed",
        description: `${client?.name || "Client"} has been removed from your list.`,
      });
    }
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const handleDeleteAnalysisClick = (clientId: string, analysisId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAnalysisToDelete({ clientId, analysisId });
    setDeleteAnalysisDialogOpen(true);
  };

  const handleDeleteAnalysisConfirm = async () => {
    if (analysisToDelete) {
      const client = await clientStore.getById(analysisToDelete.clientId);
      if (client && Array.isArray(client.analysisNotes)) {
        const updatedNotes = client.analysisNotes.filter((a: any) => a.id !== analysisToDelete.analysisId);
        await clientStore.update(client.id, { analysisNotes: updatedNotes });
        
        if (viewingClient?.id === client.id) {
          setViewingClient({ ...client, analysisNotes: updatedNotes });
        }
        
        await loadClients();
        toast({
          title: "Analysis Deleted",
          description: "The analysis entry has been removed.",
        });
      }
    }
    setDeleteAnalysisDialogOpen(false);
    setAnalysisToDelete(null);
  };

  const handleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map(c => c.id)));
    }
  };

  const handleSelectClient = (id: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedClients(newSelected);
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    for (const id of selectedClients) {
      await clientStore.remove(id);
    }
    await loadClients();
    setSelectedClients(new Set());
    setBulkDeleteDialogOpen(false);
    toast({
      title: "Clients Deleted",
      description: `${selectedClients.size} client(s) have been removed.`,
    });
  };

  const getRiskBadgeVariant = (risk: RiskLevel) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'moderate': return 'default';
      case 'low': return 'secondary';
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.assignedWorker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="bg-gradient-to-r from-blue-600/5 via-primary/5 to-transparent rounded-2xl p-6 border border-blue-600/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Client List</h1>
            </div>
            <p className="text-foreground/70 text-base ml-13">
              Manage your client profiles and track important information
            </p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <Card className="card-hover border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-600/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                All Clients
              </CardTitle>
              <CardDescription>
                {clients.length} {clients.length === 1 ? 'client' : 'clients'} in your caseload
                {selectedClients.size > 0 && ` • ${selectedClients.size} selected`}
              </CardDescription>
            </div>
            {selectedClients.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedClients.size})
              </Button>
            )}
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, contact, or assigned worker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedClients.size === filteredClients.length && filteredClients.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Assigned Worker</TableHead>
                <TableHead>Recordings</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    {searchQuery ? "No clients match your search." : "No clients yet. Add your first client to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedClients.has(client.id)}
                        onCheckedChange={() => handleSelectClient(client.id)}
                        aria-label={`Select ${client.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => handleViewDetails(client)}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        {client.name}
                      </button>
                    </TableCell>
                    <TableCell>{client.age}</TableCell>
                    <TableCell>{client.gender || '—'}</TableCell>
                    <TableCell>{client.contact}</TableCell>
                    <TableCell>
                      <Badge variant={getRiskBadgeVariant(client.riskLevel)} className="capitalize">
                        {client.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.assignedWorker || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {getClientRecordings(client.id).length}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRecordForClient(client.id)}
                          aria-label="Record audio"
                        >
                          <Mic className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(client)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(client.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Edit Client Profile" : "Add New Client"}
            </DialogTitle>
            <DialogDescription>
              {editingClient
                ? "Update client information and risk assessment."
                : "Enter client details and assign a support worker."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Client full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Age"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  placeholder="Gender (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact *</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Phone or email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedWorker">Assigned Support Worker</Label>
              <Input
                id="assignedWorker"
                value={formData.assignedWorker}
                onChange={(e) => setFormData({ ...formData, assignedWorker: e.target.value })}
                placeholder="Support worker name"
              />
            </div>

            <div className="space-y-2">
              <Label>Risk Level</Label>
              <RadioGroup
                value={formData.riskLevel}
                onValueChange={(value) => setFormData({ ...formData, riskLevel: value as RiskLevel })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low" className="font-normal cursor-pointer">Low Risk</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate" className="font-normal cursor-pointer">Moderate Risk</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high" className="font-normal cursor-pointer">High Risk</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Comments</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional comments about the client..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingClient ? "Update Client" : "Add Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this client from your list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              View complete information for this client
            </DialogDescription>
          </DialogHeader>

          {viewingClient && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="text-lg font-medium">{viewingClient.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Age</Label>
                  <p className="text-lg font-medium">{viewingClient.age}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Gender</Label>
                  <p className="text-lg font-medium">{viewingClient.gender || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact</Label>
                  <p className="text-lg font-medium">{viewingClient.contact}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Risk Level</Label>
                  <div className="mt-1">
                    <Badge variant={getRiskBadgeVariant(viewingClient.riskLevel)} className="capitalize">
                      {viewingClient.riskLevel}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Assigned Worker</Label>
                  <p className="text-lg font-medium">{viewingClient.assignedWorker || '—'}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Recordings</Label>
                <div className="mt-1">
                  <Badge variant="secondary">
                    {getClientRecordings(viewingClient.id).length} recording(s)
                  </Badge>
                </div>
              </div>

              {viewingClient.notes && (
                <div>
                  <Label className="text-muted-foreground">Comments</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{viewingClient.notes}</p>
                </div>
              )}

              <Collapsible className="space-y-2">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors">
                  <Label className="text-muted-foreground cursor-pointer">Notes (Analysis History)</Label>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 mt-2">
                    {viewingClient.analysisNotes && Array.isArray(viewingClient.analysisNotes) && viewingClient.analysisNotes.length > 0 ? (
                      viewingClient.analysisNotes.map((analysis: any) => (
                        <div
                          key={analysis.id}
                          className="w-full p-3 bg-muted hover:bg-muted/80 rounded-md transition-colors flex items-start gap-3"
                        >
                          <button
                            onClick={() => {
                              setSelectedAnalysis(analysis);
                              setAnalysisDetailOpen(true);
                            }}
                            className="flex items-start gap-3 flex-1 min-w-0 text-left"
                          >
                            <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{analysis.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(analysis.date).toLocaleString()}
                              </p>
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={(e) => handleDeleteAnalysisClick(viewingClient.id, analysis.id, e)}
                            aria-label="Delete analysis"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground p-3">No analysis notes yet.</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleEditFromDetails}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analysis Detail Dialog */}
      <Dialog open={analysisDetailOpen} onOpenChange={setAnalysisDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analysis Details</DialogTitle>
            <DialogDescription>
              Complete analysis information
            </DialogDescription>
          </DialogHeader>

          {selectedAnalysis && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Title</Label>
                  <p className="text-lg font-medium">{selectedAnalysis.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="text-lg font-medium">{new Date(selectedAnalysis.date).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Duration</Label>
                <p className="text-lg font-medium">
                  {Math.floor(selectedAnalysis.duration / 60)}m {Math.floor(selectedAnalysis.duration % 60)}s
                </p>
              </div>

              {selectedAnalysis.riskAssessment && (
                <div>
                  <Label className="text-muted-foreground">Risk Assessment</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Level:</span>
                      <Badge variant={
                        selectedAnalysis.riskAssessment.level === 'high' ? 'destructive' :
                        selectedAnalysis.riskAssessment.level === 'moderate' ? 'default' : 'secondary'
                      }>
                        {selectedAnalysis.riskAssessment.level}
                      </Badge>
                    </div>
                    {selectedAnalysis.riskAssessment.signals.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Signals:</span>
                        <p className="text-sm mt-1">{selectedAnalysis.riskAssessment.signals.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedAnalysis.summary && selectedAnalysis.summary.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Summary</Label>
                  <ul className="mt-2 space-y-1 p-3 bg-muted rounded-md">
                    {selectedAnalysis.summary.map((point: string, idx: number) => (
                      <li key={idx} className="text-sm flex gap-2">
                        <span>•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAnalysis.keyPhrases && selectedAnalysis.keyPhrases.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Key Phrases</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedAnalysis.keyPhrases.map((phrase: string, idx: number) => (
                      <Badge key={idx} variant="outline">{phrase}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedAnalysis.speakerAnalysis && (
                <div>
                  <Label className="text-muted-foreground">Speaker Analysis</Label>
                  <div className="mt-2 space-y-3 p-3 bg-muted rounded-md">
                    {selectedAnalysis.speakerAnalysis.client && (
                      <div>
                        <p className="text-sm font-medium mb-1">Client:</p>
                        <p className="text-sm">Sentiment: {selectedAnalysis.speakerAnalysis.client.sentiment}</p>
                        {selectedAnalysis.speakerAnalysis.client.topEmotions.length > 0 && (
                          <p className="text-sm">Emotions: {selectedAnalysis.speakerAnalysis.client.topEmotions.join(', ')}</p>
                        )}
                      </div>
                    )}
                    {selectedAnalysis.speakerAnalysis.supportWorker && (
                      <div>
                        <p className="text-sm font-medium mb-1">Support Worker:</p>
                        <p className="text-sm">Sentiment: {selectedAnalysis.speakerAnalysis.supportWorker.sentiment}</p>
                        <p className="text-sm">Supportiveness: {(selectedAnalysis.speakerAnalysis.supportWorker.supportiveness * 100).toFixed(0)}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Confidence Score</Label>
                <p className="text-lg font-medium">{(selectedAnalysis.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAnalysisDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteAnalysisDialogOpen} onOpenChange={setDeleteAnalysisDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this analysis entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAnalysisConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Clients</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedClients.size} client(s)? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RecorderModal
        open={recorderOpen} 
        onOpenChange={setRecorderOpen}
        preselectedClientId={selectedClientForRecording}
      />
    </div>
  );
};

export default Clients;
