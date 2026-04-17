from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.websockets import WebSocket, WebSocketDisconnect
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, Query, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import engine, SessionLocal
import models
import schemas
import security
import ai_agent
import json
import logging
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== SCHEMAS PARA IA ====================
class ProcesarFacturaRequest(BaseModel):
    imagen_base64: str
    nombre_archivo: Optional[str] = "factura.jpg"
    mime_type: Optional[str] = "image/jpeg"

class ProcesarFacturaResponse(BaseModel):
    factura: schemas.FacturaResponse
    datos_ia: dict
    mensaje: str

# Crear las tablas si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API ImpoKonrad",
    description="Backend estructurado para el sistema de gestión logística"
)

# Configuramos CORS
# IMPORTANTE: Con allow_credentials=True NO se puede usar "*" como origen.
# Se listan explícitamente los orígenes permitidos (frontend en desarrollo).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server (default)
        "http://localhost:5174",   # Vite dev server (alternativo)
        "http://localhost:3000",   # Por si se usa otro puerto
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== WEBSOCKET MANAGER ====================
class ConnectionManager:
    """Gestiona las conexiones WebSocket para tracking en tiempo real"""
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, contenedor_id: str):
        await websocket.accept()
        self.active_connections[contenedor_id] = websocket

    def disconnect(self, contenedor_id: str):
        if contenedor_id in self.active_connections:
            del self.active_connections[contenedor_id]

    async def send_personal_message(self, message: dict, contenedor_id: str):
        if contenedor_id in self.active_connections:
            await self.active_connections[contenedor_id].send_json(message)

    async def broadcast(self, message: dict):
        """Envía mensaje a todas las conexiones activas"""
        for connection in self.active_connections.values():
            try:
                await connection.send_json(message)
            except:
                pass  # Ignorar conexiones cerradas

manager = ConnectionManager()

# ==================== DEPENDENCIAS ====================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==================== ENDPOINTS PÚBLICOS ====================
@app.get("/")
def ruta_principal():
    return {"mensaje": "API ImpoKonrad - Backend estructurado y funcionando!"}

