import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Plus, Trash2, Save, Database, Mail, Send, TestTube } from "lucide-react";
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
    queryFn: async () => {
      const response = await fetch("/api/settings", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  // Fetch all grades
  const { data: grades, isLoading: gradesLoading } = useQuery({
    queryKey: ["/api/grades"],
    queryFn: async () => {
      const response = await fetch("/api/grades", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
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

  // Mutation to reset all course selections
  const resetCourseSelectionsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/students/reset-course-selections", "POST");
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Course Selections Reset",
        description: `All course selections have been removed from ${response.studentsUpdated} students.`,
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

  // Mutation to reset all payments
  const resetAllPaymentsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/payments/all", "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bill-adjustments"] });
      toast({
        title: "Payments and Adjustments Reset",
        description: "All payment records and bill adjustments have been permanently deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Reset Failed",
        description: "Failed to reset payments and adjustments. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to backup database
  const backupDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/backup", {
        method: "POST",
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Backup failed: ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Database Backup Created",
        description: `Backup saved to: ${response.backupPath}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Backup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to test email connection
  const testEmailConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/email/test-connection", {
        method: "POST",
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Connection test failed: ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Email Connection Successful",
          description: "SMTP connection is working correctly.",
        });
      } else {
        toast({
          title: "Email Connection Failed",
          description: "Could not connect to SMTP server. Check configuration.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to send family links emails
  const sendFamilyLinksEmailsMutation = useMutation({
    mutationFn: async ({ testMode = false, testFamilyId = null }: { testMode?: boolean; testFamilyId?: number | null }) => {
      const response = await fetch("/api/email/send-family-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ testMode, testFamilyId })
      });
      
      if (!response.ok) {
        throw new Error(`Email send failed: ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      if (response.testMode) {
        if (response.success) {
          toast({
            title: "Test Email Sent",
            description: `Test email sent successfully to ${response.familyTested} family.`,
          });
        } else {
          toast({
            title: "Test Email Failed",
            description: response.error || "Failed to send test email.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Family Links Sent",
          description: `Successfully sent ${response.totalSent} emails. ${response.totalFailed > 0 ? `${response.totalFailed} failed.` : ''}`,
          variant: response.totalFailed > 0 ? "destructive" : "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Email Send Failed",
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

  const handleResetCourseSelections = () => {
    if (window.confirm("Are you sure you want to remove all the students from all the courses?")) {
      resetCourseSelectionsMutation.mutate();
    }
  };

  const handleResetAllPayments = () => {
    if (window.confirm("Are you sure you want to permanently delete ALL payment records? This action cannot be undone.")) {
      resetAllPaymentsMutation.mutate();
    }
  };

  const handleBackupDatabase = () => {
    if (window.confirm("Create a backup of the CHEC Portal database?")) {
      backupDatabaseMutation.mutate();
    }
  };

  const handleTestEmailConnection = () => {
    testEmailConnectionMutation.mutate();
  };

  const handleSendFamilyLinksEmails = () => {
    if (window.confirm("Send family links emails to ALL families with email addresses? This will send invoice and schedule links to every family.")) {
      sendFamilyLinksEmailsMutation.mutate({});
    }
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
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Settings"
        description="Manage system-wide configuration settings and grades"
      />
      <div className="flex-1 p-6 overflow-hidden">
        <Tabs defaultValue="settings" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="mt-6 flex-1 overflow-y-auto">
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
          
          <TabsContent value="grades" className="mt-6 flex-1 overflow-y-auto">
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
          
          <TabsContent value="tools" className="mt-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Tools</h3>
                <p className="text-sm text-gray-600">Administrative tools and utilities</p>
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div>
                      <h4 className="font-medium text-gray-900">Data Management</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Create a backup of the CHEC Portal database for data protection and recovery.
                      </p>
                      <Button
                        onClick={handleBackupDatabase}
                        disabled={backupDatabaseMutation.isPending}
                        variant="outline"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        {backupDatabaseMutation.isPending ? "Creating Backup..." : "Backup Data"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div>
                      <h4 className="font-medium text-gray-900">Course Management</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Reset all student course selections to prepare for a new enrollment period.
                      </p>
                      <Button
                        onClick={handleResetCourseSelections}
                        disabled={resetCourseSelectionsMutation.isPending}
                        variant="destructive"
                      >
                        {resetCourseSelectionsMutation.isPending ? "Resetting..." : "Reset All Course Selections"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div>
                      <h4 className="font-medium text-gray-900">Payment Management</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Reset all payment records and bill adjustments to start fresh for a new school year. This will permanently remove all payment and adjustment history.
                      </p>
                      <Button
                        onClick={handleResetAllPayments}
                        disabled={resetAllPaymentsMutation.isPending}
                        variant="destructive"
                      >
                        {resetAllPaymentsMutation.isPending ? "Resetting..." : "Reset All Payments"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div>
                      <h4 className="font-medium text-gray-900">Family Email Notifications</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Send secure links to all families via email, allowing them to access their invoices and student schedules without logging in.
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        <Button
                          onClick={handleTestEmailConnection}
                          disabled={testEmailConnectionMutation.isPending}
                          variant="outline"
                          size="sm"
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          {testEmailConnectionMutation.isPending ? "Testing..." : "Test Connection"}
                        </Button>
                        <Button
                          onClick={handleSendFamilyLinksEmails}
                          disabled={sendFamilyLinksEmailsMutation.isPending}
                          variant="default"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {sendFamilyLinksEmailsMutation.isPending ? "Sending..." : "Send Family Links"}
                        </Button>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700">
                          <Mail className="h-3 w-3 inline mr-1" />
                          Emails include secure links to both family invoices and student schedules. Only families with email addresses will receive notifications.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
