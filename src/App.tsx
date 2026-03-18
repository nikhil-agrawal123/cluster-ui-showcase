import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import ClusterPage from "./pages/ClusterPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import ModerationPage from "./pages/ModerationPage";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import ExplorePage from "./pages/ExplorePage";
import PopularPage from "./pages/PopularPage";
import SavedPage from "./pages/SavedPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/feed" element={<Home />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/popular" element={<PopularPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/cluster" element={<ClusterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/moderation" element={<ModerationPage />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

