# 🚢 IMPOKONRAD - Plataforma Logística y de Rastreo

**IMPOKONRAD** es una plataforma logística de vanguardia (MVP) diseñada para la gestión de contenedores, bodegas, y manifiestos de carga. Este proyecto fue desarrollado con un enfoque centrado en la **Inteligencia Artificial**, utilizando agentes de IA para la automatización de procesos contables (lectura y procesamiento de facturas) y simulaciones de rastreo geolocalizado en tiempo real.

> [!NOTE]
> **🤖 Desarrollo Asistido por Inteligencia Artificial**
> Este proyecto fue conceptualizado, programado y estructurado en su gran mayoría mediante la colaboración directa con IA Avanzada (Gemini). Esto es parte integral del proyecto, demostrando las capacidades actuales de la ingeniería de software asistida para diseñar arquitecturas escalables (Cliente-Servidor) y construir MVPs funcionales en tiempos récord de manera altamente eficiente.

## 🚀 Tecnologías Utilizadas

### Backend
- **FastAPI (Python):** Framework principal de alto rendimiento para la construcción de la API REST.
- **PostgreSQL & SQLAlchemy:** Base de datos relacional y ORM para el manejo de la persistencia de datos y relaciones (Usuarios, Contenedores, Bodegas, Facturas). Autenticación segura mediante JWT y contraseñas hasheadas (Bcrypt).
- **Google Gemini (Vision API):** Agente de Inteligencia Artificial (`ai_agent.py`) entrenado para recibir facturas en formato de imagen, extraer la información clave (proveedor, montos, fechas) de manera autónoma y preprocesar los datos para la base de datos.
- **WebSockets:** Implementados nativamente en el backend para transmitir las coordenadas geográficas en tiempo real desde los navíos al frontend sin recargar la página.

### Frontend
- **React 19 & Vite:** Arquitectura de cliente para una experiencia de usuario rápida y fluida (SPA - Single Page Application).
- **Tailwind CSS v4:** Motor de estilos utilitarios garantizando diseños limpios, estéticos, y responsivos.
- **Google Maps API:** Integración de componentes geográficos interactivos para renderizar y seguir los contenedores en tránsito directo desde el panel de control.

## ⚙️ Cómo Ejecutar el Proyecto (Desarrollo Local)

Sigue estos pasos para levantar el entorno de desarrollo en tu propia máquina.

### 1. Base de Datos (PostgreSQL)
Recomendamos usar Docker para levantar la base de datos rápidamente:
```bash
docker-compose up -d
```
*(Alternativa: Puedes crear tu base de datos en Supabase/Neon y agregar la URL de conexión en tu `.env`).*

### 2. Backend (FastAPI)
```bash
cd Backend

# 1. Crear el entorno virtual e instalar dependencias
python -m venv venv
# Activar entorno:
# En Windows: .\venv\Scripts\activate
# En Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# 2. Configurar variables de entorno
# Crea un archivo .env en la carpeta Backend con tus claves de JWT, la URL de Base de datos, y tu GEMINI_API_KEY.

# 3. Levantar el servidor de la API
uvicorn main:app --reload
```
La API estará disponible en `http://localhost:8000`. Puedes consultar la documentación interactiva en `http://localhost:8000/docs`.

### 3. Frontend (React)
Abre una nueva ventana de terminal:
```bash
cd frontend-react

# 1. Instalar las dependencias de Node
npm install

# 2. Configurar variables de entorno
# Crea un archivo .env en la carpeta frontend-react y añade tu VITE_GOOGLE_MAPS_API_KEY y demás configuraciones necesarias.

# 3. Levantar la aplicación web
npm run dev
```
La aplicación web correrá por defecto en `http://localhost:5173`.

### 4. Simulador de Rastreo (Tiempo Real)
Para ver el funcionamiento estelar del mapa (contenedores moviéndose en tiempo real), debes inicializar el simulador de rutas de los navíos. En una nueva terminal con el entorno virtual activado:
```bash
cd Backend
python route_simulator.py
```
Este script empezará a emitir coordenadas hacia el backend de manera constante, las cuales se propagarán por WebSocket hacia tu sesión de React, logrando un auténtico radar logístico en vivo.
