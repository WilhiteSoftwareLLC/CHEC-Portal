import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Edit, Trash2, Plus } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import type { AdminUser, ParentUser, Family } from "@shared/schema";

interface UserWithFamily extends ParentUser {
  family?: Family;
}

export default function Users() {
  const { toast } = useToast();
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | UserWithFamily | null>(null);
  const [userType, setUserType] = useState<"admin" | "parent">("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    familyId: "",
    role: "admin",
    active: true
  });

  const { data: adminUsers } = useQuery({
    queryKey: ["/api/admin-users"],
    retry: false,
  });

  const { data: parentUsers } = useQuery({
    queryKey: ["/api/parent-users"], 
    retry: false,
  });

  const { data: families } = useQuery({
    queryKey: ["/api/families"],
    retry: false,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const endpoint = userType === "admin" ? "/api/admin-users" : "/api/parent-users";
      return await apiRequest(endpoint, "POST", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-users"] });
      toast({
        title: "User Created",
        description: `${userType === "admin" ? "Admin" : "Parent"} user has been created successfully.`,
      });
      setAddUserDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates, type }: { id: number; updates: any; type: "admin" | "parent" }) => {
      const endpoint = type === "admin" ? `/api/admin-users/${id}` : `/api/parent-users/${id}`;
      return await apiRequest(endpoint, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-users"] });
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
      setEditUserDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: "admin" | "parent" }) => {
      const endpoint = type === "admin" ? `/api/admin-users/${id}` : `/api/parent-users/${id}`;
      return await apiRequest(endpoint, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-users"] });
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      familyId: "",
      role: "admin",
      active: true
    });
    setShowPassword(false);
  };

  const handleAddUser = () => {
    setUserType("admin");
    resetForm();
    setAddUserDialogOpen(true);
  };

  const handleEditUser = (user: AdminUser | UserWithFamily, type: "admin" | "parent") => {
    setSelectedUser(user);
    setUserType(type);
    setFormData({
      username: user.username,
      email: user.email,
      firstName: ("firstName" in user ? user.firstName : "") || "",
      lastName: ("lastName" in user ? user.lastName : "") || "",
      password: "",
      familyId: "familyId" in user ? user.familyId?.toString() || "" : "",
      role: user.role,
      active: user.active ?? true
    });
    setEditUserDialogOpen(true);
  };

  const handleDeleteUser = (user: AdminUser | UserWithFamily, type: "admin" | "parent") => {
    if (window.confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone.`)) {
      deleteUserMutation.mutate({ id: user.id, type });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userData = {
      username: formData.username,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      password: formData.password,
      role: formData.role,
      active: formData.active,
      ...(userType === "parent" && formData.familyId && { familyId: parseInt(formData.familyId) })
    };

    if (editUserDialogOpen && selectedUser) {
      const updates: any = { ...userData };
      if (!formData.password) {
        delete updates.password;
      }
      updateUserMutation.mutate({ 
        id: selectedUser.id, 
        updates, 
        type: userType 
      });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  const getFamilyName = (familyId: number) => {
    const familyList = Array.isArray(families) ? families : [];
    const family = familyList.find((f: Family) => f.id === familyId);
    return family ? family.lastName : "Unknown Family";
  };

  const adminUserList = Array.isArray(adminUsers) ? adminUsers : [];
  const parentUserList = Array.isArray(parentUsers) ? parentUsers : [];
  const familyList = Array.isArray(families) ? families : [];

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="User Management"
        description="Manage admin and parent user accounts"
        actionButton={{
          label: "Add User",
          onClick: handleAddUser,
          icon: Plus
        }}
      />
      <div className="flex-1 p-6 overflow-hidden">
        <Tabs defaultValue="admin" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin">Admin Users</TabsTrigger>
            <TabsTrigger value="parent">Parent Users</TabsTrigger>
          </TabsList>

          <TabsContent value="admin" className="flex-1 overflow-hidden">
            <div className="border rounded-lg">
              <div className="overflow-auto max-h-[calc(100vh-250px)]">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">Username</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {adminUserList.map((user: AdminUser) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.username}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <Badge variant="outline">{user.role}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={user.active ? "default" : "secondary"}>
                            {user.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditUser(user, "admin")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteUser(user, "admin")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parent" className="flex-1 overflow-hidden">
            <div className="border rounded-lg">
              <div className="overflow-auto max-h-[calc(100vh-250px)]">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">Username</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">Family</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {parentUserList.map((user: UserWithFamily) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.username}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {getFamilyName(user.familyId)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={user.active ? "default" : "secondary"}>
                            {user.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditUser(user, "parent")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteUser(user, "parent")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add User Dialog */}
        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="userType">User Type</Label>
                <Select value={userType} onValueChange={(value: "admin" | "parent") => setUserType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin User</SelectItem>
                    <SelectItem value="parent">Parent User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              {userType === "parent" && (
                <div>
                  <Label htmlFor="familyId">Family</Label>
                  <Select value={formData.familyId} onValueChange={(value) => setFormData({ ...formData, familyId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select family" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyList.map((family: Family) => (
                        <SelectItem key={family.id} value={family.id.toString()}>
                          {family.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              {userType === "parent" && (
                <div>
                  <Label htmlFor="edit-familyId">Family</Label>
                  <Select value={formData.familyId} onValueChange={(value) => setFormData({ ...formData, familyId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select family" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyList.map((family: Family) => (
                        <SelectItem key={family.id} value={family.id.toString()}>
                          {family.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "Updating..." : "Update User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}