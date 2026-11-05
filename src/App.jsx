import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";

/* ================= LAYOUT ================= */
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import WhatsAppButton from "./components/common/WhatsAppButton";
import NotificationContainer from "./components/common/NotificationContainer";
import ScrollToTop from "./components/ScrollToTop";

/* ================= PUBLIC PAGES ================= */
import HomePage from "./pages/HomePage";
import CarsListingPage from "./pages/CarsListingPage";
import CarDetailPage from "./pages/CarDetailPage";
import SearchPage from "./pages/SearchPage";
import AboutPage from "./pages/AboutPage";
import FAQPage from "./pages/FAQPage";
import HowToBuyPage from "./pages/HowToBuyPage";
import PurchasingPage from "./pages/PurchasingPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";

/* ================= ADMIN ================= */
import ProtectedRoute, { RequirePermission } from "./utils/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";

/* ================= ADMIN COMPONENTS ================= */
import AddCarForm from "./components/admin/AddCarForm";
import Listingstable from "./components/admin/Listingstable";
import MessagesPanel from "./components/admin/MessagesPanel";
import EditCarForm from "./components/admin/EditCarForm";
import DashboardStats from "./components/admin/DashboardStats";
import OrdersPanel from "./components/admin/OrdersPanel";
import ShippingRatesPanel from "./components/admin/ShippingRatesPanel";
import AdminUsersPanel from "./components/admin/AdminUsersPanel";
import AccountPanel from "./components/admin/AccountPanel";
import CustomersPanel from "./components/admin/CustomersPanel";
import CustomerDetail from "./components/admin/CustomerDetail";
import CarCostsPanel from "./components/admin/CarCostsPanel";
import PaymentsPanel from "./components/admin/PaymentsPanel";
import ShipmentsPanel from "./components/admin/ShipmentsPanel";
import ImportDutiesPanel from "./components/admin/ImportDutiesPanel";
import { PageHeader } from "./components/admin/ui";
import { useAdmin } from "./context/AdminAuthContext";

/* ================= ADMIN DASHBOARD HOME ================= */
function DashboardHome() {
  const { admin } = useAdmin();
  const firstName = (admin?.name || "").split(" ")[0];
  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        subtitle={`${firstName ? `Welcome back, ${firstName}. ` : ""}Here is how your business is doing.`}
      />
      <DashboardStats />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 min-w-0">
          <Listingstable compact />
        </div>
        <div className="min-w-0">
          <MessagesPanel compact />
        </div>
      </div>
    </div>
  );
}

/* ================= APP CONTENT ================= */
function AppContent() {
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";
  const isAdminPage = location.pathname.startsWith("/admin");
  const showLayout = !isLoginPage && !isAdminPage;

  return (
    <div className="min-h-screen flex flex-col">
      {showLayout && <Navbar />}

      <main className="flex-1 min-w-0 w-full">
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<HomePage />} />
          <Route path="/cars" element={<CarsListingPage />} />
          <Route path="/cars/:id" element={<CarDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/how-to-buy" element={<HowToBuyPage />} />
          <Route path="/purchasing" element={<PurchasingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="cars" element={<Listingstable />} />
            <Route path="cars/new" element={<RequirePermission perm="cars.create"><AddCarForm /></RequirePermission>} />
            <Route path="cars/edit/:id" element={<RequirePermission perm="cars.edit"><EditCarForm /></RequirePermission>} />
            <Route path="orders" element={<OrdersPanel />} />
            <Route path="shipping" element={<ShippingRatesPanel />} />
            <Route path="messages" element={<MessagesPanel />} />
            <Route path="users" element={<RequirePermission perm="users.manage"><AdminUsersPanel /></RequirePermission>} />
            <Route path="account" element={<AccountPanel />} />
            <Route path="customers" element={<RequirePermission perm="customers.view"><CustomersPanel /></RequirePermission>} />
            <Route path="customers/:id" element={<RequirePermission perm="customers.view"><CustomerDetail /></RequirePermission>} />
            <Route path="cars/:id/costs" element={<RequirePermission perm="finance.view"><CarCostsPanel /></RequirePermission>} />
            <Route path="payments" element={<RequirePermission perm="finance.view"><PaymentsPanel /></RequirePermission>} />
            <Route path="import-duties" element={<ImportDutiesPanel />} />
            <Route path="shipments" element={<RequirePermission perm="shipments.view"><ShipmentsPanel /></RequirePermission>} />
          </Route>
        </Routes>
      </main>

      {showLayout && <Footer />}
      {showLayout && <WhatsAppButton />}

      <NotificationContainer />
    </div>
  );
}

/* ================= ROOT APP ================= */
export default function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppContent />
      </BrowserRouter>
    </NotificationProvider>
  );
}