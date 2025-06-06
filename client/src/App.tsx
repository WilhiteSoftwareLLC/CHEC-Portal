import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { DialogProvider } from "@/contexts/dialog-context";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Families from "@/pages/families";
import Students from "@/pages/students";
import Courses from "@/pages/courses";
import Schedules from "@/pages/schedules";
import Invoices from "@/pages/invoices";
import Import from "@/pages/import";
import Settings from "@/pages/settings";
import MainLayout from "@/components/layout/main-layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <MainLayout>
          <Route path="/" component={Dashboard} />
          <Route path="/families" component={Families} />
          <Route path="/students" component={Students} />
          <Route path="/courses" component={Courses} />
          <Route path="/schedules" component={Schedules} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/import" component={Import} />
          <Route path="/settings" component={Settings} />
        </MainLayout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DialogProvider>
          <Toaster />
          <Router />
        </DialogProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
