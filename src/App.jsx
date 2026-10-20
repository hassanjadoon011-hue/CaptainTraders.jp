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
import ProtectedRoute from "./utils/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";

/* ================= ADMIN COMPONENTS ================= */
import AddCarForm from "./components/admin/AddCarForm";
import Listingstable from "./components/admin/Listingstable";
import MessagesPanel from "./components/admin/MessagesPanel";
import EditCarForm from "./components/admin/EditCarForm";
import DashboardStats from "./components/admin/DashboardStats";

/* ================= ADMIN DASHBOARD HOME ================= */
function DashboardHome() {
  return (
    <>
      <DashboardStats />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 min-w-0">
          <Listingstable />
        </div>
        <div className="min-w-0">
          <MessagesPanel />
        </div>
      </div>
    </>
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

      <main className="flex-1">
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
            <Route path="cars/new" element={<AddCarForm />} />
            <Route path="cars/edit/:id" element={<EditCarForm />} />
            <Route path="messages" element={<MessagesPanel />} />
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