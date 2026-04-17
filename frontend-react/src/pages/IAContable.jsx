import { useState } from 'react';
import { facturasAPI, iaAPI } from '../services/api';

export default function IAContable() {
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [faseProceso, setFaseProceso] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [facturas, setFacturas] = useState([]);
  const [activeTab, setActiveTab] = useState('ia'); // 'ia' or 'historial'

  // Guardamos el File original (no convertimos a base64 para evitar problemas de tamaño)
  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNombreArchivo(file.name);
      setImagen(file); // File object nativo
      setResultado(null);
      setError('');

      // Preview: para imágenes mostrar miniatura, para PDF mostrar icono
      if (file.type === 'application/pdf') {
        setPreview('pdf'); // sentinel para mostrar icono PDF
      } else {
        const url = URL.createObjectURL(file);
        setPreview(url);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleImagenChange(fakeEvent);
    }
  };

  const procesarFactura = async () => {
    if (!imagen) {
      setError('Cargue un documento primero, por favor.');
      return;
    }

    setProcesando(true);
    setError('');
    setResultado(null);

    try {
      setFaseProceso('Enviando documento a Gemini Vision...');
      await new Promise(r => setTimeout(r, 300));

      setFaseProceso('Extrayendo datos con IA...');
      // Enviamos el archivo como multipart/form-data (evita límites de tamaño)
      const respuesta = await iaAPI.procesarFactura(imagen, nombreArchivo);

      setFaseProceso('Guardando en base de datos...');
      await new Promise(r => setTimeout(r, 200));

      setResultado({
        ...respuesta.datos_ia,
        id: respuesta.factura.id,
        estado: respuesta.factura.estado,
        mensaje: respuesta.mensaje,
      });

      setFacturas(prev => [respuesta.factura, ...prev]);

    } catch (err) {
      setError('Error al procesar: ' + err.message);
    } finally {
      setProcesando(false);
      setFaseProceso('');
    }
  };

  const limpiar = () => {
    setImagen(null);
    setPreview(null);
    setNombreArchivo('');
    setResultado(null);
    setError('');
  };

  const cargarFacturas = async () => {
    setLoading(true);
    try {
      const data = await facturasAPI.getAll();
      setFacturas(data);
    } catch (err) {
      setError('Error al sincronizar historial.');
    } finally {
      setLoading(false);
    }
  };

  const getConfianzaColor = (confianza) => {
    if (confianza >= 90) return 'text-primary';
    if (confianza >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="w-full text-left">
      {/* Selector de Pestañas */}
      <div className="flex gap-4 mb-6 border-b border-outline/20 pb-2">
         <button
           onClick={() => setActiveTab('ia')}
           className={`font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-t-lg transition-colors border-none cursor-pointer ${activeTab === 'ia' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'bg-transparent text-on-surface-variant hover:text-on-surface'}`}
         >
            Generador IA
         </button>
         <button
           onClick={() => { setActiveTab('historial'); cargarFacturas(); }}
           className={`font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-t-lg transition-colors border-none cursor-pointer ${activeTab === 'historial' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'bg-transparent text-on-surface-variant hover:text-on-surface'}`}
         >
            Historial de Extracciones
         </button>
      </div>

      {activeTab === 'ia' && (
        <div className="grid grid-cols-12 gap-6 w-full relative">
          {/* Motor de Extracción */}
          <section className="col-span-12 lg:col-span-8 dashboard-glass-panel rounded-xl p-8 border border-outline relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-[0.03] -mr-32 -mt-32 rounded-full"></div>
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">psychology</span>
              <h3 className="text-xs font-black text-on-surface uppercase tracking-[0.2em] m-0">Motor de Extracción Gemini Vision</h3>
              <span className="ml-auto text-[0.55rem] uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold">
                gemini-2.0-flash
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              {/* Dropzone */}
              <div className="space-y-4 flex flex-col h-full">
                <div
                  className="flex-1 border-2 border-dashed border-outline/50 rounded-xl p-6 text-center hover:border-primary/60 transition-colors bg-surface-container-low/50 relative flex flex-col items-center justify-center min-h-[220px] cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => !imagen && document.getElementById('file-input-ia').click()}
                >
                  {preview ? (
                    <div className="relative w-full h-full group flex flex-col items-center justify-center">
                      {preview === 'pdf' ? (
                        /* Icono para PDF */
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-20 h-24 bg-red-500/10 border-2 border-red-400/40 rounded-lg flex flex-col items-end justify-end p-1 relative">
                            <span className="absolute top-2 left-2 text-red-400 font-black text-xs">PDF</span>
                            <span className="material-symbols-outlined text-red-400 text-3xl">picture_as_pdf</span>
                          </div>
                          <p className="text-xs font-bold text-on-surface m-0 truncate max-w-[160px]">{nombreArchivo}</p>
                          <p className="text-[0.6rem] text-primary m-0">Listo para procesar con Gemini</p>
                        </div>
                      ) : (
                        /* Vista previa de imagen */
                        <img src={preview} alt="Documento cargado" className="max-h-48 mx-auto rounded-lg shadow-lg object-contain w-full h-full" />
                      )}
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <button onClick={(e) => { e.stopPropagation(); limpiar(); }} className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-400/10 px-4 py-2 rounded border border-red-400/20 cursor-pointer">
                          Remover Archivo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-5xl text-outline mb-3">document_scanner</span>
                      <p className="text-xs font-bold text-on-surface uppercase tracking-widest mb-1 m-0">Arrastra o haz clic para subir</p>
                      <p className="text-[0.65rem] text-on-surface-variant m-0">PDF, JPG, PNG, WEBP (Max 20MB)</p>
                      <label className="mt-4 inline-block px-6 py-2 border border-primary text-primary font-bold text-xs uppercase tracking-widest rounded cursor-pointer hover:bg-primary hover:text-black transition-colors">
                        Explorar
                        <input
                          id="file-input-ia"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleImagenChange}
                          className="hidden"
                        />
                      </label>
                    </>
                  )}
                </div>
                {nombreArchivo && (
                  <p className="text-[0.65rem] text-on-surface-variant font-medium truncate m-0">
                    <span className="text-primary font-bold">📄</span> {nombreArchivo}
                  </p>
                )}
                {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest m-0">{error}</p>}
              </div>

              {/* Panel de Resultados */}
              <div className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-primary flex flex-col justify-between shadow-2xl relative overflow-hidden h-full min-h-[220px]">
                {/* Overlay de procesamiento */}
                {procesando && (
                   <div className="absolute inset-0 bg-surface-container-lowest/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6">
                      <span className="material-symbols-outlined animate-spin text-primary text-4xl mb-4">memory</span>
                      <p className="text-xs font-black text-primary uppercase tracking-[0.2em] animate-pulse m-0">Analizando...</p>
                      <p className="text-[0.65rem] text-on-surface-variant mt-2 m-0">{faseProceso}</p>
                      <div className="w-32 h-1 bg-surface-container-high rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-primary animate-pulse w-full"></div>
                      </div>
                   </div>
                )}

                {resultado ? (
                  /* Resultado real de la IA */
                  <div className="flex flex-col gap-3 h-full">
                    <div className="flex justify-between items-start">
                      <span className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant font-bold">Resultado Gemini Vision</span>
                      <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded text-[0.6rem] font-black">✓ OK</span>
                    </div>
                    <div className="text-3xl font-extrabold text-on-surface tracking-tight">
                      {resultado.moneda} ${parseFloat(resultado.monto_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="space-y-1.5 text-[0.65rem] text-on-surface-variant mt-1">
                      <div className="flex justify-between"><span className="font-bold text-on-surface">Proveedor</span><span>{resultado.proveedor}</span></div>
                      <div className="flex justify-between"><span className="font-bold text-on-surface">N° Factura</span><span>{resultado.numero_factura}</span></div>
                      <div className="flex justify-between"><span className="font-bold text-on-surface">Impuestos</span><span>${parseFloat(resultado.monto_impuestos || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex justify-between"><span className="font-bold text-on-surface">Fecha</span><span>{resultado.fecha_emision || 'N/D'}</span></div>
                    </div>
                    {resultado.descripcion && (
                      <p className="text-[0.6rem] text-on-surface-variant italic border-t border-outline/20 pt-2 mt-1 m-0">"{resultado.descripcion}"</p>
                    )}
                    <div className="mt-auto pt-3 border-t border-outline/20">
                      <div className="flex justify-between items-center text-[0.6rem] uppercase tracking-widest font-bold">
                        <span className="text-on-surface-variant">Confianza IA</span>
                        <span className={getConfianzaColor(resultado.confianza)}>{resultado.confianza}%</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000"
                          style={{ width: `${resultado.confianza}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Estado vacío */
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant font-bold m-0">Estimación de Cálculo</span>
                      <span className="bg-surface-container-high text-on-surface-variant border border-outline/20 px-2 py-1 rounded text-[0.6rem] font-black">ESPERA</span>
                    </div>
                    <div className="text-4xl font-extrabold text-on-surface mb-1 tracking-tight">$0.00</div>
                    <p className="text-[0.65rem] text-on-surface-variant m-0">A la espera de documento...</p>
                    <div className="mt-auto pt-6 border-t border-outline/20">
                      <div className="flex justify-between text-[0.6rem] uppercase tracking-widest text-on-surface-variant font-bold">
                        <span>Evaluación de Riesgo</span>
                        <span className="text-outline">-</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-outline w-[5%]"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-8 flex justify-end gap-4">
              <button onClick={limpiar} className="px-6 py-3 border border-outline text-on-surface font-bold text-xs uppercase tracking-widest rounded hover:bg-surface-container-high transition-colors bg-transparent cursor-pointer">
                  Limpiar
              </button>
              <button
                onClick={procesarFactura}
                disabled={procesando || !imagen}
                className="flex gap-2 items-center px-8 py-3 bg-primary text-black font-black text-xs uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                  Ejecutar Auditoría Gemini
              </button>
            </div>
          </section>

          {/* Panel Lateral: Métricas y nota */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline flex-grow relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-[0.02] -mr-16 -mt-16 rounded-full pointer-events-none"></div>
               <h3 className="text-xs font-black text-on-surface uppercase tracking-[0.2em] mb-6 flex items-center gap-2 m-0">
                  <span className="material-symbols-outlined text-sm">monitoring</span>
                  Capacidades del Modelo
               </h3>
               <div className="space-y-5">
                  {[
                    { label: 'Precisión OCR', sublabel: 'Gemini 2.0 Flash Vision', value: '99.2%', delta: '+0.4%' },
                    { label: 'Velocidad Media', sublabel: 'Latencia API Gemini', value: '~3.5s', delta: 'Óptimo' },
                    { label: 'Idiomas Soportados', sublabel: 'Facturas multilenguaje', value: '38+', delta: 'Global' },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-surface-container-highest flex items-center justify-center border border-outline/20">
                             <span className="material-symbols-outlined text-primary text-sm">fact_check</span>
                          </div>
                          <div>
                             <p className="text-xs font-bold text-on-surface m-0">{m.label}</p>
                             <p className="text-[0.6rem] text-on-surface-variant uppercase font-medium m-0">{m.sublabel}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-on-surface m-0">{m.value}</p>
                          <p className="text-[0.6rem] text-primary font-bold m-0">{m.delta}</p>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-[0.6rem] uppercase font-black text-primary tracking-widest mb-2 m-0 flex items-center gap-1">
                     <span className="material-symbols-outlined text-[10px]">smart_toy</span> Powered by Gemini
                  </p>
                  <p className="text-[0.7rem] leading-relaxed text-on-surface-variant m-0 mt-1">
                     El modelo analiza visualmente el documento completo: texto, tablas, sellos, logos y estructura. Compatible con facturas internacionales en múltiples idiomas.
                  </p>
               </div>
            </div>
          </section>
        </div>
      )}

      {/* Historial */}
      {activeTab === 'historial' && (
        <section className="col-span-12 bg-surface-container-lowest rounded-xl border border-outline overflow-hidden shadow-xl">
          <div className="p-6 flex justify-between items-center border-b border-outline">
             <h3 className="text-[0.65rem] font-black text-on-surface uppercase tracking-[0.2em] m-0">Auditorías Verificadas — Gemini Vision</h3>
             <button onClick={cargarFacturas} className="text-[0.65rem] font-black text-primary uppercase tracking-widest hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">refresh</span> Actualizar
             </button>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left text-xs border-collapse">
                <thead>
                   <tr className="bg-surface text-on-surface-variant uppercase tracking-widest text-[0.6rem]">
                      <th className="px-6 py-4 font-black">Referencia</th>
                      <th className="px-6 py-4 font-black">Proveedor</th>
                      <th className="px-6 py-4 font-black">Moneda</th>
                      <th className="px-6 py-4 font-black">Monto Total</th>
                      <th className="px-6 py-4 font-black">Estado</th>
                      <th className="px-6 py-4 font-black">Veredicto IA</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-outline/20">
                   {loading ? (
                     <tr>
                       <td colSpan="6" className="text-center py-10 text-on-surface-variant text-xs">Cargando...</td>
                     </tr>
                   ) : facturas.length === 0 ? (
                     <tr>
                       <td colSpan="6" className="text-center py-10 text-on-surface-variant text-xs">No hay facturas registradas aún.</td>
                     </tr>
                   ) : facturas.map((f) => (
                      <tr key={f.id} className="hover:bg-primary/5 transition-colors">
                         <td className="px-6 py-4 font-bold text-on-surface border-b border-outline/10">{f.numero_factura}</td>
                         <td className="px-6 py-4 text-on-surface-variant border-b border-outline/10">{f.proveedor}</td>
                         <td className="px-6 py-4 text-on-surface-variant border-b border-outline/10">{f.moneda}</td>
                         <td className="px-6 py-4 font-black text-on-surface border-b border-outline/10">${parseFloat(f.monto_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                         <td className="px-6 py-4 border-b border-outline/10">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                              f.estado === 'validada' ? 'bg-primary/10 text-primary border-primary/20' :
                              f.estado === 'rechazada' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                              'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                            }`}>{f.estado}</span>
                         </td>
                         <td className="px-6 py-4 border-b border-outline/10">
                            {f.procesado_por_ia ? (
                               <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] uppercase border border-primary/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Gemini ✓
                               </span>
                            ) : (
                               <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-bold text-[10px] uppercase border border-outline/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant"></span> Manual
                               </span>
                            )}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </section>
      )}
    </div>
  );
}
