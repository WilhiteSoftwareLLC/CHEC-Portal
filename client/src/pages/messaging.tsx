import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Users, AlertTriangle, CheckCircle } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Family {
  id: number;
  lastName: string;
  father: string | null;
  mother: string | null;
  parentCell: string | null;
}

interface SMSResult {
  success: boolean;
  message: string;
  totalFamilies: number;
  sentCount: number;
  failedCount: number;
  failures: Array<{
    familyId: number;
    lastName: string;
    error: string;
  }>;
}

export default function Messaging() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<SMSResult | null>(null);
  
  // Test SMS state
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [isTestSending, setIsTestSending] = useState(false);

  // Fetch families with phone numbers
  const { data: families, isLoading } = useQuery({
    queryKey: ["/api/families/with-phones"],
    queryFn: async () => {
      const response = await fetch("/api/families/with-phones", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json() as Family[];
    },
    retry: false,
  });

  // Send SMS mutation
  const sendSMSMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await fetch("/api/messaging/send-emergency-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message: messageText }),
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json() as SMSResult;
    },
    onSuccess: (result) => {
      setLastResult(result);
      if (result.success) {
        toast({
          title: "SMS Messages Sent",
          description: `Successfully sent ${result.sentCount} messages to families.`,
        });
        setMessage("");
      } else {
        toast({
          title: "SMS Sending Failed",
          description: result.message,
          variant: "destructive",
        });
      }
      setIsSending(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send SMS messages: ${error.message}`,
        variant: "destructive",
      });
      setIsSending(false);
    },
  });

  // Test SMS mutation
  const testSMSMutation = useMutation({
    mutationFn: async ({ messageText, phoneNumber }: { messageText: string; phoneNumber: string }) => {
      const response = await fetch("/api/messaging/test-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message: messageText, phoneNumber }),
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Test Message Sent",
          description: `Test message successfully sent to ${result.sentTo}`,
        });
      } else {
        toast({
          title: "Test Message Failed",
          description: result.message,
          variant: "destructive",
        });
      }
      setIsTestSending(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send test message: ${error.message}`,
        variant: "destructive",
      });
      setIsTestSending(false);
    },
  });

  const handleTestSMS = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to test.",
        variant: "destructive",
      });
      return;
    }

    if (!testPhoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number for testing.",
        variant: "destructive",
      });
      return;
    }

    // Basic phone number validation
    const digits = testPhoneNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number with at least 10 digits.",
        variant: "destructive",
      });
      return;
    }

    setIsTestSending(true);
    testSMSMutation.mutate({ messageText: message, phoneNumber: testPhoneNumber });
  };

  const handleSendSMS = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    if (message.length > 160) {
      toast({
        title: "Warning",
        description: "Message is longer than 160 characters and may be sent as multiple SMS messages.",
      });
    }

    setIsSending(true);
    sendSMSMutation.mutate(message);
  };

  // Server already filters for families with phones, so all returned families have phones
  const familiesWithPhones = families || [];
  const familiesWithoutPhones: Family[] = []; // No longer needed since server filters

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Messaging"
        description="Send SMS notifications to all families in case of emergencies"
        icon={MessageSquare}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Message Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Compose Emergency Message
            </CardTitle>
            <CardDescription>
              This message will be sent to all families with registered phone numbers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Emergency Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your emergency message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{message.length} characters</span>
                {message.length > 160 && (
                  <span className="text-amber-600">
                    ~{Math.ceil(message.length / 160)} SMS messages
                  </span>
                )}
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will send an SMS to all families with phone numbers. Use only for genuine emergencies.
              </AlertDescription>
            </Alert>

            {/* Test Message Section */}
            <div className="border-t pt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="testPhone" className="text-sm font-medium text-gray-700">
                  Test Phone Number (optional)
                </Label>
                <Input
                  id="testPhone"
                  placeholder="Enter phone number to test message (e.g., 903-555-1234)"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">
                  Send a test message to verify your emergency message before sending to all families
                </p>
              </div>
              
              <Button
                onClick={handleTestSMS}
                disabled={isTestSending || !message.trim() || !testPhoneNumber.trim()}
                variant="outline"
                className="w-full"
              >
                {isTestSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Sending Test...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Test Message
                  </>
                )}
              </Button>
            </div>

            <Button
              onClick={handleSendSMS}
              disabled={isSending || !message.trim()}
              className="w-full"
              size="lg"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Messages...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Emergency SMS
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Family Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Phone Numbers
            </CardTitle>
            <CardDescription>
              Overview of families with and without registered phone numbers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-sm font-medium text-green-900">
                    Families with phone numbers
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {familiesWithPhones.length}
                  </Badge>
                </div>

                {familiesWithoutPhones.length > 0 && (
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <span className="text-sm font-medium text-yellow-900">
                      Families without phone numbers
                    </span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {familiesWithoutPhones.length}
                    </Badge>
                  </div>
                )}

                {familiesWithoutPhones.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      Families without phone numbers:
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {familiesWithoutPhones.map((family) => (
                        <div key={family.id} className="text-sm text-gray-600 px-2 py-1 bg-gray-50 rounded">
                          {family.lastName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last Result */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Last SMS Campaign Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{lastResult.totalFamilies}</div>
                <div className="text-sm text-gray-600">Total Families</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{lastResult.sentCount}</div>
                <div className="text-sm text-gray-600">Messages Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{lastResult.failedCount}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            {lastResult.failures && lastResult.failures.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Failed Messages:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {lastResult.failures.map((failure, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded border border-red-200">
                      <span className="font-medium">{failure.lastName}:</span> {failure.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}