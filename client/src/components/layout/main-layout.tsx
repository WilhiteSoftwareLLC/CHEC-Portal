import Header from "./header";
import { useDialogs } from "@/contexts/dialog-context";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { setAddFamilyOpen, setAddStudentOpen, setAddCourseOpen, setAddClassOpen } = useDialogs();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onAddFamily={() => setAddFamilyOpen(true)}
        onAddStudent={() => setAddStudentOpen(true)}
        onAddCourse={() => setAddCourseOpen(true)}
        onAddClass={() => setAddClassOpen(true)}
      />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
