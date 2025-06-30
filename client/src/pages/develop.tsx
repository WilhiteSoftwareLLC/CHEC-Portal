import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCredentialAuth } from "@/hooks/useCredentialAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Terminal, Rocket, AlertCircle, CheckCircle } from "lucide-react";
import PageHeader from "@/components/layout/page-header";

export default function Develop() {
  const { toast } = useToast();
  const { isAdmin } = useCredentialAuth();
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const executeMutation = useMutation({
    mutationFn: async (prompt: string) => {
      setIsExecuting(true);
      setResults("");
      return await apiRequest("/api/develop/execute", "POST", { prompt });
    },
    onSuccess: (response) => {
      setResults(response.output || "Command completed successfully");
      if (response.success) {
        toast({
          title: "Aider Execution Complete",
          description: "Command executed successfully",
        });
      } else {
        toast({
          title: "Aider Execution Failed",
          description: response.error || "Command failed",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      setResults(`Error: ${error.message}`);
      toast({
        title: "Execution Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsExecuting(false);
    },
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      setIsDeploying(true);
      return await apiRequest("/api/develop/deploy", "POST");
    },
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Deployment Successful",
          description: "Application has been built and redeployed",
        });
        // Note: User will be logged out automatically due to PM2 restart
      } else {
        toast({
          title: "Deployment Failed",
          description: response.error || "Deployment failed",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Deployment Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeploying(false);
    },
  });

  const handleExecute = () => {
    if (!prompt.trim()) {
      toast({
        title: "No Prompt",
        description: "Please enter a prompt for aider",
        variant: "destructive",
      });
      return;
    }
    executeMutation.mutate(prompt.trim());
  };

  const handleDeploy = () => {
    deployMutation.mutate();
  };

  const handleClear = () => {
    setPrompt("");
    setResults("");
  };

  // Admin access control
  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader 
          title="Develop"
          description="Execute aider commands and deploy application changes"
        />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="flex mb-4 gap-2">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                This page is only accessible to administrators.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Develop"
        description="Execute aider commands and deploy application changes"
      />
      <div className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left Column - Input */}
          <div className="flex flex-col space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Aider Prompt
                </CardTitle>
                <CardDescription>
                  Enter your development prompt for aider to execute
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your aider prompt here..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  disabled={isExecuting}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExecute}
                    disabled={isExecuting || !prompt.trim()}
                    className="flex-1"
                  >
                    {isExecuting ? "Executing..." : "Execute Aider"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleClear}
                    disabled={isExecuting}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Deploy Application
                </CardTitle>
                <CardDescription>
                  Build and redeploy the application after making changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Deployment will restart the application and log you out automatically.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleDeploy}
                  disabled={isDeploying || isExecuting}
                  variant="secondary"
                  className="w-full"
                >
                  {isDeploying ? "Deploying..." : "Deploy Application"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Output */}
          <div className="flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isExecuting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                  ) : results ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Terminal className="h-5 w-5" />
                  )}
                  Command Output
                </CardTitle>
                <CardDescription>
                  {isExecuting ? "Executing aider command..." : "Results will appear here"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Textarea
                  value={results}
                  readOnly
                  className="flex-1 min-h-0 font-mono text-sm bg-gray-50 dark:bg-gray-900"
                  placeholder={isExecuting ? "Executing command..." : "Output will appear here after execution"}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
