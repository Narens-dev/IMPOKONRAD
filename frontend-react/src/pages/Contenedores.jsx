import { useState, useEffect } from 'react';
import { contenedoresAPI, bodegasAPI } from '../services/api';

export default function Contenedores() {
  const [contenedores, setContenedores] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ codigo: '', tipo: '20ft', estado: 'en_puerto_origen', puerto_origen: '', puerto_destino: '' });

  useEffect(() => {
    cargarContenedores();
    cargarBodegas();
  }, [filtro]);

  const cargarBodegas = async () => {
    try {
      const b = await bodegasAPI.getAll();
      setBodegas(b);
    } catch {
      console.warn("No se pudieron cargar sugerencias de bodegas");
    }
  };

  const cargarContenedores = async () => {
    setLoading(true);
    try {
      const data = await contenedoresAPI.getAll(filtro || null);
      setContenedores(data);
      setError('');
    } catch (err) {
      setError('Error al conectar con la cuadrícula de contenedores.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contenedoresAPI.create(formData);
      setShowModal(false);
      setFormData({ codigo: '', tipo: '20ft', estado: 'en_puerto_origen', puerto_origen: '', puerto_destino: '' });
      await cargarContenedores();
    } catch (err) {
      setError(`Error del backend: ${err.message}`);
      setLoading(false);
    }
  };

  const estados = [
    { value: '', label: 'Todos los Registros' },
    { value: 'en_puerto_origen', label: 'En Puerto O.' },
    { value: 'en_transito', label: 'En Tránsito' },
    { value: 'en_aduana', label: 'En Aduana' },
    { value: 'en_puerto_destino', label: 'En Puerto D.' },
    { value: 'entregado', label: 'Entregado' }
  ];

  return (
    <div className="w-full text-left space-y-6">
      {/* Título */}
      <header className="flex justify-between items-end mb-8 border-b border-outline/20 pb-4">
        <div>
           <h2 className="text-3xl font-extrabold text-on-surface tracking-tight m-0 flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-primary">inventory_2</span>
              Inventario de Contenedores
           </h2>
           <p className="text-on-surface-variant text-sm mt-1 m-0">Supervisión y control del flujo de carga pesada.</p>
        </div>
        <div className="flex gap-4">
            <button 
               onClick={cargarContenedores}
               className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline/20 font-bold text-xs uppercase tracking-widest text-on-surface-variant rounded flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">sync</span> Sincronizar
            </button>
            <button 
               onClick={() => setShowModal(true)}
               className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 font-bold text-xs uppercase tracking-widest rounded flex items-center gap-2 hover:bg-primary hover:text-black transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add_box</span> Registrar
            </button>
        </div>
      </header>

      {/* Panel Superior: Filtros */}
      <div className="dashboard-glass-panel p-6 rounded-xl border border-outline flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-[0.02] -mr-16 -mt-16 rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
          <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
          <div className="flex flex-col">
            <label className="text-[0.6rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Estado Operativo</label>
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm font-bold focus:outline-none focus:border-primary w-full md:w-64 cursor-pointer"
            >
              {estados.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* KPI Simple */}
        <div className="flex items-center gap-8 relative z-10 w-full md:w-auto mt-4 md:mt-0">
           <div className="text-right border-r border-outline/20 pr-8">
              <p className="text-[0.6rem] uppercase tracking-widest font-black text-on-surface-variant m-0">Registros Listados</p>
              <p className="text-2xl font-black text-on-surface m-0 leading-tight">{contenedores.length}</p>
           </div>
           <div className="text-right">
              <p className="text-[0.6rem] uppercase tracking-widest font-black text-on-surface-variant m-0">Integridad BD</p>
              <p className="text-sm font-black text-primary flex items-center gap-1 justify-end m-0">
                 <span className="material-symbols-outlined text-xs">verified_user</span> 100%
              </p>
           </div>
        </div>
      </div>

      {/* Lista de contenedores */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl mb-4">memory</span>
            <p className="text-xs font-black text-primary uppercase tracking-[0.2em] animate-pulse m-0">Sondeando Nodos...</p>
          </div>
        ) : error ? (
          <div className="p-8 mx-6 my-6 bg-error/10 border border-error/50 rounded-lg text-center">
            <p className="text-error font-black text-xs uppercase tracking-widest m-0 flex items-center justify-center gap-2">
               <span className="material-symbols-outlined text-sm">warning</span> {error}
            </p>
          </div>
        ) : contenedores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface text-on-surface-variant uppercase tracking-widest text-[0.65rem] border-b border-outline">
                  <th className="px-6 py-4 font-black">Código ID</th>
                  <th className="px-6 py-4 font-black">Clasificación</th>
                  <th className="px-6 py-4 font-black">Estado Actual</th>
                  <th className="px-6 py-4 font-black text-center">Ruta Operativa</th>
                  <th className="px-6 py-4 font-black">Asignación Bodega</th>
                  <th className="px-6 py-4 font-black text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {contenedores.map((contenedor) => (
                  <tr key={contenedor.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4 font-bold text-on-surface tracking-wider">
                       {contenedor.codigo}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant uppercase text-xs font-bold">
                       {contenedor.tipo}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container font-black text-[10px] uppercase border ${
                        contenedor.estado === 'en_transito' ? 'border-secondary/30 text-secondary bg-secondary/10' :
                        contenedor.estado === 'en_aduana' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' :
                        contenedor.estado === 'entregado' ? 'border-primary/30 text-primary bg-primary/10' :
                        'border-outline/30 text-on-surface-variant'
                      }`}>
                         {contenedor.estado === 'en_transito' && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>}
                         {contenedor.estado === 'entregado' && <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>}
                         {contenedor.estado === 'en_aduana' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>}
                         {contenedor.estado?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       {contenedor.puerto_origen || contenedor.puerto_destino ? (
                          <div className="flex items-center justify-center gap-2 text-[0.65rem] font-bold text-on-surface-variant uppercase">
                             <span className="truncate max-w-[80px]" title={contenedor.puerto_origen}>{contenedor.puerto_origen || 'N/A'}</span>
                             <span className="material-symbols-outlined text-[10px] text-primary">arrow_forward</span>
                             <span className="truncate max-w-[80px]" title={contenedor.puerto_destino}>{contenedor.puerto_destino || 'N/A'}</span>
                          </div>
                       ) : (
                          <span className="text-xs text-outline italic">No definida</span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">
                      {contenedor.bodega_id ? (
                         <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[10px]">domain</span>
                            {contenedor.bodega_id.slice(0, 8)}...
                         </span>
                      ) : (
                         <span className="italic text-outline">No Registrada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="px-3 py-1 border border-outline/30 text-on-surface-variant font-bold text-xs uppercase rounded hover:bg-primary hover:border-primary hover:text-black transition-colors cursor-pointer inline-flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          Examinar <span className="material-symbols-outlined text-xs">chevron_right</span>
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-outline mb-4">search_off</span>
            <p className="text-sm font-bold text-on-surface m-0 mb-1">Sin Resultados</p>
            <p className="text-xs text-on-surface-variant m-0">No se encontraron contenedores para el criterio seleccionado.</p>
          </div>
        )}
      </section>

      {/* Modal Nuevo Contenedor */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
           <div className="bg-surface-container-lowest border border-outline/20 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-outline/10 flex justify-between items-center">
                 <h3 className="font-extrabold text-on-surface m-0 uppercase tracking-widest text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">add_box</span>
                    Registrar Contenedor
                 </h3>
                 <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-error transition-colors bg-transparent border-none cursor-pointer">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                 <div>
                    <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Código ID</label>
                    <input required type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary uppercase" placeholder="ZIMU-XXXXXX-X" />
                 </div>
                 <div>
                    <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Clasificación (Tipo)</label>
                    <select required value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary">
                       <option value="20ft">20ft Standard</option>
                       <option value="40ft">40ft Standard</option>
                       <option value="40ft HC">40ft High Cube</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Estado Inicial</label>
                    <select required value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary capitalize">
                      {estados.filter(e => e.value !== '').map(est => (
                         <option key={est.value} value={est.value}>{est.label.replace('En Puerto O.', 'En Puerto Origen').replace('En Puerto D.', 'En Puerto Destino')}</option>
                      ))}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <datalist id="lista-bodegas">
                      {bodegas.map(b => (
                         <option key={b.id} value={b.ubicacion}>{b.nombre} ({b.ubicacion})</option>
                      ))}
                    </datalist>
                    <div>
                       <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Bodega / Puerto Origen</label>
                       <input list="lista-bodegas" type="text" value={formData.puerto_origen} onChange={e => setFormData({...formData, puerto_origen: e.target.value})} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary" placeholder="Ej: Bogota" />
                    </div>
                    <div>
                       <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Bodega / Puerto Destino</label>
                       <input list="lista-bodegas" type="text" value={formData.puerto_destino} onChange={e => setFormData({...formData, puerto_destino: e.target.value})} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary" placeholder="Ej: Paris" />
                    </div>
                 </div>
                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-surface-container text-on-surface-variant text-xs font-bold uppercase tracking-widest rounded hover:bg-surface-container-high transition-colors cursor-pointer border-none">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-primary text-black text-xs font-bold uppercase tracking-widest rounded hover:bg-primary-container transition-colors cursor-pointer border-none shadow-lg shadow-primary/20">Registrar</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
