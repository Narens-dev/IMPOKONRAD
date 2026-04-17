import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Paneles BI', icon: 'analytics' },
    { path: '/ia-contable', label: 'IA Contable', icon: 'psychology' },
    { path: '/tracking', label: 'Rastreo de Rutas', icon: 'explore' },
    { path: '/contenedores', label: 'Contenedores', icon: 'inventory_2' },
    { path: '/bodegas', label: 'Bodegas', icon: 'warehouse' },
    { path: '/facturas', label: 'Facturas', icon: 'receipt_long' },
    { path: '/manifiestos', label: 'Manifiestos', icon: 'description' },
  ];

  const currentMenuLabel = menuItems.find(item => item.path === location.pathname)?.label || 'IMPOKONRAD';
  const currentMenuSubLabel = location.pathname === '/dashboard' ? 'Supervisión logística global en tiempo real y modelado predictivo' : 'Gestión y control de módulo activo';

  return (
    <div className="dashboard-theme flex min-h-screen">
      {/* Navegación Lateral */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest border-r border-outline-variant flex flex-col z-40 transition-all text-left">
        <div className="px-6 py-8">
          <h1 className="text-xl font-extrabold text-primary tracking-tight uppercase m-0">ImpoKonrad BI</h1>
          <p className="text-[0.65rem] uppercase tracking-[0.1em] text-on-surface-variant mt-1 m-0">Centro de Control Administrativo</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto w-full">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={isActive
                  ? 'text-primary bg-primary/10 border-l-4 border-primary px-4 py-3 flex items-center gap-3 rounded-r-lg no-underline'
                  : 'text-on-surface-variant px-4 py-3 flex items-center gap-3 hover:bg-surface-container-high hover:text-primary transition-all duration-200 rounded-lg group no-underline'
                }
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span className="text-sm uppercase tracking-wider font-bold m-0">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="px-6 py-6 w-full text-left">
          <button onClick={handleLogout} className="w-full bg-surface-container-highest text-on-surface hover:text-error hover:bg-error/10 py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer border-none border-outline-variant">
            <span className="material-symbols-outlined text-sm">logout</span> 
            <span>Cerrar Sesión</span>
          </button>
        </div>
        
        {/* Pulso del Mercado Footer */}
        <div className="mt-auto border-t border-outline-variant p-4 space-y-3 w-full text-left">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">currency_exchange</span>
            <span className="text-[0.7rem] uppercase tracking-wider m-0">Mercado: USD/EUR 0.92</span>
          </div>
          <div className="flex items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">show_chart</span>
            <span className="text-[0.7rem] uppercase tracking-wider m-0">S&P 500: +1.2%</span>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="ml-64 flex-1 min-h-screen p-8 bg-background relative">
        {/* Barra Superior */}
        <header className="flex justify-between items-center mb-10">
          <div className="text-left">
            <h2 className="text-3xl font-extrabold text-on-surface tracking-tight m-0">{currentMenuLabel}</h2>
            <p className="text-on-surface-variant text-sm mt-1 m-0">{currentMenuSubLabel}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-surface-container-low border border-outline px-4 py-2 rounded-lg">
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
              <input 
                type="text" 
                placeholder="Buscar manifiesto..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-48 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-4 text-left">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary m-0">Usuario Admin</p>
                <p className="text-[0.65rem] text-on-surface-variant m-0">Director de Operaciones</p>
              </div>
              <img 
                alt="Avatar de Usuario" 
                className="w-10 h-10 rounded-lg border border-primary/30 object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsb7BQaOy_MD1EDPvc_GjhMmmwdg1zWqZJrXaejZ5EiK2xsuQe43Q3XooConcPYdDYqBbeQqV24jLyli-yOaZ_ROyohpPACT-KdNwsJQasrGR8ppc_XgP7fbHMdwkOcCNoW5ELVPGrXN6gHwth1xENW7mQKxyIL7flgDP9STQfe5z99skLukPXWzJvhreYvBhZe7affUayZhU8qs5jZcKBVKtmhVpzNkYxfTNoeVaJSHB7SlLAiQiTthUzPPLTEjp4MGIt8RNLEws"
              />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="w-full text-left">
          <Outlet />
        </div>

        {/* Pulso Flotante del Sistema */}
        <div className="fixed bottom-10 right-10 bg-primary-container text-on-primary-container p-4 rounded-full shadow-2xl flex items-center gap-4 border border-primary/20 dashboard-glass-panel">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#10B981]"></div>
          <div className="pr-4 text-left">
            <p className="text-[0.6rem] uppercase tracking-widest text-primary leading-none font-bold m-0">Pulso del Sistema en Vivo</p>
            <p className="text-xs font-bold mt-1 text-on-surface m-0">4 Nodos Procesando Optimización</p>
          </div>
          <button className="bg-primary/20 hover:bg-primary/30 p-2 rounded-full cursor-pointer transition-colors border-none flex items-center justify-center">
            <span className="material-symbols-outlined text-sm text-primary">refresh</span>
          </button>
        </div>
      </main>
    </div>
  );
}
