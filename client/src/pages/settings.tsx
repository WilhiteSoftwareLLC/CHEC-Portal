import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Plus, Trash2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Setting {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
}

export default function Settings() {
  const { toast } = useToast();
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch all settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Mutation to update a setting
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      await apiRequest(`/api/settings/${key}`, {
        method: "PUT",
        body: { value, description },
      });
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setEditingSettings(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
      toast({
        title: "Setting updated",
        description: `${key} has been updated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to add a new setting
  const addSettingMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      await apiRequest(`/api/settings/${key}`, {
        method: "PUT",
        body: { value, description },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setNewKey("");
      setNewValue("");
      setNewDescription("");
      setIsAddDialogOpen(false);
      toast({
        title: "Setting added",
        description: "New setting has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a setting
  const deleteSettingMutation = useMutation({
    mutationFn: async (key: string) => {
      await apiRequest(`/api/settings/${key}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, key) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Setting deleted",
        description: `${key} has been deleted successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditChange = (key: string, value: string) => {
    setEditingSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string, description?: string) => {
    const value = editingSettings[key];
    if (value !== undefined) {
      updateSettingMutation.mutate({ key, value, description });
    }
  };

  const handleAdd = () => {
    if (newKey && newValue) {
      addSettingMutation.mutate({
        key: newKey,
        value: newValue,
        description: newDescription || undefined,
      });
    }
  };

  const handleDelete = (key: string) => {
    if (confirm(`Are you sure you want to delete the setting "${key}"?`)) {
      deleteSettingMutation.mutate(key);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <div className="text-center py-8">Loading settings...</div>
      </div>
    );
  }

  const settingsArray = settings ? Object.entries(settings).map(([key, value]) => ({ key, value })) : [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Setting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Setting</DialogTitle>
              <DialogDescription>
                Add a new configuration setting to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-key">Key</Label>
                <Input
                  id="new-key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g., FamilyFee, SchoolYear"
                />
              </div>
              <div>
                <Label htmlFor="new-value">Value</Label>
                <Input
                  id="new-value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Setting value"
                />
              </div>
              <div>
                <Label htmlFor="new-description">Description (Optional)</Label>
                <Input
                  id="new-description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of this setting"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAdd} 
                  disabled={!newKey || !newValue || addSettingMutation.isPending}
                >
                  Add Setting
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Settings</CardTitle>
          <CardDescription>
            Manage system-wide configuration settings. These values control various aspects of the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settingsArray.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No settings configured. Add your first setting using the button above.
            </div>
          ) : (
            <div className="space-y-4">
              {settingsArray.map(({ key, value }) => (
                <div key={key} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <Label className="font-medium">{key}</Label>
                    <Input
                      value={editingSettings[key] ?? value ?? ""}
                      onChange={(e) => handleEditChange(key, e.target.value)}
                      placeholder="Setting value"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(key)}
                      disabled={editingSettings[key] === undefined || updateSettingMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(key)}
                      disabled={deleteSettingMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}