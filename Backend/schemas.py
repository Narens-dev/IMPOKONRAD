from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ==================== USUARIOS ====================
class RolEnum(str, Enum):
    ADMIN = "admin"
    USUARIO = "usuario"

class UsuarioCreate(BaseModel):
    nombre: str
    email: str
    password: str
    rol: Optional[RolEnum] = RolEnum.USUARIO

class UsuarioLogin(BaseModel):
    email: str
    password: str

class UsuarioResponse(BaseModel):
    id: str
    nombre: str
    email: str
    rol: RolEnum
    creado_en: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# ==================== BODEGAS ====================
class BodegaCreate(BaseModel):
    nombre: str
    ubicacion: str
    capacidad_maxima: Optional[int] = 1000

class BodegaResponse(BaseModel):
    id: str
    nombre: str
    ubicacion: str
    capacidad_maxima: int
    capacidad_actual: int

    class Config:
        from_attributes = True

# ==================== CONTENEDORES ====================
class EstadoContenedor(str, Enum):
    EN_PUERTO_ORIGEN = "en_puerto_origen"
    EN_TRANSITO = "en_transito"
    EN_ADUANA = "en_aduana"
    EN_PUERTO_DESTINO = "en_puerto_destino"
    ENTREGADO = "entregado"

class ContenedorCreate(BaseModel):
    codigo: str
    tipo: Optional[str] = "20ft"
    estado: Optional[EstadoContenedor] = EstadoContenedor.EN_PUERTO_ORIGEN
    bodega_id: Optional[str] = None
    puerto_origen: Optional[str] = None
    puerto_destino: Optional[str] = None
    usuario_id: Optional[str] = None
    manifiesto_id: Optional[str] = None

class ContenedorResponse(BaseModel):
    id: str
    codigo: str
    tipo: str
    estado: EstadoContenedor
    bodega_id: Optional[str] = None
    puerto_origen: Optional[str] = None
    puerto_destino: Optional[str] = None
    usuario_id: Optional[str] = None
    manifiesto_id: Optional[str] = None

    class Config:
        from_attributes = True

# ==================== MANIFIESTOS ====================
class ManifiestoCreate(BaseModel):
    codigo: str
    puerto_origen: str
    puerto_destino: str
    fecha_salida: Optional[datetime] = None
    fecha_llegada_estimada: Optional[datetime] = None

class ManifiestoResponse(BaseModel):
    id: str
    codigo: str
    puerto_origen: str
    puerto_destino: str
    fecha_salida: Optional[datetime] = None
    fecha_llegada_estimada: Optional[datetime] = None
    fecha_llegada_real: Optional[datetime] = None

    class Config:
        from_attributes = True

# ==================== FACTURAS ====================
class FacturaCreate(BaseModel):
    numero_factura: str
    proveedor: str
    monto_total: float
    monto_impuestos: Optional[float] = 0.0
    moneda: Optional[str] = "USD"
    fecha_emision: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None
    usuario_id: Optional[str] = None
    estado: Optional[str] = "pendiente"

class FacturaUpdate(BaseModel):
    estado: Optional[str] = None
    datos_extraidos_json: Optional[str] = None
    procesado_por_ia: Optional[bool] = None

class FacturaResponse(BaseModel):
    id: str
    numero_factura: str
    proveedor: str
    monto_total: float
    monto_impuestos: float
    moneda: str
    fecha_emision: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None
    archivo_path: Optional[str] = None
    datos_extraidos_json: Optional[str] = None
    procesado_por_ia: bool
    estado: str
    usuario_id: Optional[str] = None
    creado_en: datetime

    class Config:
        from_attributes = True

# ==================== TRACKING ====================
class TrackingCreate(BaseModel):
    contenedor_id: str
    latitud: float
    longitud: float
    velocidad: Optional[float] = None
    estado: Optional[str] = None
    notas: Optional[str] = None

class TrackingResponse(BaseModel):
    id: str
    contenedor_id: str
    latitud: float
    longitud: float
    timestamp: datetime
    velocidad: Optional[float] = None
    estado: Optional[str] = None
    notas: Optional[str] = None

    class Config:
        from_attributes = True

class TrackingWebSocketResponse(BaseModel):
    contenedor_id: str
    latitud: float
    longitud: float
    timestamp: datetime
    estado: Optional[str] = None