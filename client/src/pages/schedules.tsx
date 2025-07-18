import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Eye, ChevronUp, ChevronDown } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
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
  const [sortField, setSortField] = useState<string>('lastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    retry: false,
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
    retry: false,
  });

  const { data: grades } = useQuery({
    queryKey: ["/api/grades"],
    retry: false,
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    retry: false,
  });

  const getCurrentGradeName = (gradYear: number) => {
    if (!grades || !settings) return '';
    
    const schoolYear = parseInt(settings.SchoolYear) || new Date().getFullYear();
    const gradeCode = schoolYear - gradYear + 13;
    
    const grade = grades.find((g: Grade) => g.code === gradeCode);
    return grade ? grade.gradeName : `Grade ${gradeCode}`;
  };

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

    const printContent = students.map((student: StudentWithFamily) => {
      const gradeName = getCurrentGradeName(student.gradYear);
      const courseCount = getCourseCount(student);
      
      const studentCoursesList = [
        { label: 'Math', course: student.mathHour },
        { label: '1st Hour', course: student.firstHour },
        { label: '2nd Hour', course: student.secondHour },
        { label: '3rd Hour', course: student.thirdHour },
        { label: '4th Hour', course: student.fourthHour },
        { label: '5th Hour Fall', course: student.fifthHourFall },
        { label: '5th Hour Spring', course: student.fifthHourSpring },
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedStudents = () => {
    if (!students) return [];
    
    const sortedStudents = [...students].sort((a: StudentWithFamily, b: StudentWithFamily) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'lastName':
          aValue = a.lastName || '';
          bValue = b.lastName || '';
          break;
        case 'firstName':
          aValue = a.firstName || '';
          bValue = b.firstName || '';
          break;
        case 'currentGrade':
          aValue = getCurrentGradeName(a.gradYear);
          bValue = getCurrentGradeName(b.gradYear);
          break;
        case 'gradYear':
          aValue = parseInt(a.gradYear) || 0;
          bValue = parseInt(b.gradYear) || 0;
          break;
        case 'courseCount':
          aValue = getCourseCount(a);
          bValue = getCourseCount(b);
          break;
        default:
          aValue = '';
          bValue = '';
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    return sortedStudents;
  };

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="h-3 w-3" /> : 
            <ChevronDown className="h-3 w-3" />
        )}
      </div>
    </th>
  );

  const hourFields = [
    { field: 'mathHour', label: 'Math', hourIndex: 0 },
    { field: 'firstHour', label: '1st Hour', hourIndex: 1 },
    { field: 'secondHour', label: '2nd Hour', hourIndex: 2 },
    { field: 'thirdHour', label: '3rd Hour', hourIndex: 3 },
    { field: 'fourthHour', label: '4th Hour', hourIndex: 4 },
    { field: 'fifthHourFall', label: '5th Hour Fall', hourIndex: 5 },
    { field: 'fifthHourSpring', label: '5th Hour Spring', hourIndex: 5 },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Schedules"
        description="Manage student course schedules"
        actionButton={{
          label: "Print All Schedules",
          onClick: handlePrintSchedules
        }}
      />
      <div className="flex-1 p-6 overflow-hidden">
        {/* Student Grid */}
        <div className="border rounded-lg">
          <div className="overflow-auto max-h-[calc(100vh-200px)]">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <SortableHeader field="lastName">Last Name</SortableHeader>
                  <SortableHeader field="firstName">First Name</SortableHeader>
                  <SortableHeader field="currentGrade">Current Grade</SortableHeader>
                  <SortableHeader field="gradYear">Grad Year</SortableHeader>
                  <SortableHeader field="courseCount"># Courses</SortableHeader>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {getSortedStudents().map((student: StudentWithFamily) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {student.lastName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {student.firstName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {getCurrentGradeName(student.gradYear)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {student.gradYear}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="secondary">
                        {getCourseCount(student)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewSchedule(student)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {hourFields.map(({ field, label, hourIndex }) => (
                    <div key={field} className="space-y-2">
                      <Label className="text-sm font-medium">{label}</Label>
                      <Select
                        value={studentCourses[field] || 'NO_COURSE'}
                        onValueChange={(value) => updateCourse(field, value === 'NO_COURSE' ? null : value)}
                      >
                        <SelectTrigger className="w-full">
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
                  <Button onClick={() => {
                    // TODO: Save student schedule changes
                    setScheduleDialogOpen(false);
                  }}>
                    Save Changes
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
