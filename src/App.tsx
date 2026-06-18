import { Routes, Route } from "react-router";
import Dashboard from "./pages/Dashboard";
import Escaner from "./pages/Escaner";
import Personas from "./pages/Personas";
import Transportistas from "./pages/Transportistas";
import Historial from "./pages/Historial";
import VerQR from "./pages/VerQR";
import Equipo from "./pages/Equipo";
import Checador from "./pages/Checador";
import Layout from "./components/Layout";

export default function App() {
  return (
    <Routes>
      {/* Checador - pagina simple solo escaneo */}
      <Route path="/checador" element={<Checador />} />

      {/* Admin - todo lo demas con layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/escaner" element={<Escaner />} />
        <Route path="/personas" element={<Personas />} />
        <Route path="/transportistas" element={<Transportistas />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/equipo" element={<Equipo />} />
        <Route path="/qr/:id" element={<VerQR />} />
      </Route>
    </Routes>
  );
}
