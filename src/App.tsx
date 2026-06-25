import { Route, Routes } from "react-router-dom";

import { ToastProvider } from "./components/Toast.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AdminLayout } from "./admin/AdminLayout.tsx";
import { Dashboard } from "./admin/Dashboard.tsx";
import { Inventory } from "./admin/Inventory.tsx";
import { Login } from "./admin/Login.tsx";
import { Logs } from "./admin/Logs.tsx";
import { Pos } from "./admin/Pos.tsx";
import { Prescriptions } from "./admin/Prescriptions.tsx";
import { Catalog } from "./site/Catalog.tsx";
import { Home } from "./site/Home.tsx";
import { MedicineDetail } from "./site/MedicineDetail.tsx";
import { PublicLayout } from "./site/PublicLayout.tsx";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/medicine/:id" element={<MedicineDetail />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="pos" element={<Pos />} />
              <Route path="prescriptions" element={<Prescriptions />} />
              <Route path="logs" element={<Logs />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
