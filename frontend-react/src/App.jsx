import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Layouts
import MainLayout from './layouts/MainLayout';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tracking from './pages/Tracking';
import Contenedores from './pages/Contenedores';
import Bodegas from './pages/Bodegas';
import Facturas from './pages/Facturas';
import Manifiestos from './pages/Manifiestos';
import IAContable from './pages/IAContable';
import Landing from './pages/Landing';

// Componente de ruta protegida
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública - Landing & Login */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas de la aplicación (Dashboard) */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/contenedores" element={<Contenedores />} />
          <Route path="/bodegas" element={<Bodegas />} />
          <Route path="/facturas" element={<Facturas />} />
          <Route path="/manifiestos" element={<Manifiestos />} />
          <Route path="/ia-contable" element={<IAContable />} />
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
