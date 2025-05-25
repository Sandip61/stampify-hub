import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { RoleProvider } from "./contexts/RoleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { UserRole } from "./integrations/supabase/client";

// Pages
import Home from "./pages/Home";
import Cards from "./pages/Cards";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StampCardDetail from "./pages/StampCardDetail";
import Profile from "./pages/Profile";
import Transactions from "./pages/Transactions";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ScanQR from "./pages/ScanQR";
import Dashboard from "./pages/Dashboard";
import AllBusinesses from "./pages/AllBusinesses";

// Merchant Pages
import MerchantDashboard from "./pages/merchant/Dashboard";
import MerchantCards from "./pages/merchant/Cards";
import MerchantCustomers from "./pages/merchant/Customers";
import MerchantSettings from "./pages/merchant/Settings";
import MerchantCardForm from "./pages/merchant/CardForm";
import StampManagement from "./pages/merchant/StampManagement";
import MerchantLogin from "./pages/merchant/Login";
import MerchantRegister from "./pages/merchant/Register";
import MerchantSignup from "./pages/merchant/Signup";
import MerchantResetPassword from "./pages/merchant/ResetPassword";
import MerchantAnalytics from "./pages/merchant/Analytics";
import MerchantProfile from "./pages/merchant/Profile";
import MerchantHistory from "./pages/merchant/History";

// Layouts
import MainLayout from "./layouts/MainLayout";
import MerchantLayout from "./layouts/MerchantLayout";

const router = createBrowserRouter([
  // Home redirects to customer home
  {
    path: "/",
    element: <Home />,
  },

  // Customer routes
  {
    path: "/customer",
    element: (
      <ProtectedRoute roleType={UserRole.CUSTOMER}>
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/customer/businesses",
    element: (
      <ProtectedRoute roleType={UserRole.CUSTOMER}>
        <MainLayout>
          <AllBusinesses />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/customer/scan-qr",
    element: (
      <ProtectedRoute roleType={UserRole.CUSTOMER}>
        <ScanQR />
      </ProtectedRoute>
    ),
  },
  {
    path: "/customer/login",
    element: (
      <MainLayout hideNav>
        <Login />
      </MainLayout>
    ),
  },
  {
    path: "/customer/register",
    element: (
      <MainLayout hideNav>
        <Register />
      </MainLayout>
    ),
  },
  {
    path: "/customer/signup",
    element: (
      <MainLayout hideNav>
        <Register />
      </MainLayout>
    ),
  },
  {
    path: "/customer/reset-password",
    element: (
      <MainLayout hideNav>
        <ResetPassword />
      </MainLayout>
    ),
  },
  {
    path: "/customer/card/:id",
    element: (
      <ProtectedRoute roleType={UserRole.CUSTOMER}>
        <MainLayout>
          <StampCardDetail />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/customer/cards",
    element: (
      <ProtectedRoute roleType={UserRole.CUSTOMER}>
        <MainLayout>
          <Cards />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/customer/transactions",
    element: (
      <ProtectedRoute roleType={UserRole.CUSTOMER}>
        <MainLayout>
          <Transactions />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/customer/profile",
    element: (
      <ProtectedRoute roleType={UserRole.CUSTOMER}>
        <MainLayout>
          <Profile />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  
  // Legacy customer routes (redirect to new paths)
  {
    path: "/scan-qr",
    element: <ScanQR />,
  },
  {
    path: "/login",
    element: (
      <MainLayout hideNav>
        <Login />
      </MainLayout>
    ),
  },
  {
    path: "/register",
    element: (
      <MainLayout hideNav>
        <Register />
      </MainLayout>
    ),
  },
  {
    path: "/signup",
    element: (
      <MainLayout hideNav>
        <Register />
      </MainLayout>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <MainLayout hideNav>
        <ResetPassword />
      </MainLayout>
    ),
  },
  {
    path: "/card/:id",
    element: (
      <MainLayout>
        <StampCardDetail />
      </MainLayout>
    ),
  },
  {
    path: "/cards",
    element: (
      <MainLayout>
        <Cards />
      </MainLayout>
    ),
  },
  // Redirect /history to /transactions
  {
    path: "/history",
    element: <Navigate to="/transactions" replace />,
  },
  {
    path: "/profile",
    element: (
      <MainLayout>
        <Profile />
      </MainLayout>
    ),
  },
  {
    path: "/transactions",
    element: (
      <MainLayout>
        <Transactions />
      </MainLayout>
    ),
  },
  
  // Merchant routes
  {
    path: "/merchant",
    element: (
      <ProtectedRoute roleType={UserRole.MERCHANT}>
        <MerchantLayout>
          <MerchantDashboard />
        </MerchantLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/merchant/login",
    element: (
      <MainLayout hideNav>
        <MerchantLogin />
      </MainLayout>
    ),
  },
  {
    path: "/merchant/register",
    element: (
      <MainLayout hideNav>
        <MerchantRegister />
      </MainLayout>
    ),
  },
  {
    path: "/merchant/signup",
    element: (
      <MainLayout hideNav>
        <MerchantSignup />
      </MainLayout>
    ),
  },
  {
    path: "/merchant/reset-password",
    element: (
      <MainLayout hideNav>
        <MerchantResetPassword />
      </MainLayout>
    ),
  },
  {
    path: "/merchant/analytics",
    element: (
      <ProtectedRoute roleType={UserRole.MERCHANT}>
        <MerchantLayout>
          <MerchantAnalytics />
        </MerchantLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/merchant/cards",
    element: (
      <ProtectedRoute roleType={UserRole.MERCHANT}>
        <MerchantLayout>
          <MerchantCards />
        </MerchantLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/merchant/cards/new",
    element: (
      <ProtectedRoute roleType={UserRole.MERCHANT}>
        <MerchantLayout>
          <MerchantCardForm />
        </MerchantLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/merchant/cards/edit/:id",
    element: (
      <ProtectedRoute roleType={UserRole.MERCHANT}>
        <MerchantLayout>
          <MerchantCardForm />
        </MerchantLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/merchant/cards/:id/manage",
    element: (
      <ProtectedRoute roleType={UserRole.MERCHANT}>
        <MerchantLayout>
          <StampManagement />
        </MerchantLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/merchant/customers",
    element: (
      <ProtectedRoute roleType={UserRole.MERCHANT}>
        <MerchantLayout>
          <MerchantCustomers />
        </MerchantLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/merchant/settings",
    element: (
      <ProtectedRoute roleType={UserRole.MERCHANT}>
        <MerchantLayout>
          <MerchantSettings />
        </MerchantLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/merchant/profile",
    element: (
      <ProtectedRoute roleType={UserRole.MERCHANT}>
        <MerchantLayout>
          <MerchantProfile />
        </MerchantLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/merchant/history",
    element: (
      <ProtectedRoute roleType={UserRole.MERCHANT}>
        <MerchantLayout>
          <MerchantHistory />
        </MerchantLayout>
      </ProtectedRoute>
    ),
  },
  // 404 catch-all route
  {
    path: "*",
    element: <NotFound />,
  },
]);

function App() {
  return (
    <RoleProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </RoleProvider>
  );
}

export default App;
