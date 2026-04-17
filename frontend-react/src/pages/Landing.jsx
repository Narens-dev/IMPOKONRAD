import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const [codigoRastreo, setCodigoRastreo] = useState('');
  const [rastreoError, setRastreoError] = useState('');
  const [showConsultaModal, setShowConsultaModal] = useState(false);
  const [consultaForm, setConsultaForm] = useState({ nombre: '', empresa: '', email: '', mensaje: '' });
  const [consultaEnviada, setConsultaEnviada] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterOk, setNewsletterOk] = useState(false);

  const heroRef = useRef(null);
  const serviciosRef = useRef(null);
  const rastreoRef = useRef(null);
  const rastreoInputRef = useRef(null);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRastrear = (e) => {
    e?.preventDefault();
    const codigo = codigoRastreo.trim();
    if (!codigo) {
      setRastreoError('Ingresa un número de guía o código de contenedor.');
      return;
    }
    // Redirigir al tracking con el código como query param
    navigate(`/login?redirect=/tracking&codigo=${encodeURIComponent(codigo)}`);
  };

  const handleConsulta = (e) => {
    e.preventDefault();
    // Simular envío
    setConsultaEnviada(true);
    setTimeout(() => {
      setShowConsultaModal(false);
      setConsultaEnviada(false);
      setConsultaForm({ nombre: '', empresa: '', email: '', mensaje: '' });
    }, 2500);
  };

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterOk(true);
      setTimeout(() => setNewsletterOk(false), 3000);
      setNewsletterEmail('');
    }
  };

  return (
    <div className="landing-theme text-left w-full h-full overflow-y-auto">

      {/* ===== NAVBAR ===== */}
      <header className="bg-primary sticky top-0 z-50" ref={heroRef}>
        <nav className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
          <div className="text-2xl font-bold text-white tracking-tight font-headline cursor-pointer" onClick={() => scrollTo(heroRef)}>
            ImpoKonrad
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollTo(heroRef)}
              className="text-white border-b-2 border-secondary-container pb-1 font-medium transition-all font-label uppercase text-[0.75rem] tracking-[0.05em] cursor-pointer bg-transparent border-x-0 border-t-0"
            >
              Inicio
            </button>
            <button
              onClick={() => scrollTo(serviciosRef)}
              className="text-slate-300 font-medium hover:text-white transition-colors duration-200 font-label uppercase text-[0.75rem] tracking-[0.05em] cursor-pointer bg-transparent border-none hover:border-b hover:border-white pb-1"
            >
              Servicios
            </button>
            <button
              onClick={() => {
                scrollTo(rastreoRef);
                setTimeout(() => rastreoInputRef.current?.focus(), 600);
              }}
              className="text-slate-300 font-medium hover:text-white transition-colors duration-200 font-label uppercase text-[0.75rem] tracking-[0.05em] cursor-pointer bg-transparent border-none hover:border-b hover:border-white pb-1"
            >
              Rastreo
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="bg-secondary-container text-on-secondary-container border-none px-6 py-2.5 rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-transform cursor-pointer no-underline block text-center">
              INGRESAR
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ===== HERO ===== */}
        <section className="relative min-h-[870px] flex items-center overflow-hidden bg-gradient-to-br from-[#000f22] to-[#0a2540]">
          <div className="absolute inset-0 z-0">
            <img
               className="w-full h-full object-cover opacity-30 mix-blend-overlay"
               alt="dramatic wide shot of a massive container ship at sea during twilight"
               src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMUNEaFHBOc6hkCEu2UIONuD4PlGuRBfG4zCyHGQWssF_mNS6rrpiyjfk9mDE4ab9pwv1MEVHq0AMVaZ1UMJN7scE_ijHHjEXBA3PkbJ2zpW2Henru_6HS4uIdJJlXAe2C0OK-uyhIrFHHwPBugIpJQ_oMfiqbkXvh7zwTPxDFGUj6hMW4fosToK_6NrJ5D71lrN7E7Koauvqn7PxQmInoDjVuUOxqFU0q9RcFvtz8thwuRvOs_TLi7X_Q_ljduZxeeUhH03hs8UE"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent"></div>
          </div>

          <div className="container mx-auto px-8 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl">
              <span className="inline-block text-on-tertiary-container font-label uppercase tracking-[0.15em] text-xs mb-6 font-semibold">
                Inteligencia Aduanera y Logística
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white font-headline leading-[1.1] tracking-tight mb-8 m-0">
                Comercio Global <br/>
                <span className="text-secondary-container">Simplificado.</span>
              </h1>
              <p className="text-on-primary-container text-xl leading-relaxed mb-10 max-w-lg m-0">
                Orquestamos el comercio internacional con precisión arquitectónica en corretaje de aduanas y gestión de cadena de suministro de extremo a extremo.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-secondary-container border-none text-on-secondary-container px-8 py-4 rounded-xl font-bold text-lg hover:-translate-y-1 transition-transform cursor-pointer"
                >
                  Ingresar a la Plataforma
                </button>
                <button
                  onClick={() => {
                    scrollTo(serviciosRef);
                  }}
                  className="bg-transparent border border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Ver Servicios
                </button>
              </div>
            </div>

            {/* ===== CARD DE RASTREO PÚBLICO ===== */}
            <div className="lg:pl-12" ref={rastreoRef}>
              <div className="bg-white/5 backdrop-blur-xl border border-outline-variant/20 p-8 rounded-xl shadow-2xl relative">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                     package_2
                  </span>
                  <h3 className="text-white font-headline font-bold text-xl m-0">Rastree su Envío</h3>
                </div>
                <form onSubmit={handleRastrear} className="space-y-4">
                  <div className="relative">
                    <input
                      ref={rastreoInputRef}
                      className="w-full bg-surface-container-highest/10 border-0 border-b-2 border-outline-variant/20 focus:border-secondary-container focus:ring-0 outline-none px-4 py-4 text-white placeholder-slate-400 font-body transition-all"
                      placeholder="Ingrese Número de Guía o BL"
                      type="text"
                      value={codigoRastreo}
                      onChange={(e) => { setCodigoRastreo(e.target.value); setRastreoError(''); }}
                    />
                  </div>
                  {rastreoError && (
                    <p className="text-red-400 text-xs font-bold uppercase tracking-widest m-0">{rastreoError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-white border-none text-primary font-bold py-4 rounded-xl hover:bg-slate-100 transition-colors flex justify-center items-center gap-2 cursor-pointer"
                  >
                    <span>Buscar Carga</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                  <p className="text-slate-400 text-[0.7rem] uppercase tracking-widest text-center mt-4 m-0">
                    telemetría en tiempo real de buques y carga aérea
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SERVICIOS ===== */}
        <section id="servicios" className="py-24 bg-surface-container-low" ref={serviciosRef}>
          <div className="container mx-auto px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
              <div className="max-w-xl">
                <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-4 m-0">Infraestructura Logística Central</h2>
                <p className="text-on-surface-variant text-lg m-0">
                   Desplegamos soluciones multimodales especializadas en tres continentes con despacho de aduanas integrado.
                </p>
              </div>
              <div className="flex space-x-12 pb-2">
                <div className="text-center">
                  <div className="text-3xl font-bold font-headline text-on-tertiary-container m-0">142+</div>
                  <div className="text-[0.65rem] uppercase tracking-widest font-semibold text-slate-500 m-0">Puertos Cubiertos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold font-headline text-on-tertiary-container m-0">2.4M</div>
                  <div className="text-[0.65rem] uppercase tracking-widest font-semibold text-slate-500 m-0">TEUs Manejados</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: 'flight_takeoff', title: 'Carga Aérea',
                  desc: 'Envíos prioritarios de alta velocidad con corretaje integrado para distribución global urgente.',
                  items: ['Fletamento Directo', 'Cadena de Frío Express'],
                  cta: 'Solicitar Cotización Aérea',
                },
                {
                  icon: 'directions_boat', title: 'Carga Marítima',
                  desc: 'Envío de contenedores optimizado (FCL/LCL) mediante alianzas globales y atraque prioritario.',
                  items: ['Conexión Intermodal', 'Carga a Granel'],
                  cta: 'Ver Rutas Marítimas',
                  featured: true,
                },
                {
                  icon: 'verified_user', title: 'Corretaje Aduanero',
                  desc: 'Navegando regulaciones internacionales complejas y cumplimiento arancelario con precisión.',
                  items: ['Portales de Cumplimiento Digital', 'Asesoría en Optimización Fiscal'],
                  cta: 'Contactar Agente',
                },
              ].map((s) => (
                <div
                  key={s.title}
                  className={`group p-8 rounded-xl transition-all duration-300 hover:-translate-y-2 shadow-sm ${
                    s.featured
                      ? 'bg-surface-container-lowest border-t-4 border-t-secondary-container border-x border-b border-outline-variant/20'
                      : 'bg-surface-container-lowest border border-outline-variant/20'
                  }`}
                >
                  <div className="w-14 h-14 bg-surface-container rounded-lg flex items-center justify-center mb-8 group-hover:bg-primary transition-colors">
                    <span className="material-symbols-outlined text-primary group-hover:text-white">{s.icon}</span>
                  </div>
                  <h4 className="text-xl font-bold font-headline text-primary mb-4 m-0">{s.title}</h4>
                  <p className="text-on-surface-variant leading-relaxed mb-6 m-0">{s.desc}</p>
                  <ul className="space-y-3 text-sm font-medium text-slate-600 mb-8 p-0 list-none m-0">
                    {s.items.map(item => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-on-tertiary-container text-xs">check_circle</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setShowConsultaModal(true)}
                    className="w-full py-3 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer bg-transparent"
                  >
                    {s.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TRUST / NETWORK ===== */}
        <section className="py-32 relative overflow-hidden bg-background">
          <div className="container mx-auto px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <div className="relative">
                <div className="aspect-square bg-surface-container rounded-2xl overflow-hidden shadow-xl">
                  <img
                    className="w-full h-full object-cover"
                    alt="industrial harbor at dusk with glowing city lights"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmd8XaRvs6__r03TD4iB588INB3a0Nd_VkO2fr0CXA_WbILHzs4VGjBFezCRrRbIhr5nr3IBfgUr-kQpvysHIRWh0efs3O7pOm_PvdjA5YiOrvO4AW_aj8Wz_LYNB37LTABOXQh8WrZcVOqo9AD5jZ5RDw_ffT2bAQzCqNmfll6AckJKBkEzyy-DNdyNU5Iey40djxH4z9MDMhCTv10yLO4ZfccIPA-7JqyN2zik1w622Gi8ChiJbG0b56lU8CmPBgfWqrFwEkUHA"
                  />
                </div>
                <div className="absolute -bottom-8 -right-8 bg-primary p-10 rounded-xl shadow-2xl">
                  <div className="text-5xl font-extrabold text-white mb-2 m-0">25+</div>
                  <div className="text-on-primary-container font-label uppercase text-[0.65rem] tracking-widest font-bold m-0">Años de Excelencia Arquitectónica</div>
                </div>
              </div>

              <div>
                <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-8 m-0">
                  Arquitectando la Columna Vertebral del Comercio Global
                </h2>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-12 m-0">
                  Nuestra red es más que simples rutas de envío. Proporcionamos la integridad estructural que las empresas necesitan para expandirse a través de las fronteras sin la fricción de retrasos aduaneros o puntos ciegos logísticos.
                </p>
                <div className="grid grid-cols-2 gap-8 mb-12">
                  <div className="space-y-4">
                    <div className="w-10 h-1 border-t-2 border-secondary-container"></div>
                    <h5 className="font-bold text-primary m-0">Certificación Global</h5>
                    <p className="text-sm text-on-surface-variant m-0">Certificados por IATA, FIATA y OEA para máxima seguridad y velocidad.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="w-10 h-1 border-t-2 border-secondary-container"></div>
                    <h5 className="font-bold text-primary m-0">Rastreo Digital Twin</h5>
                    <p className="text-sm text-on-surface-variant m-0">Tecnología que proporciona representación digital de carga global.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-8 grayscale opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl">architecture</span>
                    <span className="font-bold text-sm tracking-tighter">ISO 9001</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl">public</span>
                    <span className="font-bold text-sm tracking-tighter">MIEMBRO IATA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl">shield</span>
                    <span className="font-bold text-sm tracking-tighter">CONFIANZA OEA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="py-24 bg-primary text-white">
          <div className="container mx-auto px-8 text-center max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-extrabold font-headline mb-8 tracking-tight m-0">
              ¿Listo para optimizar su cadena de suministro global?
            </h2>
            <p className="text-on-primary-container text-xl mb-12 m-0">
              Conéctese hoy mismo con nuestros arquitectos logísticos para una auditoría de infraestructura y cotización.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <button
                onClick={() => setShowConsultaModal(true)}
                className="w-full sm:w-auto bg-secondary-container border-none text-on-secondary-container px-12 py-5 rounded-xl font-bold text-lg hover:scale-105 transition-transform cursor-pointer"
              >
                Programar Consulta
              </button>
              <button
                onClick={() => {
                  scrollTo(rastreoRef);
                  setTimeout(() => rastreoInputRef.current?.focus(), 600);
                }}
                className="w-full sm:w-auto border border-outline-variant/30 bg-transparent px-12 py-5 rounded-xl font-bold text-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Rastrear Envío
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#0a2540]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 px-12 py-16 w-full max-w-screen-2xl mx-auto">
          <div>
            <div className="text-xl font-bold text-white mb-6">ImpoKonrad</div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs m-0">
                Logística de precisión y corretaje de aduanas para la empresa global moderna. Construido para escalar, diseñado para la velocidad.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <h6 className="text-[0.75rem] uppercase tracking-wider text-on-tertiary-container font-bold mb-2 m-0">Compañía</h6>
              <button onClick={() => scrollTo(serviciosRef)} className="text-slate-400 text-sm hover:text-white transition-colors cursor-pointer text-left bg-transparent border-none">Servicios</button>
              <a className="text-slate-400 text-sm hover:text-white transition-colors cursor-pointer">Política de Privacidad</a>
              <a className="text-slate-400 text-sm hover:text-white transition-colors cursor-pointer">Términos de Servicio</a>
            </div>
            <div className="flex flex-col gap-4">
              <h6 className="text-[0.75rem] uppercase tracking-wider text-on-tertiary-container font-bold mb-2 m-0">Red</h6>
              <button onClick={() => setShowConsultaModal(true)} className="text-slate-400 text-sm hover:text-white transition-colors cursor-pointer text-left bg-transparent border-none">Contáctenos</button>
              <button onClick={() => { scrollTo(rastreoRef); setTimeout(() => rastreoInputRef.current?.focus(), 600); }} className="text-slate-400 text-sm hover:text-white transition-colors cursor-pointer text-left bg-transparent border-none">Rastrear Envío</button>
              <a className="text-slate-400 text-sm hover:text-white transition-colors cursor-pointer">Centro de Soporte</a>
            </div>
          </div>
          <div className="space-y-6 flex flex-col gap-4">
            <h6 className="text-[0.75rem] uppercase tracking-wider text-on-tertiary-container font-bold m-0">Boletín Informativo</h6>
            <form onSubmit={handleNewsletter} className="flex items-center">
              <input
                className="bg-transparent border-0 border-b border-outline-variant/30 px-0 py-2 text-white w-full outline-none focus:ring-0 text-sm placeholder:text-slate-500"
                placeholder="Su correo electrónico"
                type="email"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
              />
              <button type="submit" className="material-symbols-outlined text-on-tertiary-container ml-4 bg-transparent border-none cursor-pointer hover:text-white">
                arrow_forward
              </button>
            </form>
            {newsletterOk && <p className="text-primary text-xs font-bold uppercase tracking-widest m-0">✓ ¡Suscrito! Gracias.</p>}
            <div className="flex gap-4 pt-2">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-lg">share</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container-highest/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-lg">public</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-outline-variant/5 px-12 py-8 flex justify-center w-full">
          <p className="text-[0.75rem] uppercase tracking-wider text-slate-500 font-medium m-0">© 2026 ImpoKonrad Logistics. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* ===== MODAL CONSULTA ===== */}
      {showConsultaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0a2540] border border-outline-variant/20 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-primary p-6 flex justify-between items-center">
              <div>
                <h3 className="text-white font-extrabold text-lg m-0">Programar Consulta</h3>
                <p className="text-on-primary-container text-xs uppercase tracking-widest m-0 mt-1">Nuestros arquitectos logísticos te contactarán en 24h</p>
              </div>
              <button onClick={() => setShowConsultaModal(false)} className="text-white/70 hover:text-white bg-transparent border-none cursor-pointer transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {consultaEnviada ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-primary text-6xl block mb-4">check_circle</span>
                <h4 className="text-white font-extrabold text-xl m-0">¡Solicitud Recibida!</h4>
                <p className="text-slate-400 mt-2 m-0">Un experto te contactará dentro de las próximas 24 horas hábiles.</p>
              </div>
            ) : (
              <form onSubmit={handleConsulta} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.65rem] uppercase tracking-widest font-bold text-slate-400 mb-1">Nombre *</label>
                    <input
                      required
                      type="text"
                      value={consultaForm.nombre}
                      onChange={e => setConsultaForm({...consultaForm, nombre: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-secondary-container placeholder:text-slate-500"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.65rem] uppercase tracking-widest font-bold text-slate-400 mb-1">Empresa *</label>
                    <input
                      required
                      type="text"
                      value={consultaForm.empresa}
                      onChange={e => setConsultaForm({...consultaForm, empresa: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-secondary-container placeholder:text-slate-500"
                      placeholder="Nombre de empresa"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[0.65rem] uppercase tracking-widest font-bold text-slate-400 mb-1">Correo Electrónico *</label>
                  <input
                    required
                    type="email"
                    value={consultaForm.email}
                    onChange={e => setConsultaForm({...consultaForm, email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-secondary-container placeholder:text-slate-500"
                    placeholder="correo@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] uppercase tracking-widest font-bold text-slate-400 mb-1">Mensaje</label>
                  <textarea
                    rows={3}
                    value={consultaForm.mensaje}
                    onChange={e => setConsultaForm({...consultaForm, mensaje: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-secondary-container placeholder:text-slate-500 resize-none"
                    placeholder="Cuéntanos sobre tu operación logística..."
                  />
                </div>
                <div className="pt-2 flex gap-4">
                  <button type="button" onClick={() => setShowConsultaModal(false)} className="flex-1 py-3 border border-white/20 text-slate-400 text-xs font-bold uppercase tracking-widest rounded-xl hover:border-white/40 hover:text-white transition-colors bg-transparent cursor-pointer">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 py-3 bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-transform border-none cursor-pointer shadow-lg">
                    Enviar Solicitud
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
