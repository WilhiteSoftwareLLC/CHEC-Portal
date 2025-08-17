import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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

  // Fetch dashboard summary data in a single request
  const { data: summary } = useQuery({
    queryKey: ["/api/dashboard/summary"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/summary", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
    enabled: isAuthenticated,
  });

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

  // Helper function to get card descriptions with summary data
  const getCardDescription = (cardTitle: string) => {
    if (!summary) return "Loading...";
    
    switch (cardTitle) {
      case "Families":
        return `${summary.families.active} active families`;
      
      case "Former Families":
        return `${summary.families.inactive} inactive families`;
      
      case "Students":
        return `${summary.students.active} active, ${summary.students.inactive} inactive`;
      
      case "Courses":
        return `${summary.courses.total} courses`;
      
      case "Classes":
        return `${summary.classes.total} classes`;
      
      case "Schedules":
        return `${summary.students.scheduled} students scheduled`;
      
      case "Invoices":
        return `${summary.invoices.familiesPaid} paid, ${summary.invoices.familiesUnpaid} unpaid`;
      
      case "Import Data":
        return "CSV import tools";
      
      case "Users":
        return `${summary.users.total} user accounts`;
      
      case "Settings":
        return "System configuration";
      
      default:
        return "Loading...";
    }
  };

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
      hoverColor: "hover:bg-blue-600"
    },
    {
      title: "Former Families",
      icon: Users,
      path: "/former-families",
      color: "bg-gray-500",
      hoverColor: "hover:bg-gray-600"
    },
    {
      title: "Students", 
      icon: GraduationCap,
      path: "/students",
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600"
    },
    {
      title: "Courses",
      icon: BookOpen,
      path: "/courses", 
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600"
    },
    {
      title: "Classes",
      icon: School,
      path: "/classes",
      color: "bg-purple-500", 
      hoverColor: "hover:bg-purple-600"
    },
    {
      title: "Schedules",
      icon: Calendar,
      path: "/schedules",
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600"
    },
    {
      title: "Invoices",
      icon: FileText,
      path: "/invoices",
      color: "bg-teal-500",
      hoverColor: "hover:bg-teal-600"
    },
    {
      title: "Import Data",
      icon: Upload,
      path: "/import",
      color: "bg-indigo-500",
      hoverColor: "hover:bg-indigo-600"
    },
    {
      title: "Users",
      icon: UserCog,
      path: "/users",
      color: "bg-amber-500",
      hoverColor: "hover:bg-amber-600"
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
      color: "bg-gray-500",
      hoverColor: "hover:bg-gray-600"
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
                  <p className="text-xs text-gray-600">{getCardDescription(card.title)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
