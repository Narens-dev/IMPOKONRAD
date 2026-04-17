import { useState, useEffect } from 'react';
import { manifiestosAPI } from '../services/api';

export default function Manifiestos() {
  const [manifiestos, setManifiestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ codigo: '', puerto_origen: '', puerto_destino: '' });

  useEffect(() => {
    cargarManifiestos();
  }, []);

  const cargarManifiestos = async () => {
    setLoading(true);
    try {
      const data = await manifiestosAPI.getAll();
      setManifiestos(data);
    } catch {
      // Ignorar handle
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await manifiestosAPI.create(formData);
        setShowModal(false);
        setFormData({ codigo: '', puerto_origen: '', puerto_destino: '' });
        await cargarManifiestos();
      } catch (err) {
        setLoading(false);
      }
  };

  return (
    <div className="w-full text-left space-y-6">
      {/* Título de la sección */}
      <header className="flex justify-between items-end mb-8 border-b border-outline/20 pb-4">
        <div>
           <h2 className="text-3xl font-extrabold text-on-surface tracking-tight m-0 flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-primary">description</span>
              Manifiestos de Carga
           </h2>
           <p className="text-on-surface-variant text-sm mt-1 m-0">Resoluciones de transporte y documentación aduanera internacional.</p>
        </div>
        <div className="flex gap-4">
            <button
              onClick={cargarManifiestos} 
              className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline/20 font-bold text-xs uppercase tracking-widest text-on-surface-variant rounded flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">refresh</span> Refrescar
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/20 font-bold text-xs uppercase tracking-widest rounded flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add_box</span> Nuevo Manifiesto
            </button>
        </div>
      </header>

      {/* Tarjetas de Manifiestos - Vista Alternativa a Tabla */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center p-16 bg-surface-container-lowest rounded-xl border border-outline shadow-xl">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl mb-4">memory</span>
            <p className="text-xs font-black text-primary uppercase tracking-[0.2em] animate-pulse m-0">Resolviendo Nodos Criptográficos...</p>
          </div>
        ) : manifiestos.length > 0 ? (
          manifiestos.map((manifiesto) => (
             <div key={manifiesto.id} className="dashboard-glass-panel p-6 rounded-xl border border-outline hover:border-primary/50 transition-all shadow-xl group">
                 <div className="flex justify-between items-start mb-6 border-b border-outline/20 pb-4">
                     <div>
                        <p className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant font-black m-0">Id Documento</p>
                        <h3 className="text-xl font-extrabold text-on-surface tracking-tight leading-none mt-1 m-0">{manifiesto.codigo}</h3>
                     </div>
                     <span className={`px-2 py-1 rounded text-[0.6rem] uppercase font-black tracking-widest border ${
                         manifiesto.status_tag === 'En Ruta' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                     }`}>
                         {manifiesto.status_tag}
                     </span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6 mb-6">
                     <div className="flex flex-col gap-1">
                         <span className="flex items-center gap-1.5 text-on-surface-variant text-[0.6rem] uppercase tracking-widest font-black">
                            <span className="material-symbols-outlined text-xs">flight_takeoff</span> Origen
                         </span>
                         <p className="text-sm font-bold text-on-surface m-0">{manifiesto.puerto_origen}</p>
                         <p className="text-xs text-on-surface-variant m-0">{manifiesto.fecha_salida}</p>
                     </div>
                     <div className="flex flex-col gap-1 text-right">
                         <span className="flex items-center justify-end gap-1.5 text-on-surface-variant text-[0.6rem] uppercase tracking-widest font-black">
                            Destino <span className="material-symbols-outlined text-xs text-primary">flight_land</span>
                         </span>
                         <p className="text-sm font-bold text-on-surface m-0">{manifiesto.puerto_destino}</p>
                         <p className="text-xs text-primary font-bold m-0 pl-4">{manifiesto.fecha_llegada_estimada}</p>
                     </div>
                 </div>

                 {/* Tracker visual */}
                 <div className="mb-6">
                     <div className="w-full bg-surface-container h-1 rounded flex items-center justify-between">
                         <div className="w-2 h-2 rounded-full bg-on-surface-variant"></div>
                         <div className={`h-1 bg-secondary shadow-[0_0_8px_rgba(currentColor,0.4)]`} style={{width: manifiesto.status_tag === 'En Ruta' ? '40%' : '80%'}}></div>
                         <div className="w-2 h-2 rounded-full bg-surface border-2 border-outline"></div>
                     </div>
                 </div>

                 <div className="flex justify-end gap-3 mt-4">
                     <button className="px-4 py-2 border border-outline/30 text-on-surface-variant font-bold text-xs uppercase tracking-widest rounded hover:bg-surface-container-highlight transition-colors cursor-pointer inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">visibility</span> Revisar
                     </button>
                     <button className="px-4 py-2 bg-surface text-primary border border-primary/20 font-bold text-xs uppercase tracking-widest rounded hover:bg-primary hover:text-black transition-colors cursor-pointer inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">edit_document</span> Editar
                     </button>
                 </div>
             </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-16 text-center bg-surface-container-lowest rounded-xl border border-outline shadow-xl">
            <span className="material-symbols-outlined text-6xl text-outline mb-4">search_off</span>
            <p className="text-sm font-bold text-on-surface m-0 mb-1">Registro Vacío</p>
            <p className="text-xs text-on-surface-variant m-0">No hay manifiestos registrados actualmente.</p>
          </div>
        )}
      </div>

      {/* Modal Nuevo Manifiesto */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
           <div className="bg-surface-container-lowest border border-outline/20 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-outline/10 flex justify-between items-center">
                 <h3 className="font-extrabold text-on-surface m-0 uppercase tracking-widest text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">add_box</span>
                    Nuevo Manifiesto
                 </h3>
                 <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-error transition-colors bg-transparent border-none cursor-pointer">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                 <div>
                    <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Código de Documento</label>
                    <input required type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary uppercase" placeholder="MAN-202X-XX" />
                 </div>
                 <div>
                    <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Puerto de Origen</label>
                    <input required type="text" value={formData.puerto_origen} onChange={e => setFormData({...formData, puerto_origen: e.target.value})} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary" placeholder="Ej: Shanghai" />
                 </div>
                 <div>
                    <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Puerto de Destino</label>
                    <input required type="text" value={formData.puerto_destino} onChange={e => setFormData({...formData, puerto_destino: e.target.value})} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary" placeholder="Ej: Buenaventura" />
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
