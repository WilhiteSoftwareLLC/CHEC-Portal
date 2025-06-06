import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import EditableGrid, { GridColumn } from "@/components/ui/editable-grid";
import AddStudentDialog from "@/components/dialogs/add-student-dialog";
import type { StudentWithFamily } from "@shared/schema";

export default function Students() {
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const { toast } = useToast();

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const response = await fetch("/api/students", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const { data: grades } = useQuery({
    queryKey: ["/api/grades"],
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Record<string, any> }) => {
      await apiRequest(`/api/students/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Updated",
        description: "Student information has been saved.",
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

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      await apiRequest(`/api/students/${studentId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Deleted",
        description: "Student has been successfully deleted.",
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

  const handleUpdateStudent = async (id: number, updates: Record<string, any>) => {
    await updateStudentMutation.mutateAsync({ id, updates });
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (confirm("Are you sure you want to delete this student?")) {
      await deleteStudentMutation.mutateAsync(studentId);
    }
  };

  // Calculate current grade for display
  const getCurrentGrade = (gradYear: any) => {
    if (!settings || !grades || !gradYear) return "Unknown";
    
    const schoolYear = parseInt((settings as any).SchoolYear || "2024");
    const gradeCode = schoolYear - parseInt(gradYear) + 13;
    const grade = (grades as any[]).find((g: any) => g.code === gradeCode);
    return grade ? grade.gradeName : "Unknown";
  };

  // Prepare data with computed grade
  const studentsWithGrade = students?.map((student: StudentWithFamily) => ({
    ...student,
    currentGrade: getCurrentGrade(student.gradYear),
    familyName: student.family.lastName
  })) || [];

  const columns: GridColumn[] = [
    { key: "lastName", label: "Last Name", sortable: true, editable: true, width: "40" },
    { key: "firstName", label: "First Name", sortable: true, editable: true, width: "40" },
    { key: "familyName", label: "Family", sortable: true, editable: false, width: "40" },
    { key: "currentGrade", label: "Current Grade", sortable: true, editable: false, width: "32" },
    { key: "gradYear", label: "Grad Year", sortable: true, editable: true, type: "number", width: "28" },
    { key: "mathHour", label: "Math Hour", sortable: true, editable: true, width: "40" },
    { key: "firstHour", label: "1st Hour", sortable: true, editable: true, width: "40" },
    { key: "secondHour", label: "2nd Hour", sortable: true, editable: true, width: "40" },
    { key: "thirdHour", label: "3rd Hour", sortable: true, editable: true, width: "40" },
    { key: "fourthHour", label: "4th Hour", sortable: true, editable: true, width: "40" },
    { key: "fifthHourFall", label: "5th Hour (Fall)", sortable: true, editable: true, width: "48" },
    { key: "fifthHourSpring", label: "5th Hour (Spring)", sortable: true, editable: true, width: "48" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Button 
          onClick={() => setAddStudentOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      <EditableGrid
        data={studentsWithGrade}
        columns={columns}
        onRowUpdate={handleUpdateStudent}
        onRowDelete={handleDeleteStudent}
        isLoading={studentsLoading}
        className="mb-6"
      />

      <AddStudentDialog 
        open={addStudentOpen} 
        onOpenChange={setAddStudentOpen} 
      />
    </div>
  );
}