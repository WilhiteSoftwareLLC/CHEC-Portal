import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Save, X, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Class, Grade, InsertClass } from "@shared/schema";

export default function Classes() {
  const { toast } = useToast();
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [newClass, setNewClass] = useState<Partial<InsertClass>>({});
  const [isCreating, setIsCreating] = useState(false);

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes"],
    retry: false,
  });

  const { data: grades } = useQuery({
    queryKey: ["/api/grades"],
    retry: false,
  });

  const createClassMutation = useMutation({
    mutationFn: async (data: InsertClass) => {
      return await apiRequest("/api/classes", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setNewClass({});
      setIsCreating(false);
      toast({
        title: "Success",
        description: "Class created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create class",
        variant: "destructive",
      });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertClass> }) => {
      return await apiRequest(`/api/classes/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setEditingClass(null);
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update class",
        variant: "destructive",
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/classes/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete class",
        variant: "destructive",
      });
    },
  });

  const getGradeName = (gradeCode: number): string => {
    const grade = (grades as Grade[])?.find(g => g.code === gradeCode);
    return grade ? grade.gradeName : "Unknown";
  };

  const handleCreateClass = () => {
    if (!newClass.className || newClass.startCode === undefined || newClass.endCode === undefined) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    createClassMutation.mutate(newClass as InsertClass);
  };

  const handleUpdateClass = () => {
    if (!editingClass) return;
    updateClassMutation.mutate({ 
      id: editingClass.id, 
      data: editingClass 
    });
  };

  const handleEditClass = (classData: Class) => {
    setEditingClass({ ...classData });
  };

  const handleCancelEdit = () => {
    setEditingClass(null);
  };

  const handleDeleteClass = (id: number) => {
    if (confirm("Are you sure you want to delete this class?")) {
      deleteClassMutation.mutate(id);
    }
  };

  if (classesLoading) {
    return <div className="p-6">Loading classes...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Classes</h1>
        <Button
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Start Grade</TableHead>
                <TableHead>End Grade</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isCreating && (
                <TableRow>
                  <TableCell>
                    <Input
                      placeholder="Class Name"
                      value={newClass.className || ""}
                      onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={newClass.startCode?.toString() || ""}
                      onValueChange={(value) => setNewClass({ ...newClass, startCode: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Start Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {(grades as Grade[])?.map((grade) => (
                          <SelectItem key={grade.id} value={grade.code.toString()}>
                            {grade.gradeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={newClass.endCode?.toString() || ""}
                      onValueChange={(value) => setNewClass({ ...newClass, endCode: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select End Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {(grades as Grade[])?.map((grade) => (
                          <SelectItem key={grade.id} value={grade.code.toString()}>
                            {grade.gradeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        onClick={handleCreateClass}
                        disabled={createClassMutation.isPending}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsCreating(false);
                          setNewClass({});
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {(classes as Class[])?.map((classData) => (
                <TableRow key={classData.id}>
                  <TableCell>
                    {editingClass?.id === classData.id ? (
                      <Input
                        value={editingClass.className}
                        onChange={(e) => setEditingClass({ ...editingClass, className: e.target.value })}
                      />
                    ) : (
                      classData.className
                    )}
                  </TableCell>
                  <TableCell>
                    {editingClass?.id === classData.id ? (
                      <Select
                        value={editingClass.startCode?.toString() || ""}
                        onValueChange={(value) => setEditingClass({ ...editingClass, startCode: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(grades as Grade[])?.map((grade) => (
                            <SelectItem key={grade.id} value={grade.code.toString()}>
                              {grade.gradeName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      getGradeName(classData.startCode || 0)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingClass?.id === classData.id ? (
                      <Select
                        value={editingClass.endCode?.toString() || ""}
                        onValueChange={(value) => setEditingClass({ ...editingClass, endCode: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(grades as Grade[])?.map((grade) => (
                            <SelectItem key={grade.id} value={grade.code.toString()}>
                              {grade.gradeName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      getGradeName(classData.endCode || 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {editingClass?.id === classData.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={handleUpdateClass}
                            disabled={updateClassMutation.isPending}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClass(classData)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClass(classData.id)}
                            disabled={deleteClassMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {(!classes || (classes as Class[]).length === 0) && !isCreating && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No classes found. Click "Add Class" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}