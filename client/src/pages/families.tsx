import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import EditableGrid, { GridColumn } from "@/components/ui/editable-grid";
import AddFamilyDialog from "@/components/dialogs/add-family-dialog";
import PageHeader from "@/components/layout/page-header";
import { useDialogs } from "@/contexts/dialog-context";
import type { Family } from "@shared/schema";

export default function Families() {
  const { toast } = useToast();
  const { addFamilyOpen, setAddFamilyOpen } = useDialogs();

  const { data: families, isLoading } = useQuery({
    queryKey: ["/api/families"],
    queryFn: async () => {
      const response = await fetch("/api/families", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      const allFamilies = await response.json();
      // Filter for only active families
      return allFamilies.filter((family: Family) => family.active === true);
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
        description: "Family has been successfully deleted.",
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

  const handleUpdateFamily = async (id: number, updates: Record<string, any>) => {
    // Convert string boolean values to actual booleans
    const processedUpdates = { ...updates };
    if (updates.active === "true" || updates.active === "false") {
      processedUpdates.active = updates.active === "true";
    }
    
    await updateFamilyMutation.mutateAsync({ id, updates: processedUpdates });
  };

  const handleDeleteFamily = async (familyId: number) => {
    if (confirm("Are you sure you want to delete this family?")) {
      await deleteFamilyMutation.mutateAsync(familyId);
    }
  };

  const columns: GridColumn[] = [
    { key: "lastName", label: "Last Name", sortable: true, editable: true, width: "48" },
    { key: "father", label: "Father", sortable: true, editable: true, width: "48" },
    { key: "mother", label: "Mother", sortable: true, editable: true, width: "48" },
    { key: "email", label: "Email", sortable: true, editable: true, type: "email", width: "64" },
    { key: "secondEmail", label: "Second Email", sortable: true, editable: true, type: "email", width: "64" },
    { key: "parentCell", label: "Parent Cell", sortable: true, editable: true, type: "tel", width: "40" },
    { key: "parentCell2", label: "Parent Cell 2", sortable: true, editable: true, type: "tel", width: "40" },
    { key: "homePhone", label: "Home Phone", sortable: true, editable: true, type: "tel", width: "40" },
    { key: "workPhone", label: "Work Phone", sortable: true, editable: true, type: "tel", width: "40" },
    { key: "address", label: "Address", sortable: true, editable: true, width: "64" },
    { key: "city", label: "City", sortable: true, editable: true, width: "40" },
    { key: "zip", label: "ZIP", sortable: true, editable: true, width: "32" },
    {
      key: "active",
      label: "Status",
      sortable: true,
      editable: true,
      type: "dropdown",
      width: "24",
      options: [
        { value: true, label: "Active" },
        { value: false, label: "Inactive" },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Families"
        description="Manage family information and contacts"
        actionButton={{
          label: "Add Family",
          onClick: () => setAddFamilyOpen(true)
        }}
      />
      <div className="flex-1 p-6 overflow-hidden">
        <EditableGrid
          data={families || []}
          columns={columns}
          onRowUpdate={handleUpdateFamily}
          onRowDelete={handleDeleteFamily}
          isLoading={isLoading}
        />

        <AddFamilyDialog 
          open={addFamilyOpen} 
          onOpenChange={setAddFamilyOpen} 
        />
      </div>
    </div>
  );
}
