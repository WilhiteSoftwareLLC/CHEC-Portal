import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import EditableGrid, { GridColumn } from "@/components/ui/editable-grid";
import { getCurrentGradeString, getCurrentSortableGrade } from "@/lib/gradeUtils";
import { useToast } from "@/hooks/use-toast";
import type { Student, Course, Grade } from "@shared/schema";

interface StudentWithFamily extends Student {
  family: {
    lastName: string;
    father: string;
    mother: string;
  };
}

export default function Schedules() {
  const [selectedStudent, setSelectedStudent] = useState<StudentWithFamily | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [studentCourses, setStudentCourses] = useState<Record<string, string | null>>({});
  const [selectedSchedules, setSelectedSchedules] = useState<Set<number>>(new Set());
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const response = await fetch("/api/students", { credentials: "include" });
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

  const { data: grades } = useQuery({
    queryKey: ["/api/grades"],
    queryFn: async () => {
      const response = await fetch("/api/grades", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const updateStudentScheduleMutation = useMutation({
    mutationFn: async ({ studentId, scheduleData }: { studentId: number; scheduleData: Record<string, string | null> }) => {
      const response = await fetch(`/api/students/${studentId}/schedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update student schedule');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Student schedule updated successfully",
      });
      setScheduleDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update student schedule",
        variant: "destructive",
      });
    },
  });

  const getCourseCount = (student: StudentWithFamily) => {
    const studentCourses = [
      student.mathHour,
      student.firstHour,
      student.secondHour,
      student.thirdHour,
      student.fourthHour,
      student.fifthHourFall,
      student.fifthHourSpring,
    ];

    return studentCourses.filter(course => course && course !== 'NO_COURSE').length;
  };

  const handleViewSchedule = (student: StudentWithFamily) => {
    setSelectedStudent(student);
    setStudentCourses({
      mathHour: student.mathHour || null,
      firstHour: student.firstHour || null,
      secondHour: student.secondHour || null,
      thirdHour: student.thirdHour || null,
      fourthHour: student.fourthHour || null,
      fifthHourFall: student.fifthHourFall || null,
      fifthHourSpring: student.fifthHourSpring || null,
    });
    setScheduleDialogOpen(true);
  };

  const getAvailableCoursesForHour = (hourIndex: number) => {
    if (!courses) return [];
    return courses.filter((course: Course) => course.hour === hourIndex);
  };

  const updateCourse = (field: string, courseId: string | null) => {
    setStudentCourses(prev => ({
      ...prev,
      [field]: courseId === 'NO_COURSE' ? null : courseId
    }));
  };

  const handlePrintSchedules = () => {
    if (!students) return;

    // Determine which students to print based on selection
    const studentsToPrint = selectedSchedules.size > 0 
      ? students.filter((student: StudentWithFamily) => selectedSchedules.has(student.id))
      : students;

    const printContent = studentsToPrint.map((student: StudentWithFamily) => {
      const gradeName = getCurrentGradeString(student.gradYear || '', settings, grades || []);
      const courseCount = getCourseCount(student);
      
      const studentCoursesList = [
        { label: hours?.find((h: any) => h.id === 0)?.description || 'Math Hour', course: student.mathHour },
        { label: hours?.find((h: any) => h.id === 1)?.description || '1st Hour', course: student.firstHour },
        { label: hours?.find((h: any) => h.id === 2)?.description || '2nd Hour', course: student.secondHour },
        { label: hours?.find((h: any) => h.id === 3)?.description || '3rd Hour', course: student.thirdHour },
        { label: hours?.find((h: any) => h.id === 4)?.description || '4th Hour', course: student.fourthHour },
        { label: (hours?.find((h: any) => h.id === 5)?.description || '5th Hour') + ' Fall', course: student.fifthHourFall },
        { label: (hours?.find((h: any) => h.id === 5)?.description || '5th Hour') + ' Spring', course: student.fifthHourSpring },
      ]
        .filter(item => item.course && item.course !== 'NO_COURSE')
        .map(item => `${item.label}: ${item.course}`)
        .join('\n');

      return `
        <div style="page-break-after: always; margin-bottom: 2rem; padding: 1rem; border: 1px solid #ccc;">
          <h2>${student.lastName}, ${student.firstName}</h2>
          <p>Grade: ${gradeName}</p>
          <p>Family: ${student.family.lastName}</p>
          <div style="margin-top: 1rem;">
            <h3>Course Schedule:</h3>
            <pre style="white-space: pre-line; font-family: inherit;">${studentCoursesList || 'No courses scheduled'}</pre>
          </div>
          <p style="margin-top: 1rem;">Total Courses: ${courseCount}</p>
        </div>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Student Schedules</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 1rem; }
              h2 { color: #333; margin-bottom: 0.5rem; }
              h3 { color: #666; margin-bottom: 0.5rem; }
              p { margin: 0.25rem 0; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getSortedStudents = () => {
    if (!students) return [];
    // Return unsorted students since EditableGrid will handle sorting
    return students;
  };

  // Get the current grade code for a student
  const getCurrentGradeCode = (gradYear: string | number | null | undefined, settings: any): number | null => {
    if (!gradYear || !settings) return null;
    const schoolYear = parseInt((settings as any).SchoolYear || "2024");
    const graduationYear = parseInt(String(gradYear));
    const gradeCode = schoolYear - graduationYear + 13;
    return gradeCode;
  };

  // Get courses for specific hour filtered by student's grade
  const getCoursesByHour = (hour: number, studentGradYear: any) => {
    if (!courses) return [];
    const studentGradeCode = getCurrentGradeCode(studentGradYear, settings);
    if (studentGradeCode === null) return [];
    
    return (courses as any[]).filter((course: any) => {
      // Check if course is for the correct hour
      if (course.hour !== hour) return false;
      
      // Check if student's grade falls within course grade range
      const fromGrade = course.fromGrade;
      const toGrade = course.toGrade;
      
      // If no grade restrictions, course is available to all
      if (fromGrade === null && toGrade === null) return true;
      
      // If only fromGrade is set, student must be at or above that grade
      if (fromGrade !== null && toGrade === null) {
        return studentGradeCode >= fromGrade;
      }
      
      // If only toGrade is set, student must be at or below that grade
      if (fromGrade === null && toGrade !== null) {
        return studentGradeCode <= toGrade;
      }
      
      // If both are set, student must be within the range (inclusive)
      if (fromGrade !== null && toGrade !== null) {
        return studentGradeCode >= fromGrade && studentGradeCode <= toGrade;
      }
      
      return false;
    });
  };

  // Get Math Hour courses (hour = 0) filtered by student's grade
  const getMathHourCourses = (studentGradYear: any) => {
    return getCoursesByHour(0, studentGradYear);
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

  const { data: hours } = useQuery({
    queryKey: ["/api/hours"],
    queryFn: async () => {
      const response = await fetch("/api/hours", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });


  const hourFields = [
    { field: 'mathHour', label: hours?.find((h: any) => h.id === 0)?.description || 'Math Hour', hourIndex: 0 },
    { field: 'firstHour', label: hours?.find((h: any) => h.id === 1)?.description || '1st Hour', hourIndex: 1 },
    { field: 'secondHour', label: hours?.find((h: any) => h.id === 2)?.description || '2nd Hour', hourIndex: 2 },
    { field: 'thirdHour', label: hours?.find((h: any) => h.id === 3)?.description || '3rd Hour', hourIndex: 3 },
    { field: 'fourthHour', label: hours?.find((h: any) => h.id === 4)?.description || '4th Hour', hourIndex: 4 },
    { field: 'fifthHourFall', label: (hours?.find((h: any) => h.id === 5)?.description || '5th Hour') + ' Fall', hourIndex: 5 },
    { field: 'fifthHourSpring', label: (hours?.find((h: any) => h.id === 5)?.description || '5th Hour') + ' Spring', hourIndex: 5 },
  ];

  // Selection handlers
  const handleScheduleSelection = (studentId: number, selected: boolean) => {
    setSelectedSchedules(prev => {
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
      const allStudentIds = new Set<number>(getSortedStudents().map((student: StudentWithFamily) => student.id));
      setSelectedSchedules(allStudentIds);
    } else {
      // Deselect all students
      setSelectedSchedules(new Set());
    }
  };

  const isAllSelected = getSortedStudents().length > 0 && selectedSchedules.size === getSortedStudents().length;
  const isIndeterminate = selectedSchedules.size > 0 && selectedSchedules.size < getSortedStudents().length;

  // Prepare data for EditableGrid
  const studentsWithComputedData = getSortedStudents().map((student: StudentWithFamily) => ({
    ...student,
    currentGrade: getCurrentGradeString(student.gradYear, settings, grades || []),
    currentGradeSortOrder: getCurrentSortableGrade(student.gradYear, settings, grades || []).sortOrder,
    selected: selectedSchedules.has(student.id)
  }));

  // Define columns for EditableGrid
  const columns: GridColumn[] = [
    { 
      key: "selected", 
      label: "Selected", 
      sortable: false, 
      editable: false, 
      width: "12", 
      type: "checkbox",
      onCheckboxChange: handleScheduleSelection,
      selectAllCheckbox: {
        checked: isAllSelected,
        indeterminate: isIndeterminate,
        onChange: handleSelectAll
      }
    },
    { key: "lastName", label: "Last Name", sortable: true, editable: false, width: "40" },
    { key: "firstName", label: "First Name", sortable: true, editable: false, width: "40" },
    { key: "currentGrade", label: "Current Grade", sortable: true, editable: false, width: "32", sortKey: "currentGradeSortOrder" },
    { 
      key: "mathHour", 
      label: (hours || []).find((h: any) => h.id === 0)?.description || "Math Hour", 
      sortable: true, 
      editable: true, 
      width: "40", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(0, row.gradYear)
    },
    { 
      key: "firstHour", 
      label: (hours || []).find((h: any) => h.id === 1)?.description || "1st Hour", 
      sortable: true, 
      editable: true, 
      width: "40", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(1, row.gradYear)
    },
    { 
      key: "secondHour", 
      label: (hours || []).find((h: any) => h.id === 2)?.description || "2nd Hour", 
      sortable: true, 
      editable: true, 
      width: "40", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(2, row.gradYear)
    },
    { 
      key: "thirdHour", 
      label: (hours || []).find((h: any) => h.id === 3)?.description || "3rd Hour", 
      sortable: true, 
      editable: true, 
      width: "40", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(3, row.gradYear)
    },
    { 
      key: "fourthHour", 
      label: (hours || []).find((h: any) => h.id === 4)?.description || "4th Hour", 
      sortable: true, 
      editable: true, 
      width: "40", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(4, row.gradYear)
    },
    { 
      key: "fifthHourFall", 
      label: ((hours || []).find((h: any) => h.id === 5)?.description || "5th Hour") + " (Fall)", 
      sortable: true, 
      editable: true, 
      width: "48", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(5, row.gradYear, 'fall')
    },
    { 
      key: "fifthHourSpring", 
      label: ((hours || []).find((h: any) => h.id === 5)?.description || "5th Hour") + " (Spring)", 
      sortable: true, 
      editable: true, 
      width: "48", 
      type: "dropdown", 
      options: (row: any) => createCourseOptions(5, row.gradYear, 'spring')
    },
  ];

  // Handler for row updates - now supports schedule field updates
  const handleRowUpdate = async (id: number, updates: Record<string, any>) => {
    try {
      // Check if user is updating fifthHourFall and auto-manage fifthHourSpring
      if (updates.hasOwnProperty('fifthHourFall') && courses) {
        const newFallCourse = updates.fifthHourFall;
        
        if (newFallCourse && newFallCourse !== 'NO_COURSE') {
          // User selected a course for Fall - check if it's offered in both semesters
          const selectedCourse = (courses as any[]).find((course: any) => 
            course.courseName === newFallCourse
          );
          
          // If the course is offered in both fall and spring, auto-select it for spring too
          if (selectedCourse && selectedCourse.offeredFall && selectedCourse.offeredSpring) {
            updates.fifthHourSpring = newFallCourse;
          }
        } else {
          // User cleared the Fall course - also clear Spring if it was the same course
          const currentStudent = studentsWithComputedData.find((student: any) => student.id === id);
          if (currentStudent && currentStudent.fifthHourFall === currentStudent.fifthHourSpring) {
            updates.fifthHourSpring = null;
          }
        }
      }
      
      const response = await fetch(`/api/students/${id}/schedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update student schedule');
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      
      toast({
        title: "Success",
        description: "Student schedule updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student schedule",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSelectionFilter = (columnKey: string, filterValue: any, filterType: 'equals' | 'contains' | 'range') => {
    const sortedStudents = getSortedStudents();
    const matchingStudentIds = new Set<number>();
    
    sortedStudents.forEach((student: StudentWithFamily) => {
      let cellValue: any;
      
      // Handle special cases for computed values
      switch (columnKey) {
        case 'currentGrade':
          cellValue = getCurrentGradeString(student.gradYear, settings, grades || []);
          break;
        default:
          cellValue = (student as any)[columnKey];
      }
      
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
    
    setSelectedSchedules(matchingStudentIds);
    
    toast({
      title: "Filter Applied",
      description: `Selected ${matchingStudentIds.size} schedules matching the filter criteria.`,
    });
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Schedules"
        description="Manage student course schedules"
        actionButton={{
          label: selectedSchedules.size > 0 
            ? `Print (${selectedSchedules.size}) Selected Schedules`
            : "Print All Schedules",
          onClick: handlePrintSchedules
        }}
      />
      <div className="flex-1 p-6 overflow-hidden">
        <EditableGrid
          data={studentsWithComputedData}
          columns={columns}
          onRowUpdate={handleRowUpdate}
          isLoading={!students}
          onSelectionFilter={handleSelectionFilter}
          customRowAction={{
            label: "View Schedule",
            icon: Eye,
            onClick: handleViewSchedule
          }}
        />

        {/* Schedule Edit Dialog */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit Schedule - {selectedStudent?.lastName}, {selectedStudent?.firstName}
              </DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-6">
                <div className="space-y-3">
                  {hourFields.map(({ field, label, hourIndex }) => (
                    <div key={field} className="grid grid-cols-2 gap-4 items-center">
                      <Label className="text-sm font-medium">{label}</Label>
                      <Select
                        value={studentCourses[field] || 'NO_COURSE'}
                        onValueChange={(value) => updateCourse(field, value === 'NO_COURSE' ? null : value)}
                      >
                        <SelectTrigger className="w-full max-w-[300px]">
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NO_COURSE">No Course</SelectItem>
                          {getAvailableCoursesForHour(hourIndex).map((course: Course) => (
                            <SelectItem key={course.id} value={course.courseName}>
                              {course.courseName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedStudent) {
                        updateStudentScheduleMutation.mutate({
                          studentId: selectedStudent.id,
                          scheduleData: studentCourses,
                        });
                      }
                    }}
                    disabled={updateStudentScheduleMutation.isPending}
                  >
                    {updateStudentScheduleMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}