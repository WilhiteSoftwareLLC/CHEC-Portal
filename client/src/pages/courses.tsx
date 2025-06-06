import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import EditableGrid, { GridColumn } from "@/components/ui/editable-grid";
import AddCourseDialog from "@/components/dialogs/add-course-dialog";
import { useDialogs } from "@/contexts/dialog-context";
import type { Course } from "@shared/schema";

export default function Courses() {
  const { toast } = useToast();
  const { addCourseOpen, setAddCourseOpen } = useDialogs();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      const response = await fetch("/api/courses", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const { data: hours } = useQuery({
    queryKey: ["/api/hours"],
    queryFn: async () => {
      const response = await fetch("/api/hours", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Record<string, any> }) => {
      await apiRequest(`/api/courses/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course Updated",
        description: "Course information has been saved.",
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

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest(`/api/courses/${courseId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course Deleted",
        description: "Course has been successfully deleted.",
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

  const handleUpdateCourse = async (id: number, updates: Record<string, any>) => {
    // Convert boolean strings to actual booleans for offered fields
    const processedUpdates = { ...updates };
    if (updates.offeredFall === "true" || updates.offeredFall === "false") {
      processedUpdates.offeredFall = updates.offeredFall === "true";
    }
    if (updates.offeredSpring === "true" || updates.offeredSpring === "false") {
      processedUpdates.offeredSpring = updates.offeredSpring === "true";
    }
    if (updates.hour !== undefined) {
      processedUpdates.hour = parseInt(updates.hour);
    }
    
    await updateCourseMutation.mutateAsync({ id, updates: processedUpdates });
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (confirm("Are you sure you want to delete this course?")) {
      await deleteCourseMutation.mutateAsync(courseId);
    }
  };

  // Create hour options for dropdown
  const hourOptions = [
    { value: 0, label: "Math Hour" },
    ...(hours || []).map((hour: any) => ({
      value: hour.hourNumber,
      label: `${hour.hourNumber}${hour.hourNumber === 1 ? 'st' : hour.hourNumber === 2 ? 'nd' : hour.hourNumber === 3 ? 'rd' : 'th'} Hour`
    }))
  ];

  const columns: GridColumn[] = [
    { key: "courseName", label: "Course Name", sortable: true, editable: true, width: "64" },
    { key: "hour", label: "Hour", sortable: true, editable: false, width: "32", type: "dropdown", options: hourOptions },
    { key: "offeredFall", label: "Fall", sortable: true, editable: false, width: "20", type: "checkbox" },
    { key: "offeredSpring", label: "Spring", sortable: true, editable: false, width: "20", type: "checkbox" },
  ];

  return (
    <div className="p-6">
      <EditableGrid
        data={courses || []}
        columns={columns}
        onRowUpdate={handleUpdateCourse}
        onRowDelete={handleDeleteCourse}
        isLoading={isLoading}
      />

      <AddCourseDialog 
        open={addCourseOpen} 
        onOpenChange={setAddCourseOpen} 
      />
    </div>
  );
}