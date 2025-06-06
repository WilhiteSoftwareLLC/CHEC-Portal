import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Search, Save, User, BookOpen, Clock, GraduationCap } from "lucide-react";
import type { StudentWithFamily, Course } from "@shared/schema";

export default function Schedules() {
  const [search, setSearch] = useState("");
  const [scheduleChanges, setScheduleChanges] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/students"],
    retry: false,
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
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
    retry: false,
  });

  const getCurrentGrade = (gradYear: string | null) => {
    if (!gradYear || !settings || !grades) return null;
    
    const schoolYear = parseInt((settings as any).SchoolYear || "2024");
    const graduationYear = parseInt(gradYear);
    const gradeCode = schoolYear - graduationYear + 13;
    
    const grade = Array.isArray(grades) ? grades.find((g: any) => g.code === gradeCode) : null;
    return grade ? gradeCode : null;
  };

  const getCurrentGradeName = (gradYear: string | null) => {
    if (!gradYear || !settings || !grades) return "Unknown";
    
    const schoolYear = parseInt((settings as any).SchoolYear || "2024");
    const graduationYear = parseInt(gradYear);
    const gradeCode = schoolYear - graduationYear + 13;
    
    const grade = Array.isArray(grades) ? grades.find((g: any) => g.code === gradeCode) : null;
    return grade ? grade.gradeName : "Unknown";
  };

  // Get the class that a student belongs to based on their current grade
  const getStudentClass = (gradYear: string | null) => {
    if (!gradYear || !settings || !classes) return null;
    
    const gradeCode = getCurrentGrade(gradYear);
    if (gradeCode === null) return null;
    
    // Find the class that contains this grade code
    const studentClass = Array.isArray(classes) ? classes.find((cls: any) => 
      gradeCode >= cls.startCode && gradeCode <= cls.endCode
    ) : null;
    
    return studentClass;
  };

  // Filter students to only show 7th grade and older
  const eligibleStudents = Array.isArray(students) ? students.filter((student: StudentWithFamily) => {
    const gradeCode = getCurrentGrade(student.gradYear);
    return gradeCode !== null && gradeCode >= 7;
  }) : [];

  const filteredStudents = eligibleStudents.filter((student: StudentWithFamily) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        student.family.lastName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Get courses by hour and student class
  const getCoursesByHour = (hour: number, studentGradYear: string | null) => {
    if (!courses) return [];
    const studentClass = getStudentClass(studentGradYear);
    
    return (courses as Course[]).filter(course => 
      course.hour === hour && 
      (course.classId === studentClass?.id || course.classId === null)
    );
  };

  // Get courses for Math Hour (hour 0) filtered by student class
  const getMathHourCourses = (studentGradYear: string | null) => {
    if (!courses) return [];
    const studentClass = getStudentClass(studentGradYear);
    
    return (courses as Course[]).filter(course => 
      course.hour === 0 && 
      (course.classId === studentClass?.id || course.classId === null)
    );
  };

  // Get current course selection for a student and hour
  const getCurrentCourse = (studentId: number, hour: string) => {
    const student = Array.isArray(students) ? students.find((s: StudentWithFamily) => s.id === studentId) : null;
    if (!student) return "";

    // Check for unsaved changes first
    const changeKey = `${studentId}_${hour}`;
    if (scheduleChanges[changeKey]) {
      return scheduleChanges[changeKey];
    }

    // Return current value from database
    switch (hour) {
      case "mathHour":
        return student.mathHour || "";
      case "firstHour":
        return student.firstHour || "";
      case "secondHour":
        return student.secondHour || "";
      case "thirdHour":
        return student.thirdHour || "";
      case "fourthHour":
        return student.fourthHour || "";
      case "fifthHourFall":
        return student.fifthHourFall || "";
      case "fifthHourSpring":
        return student.fifthHourSpring || "";
      case "fridayScience":
        return student.fridayScience || "";
      default:
        return "";
    }
  };

  // Handle course selection change
  const handleCourseChange = (studentId: number, hour: string, courseName: string) => {
    const changeKey = `${studentId}_${hour}`;
    setScheduleChanges(prev => ({
      ...prev,
      [changeKey]: courseName
    }));
  };

  // Save schedule changes
  const saveSchedulesMutation = useMutation({
    mutationFn: async () => {
      const updates = [];
      
      for (const [changeKey, courseName] of Object.entries(scheduleChanges)) {
        const [studentId, hour] = changeKey.split('_');
        updates.push({
          studentId: parseInt(studentId),
          hour,
          courseName
        });
      }

      await apiRequest("/api/students/bulk-schedule-update", "POST", { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setScheduleChanges({});
      toast({
        title: "Schedules Updated",
        description: "Student schedules have been saved successfully.",
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

  const hours = [
    { key: "mathHour", label: "Math Hour" },
    { key: "firstHour", label: "1st Hour", hourNumber: 1 },
    { key: "secondHour", label: "2nd Hour", hourNumber: 2 },
    { key: "thirdHour", label: "3rd Hour", hourNumber: 3 },
    { key: "fourthHour", label: "4th Hour", hourNumber: 4 },
    { key: "fifthHourFall", label: "5th Hour (Fall)", hourNumber: 5 },
    { key: "fifthHourSpring", label: "5th Hour (Spring)", hourNumber: 5 },
  ];

  const hasChanges = Object.keys(scheduleChanges).length > 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Student Schedules</h1>
          <p className="text-sm text-gray-600 mt-1">Assign courses to students (7th grade and older)</p>
        </div>
        {hasChanges && (
          <Button 
            onClick={() => saveSchedulesMutation.mutate()}
            disabled={saveSchedulesMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Students Schedule Grid */}
      {studentsLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-16" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student: StudentWithFamily) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {student.firstName[0]}{student.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {student.firstName} {student.lastName}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{student.family.lastName} Family</span>
                          <span>•</span>
                          <span>{getCurrentGradeName(student.gradYear)}</span>
                        </div>
                      </div>
                    </div>
                    {hasChanges && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Unsaved Changes
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    {hours.map((hour) => (
                      <div key={hour.key} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          {hour.label}
                        </label>
                        <Select
                          value={getCurrentCourse(student.id, hour.key)}
                          onValueChange={(value) => handleCourseChange(student.id, hour.key, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Course</SelectItem>
                            {hour.key === "mathHour" ? (
                              getMathHourCourses(student.gradYear).map((course: Course) => (
                                <SelectItem key={course.id} value={course.courseName}>
                                  {course.courseName}
                                </SelectItem>
                              ))
                            ) : hour.hourNumber ? (
                              getCoursesByHour(hour.hourNumber, student.gradYear).map((course: Course) => (
                                <SelectItem key={course.id} value={course.courseName}>
                                  {course.courseName}
                                </SelectItem>
                              ))
                            ) : (
                              // For any other special hours, show courses filtered by student class
                              (courses as Course[] || []).filter((course: Course) => {
                                const studentClass = getStudentClass(student.gradYear);
                                return course.classId === studentClass?.id || course.classId === null;
                              }).map((course: Course) => (
                                <SelectItem key={course.id} value={course.courseName}>
                                  {course.courseName}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No eligible students found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search ? "Try adjusting your search terms." : "Only students in 7th grade and older can be scheduled for courses."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}