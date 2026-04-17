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

**Loging**
<img width="1919" height="1032" alt="image" src="https://github.com/user-attachments/assets/1f6f6067-1dc8-49ce-8660-40d50a62db70" />


**Panel de Control (Centro de métricas globales)**
<img width="1917" height="1028" alt="image" src="https://github.com/user-attachments/assets/46525918-3be9-45f2-b9bd-dc0d5a4a9d73" />


**Auditoría y Lector Extractor operado por IA**
<img width="1919" height="1032" alt="image" src="https://github.com/user-attachments/assets/f09ab30c-df38-4a32-b8d4-97e5f45a6e68" />

**Centro de Mapeo y Tracking Satelital Dinámico**
<img width="1916" height="1013" alt="image" src="https://github.com/user-attachments/assets/747eeab5-a372-46b4-8622-77d27b5c2367" />


**Inventario general de Contenedores**
<img width="1919" height="1029" alt="image" src="https://github.com/user-attachments/assets/4f4957e0-ea76-412e-b829-dc42dfc56b1c" />

**Inventario general de Bodegas**
<img width="1914" height="1035" alt="image" src="https://github.com/user-attachments/assets/52f550ce-54d0-412c-a869-ca5e92453b2e" />


**Facturacion**
<img width="1918" height="1039" alt="image" src="https://github.com/user-attachments/assets/ef914da3-6437-48cb-af78-8634fc981c86" />

**Manifiestos**
<img width="1919" height="1028" alt="image" src="https://github.com/user-attachments/assets/9175ec82-be50-4e0d-b43f-43644e07a458" />

## Landing Page
<img width="1916" height="1032" alt="image" src="https://github.com/user-attachments/assets/51875e35-12dd-49e4-9a62-ec9361b30ff0" />

<img width="1919" height="1021" alt="image" src="https://github.com/user-attachments/assets/48749e53-50e3-40e5-9883-1790198bb8e0" />

<img width="1919" height="1035" alt="image" src="https://github.com/user-attachments/assets/159faa67-7804-4807-adfe-7e1e47bb7f2b" />




