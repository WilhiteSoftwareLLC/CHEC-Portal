import AppHeader from "./app-header";
import { useDialogs } from "@/contexts/dialog-context";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