# ==================== AUTH ====================
@app.post("/login/", response_model=schemas.TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Endpoint de login - usa OAuth2PasswordRequestForm (username = email)"""
    usuario = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()

    if not usuario or not security.verificar_password(form_data.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    # Crear tokens
    access_token = security.crear_token_acceso(data={"sub": usuario.email})
    refresh_token = security.crear_refresh_token(data={"sub": usuario.email})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@app.post("/refresh-token/")
def refresh_token(request: schemas.RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresca el token de acceso usando un refresh token válido"""
    try:
        email = security.verificar_token(request.refresh_token, token_type="refresh")
        usuario = db.query(models.Usuario).filter(models.Usuario.email == email).first()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        new_access_token = security.crear_token_acceso(data={"sub": usuario.email})
        return {"access_token": new_access_token, "token_type": "bearer"}
    except HTTPException:
        raise

@app.post("/usuarios/", response_model=schemas.UsuarioResponse)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    """Crea un nuevo usuario"""
    db_usuario = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if db_usuario:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        password_hash=security.hashear_password(usuario.password),
        rol=usuario.rol
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return nuevo_usuario

# ==================== USUARIOS (PROTEGIDOS) ====================
@app.get("/usuarios/", response_model=List[schemas.UsuarioResponse])
def obtener_usuarios(
    skip: int = 0,
    limit: int = 100,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Obtiene lista de usuarios (requiere autenticación)"""
    if usuario_actual.rol != models.RolEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Se requiere rol de administrador")

    usuarios = db.query(models.Usuario).offset(skip).limit(limit).all()
    return usuarios

@app.get("/usuarios/me", response_model=schemas.UsuarioResponse)
def obtener_usuario_actual(usuario_actual=Depends(security.obtener_usuario_actual)):
    """Obtiene información del usuario autenticado"""
    return usuario_actual

# ==================== BODEGAS ====================
@app.post("/bodegas/", response_model=schemas.BodegaResponse)
def crear_bodega(
    bodega: schemas.BodegaCreate,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Crea una nueva bodega"""
    nueva_bodega = models.Bodega(**bodega.model_dump())
    db.add(nueva_bodega)
    db.commit()
    db.refresh(nueva_bodega)
    return nueva_bodega

@app.get("/bodegas/", response_model=List[schemas.BodegaResponse])
def obtener_bodegas(
    skip: int = 0,
    limit: int = 100,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Obtiene lista de bodegas"""
    bodegas = db.query(models.Bodega).offset(skip).limit(limit).all()
    return bodegas

@app.get("/bodegas/{bodega_id}", response_model=schemas.BodegaResponse)
def obtener_bodega(
    bodega_id: str,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Obtiene información de una bodega específica"""
    bodega = db.query(models.Bodega).filter(models.Bodega.id == bodega_id).first()
    if not bodega:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")
    return bodega

@app.patch("/bodegas/{bodega_id}", response_model=schemas.BodegaResponse)
def actualizar_bodega(
    bodega_id: str,
    capacidad_actual: int,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Actualiza la capacidad actual de una bodega (para auditorías)"""
    bodega = db.query(models.Bodega).filter(models.Bodega.id == bodega_id).first()
    if not bodega:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")
    bodega.capacidad_actual = capacidad_actual
    db.commit()
    db.refresh(bodega)
    return bodega

@app.get("/bodegas/{bodega_id}/contenedores", response_model=List[schemas.ContenedorResponse])
def obtener_contenedores_de_bodega(
    bodega_id: str,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Obtiene todos los contenedores asignados a una bodega específica"""
    bodega = db.query(models.Bodega).filter(models.Bodega.id == bodega_id).first()
    if not bodega:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")
    contenedores = db.query(models.Contenedor).filter(
        models.Contenedor.bodega_id == bodega_id
    ).all()
    return contenedores

# ==================== CONTENEDORES ====================
@app.post("/contenedores/", response_model=schemas.ContenedorResponse)
def crear_contenedor(
    contenedor: schemas.ContenedorCreate,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Crea un nuevo contenedor"""
    nuevo_contenedor = models.Contenedor(**contenedor.model_dump())
    db.add(nuevo_contenedor)
    try:
        db.commit()
        db.refresh(nuevo_contenedor)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error al registrar: el código del contenedor ya existe u ocurrió un conflicto de datos.")
        
    return nuevo_contenedor

@app.get("/contenedores/", response_model=List[schemas.ContenedorResponse])
def obtener_contenedores(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Obtiene lista de contenedores, opcionalmente filtrado por estado"""
    query = db.query(models.Contenedor)
    if estado:
        query = query.filter(models.Contenedor.estado == estado)
    contenedores = query.offset(skip).limit(limit).all()
    return contenedores

@app.get("/contenedores/{contenedor_id}", response_model=schemas.ContenedorResponse)
def obtener_contenedor(
    contenedor_id: str,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Obtiene información de un contenedor específico"""
    contenedor = db.query(models.Contenedor).filter(models.Contenedor.id == contenedor_id).first()
    if not contenedor:
        raise HTTPException(status_code=404, detail="Contenedor no encontrado")
    return contenedor

# ==================== MANIFIESTOS ====================
@app.post("/manifiestos/", response_model=schemas.ManifiestoResponse)
def crear_manifiesto(
    manifiesto: schemas.ManifiestoCreate,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Crea un nuevo manifiesto"""
    nuevo_manifiesto = models.Manifiesto(**manifiesto.model_dump())
    db.add(nuevo_manifiesto)
    db.commit()
    db.refresh(nuevo_manifiesto)
    return nuevo_manifiesto

@app.get("/manifiestos/", response_model=List[schemas.ManifiestoResponse])
def obtener_manifiestos(
    skip: int = 0,
    limit: int = 100,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Obtiene lista de manifiestos"""
    manifiestos = db.query(models.Manifiesto).offset(skip).limit(limit).all()
    return manifiestos

# ==================== FACTURAS ====================
@app.post("/facturas/", response_model=schemas.FacturaResponse)
def crear_factura(
    factura: schemas.FacturaCreate,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Crea una nueva factura"""
    # Excluir usuario_id del model_dump para evitar duplicado al asignarlo desde el token
    datos = factura.model_dump(exclude={"usuario_id"})
    nueva_factura = models.Factura(**datos, usuario_id=usuario_actual.id)
    db.add(nueva_factura)
    db.commit()
    db.refresh(nueva_factura)
    return nueva_factura

@app.get("/facturas/", response_model=List[schemas.FacturaResponse])
def obtener_facturas(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Obtiene lista de facturas"""
    query = db.query(models.Factura)
    if estado:
        query = query.filter(models.Factura.estado == estado)
    facturas = query.offset(skip).limit(limit).all()
    return facturas

@app.get("/facturas/{factura_id}", response_model=schemas.FacturaResponse)
def obtener_factura(
    factura_id: str,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Obtiene información de una factura específica"""
    factura = db.query(models.Factura).filter(models.Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return factura

# ==================== AGENTE IA ====================
@app.post("/ia/procesar-factura/", response_model=ProcesarFacturaResponse)
async def procesar_factura_con_ia(
    archivo: UploadFile = File(...),
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Procesa una factura (imagen o PDF) con Gemini Vision y guarda el resultado en la DB."""
    import base64 as _b64

    logger.info(f"Procesando factura con IA. Usuario: {usuario_actual.email}, archivo: {archivo.filename}, tipo: {archivo.content_type}")

    try:
        contenido_bytes = await archivo.read()
        imagen_b64 = _b64.b64encode(contenido_bytes).decode("utf-8")
        mime_type = archivo.content_type or "image/jpeg"

        datos_ia = ai_agent.procesar_imagen_factura_sync(imagen_b64, mime_type)
    except Exception as e:
        logger.error(f"Error en agente IA: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=422,
            detail=f"Error al procesar la imagen con IA: {str(e)}"
        )

    
    # 2. Parsear fecha si viene como string
    fecha_emision = None
    if datos_ia.get("fecha_emision"):
        try:
            fecha_emision = datetime.strptime(datos_ia["fecha_emision"], "%Y-%m-%d")
        except (ValueError, TypeError):
            fecha_emision = None
    
    # 3. Guardar la factura en la base de datos
    nueva_factura = models.Factura(
        numero_factura=datos_ia["numero_factura"],
        proveedor=datos_ia["proveedor"],
        monto_total=datos_ia["monto_total"],
        monto_impuestos=datos_ia["monto_impuestos"],
        moneda=datos_ia["moneda"],
        fecha_emision=fecha_emision,
        archivo_path=archivo.filename,
        datos_extraidos_json=json.dumps(datos_ia["datos_crudos"], ensure_ascii=False),
        procesado_por_ia=True,
        estado="pendiente",
        usuario_id=usuario_actual.id
    )
    
    db.add(nueva_factura)
    db.commit()
    db.refresh(nueva_factura)
    
    logger.info(f"Factura creada exitosamente con ID: {nueva_factura.id}")
    
    # 4. Retornar la factura creada + los datos de la IA
    return {
        "factura": nueva_factura,
        "datos_ia": {
            "proveedor": datos_ia["proveedor"],
            "numero_factura": datos_ia["numero_factura"],
            "monto_total": datos_ia["monto_total"],
            "monto_impuestos": datos_ia["monto_impuestos"],
            "moneda": datos_ia["moneda"],
            "fecha_emision": datos_ia["fecha_emision"],
            "descripcion": datos_ia["descripcion"],
            "confianza": datos_ia["confianza"]
        },
        "mensaje": f"Factura procesada con {datos_ia['confianza']}% de confianza por Gemini Vision."
    }


@app.patch("/facturas/{factura_id}", response_model=schemas.FacturaResponse)
def actualizar_factura(
    factura_id: str,
    factura_update: schemas.FacturaUpdate,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Actualiza una factura existente"""
    factura = db.query(models.Factura).filter(models.Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    update_data = factura_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(factura, field, value)

    db.commit()
    db.refresh(factura)
    return factura

# ==================== TRACKING ====================
@app.post("/tracking/", response_model=schemas.TrackingResponse)
def crear_tracking(
    tracking: schemas.TrackingCreate,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Crea un nuevo registro de tracking"""
    nuevo_tracking = models.Tracking(**tracking.model_dump())
    db.add(nuevo_tracking)
    db.commit()
    db.refresh(nuevo_tracking)
    return nuevo_tracking

@app.get("/tracking/{contenedor_id}", response_model=List[schemas.TrackingResponse])
def obtener_tracking_contenedor(
    contenedor_id: str,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Obtiene el historial de tracking de un contenedor"""
    tracking = db.query(models.Tracking).filter(
        models.Tracking.contenedor_id == contenedor_id
    ).order_by(models.Tracking.timestamp.desc()).limit(100).all()
    return tracking

@app.get("/tracking/latest/{contenedor_id}", response_model=schemas.TrackingResponse)
def obtener_ultimo_tracking(
    contenedor_id: str,
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Obtiene la última posición conocida de un contenedor"""
    tracking = db.query(models.Tracking).filter(
        models.Tracking.contenedor_id == contenedor_id
    ).order_by(models.Tracking.timestamp.desc()).first()

    if not tracking:
        raise HTTPException(status_code=404, detail="No hay tracking disponible para este contenedor")

    return tracking

# ==================== WEBSOCKET PARA TRACKING EN TIEMPO REAL ====================
@app.websocket("/ws/tracking/{contenedor_id}")
async def websocket_tracking(websocket: WebSocket, contenedor_id: str):
    """WebSocket para recibir actualizaciones de tracking en tiempo real"""
    await manager.connect(websocket, contenedor_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Guardar en base de datos
            db = SessionLocal()
            try:
                tracking = models.Tracking(
                    contenedor_id=contenedor_id,
                    latitud=data.get("latitud"),
                    longitud=data.get("longitud"),
                    velocidad=data.get("velocidad"),
                    estado=data.get("estado"),
                    notas=data.get("notas")
                )
                db.add(tracking)
                db.commit()

                # Confirmar recepción
                await websocket.send_json({
                    "status": "ok",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            finally:
                db.close()
    except WebSocketDisconnect:
        manager.disconnect(contenedor_id)

# ==================== DASHBOARD / BI ====================
@app.get("/dashboard/resumen")
def obtener_resumen_dashboard(
    usuario_actual=Depends(security.obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    """Obtiene datos resumidos para el dashboard"""
    # Contadores
    total_usuarios = db.query(func.count(models.Usuario.id)).scalar()
    total_bodegas = db.query(func.count(models.Bodega.id)).scalar()
    total_contenedores = db.query(func.count(models.Contenedor.id)).scalar()
    total_facturas = db.query(func.count(models.Factura.id)).scalar()

    # Facturas por estado
    facturas_pendientes = db.query(func.count(models.Factura.id)).filter(
        models.Factura.estado == "pendiente"
    ).scalar()

    # Monto total de facturas
    monto_total = db.query(func.sum(models.Factura.monto_total)).scalar() or 0

    # Contenedores por estado
    contenedores_por_estado = db.query(
        models.Contenedor.estado,
        func.count(models.Contenedor.id)
    ).group_by(models.Contenedor.estado).all()

    return {
        "usuarios": total_usuarios,
        "bodegas": total_bodegas,
        "contenedores": total_contenedores,
        "facturas": {
            "total": total_facturas,
            "pendientes": facturas_pendientes,
            "monto_total": monto_total
        },
        "contenedores_por_estado": [
            {"estado": estado, "cantidad": cantidad}
            for estado, cantidad in contenedores_por_estado
        ]
    }
