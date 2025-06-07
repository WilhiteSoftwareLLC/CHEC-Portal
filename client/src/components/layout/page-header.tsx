import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard } from "lucide-react";
import { Link } from "wouter";

interface PageHeaderProps {
  title: string;
  description: string;
  showDashboardButton?: boolean;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export default function PageHeader({ title, description, showDashboardButton = true, actionButton }: PageHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {showDashboardButton && (
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="mr-4 p-2"
              >
                <LayoutDashboard className="h-6 w-6 text-blue-600" />
              </Button>
            </Link>
          )}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {actionButton && (
            <Button 
              onClick={actionButton.onClick}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              {actionButton.label}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}