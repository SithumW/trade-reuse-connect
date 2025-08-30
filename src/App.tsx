import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Auth } from "./pages/Auth";
import { Marketplace } from "./pages/Marketplace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<"landing" | "auth" | "marketplace">("landing");

  const handleLogin = (userData: any) => {
    setUser(userData);
    setCurrentView("marketplace");
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("landing");
  };

  const handleGetStarted = () => {
    setCurrentView("auth");
  };

  const handleBackToLanding = () => {
    setCurrentView("landing");
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "auth":
        return <Auth onLogin={handleLogin} onBack={handleBackToLanding} />;
      case "marketplace":
        return <Marketplace user={user} onLogout={handleLogout} />;
      default:
        return <Landing onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={renderCurrentView()} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
