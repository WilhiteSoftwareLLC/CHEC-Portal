import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Plus,
  Search,
  Filter,
  Edit,
  Download,
  PrinterCheck,
  Calendar,
  UserPlus,
  BookPlus,
  CalendarPlus,
} from "lucide-react";
import { useState } from "react";
import AddFamilyDialog from "@/components/dialogs/add-family-dialog";
import AddStudentDialog from "@/components/dialogs/add-student-dialog";
import AddCourseDialog from "@/components/dialogs/add-course-dialog";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [addFamilyOpen, setAddFamilyOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addCourseOpen, setAddCourseOpen] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: recentEnrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-enrollments"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="text-blue-600 text-xl h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Families</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{stats?.totalFamilies || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-green-600 text-xl h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{stats?.activeStudents || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BookOpen className="text-orange-600 text-xl h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Courses</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{stats?.availableCourses || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="text-purple-600 text-xl h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{stats?.pendingInvoices || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {enrollmentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentEnrollments?.length > 0 ? (
                  recentEnrollments.map((enrollment: any) => (
                    <div key={enrollment.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserPlus className="text-blue-600 text-xs h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{enrollment.student.firstName} {enrollment.student.lastName}</span> enrolled in <span className="font-medium">{enrollment.course.name}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(enrollment.enrollmentDate)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent activity</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center border-2 border-dashed hover:border-blue-600 hover:bg-blue-50"
                onClick={() => setAddFamilyOpen(true)}
              >
                <Users className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-sm font-medium">Add Family</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center border-2 border-dashed hover:border-blue-600 hover:bg-blue-50"
                onClick={() => setAddStudentOpen(true)}
              >
                <GraduationCap className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-sm font-medium">Add Student</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center border-2 border-dashed hover:border-blue-600 hover:bg-blue-50"
                onClick={() => setAddCourseOpen(true)}
              >
                <BookOpen className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-sm font-medium">Add Course</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center border-2 border-dashed hover:border-blue-600 hover:bg-blue-50"
              >
                <Calendar className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-sm font-medium">Generate Schedule</span>
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Reports & Export</h4>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4 text-gray-400" />
                  Export Schedules
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4 text-gray-400" />
                  Export Invoices
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left"
                  size="sm"
                >
                  <PrinterCheck className="mr-2 h-4 w-4 text-gray-400" />
                  PrinterCheck Reports
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Enrollments Table */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Enrollments</CardTitle>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {enrollmentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/6" />
                  </div>
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Family</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Course</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Enrolled Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                    <th className="relative py-3 px-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {recentEnrollments?.length > 0 ? (
                    recentEnrollments.map((enrollment: any) => (
                      <tr key={enrollment.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {enrollment.student.firstName[0]}{enrollment.student.lastName[0]}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {enrollment.student.firstName} {enrollment.student.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {enrollment.student.grade}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {enrollment.student.family.name}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {enrollment.course.name}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {formatDate(enrollment.enrollmentDate)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={enrollment.status === 'active' ? 'default' : 'secondary'}
                            className={
                              enrollment.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {enrollment.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No enrollments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddFamilyDialog open={addFamilyOpen} onOpenChange={setAddFamilyOpen} />
      <AddStudentDialog open={addStudentOpen} onOpenChange={setAddStudentOpen} />
      <AddCourseDialog open={addCourseOpen} onOpenChange={setAddCourseOpen} />
    </div>
  );
}
