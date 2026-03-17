import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import PowerRankings from "./pages/PowerRankings";
import LockerDiagram from "./pages/LockerDiagram";
import EmailHub from "./pages/EmailHub";
import Strategy from "./pages/Strategy";
import Training from "./pages/Training";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/members" component={Members} />
        <Route path="/power-rankings" component={PowerRankings} />
        <Route path="/lockers" component={LockerDiagram} />
        <Route path="/email" component={EmailHub} />
        <Route path="/strategy" component={Strategy} />
        <Route path="/training" component={Training} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
