import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCredentialAuth } from "@/hooks/useCredentialAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Terminal, Rocket, AlertCircle, CheckCircle, X } from "lucide-react";
import PageHeader from "@/components/layout/page-header";

export default function Develop() {
  const { toast } = useToast();
  const { isAdmin } = useCredentialAuth();
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const resultsRef = useRef<HTMLTextAreaElement>(null);

  // Clean up EventSource on unmount or job change
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Auto-scroll results to bottom when new content is added
  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollTop = resultsRef.current.scrollHeight;
    }
  }, [results]);

  const connectToStream = (jobId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/develop/stream/${jobId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'output') {
          setResults(prev => prev + data.data);
        } else if (data.type === 'complete') {
          setResults(prev => prev + data.data);
          setIsExecuting(false);
          setCurrentJobId(null);
          
          if (data.success) {
            toast({
              title: "Request Completed",
              description: "Feature implemented successfully",
            });
          } else {
            toast({
              title: "Implementation Failed",
              description: data.error || "Implementation failed",
              variant: "destructive",
            });
          }
          
          eventSource.close();
          eventSourceRef.current = null;
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      setIsExecuting(false);
      setCurrentJobId(null);
      toast({
        title: "Connection Error",
        description: "Lost connection to command stream",
        variant: "destructive",
      });
      eventSource.close();
      eventSourceRef.current = null;
    };
  };

  const executeMutation = useMutation({
    mutationFn: async (prompt: string) => {
      setIsExecuting(true);
      setResults("");
      return await apiRequest("/api/develop/execute", "POST", { prompt });
    },
    onSuccess: (response) => {
      if (response.jobId) {
        setCurrentJobId(response.jobId);
        connectToStream(response.jobId);
        setResults("Starting implementation...\n");
      } else {
        setIsExecuting(false);
        toast({
          title: "Execution Error",
          description: "Failed to start command",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      setResults(`Error: ${error.message}`);
      setIsExecuting(false);
      toast({
        title: "Execution Error",
        description: error.message,
        variant: "destructive",
      });
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
        title: "No Request",
        description: "Please describe what you want to implement",
        variant: "destructive",
      });
      return;
    }
    executeMutation.mutate(prompt.trim());
  };

  const handleCancel = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsExecuting(false);
    setCurrentJobId(null);
    setResults(prev => prev + "\n❌ Command cancelled by user");
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
          description="Request features and fixes using natural language - powered by Claude"
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
        description="Request features and fixes using natural language - powered by Claude"
      />
      <div className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left Column - Input */}
          <div className="flex flex-col space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Feature Request
                </CardTitle>
                <CardDescription>
                  Describe what you want to add or fix in plain English. Claude will implement it automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Examples:&#10;• Add a new field to track student allergies on the family form&#10;• Change the color of the header to blue&#10;• Add a button to export student data to CSV&#10;• Fix the bug where students can't be deleted&#10;• Make the sidebar collapsible"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[300px] text-sm"
                  disabled={isExecuting}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExecute}
                    disabled={isExecuting || !prompt.trim()}
                    className="flex-1"
                  >
                    {isExecuting ? "Implementing..." : "Implement Request"}
                  </Button>
                  {isExecuting && (
                    <Button 
                      variant="destructive"
                      onClick={handleCancel}
                      size="icon"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
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
                  {isExecuting ? "Implementing your request..." : "Implementation progress will appear here"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Textarea
                  ref={resultsRef}
                  value={results}
                  readOnly
                  className="flex-1 min-h-0 font-mono text-sm bg-gray-50 dark:bg-gray-900"
                  placeholder={isExecuting ? "Implementing your request..." : "Implementation progress will appear here"}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
