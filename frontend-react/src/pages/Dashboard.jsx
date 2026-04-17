import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarResumen();
  }, []);

  const cargarResumen = async () => {
    try {
      const data = await dashboardAPI.getResumen();
      setResumen(data);
      setError('');
    } catch (err) {
      setError('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleExportXLS = () => {
    if (!resumen) return;

    const worksheetData = [
      ["REPORTE BI - GESTIÓN OPERACIONAL IMPOKONRAD"],
      ["Generado el:", new Date().toLocaleString()],
      [""],
      ["INDICADOR", "VALOR"],
      ["Bodegas Activas", resumen.bodegas || 0],
      ["Contenedores Registrados", resumen.contenedores || 0],
      ["Facturas Procesadas (Total)", resumen.facturas?.total || 0],
      ["Facturas Pendientes", resumen.facturas?.pendientes || 0],
      ["Monto Financiero Procesado (USD)", resumen.facturas?.monto_total || 0],
      ["Usuarios Activos", resumen.usuarios || 0],
      ["Tasa de Eficiencia (Fija)", "98.4%"],
      ["Índice Fletes FBX (Fijo)", "$2,840"]
    ];

    worksheetData.push([""]);
    worksheetData.push(["RESUMEN DE CONTENEDORES POR ESTADO", "CANTIDAD"]);
    if (resumen.contenedores_por_estado && resumen.contenedores_por_estado.length > 0) {
      resumen.contenedores_por_estado.forEach(item => {
        worksheetData.push([item.estado.replace(/_/g, ' ').toUpperCase(), item.cantidad]);
      });
    } else {
        worksheetData.push(["Sin contenedores en BD", 0]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Métricas_Operativas");
    
    // Ajustar anchura de columnas
    worksheet['!cols'] = [{ wch: 40 }, { wch: 20 }];

    XLSX.writeFile(workbook, "Reporte_BI_IMPOKONRAD.xlsx");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[10px] uppercase tracking-widest text-primary animate-pulse font-bold">Iniciando módulos de Inteligencia...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-error/10 border border-error/50 rounded-lg text-error text-center font-bold text-sm uppercase tracking-widest">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 w-full text-left">
      {/* Resumen Financiero */}
      <div className="col-span-12 lg:col-span-8 emerald-gradient-bg border border-primary/20 p-8 rounded-xl relative overflow-hidden flex flex-col justify-between h-[400px]">
        <div className="relative z-10">
          <span className="text-[0.7rem] uppercase tracking-[0.2em] text-primary font-bold m-0">Resumen Financiero Total</span>
          <h3 className="text-5xl font-extrabold tracking-tighter mt-4 text-on-surface m-0">
            <span className="text-primary">$</span>
            {resumen?.facturas?.monto_total?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </h3>
          <p className="text-on-surface-variant text-sm max-w-xs mt-2 m-0">
            Facturas procesadas globales en dólares. El sistema generativo IA administra un total de {resumen?.facturas?.total || 0} recibos activos.
          </p>
        </div>
        
        {/* Visualización de Datos Personalizada: Gráfico de Línea Abstracto */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 400">
            <path d="M0,300 Q200,100 400,250 T800,150 L800,400 L0,400 Z" fill="url(#grad1)"></path>
            <defs>
              <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 1 }}></stop>
                <stop offset="100%" style={{ stopColor: '#020617', stopOpacity: 0 }}></stop>
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="relative z-10 flex gap-4">
          <div className="bg-surface-container-lowest/50 border border-primary/10 backdrop-blur-md p-4 rounded-lg flex-1">
            <p className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant mb-1 m-0">Total Facturas</p>
            <p className="text-xl font-bold text-on-surface m-0">{resumen?.facturas?.total || 0} <span className="text-xs font-normal text-on-surface-variant">Docs</span></p>
          </div>
          <div className="bg-surface-container-lowest/50 border border-primary/10 backdrop-blur-md p-4 rounded-lg flex-1">
            <p className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant mb-1 m-0">Pendientes</p>
            <p className="text-xl font-bold text-on-surface m-0">{resumen?.facturas?.pendientes || 0} <span className="text-xs font-normal text-on-surface-variant">Docs</span></p>
          </div>
          <div className="bg-surface-container-lowest/50 border border-primary/10 backdrop-blur-md p-4 rounded-lg flex-1">
            <p className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant mb-1 m-0">Usuarios Activos</p>
            <p className="text-xl font-bold text-on-surface m-0">{resumen?.usuarios || 0} <span className="text-xs font-normal text-on-surface-variant">Personas</span></p>
          </div>
        </div>
      </div>

      {/* Contenedores Por Estado */}
      <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-8 rounded-xl border border-outline flex flex-col justify-between h-[400px]">
        <div className="flex-1 overflow-auto pr-2">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-bold text-on-surface uppercase tracking-tight m-0">Contenedores por Estado</h3>
            <span className="bg-primary/10 text-primary text-[0.6rem] font-bold px-2 py-1 rounded uppercase tracking-wider border border-primary/20">En vivo</span>
          </div>
          
          <div className="space-y-6">
            {resumen?.contenedores_por_estado && resumen.contenedores_por_estado.length > 0 ? (
              resumen.contenedores_por_estado.map((item, index) => {
                const colors = ['bg-primary', 'bg-tertiary', 'bg-secondary', 'bg-primary-container'];
                const color = colors[index % colors.length];
                return (
                  <div key={index} className="flex gap-4 items-center">
                    <div className={`w-1 h-8 ${color} rounded-full`}></div>
                    <div>
                      <p className="text-sm font-bold text-on-surface capitalize m-0">{item.estado?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-on-surface-variant mt-1 m-0">{item.cantidad} Contenedores registrados.</p>
                    </div>
                  </div>
                );
              })
            ) : (
               <p className="text-xs text-on-surface-variant italic">No hay contenedores registrados en la base de datos.</p>
            )}
          </div>
        </div>
        
        <div className="mt-4 pt-6 border-t border-outline">
          <a href="/contenedores" className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors no-underline">
            Gestionar Contenedores
            <span className="material-symbols-outlined text-sm">inventory_2</span>
          </a>
        </div>
      </div>

      {/* Métricas de Activos */}
      <div className="col-span-12 bg-surface-container-low p-8 rounded-xl border border-outline">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-[0.7rem] uppercase tracking-[0.2em] text-on-surface-variant font-bold m-0">Gestión Operacional</span>
            <h3 className="text-2xl font-extrabold text-on-surface mt-1 m-0">Métricas de Activos</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportXLS} className="px-4 py-2 bg-surface-container-lowest border border-outline text-xs font-bold uppercase rounded-lg hover:bg-surface-container-high transition-colors text-on-surface cursor-pointer">Exportar XLS</button>
            <button onClick={cargarResumen} className="px-4 py-2 bg-primary border-none text-on-primary text-xs font-bold uppercase rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer">Sincronizar</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Ticker 1 */}
          <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Bodegas</span>
              <span className="text-primary flex items-center text-xs font-bold">
                <span className="material-symbols-outlined text-sm">warehouse</span>
              </span>
            </div>
            <p className="text-2xl font-headline font-bold text-on-surface m-0">{resumen?.bodegas || 0}</p>
            <p className="text-[0.6rem] text-on-surface-variant uppercase mt-1 tracking-widest m-0">Instalaciones de Almacenamiento</p>
          </div>
          
          {/* Ticker 2 */}
          <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Contenedores</span>
              <span className="text-primary flex items-center text-xs font-bold">
                 <span className="material-symbols-outlined text-sm">inventory_2</span>
              </span>
            </div>
            <p className="text-2xl font-headline font-bold text-on-surface m-0">{resumen?.contenedores || 0}</p>
            <p className="text-[0.6rem] text-on-surface-variant uppercase mt-1 tracking-widest m-0">Unidades Totales</p>
          </div>
          
          {/* Ticker 3 */}
          <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tasa de Eficiencia</span>
              <span className="text-primary flex items-center text-xs font-bold">
                <span className="material-symbols-outlined text-sm">trending_up</span> 2.1%
              </span>
            </div>
            <p className="text-2xl font-headline font-bold text-on-surface m-0">98.4%</p>
            <p className="text-[0.6rem] text-on-surface-variant uppercase mt-1 tracking-widest m-0">Promedio de Carga</p>
          </div>
          
          {/* Ticker 4 */}
          <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Índice Fletes (FBX)</span>
              <span className="text-on-surface flex items-center text-xs font-bold">
                <span className="material-symbols-outlined text-sm">horizontal_rule</span> 0.0%
              </span>
            </div>
            <p className="text-2xl font-headline font-bold text-on-surface m-0">$2,840</p>
            <p className="text-[0.6rem] text-on-surface-variant uppercase mt-1 tracking-widest m-0">Promedio Global Por 40ft</p>
          </div>
        </div>
      </div>

      {/* Tendencias de Volumen y Predicciones */}
      <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest p-8 rounded-xl border border-outline shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-bold text-on-surface uppercase tracking-tight m-0">Tendencias de Volumen y Predicciones</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary-container"></span>
              <span className="text-[0.65rem] uppercase tracking-widest font-bold">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary"></span>
              <span className="text-[0.65rem] uppercase tracking-widest font-bold">Predicción IA</span>
            </div>
          </div>
        </div>

        {/* Gráfico de Barras Esmeralda */}
        <div className="h-64 flex items-end gap-3 px-4">
          <div className="flex-1 bg-surface-container-high h-[40%] rounded-t group relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-primary text-on-primary text-[10px] px-2 py-1 rounded transition-opacity">ENE: 12.4k</div>
          </div>
          <div className="flex-1 bg-surface-container-high h-[55%] rounded-t group relative"></div>
          <div className="flex-1 bg-surface-container-high h-[45%] rounded-t group relative"></div>
          <div className="flex-1 bg-surface-container-high h-[70%] rounded-t group relative"></div>
          <div className="flex-1 bg-surface-container-high h-[85%] rounded-t group relative"></div>
          <div className="flex-1 bg-primary-container h-[95%] rounded-t group relative"></div>
          <div className="flex-1 bg-primary h-[98%] rounded-t group relative border-t-4 border-white/20">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] px-2 py-1 rounded font-bold">PROY: 24.1k</div>
          </div>
          <div className="flex-1 bg-primary/40 h-[92%] rounded-t group relative"></div>
        </div>
        <div className="flex justify-between mt-4 px-4 text-[0.6rem] uppercase tracking-widest text-on-surface-variant font-bold">
          <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span><span className="text-primary">Jul</span><span className="text-primary/50">Ago</span>
        </div>
      </div>

      {/* Matriz de Eficiencia de Rutas / Accesos directos reales */}
      <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest p-8 rounded-xl border border-outline relative overflow-hidden flex flex-col">
        <h3 className="text-lg font-bold text-on-surface uppercase tracking-tight mb-6 m-0">Módulos Inteligentes</h3>
        <div className="space-y-4 flex-1">
          {/* Módulo 1 */}
          <a href="/tracking" className="p-4 bg-surface-container-low rounded-lg flex items-center justify-between border border-outline hover:border-primary/50 transition-colors no-underline group cursor-pointer block">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">explore</span>
              <div>
                <p className="text-sm font-bold text-on-surface m-0 group-hover:text-primary transition-colors">Sistema de Rastreo</p>
                <p className="text-[0.6rem] text-on-surface-variant uppercase tracking-widest m-0 mt-1">Ubicación GPS Global</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary m-0">100% OP</p>
              <p className="text-[0.6rem] text-on-surface-variant uppercase m-0">En línea</p>
            </div>
          </a>
          
          {/* Módulo 2 */}
          <a href="/ia-contable" className="p-4 bg-surface-container-low rounded-lg flex items-center justify-between border border-outline hover:border-secondary/50 transition-colors no-underline group cursor-pointer block">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-secondary text-3xl group-hover:scale-110 transition-transform">psychology</span>
              <div>
                <p className="text-sm font-bold text-on-surface m-0 group-hover:text-secondary transition-colors">Agente Contable IA</p>
                <p className="text-[0.6rem] text-on-surface-variant uppercase tracking-widest m-0 mt-1">Lector Inteligente de Facturas</p>
              </div>
            </div>
            <div className="text-right">
               <p className="text-sm font-bold text-secondary m-0">ACTIVO</p>
               <p className="text-[0.6rem] text-on-surface-variant uppercase m-0">Procesando</p>
            </div>
          </a>
          
          {/* Módulo 3 */}
          <a href="/facturas" className="p-4 bg-surface-container-low rounded-lg flex items-center justify-between border border-outline hover:border-primary-container/50 transition-colors no-underline group cursor-pointer block">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">receipt_long</span>
              <div>
                <p className="text-sm font-bold text-on-surface m-0 group-hover:text-primary transition-colors">Centro de Facturas</p>
                <p className="text-[0.6rem] text-on-surface-variant uppercase tracking-widest m-0 mt-1">Documentos Financieros</p>
              </div>
            </div>
            <div className="text-right">
               <p className="text-sm font-bold text-primary m-0">{resumen?.facturas?.pendientes || '0'} PEND</p>
               <p className="text-[0.6rem] text-on-surface-variant uppercase m-0">Por Revisar</p>
            </div>
          </a>
        </div>
        
        <div className="absolute bottom-[-10px] right-[-10px] w-32 h-32 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-[10rem]">language</span>
        </div>
      </div>
    </div>
  );
}
