import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCredentialAuth } from "@/hooks/useCredentialAuth";
import { DialogProvider } from "@/contexts/dialog-context";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Families from "@/pages/families";
import FormerFamilies from "@/pages/former-families";
import Students from "@/pages/students";
import Courses from "@/pages/courses";
import Classes from "@/pages/classes";
import Schedules from "@/pages/schedules";
import Invoices from "@/pages/invoices";
import Import from "@/pages/import";
import Users from "@/pages/users";
import Settings from "@/pages/settings";
import Develop from "@/pages/develop";
import PublicInvoice from "@/pages/public-invoice";
import PublicSchedules from "@/pages/public-schedules";
import MainLayout from "@/components/layout/main-layout";

function Router() {
  const { isAuthenticated: credentialAuth, isLoading: credentialLoading, user } = useCredentialAuth();

  const isLoading = credentialLoading;
  const isAuthenticated = credentialAuth;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes - no authentication required */}
      <Route path="/invoice/:hash" component={PublicInvoice} />
      <Route path="/schedules/:hash" component={PublicSchedules} />
      
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Login} />
          <Route path="/login" component={Login} />
        </>
      ) : (
        <DialogProvider>
          <MainLayout>
            <Route path="/" component={Dashboard} />
            <Route path="/families" component={Families} />
            <Route path="/former-families" component={FormerFamilies} />
            <Route path="/students" component={Students} />
            <Route path="/courses" component={Courses} />
            <Route path="/classes" component={Classes} />
            <Route path="/schedules" component={Schedules} />
            <Route path="/invoices" component={Invoices} />
            <Route path="/import" component={Import} />
            <Route path="/users" component={Users} />
            <Route path="/settings" component={Settings} />
            <Route path="/develop" component={Develop} />
          </MainLayout>
        </DialogProvider>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
