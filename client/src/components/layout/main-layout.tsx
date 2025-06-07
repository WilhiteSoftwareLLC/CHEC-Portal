import AppHeader from "./app-header";
import { useDialogs } from "@/contexts/dialog-context";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { setAddFamilyOpen, setAddStudentOpen, setAddCourseOpen, setAddClassOpen } = useDialogs();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
