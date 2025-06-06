import { Button } from "@/components/ui/button";
import { Menu, Plus, Bell } from "lucide-react";
import { useLocation } from "wouter";

interface HeaderProps {
  onMenuClick: () => void;
}

const pageLabels: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Homeschool Cooperative Overview" },
  "/families": { title: "Families", description: "Manage family information and contacts" },
  "/students": { title: "Students", description: "Manage student records and enrollment" },
  "/courses": { title: "Courses", description: "Manage courses and instructors" },
  "/schedules": { title: "Schedules", description: "Generate and view student schedules" },
  "/invoices": { title: "Invoices", description: "Manage billing and payments" },
};

export default function Header({ onMenuClick }: HeaderProps) {
  const [location] = useLocation();
  const pageInfo = pageLabels[location] || { title: "Page", description: "Homeschool Cooperative" };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden mr-2"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{pageInfo.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{pageInfo.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Quick Add
          </Button>
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
