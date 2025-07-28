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
import { getCurrentGradeString, getCurrentGradeCode, getCurrentSortableGrade } from "@/lib/gradeUtils";
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
    queryFn: async () => {
      const response = await fetch("/api/grades", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: async () => {
      const response = await fetch("/api/classes", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
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

  const { data: hours } = useQuery({
    queryKey: ["/api/hours"],
    queryFn: async () => {
      const response = await fetch("/api/hours", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Record<string, any> }) => {
      const response = await apiRequest(`/api/students/${id}`, "PATCH", updates);
      return { id, updates, response };
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["/api/students"] });

      // Snapshot the previous value
      const previousStudents = queryClient.getQueryData(["/api/students"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["/api/students"], (old: any) => {
        if (!old) return old;
        return old.map((student: any) => 
          student.id === id ? { ...student, ...updates } : student
        );
      });

      // Return a context object with the snapshotted value
      return { previousStudents };
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStudents) {
        queryClient.setQueryData(["/api/students"], context.previousStudents);
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Student Updated",
        description: "Student information has been saved.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
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


  // Get the class that a student belongs to based on their current grade
  const getStudentClass = (gradYear: any) => {
    if (!gradYear || !settings || !classes) return null;
    
    const gradeCode = getCurrentGradeCode(gradYear, settings);
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
  const studentsWithGrade = students?.map((student: StudentWithFamily) => {
    const sortableGrade = getCurrentSortableGrade(student.gradYear, settings, grades || []);
    return {
      ...student,
      currentGrade: sortableGrade.display,
      currentGradeSortOrder: sortableGrade.sortOrder,
      familyName: student.family.lastName,
      selected: selectedStudents.has(student.id)
    };
  }) || [];

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
      const allStudentIds = new Set<number>(studentsWithGrade.map((student: any) => student.id));
      setSelectedStudents(allStudentIds);
    } else {
      // Deselect all students
      setSelectedStudents(new Set());
    }
  };

  const isAllSelected = studentsWithGrade.length > 0 && selectedStudents.size === studentsWithGrade.length;
  const isIndeterminate = selectedStudents.size > 0 && selectedStudents.size < studentsWithGrade.length;

  const handleSelectionFilter = (columnKey: string, filterValue: any, filterType: 'equals' | 'contains' | 'range') => {
    if (!studentsWithGrade) return;
    
    const matchingStudentIds = new Set<number>();
    
    studentsWithGrade.forEach((student: any) => {
      const cellValue = student[columnKey];
      let matches = false;
      
      // New range-based filtering logic
      if (filterType === 'range' && filterValue && typeof filterValue === 'object') {
        const { from, to } = filterValue;
        
        if (typeof cellValue === 'number') {
          // Numeric comparison
          const fromNum = from ? Number(from) : null;
          const toNum = to ? Number(to) : null;
          
          if (fromNum !== null && toNum !== null) {
            // Both from and to provided - range filter
            matches = cellValue >= fromNum && cellValue <= toNum;
          } else if (fromNum !== null) {
            // Only from provided - greater than or equal
            matches = cellValue >= fromNum;
          } else if (toNum !== null) {
            // Only to provided - less than or equal
            matches = cellValue <= toNum;
          }
        } else {
          // String comparison (lexicographic)
          const cellStr = String(cellValue || '').toLowerCase();
          const fromStr = from ? String(from).toLowerCase() : null;
          const toStr = to ? String(to).toLowerCase() : null;
          
          if (fromStr !== null && toStr !== null) {
            // Both from and to provided - range filter
            matches = cellStr >= fromStr && cellStr <= toStr;
          } else if (fromStr !== null) {
            // Only from provided - greater than or equal
            matches = cellStr >= fromStr;
          } else if (toStr !== null) {
            // Only to provided - less than or equal
            matches = cellStr <= toStr;
          }
        }
      }
      
      if (matches) {
        matchingStudentIds.add(student.id);
      }
    });
    
    setSelectedStudents(matchingStudentIds);
    
    toast({
      title: "Filter Applied",
      description: `Selected ${matchingStudentIds.size} students matching the filter criteria.`,
    });
  };

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
    const selectedStudentsData = studentsWithGrade.filter((student: any) => 
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
      "Registered Date",
      "Comments",
      "Inactive",
      (hours || []).find((h: any) => h.id === 0)?.description || "Math Hour",
      (hours || []).find((h: any) => h.id === 1)?.description || "1st Hour",
      (hours || []).find((h: any) => h.id === 2)?.description || "2nd Hour", 
      (hours || []).find((h: any) => h.id === 3)?.description || "3rd Hour",
      (hours || []).find((h: any) => h.id === 4)?.description || "4th Hour",
      ((hours || []).find((h: any) => h.id === 5)?.description || "5th Hour") + " Fall",
      ((hours || []).find((h: any) => h.id === 5)?.description || "5th Hour") + " Spring"
    ];

    const csvRows = [
      headers.join(","),
      ...selectedStudentsData.map((student: any) => [
        student.id,
        `"${student.lastName || ""}"`,
        `"${student.firstName || ""}"`,
        `"${student.familyName || ""}"`,
        `"${student.currentGrade || ""}"`,
        student.gradYear || "",
        student.birthdate ? new Date(student.birthdate).toLocaleDateString() : "",
        student.registeredOn ? new Date(student.registeredOn).toLocaleDateString() : "",
        `"${student.comment1 || ""}"`,
        student.inactive ? "true" : "false",
        `"${student.mathHour || ""}"`,
        `"${student.firstHour || ""}"`,
        `"${student.secondHour || ""}"`,
        `"${student.thirdHour || ""}"`,
        `"${student.fourthHour || ""}"`,
        `"${student.fifthHourFall || ""}"`,
        `"${student.fifthHourSpring || ""}"`
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
    { key: "currentGrade", label: "Current Grade", sortable: true, editable: false, width: "32", sortKey: "currentGradeSortOrder" },
    { key: "gradYear", label: "Grad Year", sortable: true, editable: true, type: "number", width: "28" },
    { key: "birthdate", label: "Birth Date", sortable: true, editable: true, type: "date", width: "32" },
    { key: "registeredOn", label: "Registered Date", sortable: true, editable: true, type: "date", width: "32" },
    { key: "comment1", label: "Comments", sortable: true, editable: true, type: "text", width: "48" },
    { key: "inactive", label: "Inactive", sortable: true, editable: true, type: "checkbox", width: "24" },
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
          onSelectionFilter={handleSelectionFilter}
        />

        <AddStudentDialog 
          open={addStudentOpen} 
          onOpenChange={setAddStudentOpen} 
        />
      </div>
    </div>
  );
}
