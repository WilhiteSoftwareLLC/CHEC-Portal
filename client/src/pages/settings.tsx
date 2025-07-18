import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Plus, Trash2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EditableGrid, { GridColumn } from "@/components/ui/editable-grid";
import PageHeader from "@/components/layout/page-header";
import type { Grade } from "@shared/schema";

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

  // Fetch all grades
  const { data: grades, isLoading: gradesLoading } = useQuery({
    queryKey: ["/api/grades"],
  });

  // Mutation to update a setting
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      await apiRequest(`/api/settings/${key}`, "PUT", { value, description });
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
      await apiRequest(`/api/settings/${key}`, "PUT", { value, description });
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
      await apiRequest(`/api/settings/${key}`, "DELETE");
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

  // Mutation to update a grade
  const updateGradeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Record<string, any> }) => {
      await apiRequest(`/api/grades/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({
        title: "Grade Updated",
        description: "Grade has been updated successfully.",
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

  // Mutation to delete a grade
  const deleteGradeMutation = useMutation({
    mutationFn: async (gradeId: number) => {
      await apiRequest(`/api/grades/${gradeId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({
        title: "Grade Deleted",
        description: "Grade has been deleted successfully.",
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

  // Mutation to create a new grade
  const createGradeMutation = useMutation({
    mutationFn: async (gradeData: { gradeName: string; code: number }) => {
      await apiRequest("/api/grades", "POST", gradeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({
        title: "Grade Created",
        description: "Grade has been created successfully.",
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

  const handleUpdateGrade = async (id: number, updates: Record<string, any>) => {
    const processedUpdates = { ...updates };
    
    // Convert code to integer
    if (updates.code !== undefined) {
      processedUpdates.code = parseInt(updates.code);
    }
    
    await updateGradeMutation.mutateAsync({ id, updates: processedUpdates });
  };

  const handleDeleteGrade = async (gradeId: number) => {
    if (confirm("Are you sure you want to delete this grade?")) {
      await deleteGradeMutation.mutateAsync(gradeId);
    }
  };

  const handleAddGrade = () => {
    const gradeName = prompt("Enter grade name:");
    if (!gradeName) return;
    
    const codeStr = prompt("Enter grade code (number):");
    if (!codeStr) return;
    
    const code = parseInt(codeStr);
    if (isNaN(code)) {
      toast({
        title: "Invalid Code",
        description: "Grade code must be a number.",
        variant: "destructive",
      });
      return;
    }
    
    createGradeMutation.mutate({ gradeName, code });
  };

  if (isLoading || gradesLoading) {
    return (
      <div>
        <PageHeader 
          title="Settings"
          description="Manage system-wide configuration settings and grades"
        />
        <div className="p-6">
          <div className="text-center py-8">Loading...</div>
        </div>
      </div>
    );
  }

  const settingsArray = settings ? Object.entries(settings).map(([key, value]) => ({ key, value })) : [];

  const gradeColumns: GridColumn[] = [
    { key: "gradeName", label: "Grade Name", sortable: true, editable: true, width: "48" },
    { key: "code", label: "Code", sortable: true, editable: true, type: "number", width: "24" },
  ];

  return (
    <div>
      <PageHeader 
        title="Settings"
        description="Manage system-wide configuration settings and grades"
      />
      <div className="p-6">
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                {settingsArray.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No settings configured.
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="grades" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Grade Mappings</h3>
                  <p className="text-sm text-gray-600">Manage the mapping between grade names and codes</p>
                </div>
                <Button onClick={handleAddGrade} disabled={createGradeMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Grade
                </Button>
              </div>
              
              <EditableGrid
                data={grades || []}
                columns={gradeColumns}
                onRowUpdate={handleUpdateGrade}
                onRowDelete={handleDeleteGrade}
                isLoading={gradesLoading}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
