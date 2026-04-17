import { useState, useEffect, useRef, useCallback } from 'react';
import { contenedoresAPI, trackingAPI } from '../services/api';
import { LoadScript, GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';

const LIBRARIES = ['places'];
const AUTO_REFRESH_INTERVAL = 30000;
const FOREX_REFRESH_INTERVAL = 60000;

// Estilo oscuro del mapa
const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#020617" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#10b981" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  ],
};

const polylineOptions = {
  strokeColor: "#10b981",
  strokeOpacity: 0.85,
  strokeWeight: 2.5,
  geodesic: true,
};

const SHIP_ICON = {
  path: "M12 2L8 7H4L2 12L12 20L22 12L20 7H16L12 2Z",
  fillColor: "#10b981",
  fillOpacity: 1,
  strokeColor: "#000",
  strokeWeight: 1.5,
  scale: 1.8,
  anchor: { x: 12, y: 12 },
};

const HISTORY_ICON = {
  path: "M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z",
  fillColor: "#10b981",
  fillOpacity: 0.35,
  strokeColor: "#10b981",
  strokeWeight: 1,
  scale: 0.5,
};

// Pares de divisas con la clave que retorna Frankfurter (base USD)
// Frankfurter API devuelve rates.EUR, rates.COP, rates.CNY, rates.GBP
const FOREX_PAIRS = [
  { key: 'EUR',  label: 'USD / EUR', from: 'USD', to: 'EUR', impacto: 'Costo de Viaje',         invert: false },
  { key: 'CNY',  label: 'CNY / USD', from: 'CNY', to: 'USD', impacto: 'Gastos de Carga',         invert: true  },
  { key: 'COP',  label: 'USD / COP', from: 'USD', to: 'COP', impacto: 'Operaciones Colombia',    invert: false },
  { key: 'GBP',  label: 'EUR / GBP', from: 'EUR', to: 'GBP', impacto: 'Ruta Europea',            invert: false },
];

async function fetchForex() {
  // Frankfurter API — datos del BCE, sin API key
  const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,COP,CNY,GBP');
  if (!res.ok) throw new Error('Forex unavailable');
  return res.json(); // { base: 'USD', date: '...', rates: { EUR: 0.92, COP: 4200, CNY: 7.2, GBP: 0.79 } }
}

function calcularProgreso(estado) {
  const m = { en_puerto_origen:10, en_transito:50, en_aduana:80, en_puerto_destino:95, entregado:100 };
  return m[estado] ?? 50;
}

