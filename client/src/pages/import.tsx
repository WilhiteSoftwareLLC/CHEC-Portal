import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload } from "lucide-react";

export default function Import() {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState({
    families: "",
    students: "",
    courses: "",
    classes: "",
    grades: "",
    hours: "",
    settings: ""
  });

  const importFamilies = useMutation({
    mutationFn: async (data: any[]) => {
      return await apiRequest("/api/import/families", "POST", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Families Imported",
        description: `New: ${response.newFamilies || 0}, Modified: ${response.modifiedFamilies || 0}, Inactive: ${response.inactiveFamilies || 0}. ${response.failed || 0} failed.`,
      });
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
        description: `Successfully imported ${response.successful || 0} students. ${response.failed || 0} failed.`,
      });
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
        description: `Successfully imported ${response.successful || 0} courses. ${response.failed || 0} failed.`,
      });
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
        description: `Successfully imported ${response.successful || 0} classes. ${response.failed || 0} failed.`,
      });
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
        description: `Successfully imported ${response.successful || 0} grades. ${response.failed || 0} failed.`,
      });
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
        description: `Successfully imported ${response.successful || 0} hours. ${response.failed || 0} failed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importSettings = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/import/settings", "POST", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Settings Imported",
        description: "Settings imported successfully",
      });
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
      case 'settings':
        const settingsData = data[0]; // Settings is a single record
        importSettings.mutate(settingsData);
        break;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Upload className="h-6 w-6" />
        <h1 className="text-3xl font-bold">CSV Import</h1>
      </div>

      <Alert className="mb-6">
        <AlertDescription>
          Import your existing data from CSV files. Paste the CSV content into the text areas below. 
          The first row should contain column headers that match your database field names.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="families" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="families">Families</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="families">
          <Card>
            <CardHeader>
              <CardTitle>Import Families</CardTitle>
              <CardDescription>
                Expected fields: FamilyID, LastName, Father, Mother, Email, SecondEmail, ParentCell, ParentCell2, 
                HomePhone, WorkPhone, Address, City, Zip, Church, PastorName, PastorPhone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste CSV data here..."
                value={csvData.families}
                onChange={(e) => setCsvData({ ...csvData, families: e.target.value })}
                rows={10}
              />
              <Button 
                onClick={() => handleImport('families')}
                disabled={importFamilies.isPending}
              >
                {importFamilies.isPending ? "Importing..." : "Import Families"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Import Students</CardTitle>
              <CardDescription>
                Expected fields: FamilyID, LastName, FirstName, Birthdate, GradYear, Comment1, MathHour, 
                1stHour, 2ndHour, 3rdHour, 4thHour, 5thHourFall, 5thHourSpring, FridayScience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste CSV data here..."
                value={csvData.students}
                onChange={(e) => setCsvData({ ...csvData, students: e.target.value })}
                rows={10}
              />
              <Button 
                onClick={() => handleImport('students')}
                disabled={importStudents.isPending}
              >
                {importStudents.isPending ? "Importing..." : "Import Students"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Import Courses</CardTitle>
              <CardDescription>
                Expected fields: CourseName, OfferedFall, OfferedSpring, Hour, Fee, BookRental, Location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste CSV data here..."
                value={csvData.courses}
                onChange={(e) => setCsvData({ ...csvData, courses: e.target.value })}
                rows={10}
              />
              <Button 
                onClick={() => handleImport('courses')}
                disabled={importCourses.isPending}
              >
                {importCourses.isPending ? "Importing..." : "Import Courses"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Import Classes</CardTitle>
              <CardDescription>
                Expected fields: ClassName, StartCode, EndCode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste CSV data here..."
                value={csvData.classes}
                onChange={(e) => setCsvData({ ...csvData, classes: e.target.value })}
                rows={10}
              />
              <Button 
                onClick={() => handleImport('classes')}
                disabled={importClasses.isPending}
              >
                {importClasses.isPending ? "Importing..." : "Import Classes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>Import Grades</CardTitle>
              <CardDescription>
                Expected fields: GradeName, Code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste CSV data here..."
                value={csvData.grades}
                onChange={(e) => setCsvData({ ...csvData, grades: e.target.value })}
                rows={10}
              />
              <Button 
                onClick={() => handleImport('grades')}
                disabled={importGrades.isPending}
              >
                {importGrades.isPending ? "Importing..." : "Import Grades"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Import Hours</CardTitle>
              <CardDescription>
                Expected fields: ID, Description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste CSV data here..."
                value={csvData.hours}
                onChange={(e) => setCsvData({ ...csvData, hours: e.target.value })}
                rows={10}
              />
              <Button 
                onClick={() => handleImport('hours')}
                disabled={importHours.isPending}
              >
                {importHours.isPending ? "Importing..." : "Import Hours"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Import Settings</CardTitle>
              <CardDescription>
                Expected fields: FamilyFee, BackgroundFee, StudentFee, SchoolYear
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste CSV data here..."
                value={csvData.settings}
                onChange={(e) => setCsvData({ ...csvData, settings: e.target.value })}
                rows={10}
              />
              <Button 
                onClick={() => handleImport('settings')}
                disabled={importSettings.isPending}
              >
                {importSettings.isPending ? "Importing..." : "Import Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}