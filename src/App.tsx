
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import StampCardDetail from "./pages/StampCardDetail";
import History from "./pages/History";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Merchant routes
import MerchantLayout from "./pages/merchant/Layout";
import MerchantLogin from "./pages/merchant/Login";
import MerchantSignup from "./pages/merchant/Signup";
import MerchantForgotPassword from "./pages/merchant/ForgotPassword";
import MerchantDashboard from "./pages/merchant/Dashboard";
import MerchantCards from "./pages/merchant/Cards";
import MerchantCardForm from "./pages/merchant/CardForm";
import MerchantCustomers from "./pages/merchant/Customers";
import MerchantAnalytics from "./pages/merchant/Analytics";
import MerchantSettings from "./pages/merchant/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Customer routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/" element={<Navigation />}>
            <Route path="/cards" element={<Index />} />
            <Route path="/card/:id" element={<StampCardDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Merchant routes */}
          <Route path="/merchant" element={<MerchantLayout />}>
            <Route index element={<MerchantDashboard />} />
            <Route path="cards" element={<MerchantCards />} />
            <Route path="cards/new" element={<MerchantCardForm />} />
            <Route path="cards/edit/:id" element={<MerchantCardForm />} />
            <Route path="customers" element={<MerchantCustomers />} />
            <Route path="analytics" element={<MerchantAnalytics />} />
            <Route path="settings" element={<MerchantSettings />} />
          </Route>
          <Route path="/merchant/login" element={<MerchantLogin />} />
          <Route path="/merchant/signup" element={<MerchantSignup />} />
          <Route path="/merchant/forgot-password" element={<MerchantForgotPassword />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
