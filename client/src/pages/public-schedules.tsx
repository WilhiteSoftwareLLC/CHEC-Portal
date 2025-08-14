import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, AlertCircle, GraduationCap } from "lucide-react";

interface PublicScheduleData {
  family: any;
  students: any[];
  courses: any[];
  grades: any[];
  hours: any[];
  settings: any;
}

export default function PublicSchedules() {
  const { hash } = useParams<{ hash: string }>();
  const [scheduleData, setScheduleData] = useState<PublicScheduleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hash) {
      setError("Invalid schedules link");
      setIsLoading(false);
      return;
    }

    fetchScheduleData();
  }, [hash]);

  const fetchScheduleData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/schedules/${hash}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Schedules not found or link has expired");
        }
        throw new Error(`Failed to load schedules: ${response.status}`);
      }

      const data = await response.json();
      setScheduleData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedules");
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentGradeForStudent = (student: any) => {
    if (!scheduleData?.settings || !scheduleData?.grades || !student.gradYear) return "Unknown";
    
    const schoolYear = parseInt(scheduleData.settings.SchoolYear || "2024");
    const gradeCode = schoolYear - parseInt(student.gradYear) + 13;
    const grade = scheduleData.grades.find((g: any) => g.code === gradeCode);
    return grade ? grade.gradeName : "Unknown";
  };

  const getStudentSchedule = (student: any) => {
    if (!scheduleData) return [];

    const { courses, hours } = scheduleData;
    
    const schedule = [
      { 
        hour: hours?.find((h: any) => h.id === 0)?.description || 'Math Hour',
        courseName: student.mathHour,
        hourId: 0
      },
      { 
        hour: hours?.find((h: any) => h.id === 1)?.description || '1st Hour',
        courseName: student.firstHour,
        hourId: 1
      },
      { 
        hour: hours?.find((h: any) => h.id === 2)?.description || '2nd Hour',
        courseName: student.secondHour,
        hourId: 2
      },
      { 
        hour: hours?.find((h: any) => h.id === 3)?.description || '3rd Hour',
        courseName: student.thirdHour,
        hourId: 3
      },
      { 
        hour: hours?.find((h: any) => h.id === 4)?.description || '4th Hour',
        courseName: student.fourthHour,
        hourId: 4
      },
      { 
        hour: (hours?.find((h: any) => h.id === 5)?.description || '5th Hour') + ' - Fall',
        courseName: student.fifthHourFall,
        hourId: 5,
        semester: 'Fall'
      },
      { 
        hour: (hours?.find((h: any) => h.id === 5)?.description || '5th Hour') + ' - Spring',
        courseName: student.fifthHourSpring,
        hourId: 5,
        semester: 'Spring'
      },
    ];

    return schedule.map(item => {
      if (!item.courseName || item.courseName === 'NO_COURSE') {
        return {
          ...item,
          courseName: 'No Course',
          location: '',
          instructor: ''
        };
      }

      // Find the course to get additional details
      const course = courses?.find((c: any) => c.courseName === item.courseName);
      return {
        ...item,
        location: course?.location || '',
        instructor: course?.instructor || ''
      };
    });
  };

  const handlePrintSchedules = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Schedules Not Found</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <p className="text-sm text-gray-500">
                Please check your link or contact the administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!scheduleData) return null;

  const { family, students } = scheduleData;

  // Sort students by grade (youngest first)
  const sortedStudents = students.sort((a: any, b: any) => {
    const gradYearA = parseInt(a.gradYear) || 0;
    const gradYearB = parseInt(b.gradYear) || 0;
    return gradYearB - gradYearA; // Higher gradYear = younger student
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .bg-gray-50 { background: white !important; }
          .shadow-sm { box-shadow: none !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header with actions - hidden in print */}
        <div className="no-print mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Family Schedules</h1>
            <p className="text-gray-600">
              {family.lastName}, {family.father || ''} & {family.mother || ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrintSchedules}>
              <Download className="h-4 w-4 mr-2" />
              Print Schedules
            </Button>
          </div>
        </div>

        {/* Family info for print */}
        <div className="print-only mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">CHEC Student Schedules</h1>
          <h2 className="text-xl font-semibold text-gray-700">
            {family.lastName}, {family.father || ''} & {family.mother || ''}
          </h2>
        </div>

        {/* Students and their schedules */}
        <div className="space-y-8">
          {sortedStudents.map((student: any, index: number) => {
            const currentGrade = getCurrentGradeForStudent(student);
            const schedule = getStudentSchedule(student);

            return (
              <Card key={student.id} className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {student.firstName} {student.lastName}
                      </CardTitle>
                      <p className="text-gray-600">Grade: {currentGrade}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left py-3 px-4 font-semibold bg-gray-50">Hour</th>
                          <th className="text-left py-3 px-4 font-semibold bg-gray-50">Course</th>
                          <th className="text-left py-3 px-4 font-semibold bg-gray-50">Instructor</th>
                          <th className="text-left py-3 px-4 font-semibold bg-gray-50">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.map((item, scheduleIndex) => (
                          <tr key={`${student.id}-${scheduleIndex}`} className="border-b border-gray-200">
                            <td className="py-2 px-4 font-medium">{item.hour}</td>
                            <td className="py-2 px-4">
                              {item.courseName === 'No Course' ? (
                                <span className="text-gray-500 italic">No Course</span>
                              ) : (
                                item.courseName
                              )}
                            </td>
                            <td className="py-2 px-4">{item.instructor || '-'}</td>
                            <td className="py-2 px-4">{item.location || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Course count summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Total Courses:</strong>{' '}
                      {schedule.filter(item => item.courseName && item.courseName !== 'No Course').length} courses
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary info - hidden in print */}
        <div className="no-print mt-8">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              This schedule shows all current course enrollments for the {family.lastName} family students.
              For questions about courses or schedule changes, please contact the co-op administrator.
            </AlertDescription>
          </Alert>
        </div>

        {/* Print footer */}
        <div className="print-only mt-8 text-center text-sm text-gray-500 border-t pt-4">
          Generated from CHEC Portal • Please contact administrator for schedule changes
        </div>
      </div>
    </div>
  );
}