export default function Tracking() {
  const [contenedores, setContenedores] = useState([]);
  const [contenedorSeleccionado, setContenedorSeleccionado] = useState(null);
  const [ubicacionActual, setUbicacionActual] = useState(null);
  const [historialRuta, setHistorialRuta] = useState([]);
  const [infoWindowAbierta, setInfoWindowAbierta] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // Paneles colapsables
  const [panelIzqColapsado, setPanelIzqColapsado] = useState(false);
  const [panelDerColapsado, setPanelDerColapsado] = useState(false);

  // Forex
  const [forexData, setForexData] = useState(null);
  const [forexPrev, setForexPrev] = useState(null);
  const [forexUltima, setForexUltima] = useState(null);
  const [forexLoading, setForexLoading] = useState(true);

  const mapRef = useRef(null);
  const intervalRef = useRef(null);
  const forexIntervalRef = useRef(null);

  const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    cargarContenedores();
    cargarForex();
    forexIntervalRef.current = setInterval(cargarForex, FOREX_REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (forexIntervalRef.current) clearInterval(forexIntervalRef.current);
    };
  }, []);

  const cargarContenedores = async () => {
    try {
      const data = await contenedoresAPI.getAll();
      setContenedores(data);
      setError('');
    } catch { setError('Error al cargar contenedores'); }
    finally { setLoading(false); }
  };

  const cargarForex = async () => {
    try {
      const data = await fetchForex();
      // Usamos la forma funcional para leer el estado actual (evita stale closure)
      setForexData(prev => {
        // Guardar el anterior como "prev" para calcular delta en siguiente ciclo
        if (prev?.rates) setForexPrev(prev.rates);
        return data;
      });
      setForexUltima(new Date());
    } catch (e) {
      console.warn('Forex API no disponible:', e.message);
    } finally {
      setForexLoading(false);
    }
  };

  const cargarTracking = useCallback(async (id) => {
    if (!id) return;
    setActualizando(true);
    setError('');
    try {
      const historial = await trackingAPI.getHistory(id);
      if (historial?.length > 0) {
        const ordenado = [...historial].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setHistorialRuta(ordenado.map(t => ({ lat: t.latitud, lng: t.longitud })));
        const ult = ordenado[ordenado.length - 1];
        setUbicacionActual({ lat: ult.latitud, lng: ult.longitud, velocidad: ult.velocidad, estado: ult.estado, timestamp: ult.timestamp });
        if (mapRef.current) { mapRef.current.panTo({ lat: ult.latitud, lng: ult.longitud }); mapRef.current.setZoom(6); }
      } else {
        setUbicacionActual(null); setHistorialRuta([]);
        setError('Sin datos de tracking. Ejecuta el simulador de rutas.');
      }
      setUltimaActualizacion(new Date());
    } catch { setError('Sin datos de tracking.'); setUbicacionActual(null); setHistorialRuta([]); }
    finally { setActualizando(false); }
  }, []);

  const handleSeleccionContenedor = (id) => {
    setContenedorSeleccionado(id);
    setInfoWindowAbierta(false);
    cargarTracking(id);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => cargarTracking(id), AUTO_REFRESH_INTERVAL);
  };

  const onMapLoad = (map) => { mapRef.current = map; };

  const center = ubicacionActual ? { lat: ubicacionActual.lat, lng: ubicacionActual.lng } : { lat: 15, lng: 20 };
  const contenedorActual = contenedores.find(c => c.id === contenedorSeleccionado);
  const progreso = calcularProgreso(contenedorActual?.estado || ubicacionActual?.estado || '');

  // Obtener valor de la tasa para mostrar
  const getForexRate = (key, invert) => {
    const rate = forexData?.rates?.[key];
    if (!rate) return null;
    return invert ? (1 / rate) : rate;
  };

  const getForexDelta = (key) => {
    const curr = forexData?.rates?.[key];
    const prev = forexPrev?.[key];
    if (!curr || !prev || curr === prev) return null;
    return ((curr - prev) / prev) * 100;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full min-h-[500px]">
      <div className="text-[10px] uppercase tracking-widest text-primary animate-pulse font-bold">Estableciendo conexión satelital...</div>
    </div>
  );

  const MapContent = () => (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={center}
      zoom={ubicacionActual ? 5 : 2}
      options={mapOptions}
      onLoad={onMapLoad}
    >
      {historialRuta.length > 1 && <Polyline path={historialRuta} options={polylineOptions} />}
      {historialRuta.slice(0, -1).filter((_, i) => i % 5 === 0).map((p, i) => (
        <Marker key={`h-${i}`} position={p} icon={HISTORY_ICON} zIndex={1} />
      ))}
      {ubicacionActual && (
        <Marker position={{ lat: ubicacionActual.lat, lng: ubicacionActual.lng }} icon={SHIP_ICON} zIndex={10}
          animation={window.google?.maps?.Animation?.BOUNCE} onClick={() => setInfoWindowAbierta(true)}>
          {infoWindowAbierta && (
            <InfoWindow position={{ lat: ubicacionActual.lat, lng: ubicacionActual.lng }} onCloseClick={() => setInfoWindowAbierta(false)}>
              <div style={{ color: '#000', fontSize: '12px', minWidth: '160px' }}>
                <strong style={{ color: '#10b981', fontSize: '13px' }}>{contenedorActual?.codigo || 'Contenedor'}</strong><br/>
                {contenedorActual?.puerto_origen && <><span>🛫 de {contenedorActual.puerto_origen}</span><br/></>}
                {contenedorActual?.puerto_destino && <><span>🛬 a {contenedorActual.puerto_destino}</span><br/></>}
                <span>📍 {ubicacionActual.lat.toFixed(4)}, {ubicacionActual.lng.toFixed(4)}</span><br/>
                {ubicacionActual.velocidad && <><span>⚡ {ubicacionActual.velocidad} kts</span><br/></>}
                <span>📦 {ubicacionActual.estado || contenedorActual?.estado || 'En tránsito'}</span><br/>
                <span style={{ color: '#666', fontSize: '10px' }}>🕐 {ubicacionActual.timestamp ? new Date(ubicacionActual.timestamp).toLocaleString('es-CO') : 'Ahora'}</span>
              </div>
            </InfoWindow>
          )}
        </Marker>
      )}
    </GoogleMap>
  );

  return (
    <div className="absolute inset-0 z-0 h-[calc(100vh-64px)] overflow-hidden text-left mt-[-30px] mx-[-30px]">

      {/* FONDO: Mapa */}
      <div className="absolute inset-0 bg-background z-0">
        {GOOGLE_MAPS_KEY ? (
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_KEY} libraries={LIBRARIES}><MapContent /></LoadScript>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-red-400 font-bold text-sm uppercase">API Key no configurada</div>
        )}
      </div>

      {/* Gradiente superior */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background to-transparent pointer-events-none z-10"></div>

      {/* CAPA DE INTERFAZ */}
      <div className="relative z-10 w-full h-full flex pointer-events-none">

        {/* ========== PANEL IZQUIERDO (colapsable) ========== */}
        <div className={`flex flex-col transition-all duration-300 ease-in-out ${panelIzqColapsado ? 'w-12' : 'w-[420px] max-w-[45vw]'}`}>

          {/* Botón colapsar izq */}
          <button
            onClick={() => setPanelIzqColapsado(p => !p)}
            className="pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-surface/90 border border-outline/20 border-l-0 rounded-r-lg p-1.5 shadow-lg hover:bg-primary/20 hover:text-primary transition-colors backdrop-blur-md cursor-pointer"
            style={{ left: panelIzqColapsado ? '48px' : 'calc(min(420px, 45vw) - 1px)' }}
            title={panelIzqColapsado ? 'Expandir panel' : 'Colapsar panel'}
          >
            <span className="material-symbols-outlined text-on-surface text-sm block">
              {panelIzqColapsado ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>

          {/* Contenido del panel izquierdo */}
          <div className={`flex-1 p-6 pt-16 overflow-y-auto transition-opacity duration-200 ${panelIzqColapsado ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
            <div className="flex flex-col gap-5">

              {/* Selector + Estado */}
              <div className="dashboard-glass-panel p-5 rounded-xl border-l-4 border-primary shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">anchor</span>
                    <h2 className="text-on-surface font-headline text-lg font-extrabold tracking-tight m-0">Tracking Satelital</h2>
                  </div>
                  {contenedorSeleccionado && (
                    <span className={`text-[0.55rem] text-on-surface-variant uppercase tracking-widest font-bold flex items-center gap-1 ${actualizando ? 'text-primary animate-pulse' : ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${actualizando ? 'bg-yellow-400' : 'bg-primary animate-pulse'}`}></span>
                      {actualizando ? 'Sync...' : 'EN VIVO'}
                    </span>
                  )}
                </div>

                <div className="px-3 py-2 bg-surface-container-high rounded mb-3">
                  <select
                    className="bg-transparent border-none text-on-surface focus:ring-0 uppercase tracking-widest font-bold cursor-pointer w-full text-xs"
                    value={contenedorSeleccionado || ''}
                    onChange={e => { if (e.target.value) handleSeleccionContenedor(e.target.value); }}
                  >
                    <option value="" disabled className="bg-surface">— Seleccionar Contenedor —</option>
                    {contenedores.map(c => <option key={c.id} value={c.id} className="bg-surface">{c.codigo} ({c.estado?.replace(/_/g,' ')})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant font-bold m-0">Código</p>
                    <p className="text-on-surface font-bold text-sm m-0">{contenedorActual?.codigo || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant font-bold m-0">Estado</p>
                    <p className="text-primary font-bold text-sm flex items-center gap-1 m-0 capitalize">
                      <span className="material-symbols-outlined text-xs">{contenedorActual ? 'sailing' : 'not_listed_location'}</span>
                      {contenedorActual ? contenedorActual.estado.replace(/_/g, ' ') : '—'}
                    </p>
                  </div>
                  {contenedorActual?.puerto_origen && (
                    <div className="col-span-2">
                       <p className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant font-bold m-0">Origen → Destino</p>
                       <p className="text-on-surface font-bold text-xs m-0">
                          {contenedorActual.puerto_origen} <span className="text-primary">→</span> {contenedorActual.puerto_destino || '...'}
                       </p>
                    </div>
                  )}
                </div>
                {error && <p className="text-red-400 text-[0.6rem] font-bold mt-3 uppercase tracking-widest m-0">{error}</p>}
              </div>

              {/* Telemetría */}
              {contenedorActual && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="dashboard-glass-panel p-4 rounded-lg border border-outline/10">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[0.55rem] uppercase tracking-widest text-on-surface-variant font-bold m-0">LAT/LNG</p>
                        <span className="material-symbols-outlined text-primary text-sm">sensors</span>
                      </div>
                      {ubicacionActual ? (
                        <div>
                          <span className="text-sm font-extrabold text-on-surface block">{ubicacionActual.lat.toFixed(4)}°</span>
                          <span className="text-sm font-extrabold text-on-surface block">{ubicacionActual.lng.toFixed(4)}°</span>
                          {ubicacionActual.velocidad && <p className="text-[0.55rem] text-primary font-bold m-0 mt-1">⚡ {ubicacionActual.velocidad} kts</p>}
                        </div>
                      ) : <span className="text-on-surface-variant text-xs">Sin datos</span>}
                      <div className="w-full bg-surface-container-high h-1 mt-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full w-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="dashboard-glass-panel p-4 rounded-lg border border-outline/10">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[0.55rem] uppercase tracking-widest text-on-surface-variant font-bold m-0">Tipo</p>
                        <span className="material-symbols-outlined text-primary text-sm">inventory_2</span>
                      </div>
                      <span className="text-lg font-bold text-on-surface uppercase block">{contenedorActual.tipo}</span>
                      <p className="text-[0.55rem] text-primary font-bold m-0 mt-1">{historialRuta.length} pts de ruta</p>
                      {ultimaActualizacion && <p className="text-[0.5rem] text-on-surface-variant m-0">↻ {ultimaActualizacion.toLocaleTimeString('es-CO')}</p>}
                    </div>
                  </div>

                  {/* Progreso */}
                  <div className="dashboard-glass-panel p-5 rounded-lg border border-outline/10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[0.65rem] uppercase tracking-widest text-on-surface font-extrabold m-0">Progreso de Tránsito</h3>
                      <span className="text-xs font-bold text-primary">{progreso}%</span>
                    </div>
                    <div className="relative flex items-center justify-between w-full px-2">
                      <div className="absolute h-[2px] bg-outline/20 w-full left-0 top-1.5"></div>
                      <div className="absolute h-[2px] bg-primary left-0 top-1.5 transition-all duration-700" style={{ width: `${progreso}%` }}></div>
                      {[0,25,50,75,100].map((t, i) => (
                        <div key={i} className={`relative z-10 rounded-full ring-4 ring-surface ${progreso >= t ? 'w-3 h-3 bg-primary' : 'w-3 h-3 bg-surface-container-high'}`}></div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-3">
                      {['ORIGEN','TRÁNSITO','ADUANA','DESTINO','OK'].map((l, i) => (
                        <span key={l} className={`text-[0.5rem] font-bold ${i === Math.round(progreso/25) ? 'text-primary' : 'text-on-surface-variant'}`}>{l}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ESPACIO CENTRAL (el mapa) */}
        <div className="flex-1"></div>

        {/* ========== PANEL DERECHO (colapsable) ========== */}
        <div className={`flex flex-col transition-all duration-300 ease-in-out relative ${panelDerColapsado ? 'w-12' : 'w-80'}`}>

          {/* Botón colapsar der */}
          <button
            onClick={() => setPanelDerColapsado(p => !p)}
            className="pointer-events-auto absolute -left-3 top-1/2 -translate-y-1/2 z-20 bg-surface/90 border border-outline/20 rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-primary/20 hover:text-primary transition-colors backdrop-blur-md cursor-pointer"
            title={panelDerColapsado ? 'Expandir' : 'Colapsar panel de mercado'}
          >
            <span className="material-symbols-outlined text-on-surface text-xs">
              {panelDerColapsado ? 'chevron_left' : 'chevron_right'}
            </span>
          </button>

          {/* Contenido del panel derecho */}
          <div className={`bg-surface/95 backdrop-blur-xl border-l border-outline/10 shadow-2xl flex flex-col h-full pointer-events-auto transition-opacity duration-200 ${panelDerColapsado ? 'opacity-0 overflow-hidden' : 'opacity-100'}`}>
            <div className="p-5 border-b border-outline/10 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline font-extrabold text-on-surface text-lg tracking-tight m-0">Mercados</h2>
                  <p className="text-[0.6rem] uppercase tracking-widest text-primary font-bold mt-0.5 m-0">Forex en Tiempo Real • BCE</p>
                </div>
                {forexUltima && (
                  <span className="text-[0.5rem] text-on-surface-variant font-medium">
                    ↻ {forexUltima.toLocaleTimeString('es-CO')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Tasas de cambio en vivo */}
              <div>
                <span className="text-[0.65rem] font-extrabold text-on-surface-variant tracking-wider uppercase block mb-3">Índices de Divisas</span>
                <div className="space-y-2">
                  {FOREX_PAIRS.map(pair => {
                    const rate = getForexRate(pair.key, pair.invert);
                    const delta = getForexDelta(pair.key);
                    const isUp = delta !== null && delta >= 0;

                    return (
                      <div key={pair.label} className="bg-background/50 p-3 rounded-lg border border-outline/5">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-sm font-bold">{pair.label}</span>
                          {forexLoading ? (
                            <span className="text-[0.6rem] text-on-surface-variant animate-pulse">...</span>
                          ) : rate ? (
                            <span className={`text-xs font-bold flex items-center gap-1 ${delta === null ? 'text-on-surface-variant' : isUp ? 'text-primary' : 'text-red-400'}`}>
                              <span className="material-symbols-outlined text-xs">{delta === null ? 'remove' : isUp ? 'trending_up' : 'trending_down'}</span>
                              {delta !== null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(3)}%` : '—'}
                            </span>
                          ) : (
                            <span className="text-[0.6rem] text-red-400">sin datos</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[0.6rem] text-on-surface-variant font-medium m-0">IMPACTO: {pair.impacto}</p>
                          {rate && (
                            <span className="text-[0.6rem] font-black text-on-surface">{rate.toFixed(4)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extras de costo */}
              <div className="space-y-2 pt-1">
                <span className="text-[0.65rem] font-extrabold text-on-surface-variant tracking-wider uppercase block">Elementos de Costo</span>
                <div className="flex justify-between items-center p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-xs">local_gas_station</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold m-0">Ajuste Combustible</p>
                      <p className="text-[0.55rem] text-on-surface-variant m-0">LSF Premium</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold">$14,200</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-xs">anchor</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold m-0">Tarifa Portuaria</p>
                      <p className="text-[0.55rem] text-on-surface-variant m-0">THC Destino</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold">$3,850</span>
                </div>
              </div>

              {/* CTA cobertura */}
              <div className="bg-primary p-4 rounded-xl relative overflow-hidden group shadow-lg shadow-primary/10">
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-7xl text-on-primary">account_balance</span>
                </div>
                <h4 className="text-on-primary font-extrabold text-sm mb-1 m-0">Oportunidad de Cobertura</h4>
                <p className="text-on-primary/70 text-[0.6rem] leading-relaxed mb-3 font-medium m-0">Fije el tipo de cambio por 30 días para ahorrar ~$14k.</p>
                <button className="w-full bg-black text-primary py-2 rounded font-extrabold text-[0.6rem] uppercase tracking-widest hover:bg-surface-container-lowest border-none transition-colors cursor-pointer">
                  Ejecutar Cobertura
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles flotantes */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 p-1.5 bg-surface/80 backdrop-blur-xl rounded-full border border-outline/20 shadow-2xl">
        <button onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() || 5) + 1)} className="p-2.5 bg-surface text-on-surface rounded-full flex items-center justify-center hover:bg-outline/20 transition-colors border-none cursor-pointer pointer-events-auto">
          <span className="material-symbols-outlined text-lg">zoom_in</span>
        </button>
        <button onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() || 5) - 1)} className="p-2.5 bg-surface text-on-surface rounded-full flex items-center justify-center hover:bg-outline/20 transition-colors border-none cursor-pointer pointer-events-auto">
          <span className="material-symbols-outlined text-lg">zoom_out</span>
        </button>
        {ubicacionActual && (
          <button onClick={() => { mapRef.current?.panTo({ lat: ubicacionActual.lat, lng: ubicacionActual.lng }); mapRef.current?.setZoom(7); }} className="p-2.5 bg-primary text-black rounded-full flex items-center justify-center shadow-lg hover:-translate-y-1 transition-transform border-none cursor-pointer pointer-events-auto">
            <span className="material-symbols-outlined text-lg">my_location</span>
          </button>
        )}
        <div className="w-[1px] bg-outline/20 mx-1"></div>
        <button onClick={() => contenedorSeleccionado && cargarTracking(contenedorSeleccionado)} className="p-2.5 bg-surface text-on-surface rounded-full flex items-center justify-center hover:bg-outline/20 transition-colors px-5 gap-2 border-none cursor-pointer pointer-events-auto">
          <span className="material-symbols-outlined text-lg">refresh</span>
          <span className="text-[0.6rem] font-extrabold uppercase tracking-widest text-white">Actualizar</span>
        </button>
      </div>
    </div>
  );
}
