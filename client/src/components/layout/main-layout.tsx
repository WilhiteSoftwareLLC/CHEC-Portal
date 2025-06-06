import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import { useDialogs } from "@/contexts/dialog-context";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { setAddFamilyOpen, setAddStudentOpen, setAddCourseOpen } = useDialogs();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="flex-1 overflow-auto">
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          onAddFamily={() => setAddFamilyOpen(true)}
          onAddStudent={() => setAddStudentOpen(true)}
          onAddCourse={() => setAddCourseOpen(true)}
        />
        {children}
      </main>
    </div>
  );
}
