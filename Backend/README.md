# Backend IMPOKONRAD

Backend para el sistema de gestión logística IMPOKONRAD, construido con FastAPI y PostgreSQL.

## Características

- **Autenticación JWT**: Login con access tokens y refresh tokens
- **RBAC**: Roles de Administrador y Usuario
- **WebSockets**: Tracking en tiempo real de contenedores
- **Base de datos**: PostgreSQL con migraciones Alembic
- **CORS**: Configurado para desarrollo local

## Modelos de Datos

- **Usuarios**: Autenticación y roles
- **Bodegas**: Almacenamiento de contenedores
- **Contenedores**: Gestión de envíos con estados
- **Manifiestos**: Documentos de transporte
- **Facturas**: Gestión contable con procesamiento IA
- **Tracking**: Posiciones GPS en tiempo real

## Instalación

### 1. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

Editar `.env` con tus credenciales:

```env
DATABASE_URL=postgresql+psycopg://usuario:password@localhost:5432/impokonrad
SECRET_KEY=tu_clave_secreta_muy_larga
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 3. Ejecutar migraciones

```bash
alembic upgrade head
```

## Ejecución

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

La API estará disponible en `http://localhost:8000`

## Endpoints Principales

### Autenticación
- `POST /login/` - Iniciar sesión
- `POST /refresh-token/` - Refrescar token
- `POST /usuarios/` - Crear usuario

### Usuarios (requiere auth)
- `GET /usuarios/` - Listar usuarios (solo admin)
- `GET /usuarios/me` - Obtener usuario actual

### Bodegas
- `GET /bodegas/` - Listar bodegas
- `POST /bodegas/` - Crear bodega
- `GET /bodegas/{id}` - Obtener bodega

### Contenedores
- `GET /contenedores/` - Listar contenedores
- `POST /contenedores/` - Crear contenedor
- `GET /contenedores/{id}` - Obtener contenedor

### Manifiestos
- `GET /manifiestos/` - Listar manifiestos
- `POST /manifiestos/` - Crear manifiesto

### Facturas
- `GET /facturas/` - Listar facturas
- `POST /facturas/` - Crear factura
- `PATCH /facturas/{id}` - Actualizar factura

### Tracking
- `GET /tracking/{contenedor_id}` - Historial de tracking
- `GET /tracking/latest/{contenedor_id}` - Última posición
- `WS /ws/tracking/{contenedor_id}` - WebSocket para actualizaciones en tiempo real

### Dashboard
- `GET /dashboard/resumen` - Datos resumidos para BI

## Documentación interactiva

FastAPI genera automáticamente documentación Swagger en:
- `http://localhost:8000/docs` - Swagger UI
- `http://localhost:8000/redoc` - ReDoc

## WebSocket - Tracking en Tiempo Real

Para conectarse al WebSocket de tracking:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/tracking/{contenedor_id}');

ws.onopen = () => {
  ws.send(JSON.stringify({
    latitud: 40.7128,
    longitud: -74.0060,
    velocidad: 15.5,
    estado: 'en_transito'
  }));
};

ws.onmessage = (event) => {
  console.log('Confirmación:', event.data);
};
```

## Migraciones (Alembic)

```bash
# Crear nueva migración
alembic revision --autogenerate -m "Descripción del cambio"

# Aplicar migraciones
alembic upgrade head

# Revertir última migración
alembic downgrade -1
```

## Estructura de Archivos

```
Backend/
├── main.py           # Aplicación principal y endpoints
├── models.py         # Modelos SQLAlchemy
├── schemas.py        # Esquemas Pydantic
├── security.py       # Autenticación JWT y dependencias
├── database.py       # Configuración de base de datos
├── .env              # Variables de entorno (no versionar)
├── requirements.txt  # Dependencias
├── alembic/          # Migraciones de base de datos
│   ├── env.py
│   └── versions/
└── README.md         # Este archivo
```

## Próximas Características (Pendiente)

- [ ] Procesamiento de facturas con IA (Gemini/OpenAI)
- [ ] Upload de archivos PDF/imágenes
- [ ] Integración con Google Maps API
- [ ] Tests automatizados
