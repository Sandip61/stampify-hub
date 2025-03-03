import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StampCardDetail from "./pages/StampCardDetail";
import Profile from "./pages/Profile";
import Transactions from "./pages/Transactions";
import ResetPassword from "./pages/ResetPassword";

// Merchant Pages
import MerchantLogin from "./pages/merchant/Login";
import MerchantRegister from "./pages/merchant/Register";
import MerchantDashboard from "./pages/merchant/Dashboard";
import MerchantCards from "./pages/merchant/Cards";
import MerchantCustomers from "./pages/merchant/Customers";
import MerchantSettings from "./pages/merchant/Settings";
import MerchantCardForm from "./pages/merchant/CardForm";
import MerchantResetPassword from "./pages/merchant/ResetPassword";
import StampManagement from "./pages/merchant/StampManagement";

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
    path: "/merchant/login",
    element: <MerchantLogin />,
  },
  {
    path: "/merchant/register",
    element: <MerchantRegister />,
  },
  {
    path: "/merchant/reset-password",
    element: <MerchantResetPassword />,
  },
  {
    path: "/merchant",
    element: (
      <MerchantLayout>
        <MerchantDashboard />
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
