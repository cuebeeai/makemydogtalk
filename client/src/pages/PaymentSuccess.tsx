import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/payment/success");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    // Get session ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (!sessionId) {
      setStatus("error");
      return;
    }

    // Check session status
    fetch(`/api/session-status/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setSessionData(data);
        if (data.status === "complete" && data.payment_status === "paid") {
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch((error) => {
        console.error("Error checking session status:", error);
        setStatus("error");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 space-y-6 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
            <h2 className="text-2xl font-bold">Processing Payment...</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Payment Successful!</h2>
            <p className="text-muted-foreground">
              Your credits have been added to your account. You can now create more talking dog videos!
            </p>
            {sessionData?.customer_email && (
              <p className="text-sm text-muted-foreground">
                A receipt has been sent to {sessionData.customer_email}
              </p>
            )}
            <Button
              onClick={() => setLocation("/")}
              size="lg"
              className="w-full"
            >
              Start Creating Videos
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-16 w-16 text-destructive mx-auto text-5xl">❌</div>
            <h2 className="text-2xl font-bold">Payment Issue</h2>
            <p className="text-muted-foreground">
              There was an issue processing your payment. Please contact support if you believe this is an error.
            </p>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Return Home
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
