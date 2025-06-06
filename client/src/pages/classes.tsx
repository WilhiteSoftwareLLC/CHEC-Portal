import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EditableGrid, { type GridColumn } from "@/components/ui/editable-grid";
import type { Class, Grade, InsertClass } from "@shared/schema";

export default function Classes() {
  const { toast } = useToast();

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes"],
    retry: false,
  });

  const { data: grades } = useQuery({
    queryKey: ["/api/grades"],
    retry: false,
  });

  const updateClassMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Record<string, any> }) => {
      return await apiRequest(`/api/classes/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Class Updated",
        description: "Class has been successfully updated.",
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

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: number) => {
      await apiRequest(`/api/classes/${classId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Class Deleted",
        description: "Class has been successfully deleted.",
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

  const handleUpdateClass = async (id: number, updates: Record<string, any>) => {
    const processedUpdates = { ...updates };
    
    // Convert grade codes to integers
    if (updates.startCode !== undefined) {
      processedUpdates.startCode = parseInt(updates.startCode);
    }
    if (updates.endCode !== undefined) {
      processedUpdates.endCode = parseInt(updates.endCode);
    }
    
    await updateClassMutation.mutateAsync({ id, updates: processedUpdates });
  };

  const handleDeleteClass = async (classId: number) => {
    if (confirm("Are you sure you want to delete this class?")) {
      await deleteClassMutation.mutateAsync(classId);
    }
  };

  // Create grade options for dropdown
  const gradeOptions = (grades || []).map((grade: Grade) => ({
    value: grade.code,
    label: grade.gradeName
  }));

  const columns: GridColumn[] = [
    { key: "className", label: "Class Name", sortable: true, editable: true, width: "50" },
    { key: "startCode", label: "Start Grade", sortable: true, editable: false, width: "25", type: "dropdown", options: gradeOptions },
    { key: "endCode", label: "End Grade", sortable: true, editable: false, width: "25", type: "dropdown", options: gradeOptions },
  ];

  return (
    <div className="p-6">
      <EditableGrid
        data={classes || []}
        columns={columns}
        onUpdate={handleUpdateClass}
        onDelete={handleDeleteClass}
        isLoading={classesLoading}
        emptyMessage="No classes found"
        showAddButton={false}
      />
    </div>
  );
}