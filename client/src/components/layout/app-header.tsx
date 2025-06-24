import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useCredentialAuth } from "@/hooks/useCredentialAuth";

export default function AppHeader() {
  const { user, logout } = useCredentialAuth();
  
  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-blue-600 text-white shadow-sm border-b border-blue-700 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">CHEC Portal</h1>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {user.firstName || user.username}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:bg-blue-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}