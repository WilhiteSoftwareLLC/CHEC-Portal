import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload } from "lucide-react";
import PageHeader from "@/components/layout/page-header";

export default function Import() {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState({
    families: "",
    students: "",
    courses: "",
    classes: "",
    grades: "",
    hours: ""
  });

  const importFamilies = useMutation({
    mutationFn: async (data: any[]) => {
      return await apiRequest("/api/import/families", "POST", data);
    },
    onSuccess: (response: any) => {
      console.log("Import response:", response);
      toast({
        title: "Families Imported",
        description: `New: ${response.newFamilies || 0}, Modified: ${response.modifiedFamilies || 0}, Inactive: ${response.inactiveFamilies || 0}. ${response.failed || 0} failed.`,
      });
      // Clear the form data after successful import
      setCsvData({ ...csvData, families: "" });
      // Invalidate cache to refresh families list
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importStudents = useMutation({
    mutationFn: async (data: any[]) => {
      return await apiRequest("/api/import/students", "POST", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Students Imported",
        description: `New: ${response.newStudents || 0}, Modified: ${response.modifiedStudents || 0}. ${response.failed || 0} failed.`,
      });
      // Clear the form data after successful import
      setCsvData({ ...csvData, students: "" });
      // Invalidate cache to refresh students list
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importCourses = useMutation({
    mutationFn: async (data: any[]) => {
      return await apiRequest("/api/import/courses", "POST", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Courses Imported",
        description: `New: ${response.newCourses || 0} (replaced all previous). ${response.failed || 0} failed.`,
      });
      // Clear the form data after successful import
      setCsvData({ ...csvData, courses: "" });
      // Invalidate cache to refresh courses list
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importClasses = useMutation({
    mutationFn: async (data: any[]) => {
      return await apiRequest("/api/import/classes", "POST", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Classes Imported",
        description: `New: ${response.newClasses || 0} (replaced all previous). ${response.failed || 0} failed.`,
      });
      // Clear the form data after successful import
      setCsvData({ ...csvData, classes: "" });
      // Invalidate cache to refresh classes list
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importGrades = useMutation({
    mutationFn: async (data: any[]) => {
      return await apiRequest("/api/import/grades", "POST", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Grades Imported",
        description: `New: ${response.newGrades || 0} (replaced all previous). ${response.failed || 0} failed.`,
      });
      // Clear the form data after successful import
      setCsvData({ ...csvData, grades: "" });
      // Invalidate cache to refresh grades list
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importHours = useMutation({
    mutationFn: async (data: any[]) => {
      return await apiRequest("/api/import/hours", "POST", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Hours Imported",
        description: `New: ${response.newHours || 0} (replaced all previous). ${response.failed || 0} failed.`,
      });
      // Clear the form data after successful import
      setCsvData({ ...csvData, hours: "" });
      // Invalidate cache to refresh hours list
      queryClient.invalidateQueries({ queryKey: ["/api/hours"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  const parseCsv = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Convert numeric fields
        if (['id', 'familyId', 'hour', 'startGrade', 'endGrade'].includes(header) && value) {
          row[header] = parseInt(value);
        } else if (['fee', 'bookRental'].includes(header) && value) {
          row[header] = value;
        } else if (['openForRegistration', 'registrationClosed'].includes(header)) {
          row[header] = value.toLowerCase() === 'true';
        } else {
          row[header] = value || null;
        }
      });
      data.push(row);
    }
    
    return data;
  };

  const handleImport = (type: string) => {
    const data = parseCsv(csvData[type as keyof typeof csvData]);
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "Please paste CSV data before importing.",
        variant: "destructive",
      });
      return;
    }

    switch (type) {
      case 'families':
        importFamilies.mutate(data);
        break;
      case 'students':
        importStudents.mutate(data);
        break;
      case 'courses':
        importCourses.mutate(data);
        break;
      case 'classes':
        importClasses.mutate(data);
        break;
      case 'grades':
        importGrades.mutate(data);
        break;
      case 'hours':
        importHours.mutate(data);
        break;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="CSV Import"
        description="Import your existing data from CSV files"
      />
      <div className="flex-1 p-6 overflow-hidden">
        <Tabs defaultValue="families" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="families">Families</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="families" className="flex-1 flex flex-col">
          <div className="flex flex-col h-full space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Import Families</h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste CSV content below. First row should contain column headers that match database field names.
                Expected fields: FamilyID, LastName, Father, Mother, Email, SecondEmail, ParentCell, ParentCell2, 
                HomePhone, WorkPhone, Address, City, Zip, Church, PastorName, PastorPhone
              </p>
            </div>
            <Textarea
              placeholder="Paste CSV data here..."
              value={csvData.families}
              onChange={(e) => setCsvData({ ...csvData, families: e.target.value })}
              className="flex-1 min-h-0"
            />
            <Button 
              onClick={() => handleImport('families')}
              disabled={importFamilies.isPending}
              className="w-fit"
            >
              {importFamilies.isPending ? "Importing..." : "Import Families"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="students" className="flex-1 flex flex-col">
          <div className="flex flex-col h-full space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Import Students</h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste CSV content below. First row should contain column headers that match database field names.
                Expected fields: FamilyID, LastName, FirstName, Birthdate, GradYear, Comment1, MathHour, 
                1stHour, 2ndHour, 3rdHour, 4thHour, 5thHourFall, 5thHourSpring, FridayScience
              </p>
            </div>
            <Textarea
              placeholder="Paste CSV data here..."
              value={csvData.students}
              onChange={(e) => setCsvData({ ...csvData, students: e.target.value })}
              className="flex-1 min-h-0"
            />
            <Button 
              onClick={() => handleImport('students')}
              disabled={importStudents.isPending}
              className="w-fit"
            >
              {importStudents.isPending ? "Importing..." : "Import Students"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="flex-1 flex flex-col">
          <div className="flex flex-col h-full space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Import Courses</h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste CSV content below. First row should contain column headers that match database field names.
                Expected fields: CourseName, OfferedFall, OfferedSpring, Hour, Fee, BookRental, Location
              </p>
            </div>
            <Textarea
              placeholder="Paste CSV data here..."
              value={csvData.courses}
              onChange={(e) => setCsvData({ ...csvData, courses: e.target.value })}
              className="flex-1 min-h-0"
            />
            <Button 
              onClick={() => handleImport('courses')}
              disabled={importCourses.isPending}
              className="w-fit"
            >
              {importCourses.isPending ? "Importing..." : "Import Courses"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="classes" className="flex-1 flex flex-col">
          <div className="flex flex-col h-full space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Import Classes</h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste CSV content below. First row should contain column headers that match database field names.
                Expected fields: ClassName, StartCode, EndCode
              </p>
            </div>
            <Textarea
              placeholder="Paste CSV data here..."
              value={csvData.classes}
              onChange={(e) => setCsvData({ ...csvData, classes: e.target.value })}
              className="flex-1 min-h-0"
            />
            <Button 
              onClick={() => handleImport('classes')}
              disabled={importClasses.isPending}
              className="w-fit"
            >
              {importClasses.isPending ? "Importing..." : "Import Classes"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="grades" className="flex-1 flex flex-col">
          <div className="flex flex-col h-full space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Import Grades</h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste CSV content below. First row should contain column headers that match database field names.
                Expected fields: GradeName, Code
              </p>
            </div>
            <Textarea
              placeholder="Paste CSV data here..."
              value={csvData.grades}
              onChange={(e) => setCsvData({ ...csvData, grades: e.target.value })}
              className="flex-1 min-h-0"
            />
            <Button 
              onClick={() => handleImport('grades')}
              disabled={importGrades.isPending}
              className="w-fit"
            >
              {importGrades.isPending ? "Importing..." : "Import Grades"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="hours" className="flex-1 flex flex-col">
          <div className="flex flex-col h-full space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Import Hours</h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste CSV content below. First row should contain column headers that match database field names.
                Expected fields: ID, Description
              </p>
            </div>
            <Textarea
              placeholder="Paste CSV data here..."
              value={csvData.hours}
              onChange={(e) => setCsvData({ ...csvData, hours: e.target.value })}
              className="flex-1 min-h-0"
            />
            <Button 
              onClick={() => handleImport('hours')}
              disabled={importHours.isPending}
              className="w-fit"
            >
              {importHours.isPending ? "Importing..." : "Import Hours"}
            </Button>
          </div>
        </TabsContent>


        </Tabs>
      </div>
    </div>
  );
}