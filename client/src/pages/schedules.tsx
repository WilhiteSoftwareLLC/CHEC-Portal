import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Search, Filter, Download, PrinterCheck, User, BookOpen, Clock, MapPin } from "lucide-react";
import type { EnrollmentWithDetails, StudentWithFamily, Course } from "@shared/schema";

export default function Schedules() {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["/api/enrollments"],
    retry: false,
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    retry: false,
  });

  const filteredEnrollments = enrollments?.filter((enrollment: EnrollmentWithDetails) => {
    if (selectedStudent && enrollment.studentId.toString() !== selectedStudent) {
      return false;
    }
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        enrollment.student.firstName.toLowerCase().includes(searchLower) ||
        enrollment.student.lastName.toLowerCase().includes(searchLower) ||
        enrollment.course.name.toLowerCase().includes(searchLower) ||
        enrollment.student.family.name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const formatTime = (schedule: string | null) => {
    if (!schedule) return "Not specified";
    return schedule;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'withdrawn':
        return <Badge className="bg-red-100 text-red-800">Withdrawn</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleExportSchedules = () => {
    // TODO: Implement schedule export functionality
    console.log("Exporting schedules...");
  };

  const handlePrintSchedules = () => {
    // TODO: Implement schedule printing functionality
    window.print();
  };

  // Group enrollments by student for easier schedule viewing
  const schedulesByStudent = filteredEnrollments?.reduce((acc: any, enrollment: EnrollmentWithDetails) => {
    const studentKey = `${enrollment.student.firstName} ${enrollment.student.lastName}`;
    if (!acc[studentKey]) {
      acc[studentKey] = {
        student: enrollment.student,
        enrollments: []
      };
    }
    acc[studentKey].enrollments.push(enrollment);
    return acc;
  }, {}) || {};

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Schedules</h1>
          <p className="text-sm text-gray-600 mt-1">Generate and view student schedules</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportSchedules}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={handlePrintSchedules}>
            <PrinterCheck className="mr-2 h-4 w-4" />
            PrinterCheck
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search students or courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by student" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Students</SelectItem>
            {students?.map((student: StudentWithFamily) => (
              <SelectItem key={student.id} value={student.id.toString()}>
                {student.firstName} {student.lastName} ({student.family.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            Table
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(schedulesByStudent).length > 0 ? (
            Object.entries(schedulesByStudent).map(([studentName, data]: [string, any]) => (
              <Card key={studentName} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {data.student.firstName[0]}{data.student.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {data.student.firstName} {data.student.lastName}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{data.student.family.name}</p>
                      {data.student.grade && (
                        <p className="text-xs text-gray-500">Grade {data.student.grade}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Enrolled Courses ({data.enrollments.length})
                    </h4>
                    <div className="space-y-2">
                      {data.enrollments.map((enrollment: EnrollmentWithDetails) => (
                        <div key={enrollment.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-sm">{enrollment.course.name}</h5>
                            {getStatusBadge(enrollment.status)}
                          </div>
                          
                          {enrollment.course.instructor && (
                            <div className="flex items-center text-xs text-gray-600 mb-1">
                              <User className="mr-1 h-3 w-3" />
                              {enrollment.course.instructor}
                            </div>
                          )}
                          
                          {enrollment.course.schedule && (
                            <div className="flex items-center text-xs text-gray-600 mb-1">
                              <Clock className="mr-1 h-3 w-3" />
                              {formatTime(enrollment.course.schedule)}
                            </div>
                          )}
                          
                          {enrollment.course.location && (
                            <div className="flex items-center text-xs text-gray-600">
                              <MapPin className="mr-1 h-3 w-3" />
                              {enrollment.course.location}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || selectedStudent 
                  ? "Try adjusting your filters." 
                  : "No student enrollments found. Students need to be enrolled in courses to generate schedules."}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <Card>
          <CardHeader>
            <CardTitle>Student Schedule Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEnrollments?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Family</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Course</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Instructor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Schedule</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnrollments.map((enrollment: EnrollmentWithDetails) => (
                      <tr key={enrollment.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <span className="text-xs font-medium text-gray-600">
                                {enrollment.student.firstName[0]}{enrollment.student.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {enrollment.student.firstName} {enrollment.student.lastName}
                              </div>
                              {enrollment.student.grade && (
                                <div className="text-xs text-gray-500">Grade {enrollment.student.grade}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {enrollment.student.family.name}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {enrollment.course.name}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {enrollment.course.instructor || "Not assigned"}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {formatTime(enrollment.course.schedule)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {enrollment.course.location || "Not specified"}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(enrollment.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No enrollment data found</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
