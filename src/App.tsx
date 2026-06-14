import { Routes, Route } from "react-router";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Escaner from "./pages/Escaner";
import Personas from "./pages/Personas";
import Transportistas from "./pages/Transportistas";
import Historial from "./pages/Historial";
import VerQR from "./pages/VerQR";
import Equipo from "./pages/Equipo";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/escaner" element={<Escaner />} />
        <Route path="/personas" element={<Personas />} />
        <Route path="/transportistas" element={<Transportistas />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/equipo" element={<Equipo />} />
        <Route path="/qr/:id" element={<VerQR />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
