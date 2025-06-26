import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import EditableGrid, { GridColumn } from "@/components/ui/editable-grid";
import PageHeader from "@/components/layout/page-header";
import type { Family } from "@shared/schema";

export default function FormerFamilies() {
  const { toast } = useToast();

  const { data: families, isLoading } = useQuery({
    queryKey: ["/api/families", "inactive"],
    queryFn: async () => {
      const response = await fetch("/api/families", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      const allFamilies = await response.json();
      // Filter for only inactive families
      return allFamilies.filter((family: Family) => family.active === false);
    },
    retry: false,
  });

  const updateFamilyMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Record<string, any> }) => {
      await apiRequest(`/api/families/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      toast({
        title: "Family Updated",
        description: "Family information has been saved.",
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

  const deleteFamilyMutation = useMutation({
    mutationFn: async (familyId: number) => {
      await apiRequest(`/api/families/${familyId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      toast({
        title: "Family Deleted",
        description: "Family has been permanently removed.",
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

  const columns: GridColumn[] = [
    {
      key: "lastName",
      label: "Last Name",
      sortable: true,
      editable: true,
      type: "text",
    },
    {
      key: "father",
      label: "Father",
      sortable: true,
      editable: true,
      type: "text",
    },
    {
      key: "mother",
      label: "Mother",
      sortable: true,
      editable: true,
      type: "text",
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      editable: true,
      type: "email",
    },
    {
      key: "secondEmail",
      label: "Second Email",
      sortable: true,
      editable: true,
      type: "email",
    },
    {
      key: "parentCell",
      label: "Parent Cell",
      sortable: true,
      editable: true,
      type: "tel",
    },
    {
      key: "parentCell2",
      label: "Parent Cell 2",
      sortable: true,
      editable: true,
      type: "tel",
    },
    {
      key: "homePhone",
      label: "Home Phone",
      sortable: true,
      editable: true,
      type: "tel",
    },
    {
      key: "workPhone",
      label: "Work Phone",
      sortable: true,
      editable: true,
      type: "tel",
    },
    {
      key: "address",
      label: "Address",
      sortable: true,
      editable: true,
      type: "text",
    },
    {
      key: "city",
      label: "City",
      sortable: true,
      editable: true,
      type: "text",
    },
    {
      key: "zip",
      label: "Zip",
      sortable: true,
      editable: true,
      type: "text",
    },
    {
      key: "active",
      label: "Status",
      sortable: true,
      editable: true,
      type: "dropdown",
      options: [
        { value: true, label: "Active" },
        { value: false, label: "Inactive" },
      ],
    },
  ];

  const handleRowUpdate = async (id: number, updates: Record<string, any>) => {
    // Convert string boolean values to actual booleans
    const processedUpdates = { ...updates };
    if (updates.active === "true" || updates.active === "false") {
      processedUpdates.active = updates.active === "true";
    }
    
    await new Promise((resolve, reject) => {
      updateFamilyMutation.mutate({
        id,
        updates: processedUpdates,
      }, {
        onSuccess: resolve,
        onError: reject,
      });
    });
  };

  const handleRowDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this family? This action cannot be undone.")) {
      await new Promise((resolve, reject) => {
        deleteFamilyMutation.mutate(id, {
          onSuccess: resolve,
          onError: reject,
        });
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Former Families"
        description="Manage inactive family records"
      />
      <div className="flex-1 p-6 overflow-hidden">
        <EditableGrid
          data={families || []}
          columns={columns}
          isLoading={isLoading}
          onRowUpdate={handleRowUpdate}
          onRowDelete={handleRowDelete}
        />
      </div>
    </div>
  );
}
