import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Calendar, FileText, BarChart } from "lucide-react";

import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  const handleLogin = () => {
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <GraduationCap className="h-16 w-16 text-blue-600 mr-4" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Homeschool Co-op</h1>
              <p className="text-xl text-gray-600 mt-2">Management System</p>
            </div>
          </div>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Streamline your homeschool cooperative with comprehensive family, student, and course management tools.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Family Management</CardTitle>
              <CardDescription>
                Organize and track family information, contacts, and emergency details
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <GraduationCap className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Student Records</CardTitle>
              <CardDescription>
                Maintain detailed student profiles with grades, medical information, and notes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Course Management</CardTitle>
              <CardDescription>
                Create and manage courses with instructors, schedules, and materials
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Schedule Generation</CardTitle>
              <CardDescription>
                Generate and print student schedules for easy reference
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>
                Create and track family invoices with automated calculations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>
                Generate comprehensive reports and export data as needed
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
            <CardDescription className="text-lg">
              Sign in to access your homeschool cooperative management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Sign In to Continue
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Secure authentication powered by your existing account
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
