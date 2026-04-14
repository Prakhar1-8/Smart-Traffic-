import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardHome from "@/pages/DashboardHome";
import VideoUpload from "@/pages/VideoUpload";
import LiveFeed from "@/pages/LiveFeed";
import Analytics from "@/pages/Analytics";
import Signals from "@/pages/Signals";
import Simulation from "@/pages/Simulation";
import Alerts from "@/pages/Alerts";

import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/upload-video" element={<VideoUpload />} />
            <Route path="/live-feed" element={<LiveFeed />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
