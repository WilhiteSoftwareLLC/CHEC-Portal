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

  // Prepare data with computed display values
  const coursesWithDisplay = courses?.map((course: Course) => ({
    ...course,
    hourDisplay: course.hour === 0 ? "Math Hour" : course.hour?.toString() || "",
    offeredFallDisplay: course.offeredFall ? "Yes" : "No",
    offeredSpringDisplay: course.offeredSpring ? "Yes" : "No"
  })) || [];

  const columns: GridColumn[] = [
    { key: "courseName", label: "Course Name", sortable: true, editable: true, width: "64" },
    { key: "hourDisplay", label: "Hour", sortable: true, editable: false, width: "24" },
    { key: "hour", label: "Hour (Edit)", sortable: true, editable: true, type: "number", width: "32" },
    { key: "offeredFallDisplay", label: "Fall", sortable: true, editable: false, width: "20" },
    { key: "offeredFall", label: "Fall (Edit)", sortable: true, editable: true, width: "24" },
    { key: "offeredSpringDisplay", label: "Spring", sortable: true, editable: false, width: "20" },
    { key: "offeredSpring", label: "Spring (Edit)", sortable: true, editable: true, width: "24" },
  ];

  return (
    <div className="p-6">
      <EditableGrid
        data={coursesWithDisplay}
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