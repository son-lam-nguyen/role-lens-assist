import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/supportlens/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Pencil, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { userStore, type DemoUser } from "@/lib/users/userStore";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Admin = () => {
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DemoUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "support-worker" as "support-worker" | "admin",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = userStore.listAll();
    setUsers(allUsers);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      username: "",
      password: "",
      role: "support-worker",
    });
    setDialogOpen(true);
  };

  const handleEditUser = (user: DemoUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      password: user.password,
      role: user.role,
    });
    setDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.username.trim() || !formData.password.trim()) {
      toast.error("All fields are required");
      return;
    }

    try {
      if (editingUser) {
        userStore.update(editingUser.id, formData);
        toast.success(`User ${formData.name} updated`);
      } else {
        // Check if username already exists
        const existing = userStore.getByUsername(formData.username);
        if (existing) {
          toast.error("Username already exists");
          return;
        }
        userStore.add({ ...formData, active: true });
        toast.success(`User ${formData.name} created`);
      }
      loadUsers();
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save user");
    }
  };

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      const user = userStore.getById(userToDelete);
      userStore.remove(userToDelete);
      loadUsers();
      toast.success(`User ${user?.name} deleted`);
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleToggleActive = (id: string) => {
    const user = userStore.toggleActive(id);
    if (user) {
      loadUsers();
      toast.success(`User ${user.name} ${user.active ? 'activated' : 'deactivated'}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-6xl mx-auto fade-in">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground text-lg">Manage library content and resources</p>
          </div>

          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
              <TabsTrigger value="cases">Cases</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card className="card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Support Worker Accounts</CardTitle>
                      <CardDescription>Manage user accounts (demo mode - local storage)</CardDescription>
                    </div>
                    <Button onClick={handleAddUser}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                                {user.role.replace("-", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.active ? "secondary" : "destructive"}>
                                {user.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditUser(user)}
                                  title="Edit user"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleActive(user.id)}
                                  title={user.active ? "Deactivate" : "Activate"}
                                >
                                  {user.active ? (
                                    <UserX className="w-4 h-4 text-orange-500" />
                                  ) : (
                                    <UserCheck className="w-4 h-4 text-green-500" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(user.id)}
                                  title="Delete user"
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
            </TabsContent>

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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update user account details" : "Create a new support worker account"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johnsmith"
                disabled={!!editingUser}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "support-worker" | "admin") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support-worker">Support Worker</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              {editingUser ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and will remove all login access.
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
    </div>
  );
};

export default Admin;
