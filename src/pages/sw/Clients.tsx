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
import { Plus, Pencil, Trash2, Search, Mic } from "lucide-react";
import { clientStore, type Client, type RiskLevel } from "@/lib/clients/store";
import { recordingsStore, type Recording } from "@/lib/recordings/store";
import { RecorderModal } from "@/components/recorder/RecorderModal";
import { useToast } from "@/hooks/use-toast";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client List</h1>
          <p className="text-muted-foreground mt-1">
            Manage your client profiles and track important information
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            {clients.length} {clients.length === 1 ? 'client' : 'clients'} in your caseload
          </CardDescription>
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
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {searchQuery ? "No clients match your search." : "No clients yet. Add your first client to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the client..."
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
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{viewingClient.notes}</p>
                </div>
              )}
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

      <RecorderModal 
        open={recorderOpen} 
        onOpenChange={setRecorderOpen}
        preselectedClientId={selectedClientForRecording}
      />
    </div>
  );
};

export default Clients;
