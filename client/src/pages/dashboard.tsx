import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Calendar,
  Upload,
  Settings,
  School,
  UserCog,
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
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

  const navigationCards = [
    {
      title: "Families",
      icon: Users,
      path: "/families",
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      description: "Manage active families"
    },
    {
      title: "Former Families",
      icon: Users,
      path: "/former-families",
      color: "bg-gray-500",
      hoverColor: "hover:bg-gray-600",
      description: "View inactive families"
    },
    {
      title: "Students", 
      icon: GraduationCap,
      path: "/students",
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600", 
      description: "Manage student records"
    },
    {
      title: "Courses",
      icon: BookOpen,
      path: "/courses", 
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
      description: "Manage course offerings"
    },
    {
      title: "Classes",
      icon: School,
      path: "/classes",
      color: "bg-purple-500", 
      hoverColor: "hover:bg-purple-600",
      description: "Manage class groupings"
    },
    {
      title: "Schedules",
      icon: Calendar,
      path: "/schedules",
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600",
      description: "Generate student schedules"
    },
    {
      title: "Invoices",
      icon: FileText,
      path: "/invoices",
      color: "bg-teal-500",
      hoverColor: "hover:bg-teal-600",
      description: "Manage billing and payments"
    },
    {
      title: "Import Data",
      icon: Upload,
      path: "/import",
      color: "bg-indigo-500",
      hoverColor: "hover:bg-indigo-600",
      description: "Import from spreadsheets"
    },
    {
      title: "Users",
      icon: UserCog,
      path: "/users",
      color: "bg-amber-500",
      hoverColor: "hover:bg-amber-600",
      description: "Manage user accounts"
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
      color: "bg-gray-500",
      hoverColor: "hover:bg-gray-600",
      description: "Configure system settings"
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-6">
        {/* Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {navigationCards.map((card) => (
            <Link key={card.path} href={card.path}>
              <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-gray-300">
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto w-16 h-16 ${card.color} ${card.hoverColor} rounded-2xl flex items-center justify-center mb-4 transition-colors duration-200 group-hover:shadow-lg`}>
                    <card.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-xs text-gray-600">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
