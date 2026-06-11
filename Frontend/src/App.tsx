import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardHome from "@/pages/DashboardHome";
import LandingPage from "@/pages/LandingPage";
import VideoUpload from "@/pages/VideoUpload";
import LiveFeed from "@/pages/LiveFeed";
import Analytics from "@/pages/Analytics";
import Signals from "@/pages/Signals";
import Simulation from "@/pages/Simulation";
import Alerts from "@/pages/Alerts";
import Profile from "@/pages/Profile";
import Signup from "@/pages/Signup";

import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<LandingPage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/upload-video" element={<VideoUpload />} />
            <Route path="/live-feed" element={<LiveFeed />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
