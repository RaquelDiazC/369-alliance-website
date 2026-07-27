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
import ApartmentDesignGuide from "./pages/ApartmentDesignGuide";
import FieldInspector from "./pages/FieldInspector";
import LegislationBrain from "./pages/LegislationBrain";
import ReportStudio from "./pages/ReportStudio";
import TrainingPlatform from "./pages/TrainingPlatform";
import PlatformHome from "./pages/PlatformHome";

// Marketing website pages
import WebsiteHome from "./pages/website/WebsiteHome";
import WebsiteRolePage from "./pages/website/WebsiteRolePage";
import WebsiteServices from "./pages/website/WebsiteServices";
import WebsiteAbout from "./pages/website/WebsiteAbout";
import WebsiteContact from "./pages/website/WebsiteContact";

// Build-time site split — keeps the corporate site and the product platform
// as two separate deployments from one codebase (honours the corporate ≠
// product separation constraint):
//   VITE_SITE=platform → product-only site (Brain, Courses, DBP). Root opens
//     the product hub; the corporate marketing pages are not mounted at all.
//   unset (default)    → the corporate site, exactly as before (zero change).
const PLATFORM_ONLY = import.meta.env.VITE_SITE === "platform";

function Router() {
  return (
    <Switch>
      {/* Marketing website – only mounted on the corporate build */}
      {!PLATFORM_ONLY && <Route path="/website" component={WebsiteHome} />}
      {!PLATFORM_ONLY && <Route path="/website/for/:role" component={WebsiteRolePage} />}
      {!PLATFORM_ONLY && <Route path="/website/services" component={WebsiteServices} />}
      {!PLATFORM_ONLY && <Route path="/website/services/:pillar" component={WebsiteServices} />}
      {!PLATFORM_ONLY && <Route path="/website/about" component={WebsiteAbout} />}
      {!PLATFORM_ONLY && <Route path="/website/contact" component={WebsiteContact} />}

      {/* Front door: corporate → marketing home; platform → product hub */}
      <Route path="/" component={PLATFORM_ONLY ? PlatformHome : WebsiteHome} />
      {/* Product-only front door — courses, Brain and DBP drawings audit */}
      <Route path="/home" component={PlatformHome} />
      <Route path="/system" component={LandingPage} />
      <Route path="/adm" component={AdmLanding} />
      <Route path="/action-manager" component={ActionManager} />
      <Route path="/iauditor" component={IauditorPage} />
      <Route path="/dbp-auditor" component={DbpAuditor} />
      <Route path="/drawing-analyser" component={DrawingAnalyser} />
      <Route path="/field" component={FieldInspector} />
      <Route path="/brain" component={LegislationBrain} />
      <Route path="/brains" component={LegislationBrain} />
      <Route path="/report-studio" component={ReportStudio} />
      <Route path="/training" component={TrainingPlatform} />
      <Route path="/training/:code" component={TrainingPlatform} />
      <Route path="/apartment-design-guide" component={ApartmentDesignGuide} />
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
