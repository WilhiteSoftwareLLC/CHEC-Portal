import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import EditableGrid, { GridColumn } from "@/components/ui/editable-grid";
import AddFamilyDialog from "@/components/dialogs/add-family-dialog";
import type { Family } from "@shared/schema";

export default function Families() {
  const [search, setSearch] = useState("");
  const [addFamilyOpen, setAddFamilyOpen] = useState(false);
  const { toast } = useToast();

  const { data: families, isLoading } = useQuery({
    queryKey: ["/api/families", search],
    queryFn: async () => {
      const url = search ? `/api/families?search=${encodeURIComponent(search)}` : "/api/families";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
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
    await updateFamilyMutation.mutateAsync({ id, updates });
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
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Families</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage family information and contacts</p>
        </div>
        <Button 
          onClick={() => setAddFamilyOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Family
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search families..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Families Grid */}
      <EditableGrid
        data={families || []}
        columns={columns}
        onRowUpdate={handleUpdateFamily}
        onRowDelete={handleDeleteFamily}
        isLoading={isLoading}
        className="mb-6"
      />

      <AddFamilyDialog 
        open={addFamilyOpen} 
        onOpenChange={setAddFamilyOpen} 
      />
    </div>
  );
}