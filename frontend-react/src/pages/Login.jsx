import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background font-body text-on-background min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Content Shell */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-logistics-mesh opacity-30"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full"></div>
        <img
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
          alt="Logistics background"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBr7gG_g-rPMjFu5jmnVrPRqqxs7ZLr1Mij1u4ndk7ACVpR05cThLwZH8ojGqF3LMy4R8UTSUIsG9zkrpEAuGdaOTzYejbUWTzwtNCMafkrCGGtyo2hAo6Jmk4EKppObGUc0V_6rW36P9SKIUwsXj9UEEPOwr9BecrG-H7fEEYg8Z3xaClea9CSAoBkvhTIma0J01aCJNGPuhDN765_Wq9Ck6b2vbbL-s-UOjVTrw6-yuSATRtUM4M4pRxB4-fiQYZWfFH04V2T4A"
        />
      </div>

      {/* Login Container */}
      <main className="relative z-10 w-full max-w-[480px]">
        {/* Back Link */}
        <div className="mb-4">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-none bg-transparent font-label text-sm uppercase tracking-widest font-bold"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Volver a Inicio
          </button>
        </div>

        <div className="glass-panel border border-outline-variant/20 rounded-xl p-8 md:p-12 shadow-2xl shadow-surface-container-lowest">
          {/* Branding Area */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-5xl mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <h1 className="font-headline font-extrabold text-2xl tracking-tighter text-on-surface m-0">
                ImpoKonrad Logística
              </h1>
            </div>
            <p className="text-on-surface-variant font-medium text-sm m-0">
              Acceso al Panel de Control • Gestión de Importaciones
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container/20 border border-error-container rounded-lg text-error text-sm text-center">
              {error}
            </div>
          )}

          {/* Social Login Cluster */}
          <div className="grid grid-cols-1 gap-3 mb-8">
            <button type="button" className="flex items-center justify-center gap-3 bg-surface-container-high hover:bg-surface-container-highest transition-all duration-200 py-3 rounded-md border border-outline-variant/10 group active:scale-[0.98] cursor-pointer">
              <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfPBcXlrqjFZe3GLtIaPvmAD5ZVHYfN4UwN-kc-97PNAAIh-2nZaIS44v-Qb6yyrBetxyqxKSOp7XPlS9-5jgQCRVTWE8BWbLaAL4V8wMmyl9YREIWbmF1YelnnMXAC2ha74T5206dJ3RE_FsINSjU5Z4GrB7Oi6iAExUwUVgrTFip1w4wSQmLC3beL916DN00RNN5n-JsP2WJrujyW_lygcjCAGwl8Pp6qS2NjAPIXAQqfKPGlLjmchpG8lKd5lKb47dMMbrJ_3A"/>
              <span className="font-label text-sm font-semibold text-on-surface">Continuar con Google</span>
            </button>
            <button type="button" className="flex items-center justify-center gap-3 bg-surface-container-high hover:bg-surface-container-highest transition-all duration-200 py-3 rounded-md border border-outline-variant/10 group active:scale-[0.98] cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0H10.91V10.91H0V0Z" fill="#F25022"></path>
                <path d="M12.09 0H23V10.91H12.09V0Z" fill="#7FBA00"></path>
                <path d="M0 12.09H10.91V23H0V12.09Z" fill="#00A4EF"></path>
                <path d="M12.09 12.09H23V23H12.09V12.09Z" fill="#FFB900"></path>
              </svg>
              <span className="font-label text-sm font-semibold text-on-surface">Continuar con Microsoft</span>
            </button>
          </div>

          {/* Separator */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/20"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="px-4 bg-surface-container-low text-on-surface-variant font-bold">o usar credenciales</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-primary-fixed mb-2 uppercase tracking-wider" htmlFor="email">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-xl">alternate_email</span>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 bg-surface-container-lowest border-0 rounded-md py-3 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-secondary/50 transition-all font-body text-sm"
                  placeholder="admin@impokonrad.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-primary-fixed uppercase tracking-wider" htmlFor="password">
                  Contraseña
                </label>
                <a href="#" className="text-xs font-semibold text-secondary hover:text-secondary-fixed transition-colors">
                  ¿Olvidó su contraseña?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-xl">lock</span>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 bg-surface-container-lowest border-0 rounded-md py-3 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-secondary/50 transition-all font-body text-sm"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                className="h-4 w-4 rounded border-outline-variant/30 bg-surface-container-lowest text-primary focus:ring-primary-container"
              />
              <label htmlFor="remember" className="ml-2 block text-xs text-on-surface-variant font-medium">
                Mantener sesión iniciada por 30 días
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full cursor-pointer bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-extrabold py-3.5 rounded-md shadow-lg shadow-primary-container/20 hover:shadow-primary-container/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-75"
            >
              <span>{loading ? 'INGRESANDO...' : 'INGRESAR AL PANEL'}</span>
              {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
            </button>
          </form>

          {/* Footer Legal */}
          <div className="mt-10 text-center">
            <p className="text-[10px] text-on-surface-variant/50 leading-relaxed uppercase tracking-widest m-0">
              Sistema de Alta Seguridad GSC-256 <br />
              © 2026 ImpoKonrad Logística • Red Global de Datos
            </p>
          </div>
        </div>

        {/* Status Indicator Grid (Visual Detail) */}
        <div className="mt-8 grid grid-cols-3 gap-4 px-2">
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-primary/50 text-xl mb-1">router</span>
            <span className="text-[9px] font-bold text-on-surface-variant/60 uppercase">Nodos Activos</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-primary/50 text-xl mb-1">verified_user</span>
            <span className="text-[9px] font-bold text-on-surface-variant/60 uppercase">Encriptación SSL</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-primary/50 text-xl mb-1">public</span>
            <span className="text-[9px] font-bold text-on-surface-variant/60 uppercase">Uptime 99.9%</span>
          </div>
        </div>
      </main>
    </div>
  );
}
