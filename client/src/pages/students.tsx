import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import EditableGrid, { GridColumn } from "@/components/ui/editable-grid";
import AddStudentDialog from "@/components/dialogs/add-student-dialog";
import PageHeader from "@/components/layout/page-header";
import { useDialogs } from "@/contexts/dialog-context";
import type { StudentWithFamily } from "@shared/schema";

export default function Students() {
  const { toast } = useToast();
  const { addStudentOpen, setAddStudentOpen } = useDialogs();
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());

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

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      const response = await fetch("/api/courses", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
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
    // Convert string boolean values to actual booleans for inactive field
    const processedUpdates = { ...updates };
    if (updates.inactive === "true" || updates.inactive === "false") {
      processedUpdates.inactive = updates.inactive === "true";
    }
    
    await updateStudentMutation.mutateAsync({ id, updates: processedUpdates });
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

  // Get current grade code for a student
  const getCurrentGradeCode = (gradYear: any) => {
    if (!settings || !gradYear) return null;
    
    const schoolYear = parseInt((settings as any).SchoolYear || "2024");
    const gradeCode = schoolYear - parseInt(gradYear) + 13;
    return gradeCode;
  };

  // Get the class that a student belongs to based on their current grade
  const getStudentClass = (gradYear: any) => {
    if (!gradYear || !settings || !classes) return null;
    
    const gradeCode = getCurrentGradeCode(gradYear);
    if (gradeCode === null) return null;
    
    // Find the class that contains this grade code
    const studentClass = Array.isArray(classes) ? classes.find((cls: any) => 
      gradeCode >= cls.startCode && gradeCode <= cls.endCode
    ) : null;
    
    return studentClass;
  };

  // Get courses for specific hour filtered by student's class
  const getCoursesByHour = (hour: number, studentGradYear: any) => {
    if (!courses) return [];
    const studentClass = getStudentClass(studentGradYear);
    
    return (courses as any[]).filter((course: any) => 
      course.hour === hour && 
      (course.classId === studentClass?.id || course.classId === null)
    );
  };

  // Get Math Hour courses (hour = 0) filtered by student's class
  const getMathHourCourses = (studentGradYear: any) => {
    if (!courses) return [];
    const studentClass = getStudentClass(studentGradYear);
    
    return (courses as any[]).filter((course: any) => 
      course.hour === 0 && 
      (course.classId === studentClass?.id || course.classId === null)
    );
  };

  // Create course options for dropdowns based on student's grade
  const createCourseOptions = (hour: number, studentGradYear: any, semester?: 'fall' | 'spring') => {
    const hourCourses = hour === 0 ? getMathHourCourses(studentGradYear) : getCoursesByHour(hour, studentGradYear);
    
    // Filter by semester if specified
    const filteredCourses = semester ? hourCourses.filter((course: any) => {
      if (semester === 'fall') return course.offeredFall;
      if (semester === 'spring') return course.offeredSpring;
      return true;
    }) : hourCourses;
    
    return [
      { value: "NO_COURSE", label: "No Course" },
      ...filteredCourses.map((course: any) => ({
        value: course.courseName,
        label: course.courseName
      }))
    ];
  };

  // Prepare data with computed grade and selected status
  const studentsWithGrade = students?.map((student: StudentWithFamily) => ({
    ...student,
    currentGrade: getCurrentGrade(student.gradYear),
    familyName: student.family.lastName,
    selected: selectedStudents.has(student.id)
  })) || [];

  const handleStudentSelection = (studentId: number, selected: boolean) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(studentId);
      } else {
        newSet.delete(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      // Select all students
      const allStudentIds = new Set(studentsWithGrade.map(student => student.id));
      setSelectedStudents(allStudentIds);
    } else {
      // Deselect all students
      setSelectedStudents(new Set());
    }
  };

  const isAllSelected = studentsWithGrade.length > 0 && selectedStudents.size === studentsWithGrade.length;
  const isIndeterminate = selectedStudents.size > 0 && selectedStudents.size < studentsWithGrade.length;

  const handleExportSelected = () => {
    if (selectedStudents.size === 0) {
      toast({
        title: "No Students Selected",
        description: "Please select students to export.",
        variant: "destructive",
      });
      return;
    }

    // Get selected students data
    const selectedStudentsData = studentsWithGrade.filter(student => 
      selectedStudents.has(student.id)
    );

    // Create CSV content
    const headers = [
      "ID",
      "Last Name", 
      "First Name",
      "Family Name",
      "Current Grade",
      "Grad Year",
      "Birth Date",
      "Comments",
      "Inactive",
      "Math Hour",
      "1st Hour",
      "2nd Hour", 
      "3rd Hour",
      "4th Hour",
      "5th Hour Fall",
      "5th Hour Spring",
      "Friday Science"
    ];

    const csvRows = [
      headers.join(","),
      ...selectedStudentsData.map(student => [
        student.id,
        `"${student.lastName || ""}"`,
        `"${student.firstName || ""}"`,
        `"${student.familyName || ""}"`,
        `"${student.currentGrade || ""}"`,
        student.gradYear || "",
        student.birthdate ? new Date(student.birthdate).toLocaleDateString() : "",
        `"${student.comment1 || ""}"`,
        student.inactive ? "true" : "false",
        `"${student.mathHour || ""}"`,
        `"${student.firstHour || ""}"`,
        `"${student.secondHour || ""}"`,
        `"${student.thirdHour || ""}"`,
        `"${student.fourthHour || ""}"`,
        `"${student.fifthHourFall || ""}"`,
        `"${student.fifthHourSpring || ""}"`,
        `"${student.fridayScience || ""}"`
      ].join(","))
    ];

    const csvContent = csvRows.join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `selected_students_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${selectedStudents.size} students to CSV file.`,
    });
  };

  const columns: GridColumn[] = [
    { 
      key: "selected", 
      label: "Selected", 
      sortable: false, 
      editable: false, 
      width: "20", 
      type: "checkbox",
      onCheckboxChange: handleStudentSelection,
      selectAllCheckbox: {
        checked: isAllSelected,
        indeterminate: isIndeterminate,
        onChange: handleSelectAll
      }
    },
    { key: "lastName", label: "Last Name", sortable: true, editable: true, width: "40" },
    { key: "firstName", label: "First Name", sortable: true, editable: true, width: "40" },
    { key: "familyName", label: "Family", sortable: true, editable: false, width: "40" },
    { key: "currentGrade", label: "Current Grade", sortable: true, editable: false, width: "32" },
    { key: "gradYear", label: "Grad Year", sortable: true, editable: true, type: "number", width: "28" },
    { key: "birthdate", label: "Birth Date", sortable: true, editable: true, type: "date", width: "32" },
    { key: "comment1", label: "Comments", sortable: true, editable: true, type: "text", width: "48" },
    { key: "inactive", label: "Inactive", sortable: true, editable: true, type: "checkbox", width: "24" },
    { 
      key: "mathHour", 
      label: "Math Hour", 
      sortable: true, 
      editable: false, 
      width: "40", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(0, row.gradYear)
    },
    { 
      key: "firstHour", 
      label: "1st Hour", 
      sortable: true, 
      editable: false, 
      width: "40", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(1, row.gradYear)
    },
    { 
      key: "secondHour", 
      label: "2nd Hour", 
      sortable: true, 
      editable: false, 
      width: "40", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(2, row.gradYear)
    },
    { 
      key: "thirdHour", 
      label: "3rd Hour", 
      sortable: true, 
      editable: false, 
      width: "40", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(3, row.gradYear)
    },
    { 
      key: "fourthHour", 
      label: "4th Hour", 
      sortable: true, 
      editable: false, 
      width: "40", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(4, row.gradYear)
    },
    { 
      key: "fifthHourFall", 
      label: "5th Hour (Fall)", 
      sortable: true, 
      editable: false, 
      width: "48", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(5, row.gradYear, 'fall')
    },
    { 
      key: "fifthHourSpring", 
      label: "5th Hour (Spring)", 
      sortable: true, 
      editable: false, 
      width: "48", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(5, row.gradYear, 'spring')
    },
    { 
      key: "fridayScience", 
      label: "Friday Science", 
      sortable: true, 
      editable: false, 
      width: "40", 
      type: "dropdown", 
      options: (row: any) => {
        if (!courses) return [{ value: "NO_COURSE", label: "No Course" }];
        const studentClass = getStudentClass(row.gradYear);
        
        // Filter courses for Friday Science or science-related courses
        const fridayCourses = (courses as any[]).filter((course: any) => 
          (course.location?.toLowerCase().includes('friday') || 
           course.courseName?.toLowerCase().includes('science')) &&
          (course.classId === studentClass?.id || course.classId === null)
        );
        
        return [
          { value: "NO_COURSE", label: "No Course" },
          ...fridayCourses.map((course: any) => ({
            value: course.courseName,
            label: course.courseName
          }))
        ];
      }
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Students"
        description="Manage student records and enrollment"
        actionButton={{
          label: "Add Student",
          onClick: () => setAddStudentOpen(true)
        }}
        secondaryButton={{
          label: `Export Selected Students (${selectedStudents.size})`,
          onClick: handleExportSelected,
          variant: "outline",
          icon: Download,
          disabled: selectedStudents.size === 0
        }}
      />
      <div className="flex-1 p-6 overflow-hidden">
        <EditableGrid
          data={studentsWithGrade}
          columns={columns}
          onRowUpdate={handleUpdateStudent}
          onRowDelete={handleDeleteStudent}
          isLoading={studentsLoading}
        />

        <AddStudentDialog 
          open={addStudentOpen} 
          onOpenChange={setAddStudentOpen} 
        />
      </div>
    </div>
  );
}
