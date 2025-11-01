import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import HowTo from "@/pages/HowTo";
import Examples from "@/pages/Examples";
import Pricing from "@/pages/Pricing";
import PaymentSuccess from "@/pages/PaymentSuccess";
import Dashboard from "@/pages/Dashboard";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/how-to" component={HowTo} />
      <Route path="/examples" component={Examples} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Header />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
