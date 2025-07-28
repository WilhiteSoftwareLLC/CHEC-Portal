import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PrinterCheck, Users } from "lucide-react";
import EditableGrid, { GridColumn } from "@/components/ui/editable-grid";
import AddCourseDialog from "@/components/dialogs/add-course-dialog";
import PageHeader from "@/components/layout/page-header";
import { useDialogs } from "@/contexts/dialog-context";
import { getCurrentGradeString } from "@/lib/gradeUtils";
import type { Course } from "@shared/schema";

export default function Courses() {
  const { toast } = useToast();
  const { addCourseOpen, setAddCourseOpen } = useDialogs();
  const [rosterDialogOpen, setRosterDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

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


  const { data: students } = useQuery({
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
    queryFn: async () => {
      const response = await fetch("/api/settings", { credentials: "include" });
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
    if (updates.fromGrade !== undefined) {
      processedUpdates.fromGrade = updates.fromGrade === "null" || updates.fromGrade === null ? null : parseInt(updates.fromGrade);
    }
    if (updates.toGrade !== undefined) {
      processedUpdates.toGrade = updates.toGrade === "null" || updates.toGrade === null ? null : parseInt(updates.toGrade);
    }
    
    await updateCourseMutation.mutateAsync({ id, updates: processedUpdates });
  };

  const handleDeleteCourse = async (courseId: number) => {
    const course = courses?.find((c: any) => c.id === courseId);
    const courseName = course?.courseName || "this course";
    
    if (confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
      await deleteCourseMutation.mutateAsync(courseId);
    }
  };

  // Create hour options for dropdown
  const hourOptions = (hours || []).map((hour: any) => ({
    value: hour.id,
    label: hour.description
  }));

  // Create grade options for dropdown
  const gradeOptions = [
    { value: null, label: "No Grade" },
    ...(grades || []).map((grade: any) => ({
      value: grade.code,
      label: grade.gradeName
    }))
  ];

  const handlePrintCourseRosters = () => {
    if (!courses || !students) return;
    
    // Generate roster HTML for all courses
    const rosterHTML = generateAllRostersHTML();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(rosterHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const generateAllRostersHTML = () => {
    const sortedCourses = [...(courses || [])].sort((a, b) => 
      a.courseName.localeCompare(b.courseName)
    );
    
    // Filter out courses with no enrolled students (excluding inactive students)
    const coursesWithStudents = sortedCourses.filter(course => {
      const enrolledStudents = (students || []).filter((student: any) => {
        // Skip inactive students
        if (student.inactive) return false;
        
        return student.mathHour === course.courseName ||
               student.firstHour === course.courseName ||
               student.secondHour === course.courseName ||
               student.thirdHour === course.courseName ||
               student.fourthHour === course.courseName ||
               student.fifthHourFall === course.courseName ||
               student.fifthHourSpring === course.courseName;
      });
      return enrolledStudents.length > 0;
    });
    
    const courseRosters = coursesWithStudents.map((course, index) => 
      generateSingleRosterHTML(course, index > 0)
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Course Rosters</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .page-break { 
              page-break-before: always; 
            }
            .course-header {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 12px;
              border-bottom: 2px solid #000;
              padding-bottom: 6px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #000;
              padding: 4px 8px;
              text-align: left;
              white-space: nowrap;
              height: 28px;
              vertical-align: middle;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .number-column { width: 5%; text-align: center; }
            .grade-column { width: 8%; text-align: center; }
            .name-column { width: 15%; }
            .birth-column { width: 12%; text-align: center; }
            .parent-column { width: 15%; }
            .phone-column { width: 15%; white-space: nowrap; }
            .email-column { width: 30%; }
          </style>
        </head>
        <body>
          ${courseRosters}
        </body>
      </html>
    `;
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Format as XXX-XXX-XXXX if we have 10 digits
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    return phone; // Return original if not 10 digits
  };

  const getEnrolledStudents = (courseName: string) => {
    if (!students) return [];
    
    // Get students enrolled in this course, excluding inactive students
    const enrolledStudents = (students || []).filter((student: any) => {
      // Skip inactive students
      if (student.inactive) return false;
      
      return student.mathHour === courseName ||
             student.firstHour === courseName ||
             student.secondHour === courseName ||
             student.thirdHour === courseName ||
             student.fourthHour === courseName ||
             student.fifthHourFall === courseName ||
             student.fifthHourSpring === courseName;
    });

    // Sort students by grade (inverse grad year), then by last name, then by first name
    return enrolledStudents.sort((a: any, b: any) => {
      // First sort by grade (inverse grad year - higher grad year = younger student = lower grade)
      const gradYearA = parseInt(a.gradYear) || 0;
      const gradYearB = parseInt(b.gradYear) || 0;
      const gradeCompare = gradYearB - gradYearA; // Higher grad year first (younger students)
      if (gradeCompare !== 0) return gradeCompare;
      
      // Then sort by last name
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      
      // Finally sort by first name
      return a.firstName.localeCompare(b.firstName);
    });
  };

  const handleViewRoster = (course: Course) => {
    setSelectedCourse(course);
    setRosterDialogOpen(true);
  };

  const getEnrollmentCount = (courseName: string) => {
    if (!students) return 0;
    
    return students.filter((student: any) => {
      // Skip inactive students
      if (student.inactive) return false;
      
      return student.mathHour === courseName ||
             student.firstHour === courseName ||
             student.secondHour === courseName ||
             student.thirdHour === courseName ||
             student.fourthHour === courseName ||
             student.fifthHourFall === courseName ||
             student.fifthHourSpring === courseName;
    }).length;
  };

  const generateSingleRosterHTML = (course: any, addPageBreak: boolean = false) => {
    // Get students enrolled in this course, excluding inactive students
    const enrolledStudents = (students || []).filter((student: any) => {
      // Skip inactive students
      if (student.inactive) return false;
      
      return student.mathHour === course.courseName ||
             student.firstHour === course.courseName ||
             student.secondHour === course.courseName ||
             student.thirdHour === course.courseName ||
             student.fourthHour === course.courseName ||
             student.fifthHourFall === course.courseName ||
             student.fifthHourSpring === course.courseName;
    });

    // Sort students by grade (inverse grad year), then by last name, then by first name
    const sortedStudents = enrolledStudents.sort((a: any, b: any) => {
      // First sort by grade (inverse grad year - higher grad year = younger student = lower grade)
      const gradYearA = parseInt(a.gradYear) || 0;
      const gradYearB = parseInt(b.gradYear) || 0;
      const gradeCompare = gradYearB - gradYearA; // Higher grad year first (younger students)
      if (gradeCompare !== 0) return gradeCompare;
      
      // Then sort by last name
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      
      // Finally sort by first name
      return a.firstName.localeCompare(b.firstName);
    });

    const rowsHTML = sortedStudents.map((student: any, index: number) => {
      const birthDate = student.birthdate ? new Date(student.birthdate).toLocaleDateString() : '';
      const gradeString = getCurrentGradeString(student.gradYear, settings, grades || []);
      const formattedPhone = formatPhoneNumber(student.family?.parentCell || '');
      
      return `
        <tr>
          <td class="number-column">${index + 1}.</td>
          <td class="grade-column">${gradeString}</td>
          <td class="name-column">${student.lastName}</td>
          <td class="name-column">${student.firstName}</td>
          <td class="birth-column">${birthDate}</td>
          <td class="parent-column">${student.family?.mother || ''}</td>
          <td class="parent-column">${student.family?.father || ''}</td>
          <td class="phone-column">${formattedPhone}</td>
          <td class="email-column">${student.family?.email || ''}</td>
        </tr>
      `;
    }).join('');

    return `
      ${addPageBreak ? '<div class="page-break"></div>' : ''}
      <div class="course-header">${course.courseName}</div>
      <table>
        <thead>
          <tr>
            <th class="number-column"></th>
            <th class="grade-column">Grade</th>
            <th class="name-column">Last Name</th>
            <th class="name-column">First Name</th>
            <th class="birth-column">Birth Date</th>
            <th class="parent-column">Mother</th>
            <th class="parent-column">Father</th>
            <th class="phone-column">Parent's Cell</th>
            <th class="email-column">Email</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
    `;
  };

  // Prepare courses data with enrollment counts
  const coursesWithEnrollment = (courses || []).map((course: any) => ({
    ...course,
    enrollmentCount: getEnrollmentCount(course.courseName)
  }));

  const columns: GridColumn[] = [
    { key: "courseName", label: "Course Name", sortable: true, editable: true, width: "48" },
    { key: "fromGrade", label: "From Grade", sortable: true, editable: true, width: "32", type: "dropdown", options: gradeOptions },
    { key: "toGrade", label: "To Grade", sortable: true, editable: true, width: "32", type: "dropdown", options: gradeOptions },
    { key: "hour", label: "Hour", sortable: true, editable: true, width: "24", type: "dropdown", options: hourOptions },
    { key: "location", label: "Location", sortable: true, editable: true, width: "32", type: "text" },
    { key: "fee", label: "Course Fee", sortable: true, editable: true, width: "28", type: "text" },
    { key: "bookRental", label: "Book Rental Fee", sortable: true, editable: true, width: "32", type: "text" },
    { key: "enrollmentCount", label: "# Enrolled", sortable: true, editable: false, width: "24", type: "number" },
    { key: "offeredFall", label: "Fall", sortable: true, editable: true, width: "16", type: "checkbox" },
    { key: "offeredSpring", label: "Spring", sortable: true, editable: true, width: "16", type: "checkbox" },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Courses"
        description="Manage courses and instructors"
        actionButton={{
          label: "Add Course",
          onClick: () => setAddCourseOpen(true)
        }}
        secondaryButton={{
          label: "Print Course Rosters",
          onClick: handlePrintCourseRosters,
          variant: "outline",
          icon: PrinterCheck
        }}
      />
      <div className="flex-1 p-6 overflow-hidden">
        <EditableGrid
          data={coursesWithEnrollment}
          columns={columns}
          onRowUpdate={handleUpdateCourse}
          onRowDelete={handleDeleteCourse}
          isLoading={isLoading}
          customRowAction={{
            label: "View Roster",
            icon: Users,
            onClick: handleViewRoster
          }}
        />

        <AddCourseDialog 
          open={addCourseOpen} 
          onOpenChange={setAddCourseOpen} 
        />

        {/* Course Roster Dialog */}
        <Dialog open={rosterDialogOpen} onOpenChange={setRosterDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Course Roster - {selectedCourse?.courseName}
              </DialogTitle>
            </DialogHeader>
            {selectedCourse && (() => {
              const enrolledStudents = getEnrolledStudents(selectedCourse.courseName);
              const rosterColumns: GridColumn[] = [
                { key: "lastName", label: "Last Name", sortable: true, editable: false, width: "40" },
                { key: "firstName", label: "First Name", sortable: true, editable: false, width: "40" },
                { key: "currentGrade", label: "Grade", sortable: true, editable: false, width: "24" },
              ];

              const rosterData = enrolledStudents.map((student: any) => ({
                ...student,
                currentGrade: getCurrentGradeString(student.gradYear, settings, grades || [])
              }));

              return (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Students: {enrolledStudents.length}
                  </div>
                  
                  {enrolledStudents.length > 0 ? (
                    <EditableGrid
                      data={rosterData}
                      columns={rosterColumns}
                      onRowUpdate={async () => {}} // No-op since this is read-only
                      isLoading={false}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No students enrolled in this course
                    </div>
                  )}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
