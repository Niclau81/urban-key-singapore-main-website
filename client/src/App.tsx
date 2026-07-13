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

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/explore" component={Explore} />
    <Route path="/dashboard" component={Dashboard} />
    <Route path="/map" component={MapIntelligence} />
    <Route path="/property/:id" component={PropertyDetail} />
    <Route path="/assistants" component={Assistants} />
    <Route path="/agent" component={AgentLogin} />
    <Route path="/agent/portal" component={AgentPortal} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
