
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router";

import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import AcceptInvitation from "./pages/auth/AcceptInvitation";
import Login from "./pages/auth/Login";

import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import Worklist from "./pages/Worklist";
import Reports from "./pages/Reports";
import Staff from "./pages/Staff";

const pageInformation = {
  "/dashboard": {
    title: "Dashboard",
    description: "Radiology operations overview",
  },
  "/patients": {
    title: "Patients",
    description: "Patient registration and records",
  },
  "/appointments": {
    title: "Appointments",
    description: "Radiology appointment management",
  },
  "/worklist": {
    title: "Radiology Worklist",
    description: "Examination orders and worklist management",
  },
  "/reports": {
    title: "Radiology Reports",
    description: "Report creation and review",
  },
  "/staff": {
    title: "Staff Management",
    description: "Staff accounts and invitations",
  },
};

function AppLayout() {
  const location = useLocation();

  const currentPage =
    pageInformation[location.pathname] ||
    pageInformation["/dashboard"];

  return (
    <div className="flex min-h-screen flex-col bg-page md:flex-row">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={currentPage.title}
          description={currentPage.description}
        />

        <main className="w-full flex-1 p-5 md:p-8">
          <div className="mx-auto max-w-[1500px]">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-line bg-surface px-6 py-4">
          <p className="text-center text-xs text-muted">
            RIS MVP · Radiology Information System
          </p>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public authentication routes */}
        <Route path="/login" element={<Login />} />

        <Route
          path="/accept-invitation"
          element={<AcceptInvitation />}
        />

        {/* Protected application routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/patients"
            element={<Patients />}
          />

          <Route
            path="/appointments"
            element={<Appointments />}
          />

          <Route
            path="/worklist"
            element={<Worklist />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/staff"
            element={<Staff />}
          />
        </Route>

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
