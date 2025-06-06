import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Trash2, GraduationCap, User, Calendar } from "lucide-react";
import AddStudentDialog from "@/components/dialogs/add-student-dialog";
import type { StudentWithFamily } from "@shared/schema";

export default function Students() {
  const [search, setSearch] = useState("");
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const { toast } = useToast();

  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/students", search],
    queryFn: async () => {
      const url = search ? `/api/students?search=${encodeURIComponent(search)}` : "/api/students";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
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

  const handleDeleteStudent = (studentId: number) => {
    if (confirm("Are you sure you want to delete this student?")) {
      deleteStudentMutation.mutate(studentId);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
          <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
          <p className="text-sm text-gray-600 mt-1">Manage student records and enrollment</p>
        </div>
        <Button 
          onClick={() => setAddStudentOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
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

      {/* Students Grid */}
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
          {students?.length > 0 ? (
            students.map((student: StudentWithFamily) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {student.firstName[0]}{student.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {student.firstName} {student.lastName}
                        </CardTitle>
                        <p className="text-sm text-gray-600">{student.family.lastName} Family</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteStudent(student.id)}
                        disabled={deleteStudentMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {student.grade && (
                        <div className="flex items-center text-gray-600">
                          <GraduationCap className="mr-2 h-4 w-4" />
                          {student.grade}
                        </div>
                      )}
                      {student.dateOfBirth && (
                        <div className="flex items-center text-gray-600">
                          <Calendar className="mr-2 h-4 w-4" />
                          {formatDate(student.dateOfBirth)}
                        </div>
                      )}
                    </div>
                    
                    {(student.allergies || student.medicalConditions || student.specialNeeds) && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-medium mb-1">Health Notes:</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          {student.allergies && (
                            <p><span className="font-medium">Allergies:</span> {student.allergies}</p>
                          )}
                          {student.medicalConditions && (
                            <p><span className="font-medium">Medical:</span> {student.medicalConditions}</p>
                          )}
                          {student.specialNeeds && (
                            <p><span className="font-medium">Special Needs:</span> {student.specialNeeds}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      {getStatusBadge(student.active)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search ? "Try adjusting your search terms." : "Get started by adding a new student."}
              </p>
              {!search && (
                <div className="mt-6">
                  <Button onClick={() => setAddStudentOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AddStudentDialog open={addStudentOpen} onOpenChange={setAddStudentOpen} />
    </div>
  );
}
