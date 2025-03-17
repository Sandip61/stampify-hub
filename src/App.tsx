
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

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
import History from "./pages/History";

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

// Layouts
import MainLayout from "./layouts/MainLayout";
import MerchantLayout from "./layouts/MerchantLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <MainLayout>
        <Home />
      </MainLayout>
    ),
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
    path: "/scan",
    element: (
      <MainLayout>
        <ScanQR />
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
  {
    path: "/history",
    element: (
      <MainLayout>
        <History />
      </MainLayout>
    ),
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
  // Merchant routes - all authentication requirements removed
  {
    path: "/merchant",
    element: (
      <MerchantLayout>
        <MerchantDashboard />
      </MerchantLayout>
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
      <MerchantLayout>
        <MerchantAnalytics />
      </MerchantLayout>
    ),
  },
  {
    path: "/merchant/cards",
    element: (
      <MerchantLayout>
        <MerchantCards />
      </MerchantLayout>
    ),
  },
  {
    path: "/merchant/cards/new",
    element: (
      <MerchantLayout>
        <MerchantCardForm />
      </MerchantLayout>
    ),
  },
  {
    path: "/merchant/cards/edit/:id",
    element: (
      <MerchantLayout>
        <MerchantCardForm />
      </MerchantLayout>
    ),
  },
  {
    path: "/merchant/cards/:id/manage",
    element: (
      <MerchantLayout>
        <StampManagement />
      </MerchantLayout>
    ),
  },
  {
    path: "/merchant/customers",
    element: (
      <MerchantLayout>
        <MerchantCustomers />
      </MerchantLayout>
    ),
  },
  {
    path: "/merchant/settings",
    element: (
      <MerchantLayout>
        <MerchantSettings />
      </MerchantLayout>
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
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
