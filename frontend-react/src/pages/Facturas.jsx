import { useState, useEffect } from 'react';
import { facturasAPI } from '../services/api';

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ proveedor: '', numero_factura: '', monto_total: 0, monto_impuestos: 0, estado: 'pendiente' });

  useEffect(() => {
    cargarFacturas();
  }, [filtroEstado]);

  const cargarFacturas = async () => {
    setLoading(true);
    try {
      const data = await facturasAPI.getAll(filtroEstado || null);
      setFacturas(data);
      setError('');
    } catch (err) {
      setError('Error al sincronizar historial de facturaciÃ³n.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await facturasAPI.create(formData);
      setShowModal(false);
      setFormData({ proveedor: '', numero_factura: '', monto_total: 0, monto_impuestos: 0, estado: 'pendiente' });
      await cargarFacturas();
    } catch (err) {
      setError('Error al guardar registro en backend: ' + (err.message || 'Error desconocido'));
      setLoading(false);
    }
  };

  const handleAuditar = async (facturaId) => {
    try {
      await facturasAPI.patch(facturaId, { estado: 'validada', procesado_por_ia: false });
      await cargarFacturas();
    } catch (err) {
      setError('Error al auditar la factura: ' + (err.message || 'Error desconocido'));
    }
  };

  const estados = [
    { value: '', label: 'Historial Completo' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'procesada', label: 'Procesada' },
    { value: 'validada', label: 'Validada' },
    { value: 'rechazada', label: 'Rechazada' }
  ];

  const totalMonto = facturas.reduce((sum, f) => sum + f.monto_total, 0);
  const totalPendientes = facturas.filter(f => f.estado === 'pendiente').length;

  return (
    <div className="w-full text-left space-y-6">
      {/* TÃ­tulo */}
      <header className="flex justify-between items-end mb-8 border-b border-outline/20 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight m-0 flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-primary">receipt_long</span>
            Facturacion & Cuentas
          </h2>
          <p className="text-on-surface-variant text-sm mt-1 m-0">Gestion documental, tributos y control contable.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={cargarFacturas}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline/20 font-bold text-xs uppercase tracking-widest text-on-surface-variant rounded flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">sync</span> Refrescar Data
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 font-bold text-xs uppercase tracking-widest rounded flex items-center gap-2 hover:bg-primary hover:text-black transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add_box</span> Nueva Factura
          </button>
        </div>
      </header>

      {/* Resumen & Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">

        {/* Filtros */}
        <div className="md:col-span-4 dashboard-glass-panel p-6 rounded-xl border border-outline flex flex-col justify-between shadow-xl">
          <div>
            <label className="text-[0.6rem] uppercase tracking-widest font-black text-on-surface-variant mb-3 flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">filter_alt</span> Estado de Auditoria
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-surface-container border border-outline/20 rounded px-4 py-3 text-on-surface text-sm font-bold focus:outline-none focus:border-primary w-full cursor-pointer transition-colors hover:bg-surface-container-high"
            >
              {estados.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
          {totalPendientes > 0 && (
            <div className="mt-4 p-3 bg-secondary/10 border border-secondary/20 rounded-lg flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary text-sm">notification_important</span>
              <div>
                <p className="text-[0.65rem] font-bold text-secondary uppercase tracking-widest leading-none m-0">Atencion Requerida</p>
                <p className="text-xs text-on-surface m-0 mt-1">{totalPendientes} facturas estan esperando validacion.</p>
              </div>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="md:col-span-8 dashboard-glass-panel p-6 rounded-xl border border-outline shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary opacity-[0.02] -mr-24 -mt-24 rounded-full pointer-events-none"></div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="border-r border-outline/10 pr-6">
              <p className="text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Volumen Total</p>
              <p className="text-4xl font-extrabold text-on-surface tracking-tighter m-0">{facturas.length}</p>
              <p className="text-[0.6rem] text-primary mt-1 font-bold m-0">+14% este mes</p>
            </div>
            <div className="border-r border-outline/10 pr-6">
              <p className="text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Capital Comprometido</p>
              <p className="text-3xl font-extrabold text-primary tracking-tighter m-0 overflow-hidden text-ellipsis">${totalMonto.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              <p className="text-[0.6rem] text-on-surface-variant mt-1 font-bold m-0">Consolidado USD</p>
            </div>
            <div className="pr-6">
              <p className="text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Ratio de IA</p>
              <p className="text-4xl font-extrabold text-on-surface tracking-tighter m-0 flex items-center gap-2">
                {facturas.length ? Math.round((facturas.filter(f => f.procesado_por_ia).length / facturas.length) * 100) : 0}%
              </p>
              <p className="text-[0.6rem] text-on-surface-variant mt-1 font-bold m-0">Automatizacion Actual</p>
            </div>
          </div>
          <div className="w-full bg-surface-container mt-6 h-1 rounded-full overflow-hidden">
            <div className="bg-primary h-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${facturas.length ? (facturas.filter(f => f.procesado_por_ia).length / facturas.length) * 100 : 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Tabla de facturas */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline overflow-hidden shadow-xl mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl mb-4">memory</span>
            <p className="text-xs font-black text-primary uppercase tracking-[0.2em] animate-pulse m-0">Sincronizando Libro Contable...</p>
          </div>
        ) : error ? (
          <div className="p-8 mx-6 my-6 bg-error/10 border border-error/50 rounded-lg text-center">
            <p className="text-error font-black text-xs uppercase tracking-widest m-0 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">warning</span> {error}
            </p>
          </div>
        ) : facturas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface text-on-surface-variant uppercase tracking-[0.1em] text-[0.65rem] border-b border-outline">
                  <th className="px-6 py-4 font-black">Referencia</th>
                  <th className="px-6 py-4 font-black">Emisor</th>
                  <th className="px-6 py-4 font-black text-right">Balance</th>
                  <th className="px-6 py-4 font-black text-right">Carga Impositiva</th>
                  <th className="px-6 py-4 font-black">Status Tracker</th>
                  <th className="px-6 py-4 font-black text-center">IA</th>
                  <th className="px-6 py-4 font-black text-right">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {facturas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4 font-bold text-on-surface tracking-wider">
                      {factura.numero_factura}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs font-bold">
                      {factura.proveedor}
                    </td>
                    <td className="px-6 py-4 text-right text-primary font-black">
                      ${factura.monto_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-secondary font-bold text-xs">
                      ${factura.monto_impuestos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container font-black text-[10px] uppercase border ${factura.estado === 'procesada' ? 'border-primary/30 text-primary bg-primary/10' :
                        factura.estado === 'pendiente' ? 'border-secondary/30 text-secondary bg-secondary/10' :
                          factura.estado === 'validada' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                            factura.estado === 'rechazada' ? 'border-error/30 text-error bg-error/10' :
                              'border-outline/30 text-on-surface-variant'
                        }`}>
                        {factura.estado === 'pendiente' && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>}
                        {factura.estado === 'procesada' && <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>}
                        {factura.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {factura.procesado_por_ia ? (
                        <span className="material-symbols-outlined text-primary text-sm bg-primary/10 p-1.5 rounded" title="ValidaciÃ³n IA Completada">psychology</span>
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant text-sm bg-surface-container-high p-1.5 rounded" title="InspecciÃ³n Manual">person</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleAuditar(factura.id)} className="px-3 py-1 border border-outline/30 text-on-surface-variant font-bold text-xs uppercase rounded hover:bg-primary hover:border-primary hover:text-black transition-colors cursor-pointer inline-flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        Auditar <span className="material-symbols-outlined text-xs">chevron_right</span>
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
            <p className="text-sm font-bold text-on-surface m-0 mb-1">Registro VacÃ­o</p>
            <p className="text-xs text-on-surface-variant m-0">No se encontraron documentos contables bajo estos parÃ¡metros.</p>
          </div>
        )}
      </section>

      {/* Modal Nueva Factura */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-outline/20 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline/10 flex justify-between items-center">
              <h3 className="font-extrabold text-on-surface m-0 uppercase tracking-widest text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">post_add</span>
                Ingresar Factura
              </h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-error transition-colors bg-transparent border-none cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Entidad/Proveedor</label>
                  <input required type="text" value={formData.proveedor} onChange={e => setFormData({ ...formData, proveedor: e.target.value })} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary" placeholder="Ej: Maersk Line" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">ID Fiscal / Num. Documento</label>
                  <input required type="text" value={formData.numero_factura} onChange={e => setFormData({ ...formData, numero_factura: e.target.value })} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary uppercase" placeholder="INV-202X-XX" />
                </div>
                <div>
                  <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Monto Base</label>
                  <input required type="number" step="0.01" value={formData.monto_total} onChange={e => setFormData({ ...formData, monto_total: parseFloat(e.target.value) })} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Monto Impositivo</label>
                  <input required type="number" step="0.01" value={formData.monto_impuestos} onChange={e => setFormData({ ...formData, monto_impuestos: parseFloat(e.target.value) })} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[0.65rem] uppercase tracking-widest font-black text-on-surface-variant mb-1">Estado</label>
                  <select required value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} className="w-full bg-surface-container border border-outline/20 rounded px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary">
                    <option value="pendiente">Pendiente</option>
                    <option value="procesada">Procesada</option>
                    <option value="validada">Validada</option>
                  </select>
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

