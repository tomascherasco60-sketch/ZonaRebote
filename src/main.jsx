// src/main.jsx 

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; 

// Importaciones de React Router DOM
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importa el componente de la "nueva página" de gestión
import AdminPanel from './components/AdminPanel.jsx'; 
import AdminLogin from './components/AdminLogin.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Envolvemos toda la aplicación en el Router */}
    <Router>
        {/* Definimos las URLs */}
        <Routes>
            {/* RUTA PRINCIPAL: La tienda (URL: /) */}
            <Route path="/" element={<App />} />
            
            {/* RUTAS DE ADMINISTRACIÓN */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            {/* Legacy single-panel route kept for compatibility */}
            <Route path="/admin/panel" element={<AdminPanel />} />
        </Routes>
    </Router>
  </React.StrictMode>,
);
import { registerServiceWorker } from './serviceWorkerRegistration';

registerServiceWorker();
