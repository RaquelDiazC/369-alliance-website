import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// System pages
import LandingPage from "./pages/LandingPage";
import AdmLanding from "./pages/AdmLanding";
import ActionManager from "./pages/ActionManager";
import Dashboard from "./pages/Dashboard";
import RolePortal from "./pages/RolePortal";
import DataHub from "./pages/DataHub";
import NotFound from "./pages/NotFound";
import IauditorPage from "./pages/IauditorPage";
import DbpAuditor from "./pages/DbpAuditor";
import DrawingAnalyser from "./pages/DrawingAnalyser";

// Marketing website pages
import WebsiteHome from "./pages/website/WebsiteHome";
import WebsiteRolePage from "./pages/website/WebsiteRolePage";
import WebsiteServices from "./pages/website/WebsiteServices";
import WebsiteAbout from "./pages/website/WebsiteAbout";
import WebsiteContact from "./pages/website/WebsiteContact";

function Router() {
  return (
    <Switch>
      {/* Marketing website – entry point */}
      <Route path="/website" component={WebsiteHome} />
      <Route path="/website/for/:role" component={WebsiteRolePage} />
      <Route path="/website/services" component={WebsiteServices} />
      <Route path="/website/services/:pillar" component={WebsiteServices} />
      <Route path="/website/about" component={WebsiteAbout} />
      <Route path="/website/contact" component={WebsiteContact} />

      {/* Internal system */}
      <Route path="/" component={WebsiteHome} />
      <Route path="/system" component={LandingPage} />
      <Route path="/adm" component={AdmLanding} />
      <Route path="/action-manager" component={ActionManager} />
      <Route path="/iauditor" component={IauditorPage} />
      <Route path="/dbp-auditor" component={DbpAuditor} />
      <Route path="/drawing-analyser" component={DrawingAnalyser} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/portal/:role" component={RolePortal} />
      <Route path="/data" component={DataHub} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
