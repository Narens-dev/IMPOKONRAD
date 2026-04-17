import { useState, useEffect } from 'react';
import { bodegasAPI } from '../services/api';

const API_BASE = 'http://localhost:8000';
const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

async function fetchContenedoresBodega(bodegaId) {
  const res = await fetch(`${API_BASE}/bodegas/${bodegaId}/contenedores`, { headers: getHeaders() });
  if (!res.ok) return [];
  return res.json();
}

async function patchCapacidadBodega(bodegaId, capacidad_actual) {
  const res = await fetch(`${API_BASE}/bodegas/${bodegaId}?capacidad_actual=${capacidad_actual}`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Error al actualizar');
  return res.json();
}

export default function Bodegas() {
  const [bodegas, setBodegas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', ubicacion: '', capacidad_maxima: 1000 });

  // Estado del modal de auditoría
  const [auditoriaModal, setAuditoriaModal] = useState(false);
  const [bodegaAuditada, setBodegaAuditada] = useState(null);
  const [contenedoresBodega, setContenedoresBodega] = useState([]);
  const [nuevaCapacidad, setNuevaCapacidad] = useState('');
  const [auditandoLoading, setAuditandoLoading] = useState(false);
  const [auditMsg, setAuditMsg] = useState('');

  useEffect(() => {
    cargarBodegas();
  }, []);

  const cargarBodegas = async () => {
    setLoading(true);
    try {
      const data = await bodegasAPI.getAll();
      setBodegas(data);
      setError('');
    } catch (err) {
      setError('Error de Red: Nódos de almacenamiento inaccesibles.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await bodegasAPI.create(formData);
      setShowModal(false);
      setFormData({ nombre: '', ubicacion: '', capacidad_maxima: 1000 });
      await cargarBodegas();
    } catch (err) {
      setError('Backend Falló: No se pudo guardar el registro en DB.');
      setLoading(false);
    }
  };

  const abrirAuditoria = async (bodega) => {
    setBodegaAuditada(bodega);
    setNuevaCapacidad(bodega.capacidad_actual.toString());
    setAuditMsg('');
    setAuditoriaModal(true);
    setAuditandoLoading(true);
    try {
      const ctns = await fetchContenedoresBodega(bodega.id);
      setContenedoresBodega(ctns);
    } catch {
      setContenedoresBodega([]);
    } finally {
      setAuditandoLoading(false);
    }
  };

  const guardarAuditoria = async () => {
    if (!bodegaAuditada) return;
    setAuditandoLoading(true);
    setAuditMsg('');
    try {
      const actualizado = await patchCapacidadBodega(bodegaAuditada.id, parseInt(nuevaCapacidad));
      // Actualizar estado local
      setBodegas(prev => prev.map(b => b.id === actualizado.id ? actualizado : b));
      setBodegaAuditada(actualizado);
      setAuditMsg('✓ Auditoría guardada correctamente.');
    } catch {
      setAuditMsg('✗ Error al guardar. Verifica la conexión.');
    } finally {
      setAuditandoLoading(false);
    }
  };

  const getEstadoContenedor = (estado) => {
    const mapa = {
      en_puerto_origen: { label: 'Puerto Origen', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
      en_transito: { label: 'En Tránsito', color: 'text-primary bg-primary/10 border-primary/20' },
      en_aduana: { label: 'En Aduana', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
      en_puerto_destino: { label: 'Puerto Destino', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
      entregado: { label: 'Entregado', color: 'text-primary bg-primary/10 border-primary/20' },
    };
    return mapa[estado] || { label: estado, color: 'text-on-surface-variant bg-surface border-outline/20' };
  };

  return (
    <div className="w-full text-left space-y-6">
      {/* Encabezado */}
      <header className="flex justify-between items-end mb-8 border-b border-outline/20 pb-4">
        <div>
           <h2 className="text-3xl font-extrabold text-on-surface tracking-tight m-0 flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-primary">warehouse</span>
              Malla de Bodegas
           </h2>
           <p className="text-on-surface-variant text-sm mt-1 m-0">Infraestructura global operativa y saturación volumétrica.</p>
        </div>
        <div className="flex gap-4">
            <button onClick={cargarBodegas} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline/20 font-bold text-xs uppercase tracking-widest text-on-surface-variant rounded flex items-center gap-2 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm">refresh</span> Actualizar
            </button>
            <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/20 font-bold text-xs uppercase tracking-widest rounded flex items-center gap-2 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm">add</span> Nueva Sede
            </button>
        </div>
      </header>

      {/* Grid de bodegas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center p-16 bg-surface-container-lowest rounded-xl border border-outline">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl mb-4">memory</span>
            <p className="text-xs font-black text-primary uppercase tracking-[0.2em] animate-pulse m-0">Sondeando Nodos...</p>
          </div>
        ) : error ? (
          <div className="p-8 mx-6 my-6 bg-error/10 border border-error/50 rounded-lg text-center col-span-full">
            <p className="text-error font-black text-xs uppercase tracking-widest m-0 flex items-center justify-center gap-2">
               <span className="material-symbols-outlined text-sm">warning</span> {error}
            </p>
          </div>
        ) : bodegas.length > 0 ? (
          bodegas.map((bodega) => {
            const ocupacion = (bodega.capacidad_actual / bodega.capacidad_maxima) * 100;
            const statusColor = ocupacion > 80 ? 'text-error bg-error' : ocupacion > 50 ? 'text-orange-400 bg-orange-400' : 'text-primary bg-primary';
            const statusBgClass = ocupacion > 80 ? 'border-error/20 bg-error/5' : 'border-outline/10 dashboard-glass-panel';

            return (
              <div key={bodega.id} className={`rounded-xl p-8 border hover:border-primary/50 transition-colors relative overflow-hidden shadow-xl ${statusBgClass}`}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.02] -mr-16 -mt-16 rounded-full bg-current pointer-events-none"></div>

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div>
                    <h3 className="text-xl font-extrabold text-on-surface m-0 uppercase tracking-tight">{bodega.nombre}</h3>
                    <p className="text-on-surface-variant text-[0.65rem] font-bold uppercase tracking-widest mt-1 m-0 flex items-center gap-1">
                       <span className="material-symbols-outlined text-[10px]">location_on</span> {bodega.ubicacion}
                    </p>
                  </div>
                  <div className={`p-2 rounded flex items-center justify-center ${ocupacion > 80 ? 'bg-error/20 text-error' : 'bg-surface-container-high text-primary'}`}>
                      <span className="material-symbols-outlined text-2xl">domain</span>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-end justify-between border-b border-outline/20 pb-4">
                     <div>
                        <span className="text-[0.6rem] uppercase tracking-widest font-black text-on-surface-variant m-0">Ocupación Física</span>
                        <p className="text-3xl font-black text-on-surface m-0 mt-1 leading-none">{Math.round(ocupacion)}<span className="text-lg text-on-surface-variant">%</span></p>
                     </div>
                     <div className="text-right">
                        <span className="text-[0.6rem] uppercase tracking-widest font-black text-on-surface-variant m-0">Cap. Nominal</span>
                        <p className="text-sm font-bold text-on-surface m-0">{bodega.capacidad_maxima} TEU</p>
                     </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[0.6rem] uppercase tracking-widest font-bold text-on-surface-variant mb-2">
                       <span>SATURACIÓN</span>
                       <span className={statusColor.split(' ')[0]}>{bodega.capacidad_actual} CTNs</span>
                    </div>
                    <div className="bg-surface-container h-1.5 rounded-full overflow-hidden w-full">
                      <div
                        className={`h-full transition-all duration-700 ${statusColor.split(' ')[1]}`}
                        style={{ width: `${Math.min(ocupacion, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-outline/20 flex gap-4 relative z-10">
                  <button className="flex-1 py-3 px-3 bg-surface border border-outline/20 hover:bg-surface-container text-on-surface text-[0.6rem] font-black uppercase tracking-widest rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-xs">inventory_2</span>
                    Manifestos
                  </button>
                  <button
                    onClick={() => abrirAuditoria(bodega)}
                    className="flex-1 py-3 px-3 bg-primary/10 border border-primary/20 hover:bg-primary hover:text-black text-primary text-[0.6rem] font-black uppercase tracking-widest rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">fact_check</span>
                    Auditar
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-16 col-span-full flex flex-col justify-center items-center text-center bg-surface-container-lowest rounded-xl border border-outline">
            <span className="material-symbols-outlined text-6xl text-outline mb-4">search_off</span>
            <p className="text-sm font-bold text-on-surface m-0 mb-1">Sin Resultados</p>
            <p className="text-xs text-on-surface-variant m-0">La red de bodegas no cuenta con registros activos.</p>
          </div>
        )}
      </div>

      {/* Modal Nueva Bodega */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
           <div className="bg-surface-container-lowest border border-outline/20 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-outline/10 flex justify-between items-center">
                 <h3 className="font-extrabold text-on-surface m-0 uppercase tracking-widest text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">add_business</span>
                    Registrar Nueva Sede
                 </h3>
                 <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                 <div>
                    <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Nombre Descriptivo</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary" placeholder="Ej: Puerto Seco BOG" />
                 </div>
                 <div>
                    <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Ubicación Geográfica</label>
                    <input required type="text" value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary" placeholder="Ej: Bogotá, Colombia" />
                 </div>
                 <div>
                    <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Capacidad Máxima (TEU)</label>
                    <input required type="number" min="10" value={formData.capacidad_maxima} onChange={e => setFormData({...formData, capacidad_maxima: parseInt(e.target.value)})} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary" />
                 </div>
                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-surface-container text-on-surface-variant text-xs font-bold uppercase tracking-widest rounded hover:bg-surface-container-high transition-colors cursor-pointer border-none">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-primary text-black text-xs font-bold uppercase tracking-widest rounded hover:brightness-110 transition-colors cursor-pointer border-none shadow-lg shadow-primary/20">Guardar</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* ==================== MODAL AUDITORÍA ==================== */}
      {auditoriaModal && bodegaAuditada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
           <div className="bg-surface-container-lowest border border-outline/20 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="p-6 border-b border-outline/10 flex justify-between items-center bg-surface-container">
                 <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">fact_check</span>
                    <div>
                      <h3 className="font-extrabold text-on-surface m-0 uppercase tracking-widest text-sm">Auditoría de Bodega</h3>
                      <p className="text-[0.65rem] text-primary font-bold uppercase tracking-widest m-0">{bodegaAuditada.nombre}</p>
                    </div>
                 </div>
                 <button onClick={() => setAuditoriaModal(false)} className="text-on-surface-variant hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                {/* Métricas actuales */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Capacidad Máx.', value: `${bodegaAuditada.capacidad_maxima} TEU`, icon: 'straighten' },
                    { label: 'Ocupación Actual', value: `${bodegaAuditada.capacidad_actual} CTN`, icon: 'inventory_2' },
                    { label: 'Saturación', value: `${Math.round((bodegaAuditada.capacidad_actual / bodegaAuditada.capacidad_maxima) * 100)}%`, icon: 'donut_large' },
                  ].map(m => (
                    <div key={m.label} className="bg-surface-container p-4 rounded-lg border border-outline/10 text-center">
                      <span className="material-symbols-outlined text-primary text-xl block mb-1">{m.icon}</span>
                      <p className="text-lg font-black text-on-surface m-0">{m.value}</p>
                      <p className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant font-bold m-0">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Barra de ocupación */}
                <div>
                  <div className="flex justify-between text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-2">
                    <span>Saturación Visual</span>
                    <span className="text-primary">{Math.round((bodegaAuditada.capacidad_actual / bodegaAuditada.capacidad_maxima) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                      style={{ width: `${Math.min((bodegaAuditada.capacidad_actual / bodegaAuditada.capacidad_maxima) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Actualizar capacidad actual */}
                <div className="bg-surface-container p-4 rounded-lg border border-outline/10">
                  <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-2">
                    Actualizar Ocupación Actual (CTN)
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min="0"
                      max={bodegaAuditada.capacidad_maxima}
                      value={nuevaCapacidad}
                      onChange={e => setNuevaCapacidad(e.target.value)}
                      className="flex-1 bg-surface-container-lowest border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={guardarAuditoria}
                      disabled={auditandoLoading}
                      className="px-6 py-2 bg-primary text-black text-xs font-black uppercase tracking-widest rounded hover:brightness-110 transition cursor-pointer border-none disabled:opacity-50 flex items-center gap-2"
                    >
                      {auditandoLoading
                        ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                        : <span className="material-symbols-outlined text-sm">save</span>
                      }
                      Guardar
                    </button>
                  </div>
                  {auditMsg && (
                    <p className={`mt-2 text-[0.65rem] font-bold uppercase tracking-widest m-0 ${auditMsg.startsWith('✓') ? 'text-primary' : 'text-red-400'}`}>
                      {auditMsg}
                    </p>
                  )}
                </div>

                {/* Contenedores asignados */}
                <div>
                  <h4 className="text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-3 flex items-center gap-2 m-0">
                    <span className="material-symbols-outlined text-sm text-primary">inventory_2</span>
                    Contenedores Asignados ({contenedoresBodega.length})
                  </h4>
                  {auditandoLoading ? (
                    <p className="text-[0.65rem] text-on-surface-variant animate-pulse">Cargando contenedores...</p>
                  ) : contenedoresBodega.length === 0 ? (
                    <p className="text-[0.65rem] text-on-surface-variant">No hay contenedores asignados a esta bodega.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {contenedoresBodega.map(c => {
                        const est = getEstadoContenedor(c.estado);
                        return (
                          <div key={c.id} className="flex items-center justify-between p-3 bg-surface-container rounded-lg border border-outline/10">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary text-sm">sailing</span>
                              <div>
                                <p className="text-xs font-bold text-on-surface m-0">{c.codigo}</p>
                                <p className="text-[0.6rem] text-on-surface-variant m-0 uppercase">{c.tipo}</p>
                              </div>
                            </div>
                            <span className={`text-[0.55rem] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${est.color}`}>
                              {est.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-outline/10 flex justify-end">
                <button onClick={() => setAuditoriaModal(false)} className="px-6 py-2 bg-surface-container text-on-surface-variant text-xs font-bold uppercase tracking-widest rounded hover:bg-surface-container-high transition-colors cursor-pointer border-none">
                  Cerrar Auditoría
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
