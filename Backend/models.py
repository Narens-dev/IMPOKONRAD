from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from database import Base
import uuid
import enum
from datetime import datetime, timezone

class RolEnum(str, enum.Enum):
    ADMIN = "admin"
    USUARIO = "usuario"

class EstadoContenedor(str, enum.Enum):
    EN_PUERTO_ORIGEN = "en_puerto_origen"
    EN_TRANSITO = "en_transito"
    EN_ADUANA = "en_aduana"
    EN_PUERTO_DESTINO = "en_puerto_destino"
    ENTREGADO = "entregado"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    nombre = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(Enum(RolEnum), default=RolEnum.USUARIO)
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    facturas = relationship("Factura", back_populates="usuario")
    contenedores = relationship("Contenedor", back_populates="usuario")

class Bodega(Base):
    __tablename__ = "bodegas"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = Column(String, nullable=False)
    ubicacion = Column(String, nullable=False)
    capacidad_maxima = Column(Integer, default=1000)
    capacidad_actual = Column(Integer, default=0)

    # Relaciones
    contenedores = relationship("Contenedor", back_populates="bodega")

class Contenedor(Base):
    __tablename__ = "contenedores"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    codigo = Column(String, unique=True, nullable=False, index=True)
    tipo = Column(String, default="20ft")  # 20ft, 40ft, 40ft HC
    estado = Column(Enum(EstadoContenedor), default=EstadoContenedor.EN_PUERTO_ORIGEN)
    bodega_id = Column(String, ForeignKey("bodegas.id"), nullable=True)  # bodega actual
    puerto_origen = Column(String, nullable=True)   # Ej: "Bodega Bogotá" o "Puerto Shanghai"
    puerto_destino = Column(String, nullable=True)  # Ej: "Bodega Medellín" o "Puerto Buenaventura"
    usuario_id = Column(String, ForeignKey("usuarios.id"), nullable=True)
    manifiesto_id = Column(String, ForeignKey("manifiestos.id"), nullable=True)

    # Relaciones
    bodega = relationship("Bodega", back_populates="contenedores")
    usuario = relationship("Usuario", back_populates="contenedores")
    manifiesto = relationship("Manifiesto", back_populates="contenedores")
    tracking = relationship("Tracking", back_populates="contenedor", cascade="all, delete-orphan")

class Manifiesto(Base):
    __tablename__ = "manifiestos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    codigo = Column(String, unique=True, nullable=False, index=True)
    puerto_origen = Column(String, nullable=False)
    puerto_destino = Column(String, nullable=False)
    fecha_salida = Column(DateTime, nullable=True)
    fecha_llegada_estimada = Column(DateTime, nullable=True)
    fecha_llegada_real = Column(DateTime, nullable=True)

    # Relaciones
    contenedores = relationship("Contenedor", back_populates="manifiesto")

class Factura(Base):
    __tablename__ = "facturas"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    numero_factura = Column(String, nullable=False, index=True)
    proveedor = Column(String, nullable=False)
    monto_total = Column(Float, nullable=False)
    monto_impuestos = Column(Float, default=0.0)
    moneda = Column(String, default="USD")
    fecha_emision = Column(DateTime, nullable=True)
    fecha_vencimiento = Column(DateTime, nullable=True)
    archivo_path = Column(String, nullable=True)  # Ruta del PDF/imagen subido
    datos_extraidos_json = Column(Text, nullable=True)  # JSON con datos extraídos por IA
    procesado_por_ia = Column(Boolean, default=False)
    estado = Column(String, default="pendiente")  # pendiente, procesada, validada, rechazada
    usuario_id = Column(String, ForeignKey("usuarios.id"), nullable=True)
    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    usuario = relationship("Usuario", back_populates="facturas")

class Tracking(Base):
    __tablename__ = "tracking"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    contenedor_id = Column(String, ForeignKey("contenedores.id"), nullable=False)
    latitud = Column(Float, nullable=False)
    longitud = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    velocidad = Column(Float, nullable=True)  # en nudos
    estado = Column(String, nullable=True)  # "en ruta", "en puerto", etc.
    notas = Column(Text, nullable=True)

    # Relaciones
    contenedor = relationship("Contenedor", back_populates="tracking")