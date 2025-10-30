import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "./components/Layout";
import { ChatBubble } from "./components/ChatBubble";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import NotFound from "./pages/NotFound";
import GeoMatching from "./pages/GeoMatching";
import Ideas from "./pages/Ideas";
import Assistant from "./pages/Assistant";
import Leaderboard from "./pages/Leaderboard";
import Store from "./pages/Store";
import LiveTracking from "./pages/LiveTracking";
import Notifications from "./pages/Notifications";
import Receipts from "./pages/Receipts";
import RoutesPage from "./pages/Routes";
import ChatSettings from "./pages/ChatSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/bookings" element={<Layout><Bookings /></Layout>} />
            <Route path="/geo" element={<Layout><GeoMatching /></Layout>} />
            <Route path="/ideas" element={<Layout><Ideas /></Layout>} />
            <Route path="/assistant" element={<Layout><Assistant /></Layout>} />
            <Route path="/leaderboard" element={<Layout><Leaderboard /></Layout>} />
            <Route path="/store" element={<Layout><Store /></Layout>} />
            <Route path="/live" element={<Layout><LiveTracking /></Layout>} />
            <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
            <Route path="/receipts" element={<Layout><Receipts /></Layout>} />
            <Route path="/routes" element={<Layout><RoutesPage /></Layout>} />
            <Route path="/chat/settings" element={<Layout><ChatSettings /></Layout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
          <ChatBubble />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
