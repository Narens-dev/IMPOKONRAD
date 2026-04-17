# IMPOKONRAD MVP - Plan de Implementación

¡Excelente proyecto! Para el desarrollo del MVP de IMPOKONRAD, he diseñado el siguiente plan que cubre todo lo que solicitas: logística, inteligencia artificial, tracking en tiempo real, Business Intelligence y roles de usuario.

## User Review Required

> [!IMPORTANT]
> **Mockups de Frontend:** ¡Sí! Sube las imágenes de tus mockups a la carpeta `Frontend` (o `frontend-react/src/assets` de tu proyecto) y avísame cuando estén allí. Luego puedo usar mis herramientas de visión para analizarlas y pasarlas a código React y TailwindCSS.
>
> **Servicios Externos (API Keys):** Para algunas características necesitaremos usar servicios externos (que suelen tener capas gratuitas):
> 1.  **Google Maps API Key:** Para el tracking en tiempo real.
> 2.  **Google Gemini API Key o OpenAI API Key:** Para nuestro agente de IA contable (para procesar PDFs/imágenes de facturas y extraer datos).
> 3.  **API para la Bolsa de Valores:** Usaremos alguna API gratuita como Finnhub o Alpha Vantage para traer divisas.

## Proposed Changes

---

### Fase 1: Backend, BD y Roles de Acceso (RBAC)
Estructuraremos la base de datos PostgreSQL, creando las tablas necesarias y autenticación con FastAPI.

*   **Autenticación y Roles:** JWT Tokens. Perfiles como 'Administrador' (acceso al dashboard y contabilidad) y 'Usuario/Operador'.
*   **Modelos de Datos:** Tablas para Usuarios, Bodegas, Contenedores, Manifiestos, Facturas.

#### [NEW] Backend/auth.py
#### [MODIFY] Backend/models.py
#### [MODIFY] Backend/main.py

---

### Fase 2: Integración de Mockups (Frontend Base)
Convertir tus diseños a React.

*   **Enrutador:** React Router para separar la vista de 'Login', 'Dashboard Admin', 'Tracking' e 'IA Contable'.
*   **Maquetado:** TailwindCSS basado en tus mockups subidos.

#### [NEW] frontend-react/src/pages/Dashboard.jsx
#### [NEW] frontend-react/src/pages/TrackingMap.jsx
#### [MODIFY] frontend-react/src/App.jsx

---

### Fase 3: Tracking en Tiempo Real
Simularemos el movimiento de los contenedores por el mundo usando Google Maps.

*   **Simulador Backend:** Un proceso en FastAPI (o Celery) que genere datos de ubicación (lat/lon) y los envíe en tiempo real a través de WebSockets hacia el Frontend.
*   **Mapa Interactivo:** Componente de React con Google Maps marcando la ruta.

#### [NEW] Backend/tracking_service.py
#### [NEW] frontend-react/src/components/MapComponent.jsx

---

### Fase 4: Agente IA Contable
Aquí construiremos la "magia" administrativa.

*   **Procesamiento:** Subida de recibos y facturas. Usaremos la librería `pdf2image` y tesseract, o directamente una API Vision de LLM para procesar la imagen y extraer el texto.
*   **Agente:** El LLM recibirá el texto de la factura y llenará la base de datos automáticamente (quién envió, monto, impuestos, etc.).

#### [NEW] Backend/ai_agent.py
#### [NEW] frontend-react/src/pages/AccountingAutomations.jsx

---

### Fase 5: Business Intelligence Dashboard
Panel en vivo para la gerencia.

*   **Gráficas:** Gráficos de Chart.js o Recharts mostrando Ingresos vs Egresos leyendo directo de la base de datos.
*   **Divisas:** Un componente que hace peticiones en tiempo real a una API de mercados para mostrar USD, EUR, etc.

#### [NEW] frontend-react/src/components/Charts.jsx
#### [NEW] frontend-react/src/components/StockTicker.jsx

## Open Questions

> [!CAUTION]
> 1.  Para procesar las facturas con IA, ¿prefieres que intentemos con una librería gratuita instalada localmente (como Tesseract OCR) aunque es menos precisa, o prefieres que consigamos una API Key de Gemini/OpenAI para que sea mucho más exacta?
> 2.  ¿Puedo asumir que te encargarás de conseguir una API Key de Google Maps para incluirla cuando la necesitemos?

## Verification Plan

### Automated Tests
- Ejecutar tests básicos de autenticación del API de FastAPI.

### Manual Verification
- Ingresar la API Key de Google Maps y verificar que el mapa renderiza en el Frontend.
- Probar un flujo End-To-End: subir una imagen de factura genérica y revisar si la IA guardó correctamente los valores en la base de datos.
- Confirmar que los valores de en el Dashboard cambian cuando ingresa una nueva factura.
