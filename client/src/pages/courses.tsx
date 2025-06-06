import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Trash2, BookOpen, User, Calendar, MapPin, DollarSign, Users } from "lucide-react";
import AddCourseDialog from "@/components/dialogs/add-course-dialog";
import type { Course } from "@shared/schema";

export default function Courses() {
  const [search, setSearch] = useState("");
  const [addCourseOpen, setAddCourseOpen] = useState(false);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses", search],
    queryFn: async () => {
      const url = search ? `/api/courses?search=${encodeURIComponent(search)}` : "/api/courses";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "$0";
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-600 mt-1">Manage courses and instructors</p>
        </div>
        <Button 
          onClick={() => setAddCourseOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Courses Grid */}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.length > 0 ? (
            courses.map((course: Course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        {course.subject && (
                          <Badge variant="outline" className="text-xs">
                            {course.subject}
                          </Badge>
                        )}
                        {course.gradeLevel && (
                          <Badge variant="outline" className="text-xs">
                            {course.gradeLevel}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {course.instructor && (
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="mr-2 h-4 w-4" />
                        {course.instructor}
                      </div>
                    )}
                    
                    {course.schedule && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="mr-2 h-4 w-4" />
                        {course.schedule}
                      </div>
                    )}

                    {course.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="mr-2 h-4 w-4" />
                        {course.location}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="mr-1 h-4 w-4" />
                        {formatCurrency(course.cost)}
                      </div>
                      {course.maxStudents && (
                        <div className="flex items-center text-gray-600">
                          <Users className="mr-1 h-4 w-4" />
                          Max {course.maxStudents}
                        </div>
                      )}
                    </div>

                    {(course.startDate || course.endDate) && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-medium mb-1">Duration:</p>
                        <p className="text-xs text-gray-600">
                          {formatDate(course.startDate)} - {formatDate(course.endDate)}
                        </p>
                      </div>
                    )}

                    {course.description && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                    )}

                    <div className="pt-2">
                      {getStatusBadge(course.active)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search ? "Try adjusting your search terms." : "Get started by adding a new course."}
              </p>
              {!search && (
                <div className="mt-6">
                  <Button onClick={() => setAddCourseOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Course
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AddCourseDialog open={addCourseOpen} onOpenChange={setAddCourseOpen} />
    </div>
  );
}
