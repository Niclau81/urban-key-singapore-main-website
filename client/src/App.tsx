import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Explore from "./pages/Explore";
import Home from "./pages/Home";
import MapIntelligence from "./pages/MapIntelligence";
import PropertyDetail from "./pages/PropertyDetail";
import Assistants from "./pages/Assistants";
import AgentLogin from "./pages/AgentLogin";
import AgentPortal from "./pages/AgentPortal";
import AgentSignUp from "./pages/AgentSignUp";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentHistory from "./pages/PaymentHistory";
import PropertyAgent from "./pages/PropertyAgent";
import TourCaptureQuality from "./pages/TourCaptureQuality";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/explore" component={Explore} />
    <Route path="/dashboard" component={Dashboard} />
    <Route path="/map" component={MapIntelligence} />
    <Route path="/property/:id" component={PropertyDetail} />
    <Route path="/assistants" component={Assistants} />
    <Route path="/property-agent" component={PropertyAgent} />
    <Route path="/agent" component={AgentLogin} />
    <Route path="/agent/portal" component={AgentPortal} />
    <Route path="/agent/tours" component={TourCaptureQuality} />
    <Route path="/agent/signup" component={AgentSignUp} />
    <Route path="/agent/subscribe" component={SubscriptionPlans} />
    <Route path="/agent/checkout" component={Checkout} />
    <Route path="/agent/payment-success" component={PaymentSuccess} />
    <Route path="/agent/payments" component={PaymentHistory} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><div className="mobile-compact"><Router /></div></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
