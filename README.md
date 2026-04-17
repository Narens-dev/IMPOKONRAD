# IMPOKONRAD - Sistema de Gestión Logística

IMPOKONRAD es el producto mínimo viable (MVP) de un sistema de gestión para contenedores, aduanas y manifiestos de carga. Este proyecto nace con la intención de modernizar la cadena de suministro a través de la integración de tareas contables automatizadas y monitoreo geoespacial constante.

**Nota sobre el desarrollo asistido:** 
El diseño de la arquitectura, planeación de base de datos y la codificación general de este MVP fueron asistidos de manera intensiva por modelos de IA (principalmente Gemini y Claude). 

## Arquitectura y Tecnologías

El proyecto divide sus responsabilidades en dos aplicaciones mediante una arquitectura Cliente-Servidor:

### Backend 
- **Python y FastAPI**: Actúa como el punto de entrada de la API REST. Fue elegido por su velocidad y manejo nativo de programación asincrónica para tareas de IA y WebSockets.
- **PostgreSQL**: Base de datos principal operada mediante el ORM SQLAlchemy con migraciones de Alembic.
- **Google Gemini (Vision)**: Se desarrolló un script de lado del servidor para procesar imágenes de facturas subidas por los usuarios, extrayendo la información bruta (proveedor y montos) para parsearse a la tabla de reportes financieros automáticamente.
- **WebSockets**: Se estableció una conexión TCP persistente para transferir la latitud y longitud calculada en un simulador de tráfico de barcos hacia el frontend y actualizar las vistas.

### Frontend
- **React y Vite**: Creación de una SPA (Single Page Application) estructurada y modular.
- **Tailwind CSS**: Framework que permitió estilizar un esquema UI de paneles analíticos.
- **Google Maps JS API**: El visualizador del mapa mundial sobre el que se despliegan los indicadores de estatus de ruta de la mercancía.

---

## Cómo ejecutar el proyecto en modo desarrollo

Para levantar este proyecto de manera local, considera la creación de entornos separados.

### 1. Variables de entorno necesarias
Para evitar excepciones, requieres registrarte en las siguientes plataformas y guardar las llaves generadas de la API:
- Google Maps JavaScript API
- Google AI Studio (Gemini)

### 2. Base de datos
Una forma ágil para no saturar tu instalación de sistema con configuraciones de la base de datos es inicializar el contenedor Docker provisto (si dispones de Docker).
```bash
docker-compose up -d
```
*(Alternativa: Conectar la aplicación mediante una cadena de conexión remota apuntando a un servicio de bases de datos como Neon o Supabase).*

### 3. Configuración del Servidor Backend
Abre una terminal y colócate en el directorio `/Backend`.

```bash
# Crear y activar la máquina virtual de Python
python -m venv venv
.\venv\Scripts\activate  # En sistemas operativos Windows.

# Descargar las librerías necesarias de Python
pip install -r requirements.txt

# Inicializar un archivo .env dentro de la carpeta /Backend
DATABASE_URL=postgresql+psycopg://usuario:password@localhost:5433/impokonrad
SECRET_KEY=tu_clave_secreta_super_segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
GEMINI_API_KEY=tu_api_key_de_gemini_aqui

# Iniciar la interfaz ASGI
uvicorn main:app --reload
```

### 4. Configurar el Frontend
Abre una terminal paralela y posiciónate sobre el directorio `/frontend-react`.

```bash
# Descarga de dependencias
npm install

# Creación de archivo .env dentro de la carpeta frontend-react
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_de_google_maps_aqui
VITE_GEMINI_API_KEY=tu_api_key_de_gemini_aqui

# Levantar el entorno local de desarrollo web
npm run dev
```

### 5. Script simulador de flota
Para comprobar el correcto funcionamiento de los rastreos de ruta, el puerto WebSockets en base a coordenadas debe ser alimentado artificialmente activando la simulación:
```bash
python route_simulator.py
```
*(Recuerda activar el entorno virtual previamente).*

---

## Capturas del Sistema

A continuación se muestra el esquema visual y funcionalidad de los diferentes módulos del tablero que compone a IMPOKONRAD.

**Panel de Control (Centro de métricas globales)**
![Vista general del Dashboard](./assets/dashboard.png)

**Auditoría y Lector Extractor operado por IA**
![Auditoría de imágenes por IA Contable](./assets/ia-contable.png)

**Centro de Mapeo y Tracking Satelital Dinámico**
![Monitoreo Satelital de contenedores](./assets/rastreo-mapa.png)

**Inventario general de infraestructura (Bodegas y sedes)**
![Catálogo y saturación de bodegas operativas](./assets/bodegas.png)
