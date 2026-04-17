import os
import sys
from datetime import datetime, timezone, timedelta
import random
import uuid
import bcrypt

# Asegurar que el path sea correcto para importaciones
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models

def hashear_password(password: str) -> str:
    """Usa el mismo método que security.py (bcrypt directo)"""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def run_seeder():
    print("Creando tablas si no existen...")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Buscando / Creando Admin...")
        admin = db.query(models.Usuario).filter(models.Usuario.email == "admin@impokonrad.com").first()
        if not admin:
            admin = models.Usuario(
                email="admin@impokonrad.com",
                nombre="Administrador",
                password_hash=hashear_password("admin123"),
                rol=models.RolEnum.ADMIN
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("=> Admin Creado! Usa correo: admin@impokonrad.com clave: admin123")

        print("Creando Bodegas...")
        bodegas = []
        bodega_nombres = ["Sede Bogotá Principal", "Centro Acopio Buenaventura", "Zona Franca Cartagena"]
        ubicaciones = ["Bogotá, Colombia", "Buenaventura, Colombia", "Cartagena, Colombia"]
        for i in range(3):
            b = db.query(models.Bodega).filter(models.Bodega.nombre == bodega_nombres[i]).first()
            if not b:
                b = models.Bodega(
                    nombre=bodega_nombres[i],
                    ubicacion=ubicaciones[i],
                    capacidad_maxima=random.randint(500, 2000),
                    capacidad_actual=random.randint(50, 400)
                )
                db.add(b)
                db.commit()
                db.refresh(b)
            bodegas.append(b)

        print("Creando Manifiestos...")
        manifiestos = []
        for i in range(2):
            c_man = f"MAN-2026-0{random.randint(10,99)}"
            m = db.query(models.Manifiesto).filter(models.Manifiesto.codigo == c_man).first()
            if not m:
                m = models.Manifiesto(
                    codigo=c_man,
                    puerto_origen=random.choice(["Shanghai", "Miami", "Rotterdam"]),
                    puerto_destino=random.choice(["Buenaventura", "Cartagena", "Barranquilla"]),
                )
                db.add(m)
                db.commit()
                db.refresh(m)
            manifiestos.append(m)

        print("Creando Contenedores...")
        contenedores = []
        for i in range(5):
            c_con = f"ZIMU-{random.randint(100000,999999)}-{random.randint(0,9)}"
            c = db.query(models.Contenedor).filter(models.Contenedor.codigo == c_con).first()
            if not c:
                c = models.Contenedor(
                    codigo=c_con,
                    tipo=random.choice(["20ft", "40ft", "40ft HC"]),
                    estado=random.choice(list(models.EstadoContenedor)),
                    bodega_id=random.choice(bodegas).id,
                    manifiesto_id=random.choice(manifiestos).id,
                    usuario_id=admin.id
                )
                db.add(c)
                db.commit()
                db.refresh(c)
            contenedores.append(c)

        print("Creando Tracking GPS...")
        for c in contenedores:
            track = db.query(models.Tracking).filter(models.Tracking.contenedor_id == c.id).first()
            if not track:
                base_lat = random.uniform(3.0, 15.0)
                base_lng = random.uniform(-80.0, -70.0)
                # Crear traza historica de 5 puntos
                for j in range(5):
                    t = models.Tracking(
                        contenedor_id=c.id,
                        latitud=base_lat + (j * 0.1),
                        longitud=base_lng + (j * 0.1),
                        velocidad=random.uniform(10.0, 25.0),
                        estado="en transito marítimo",
                        timestamp=datetime.now(timezone.utc) - timedelta(days=(5-j))
                    )
                    db.add(t)
                db.commit()

        print("Creando Facturas...")
        for i in range(4):
            f_num = f"INV-2026-00{random.randint(10,90)}"
            f = db.query(models.Factura).filter(models.Factura.numero_factura == f_num).first()
            if not f:
                f = models.Factura(
                    numero_factura=f_num,
                    proveedor=random.choice(["Maersk", "Evergreen", "Hapag-Lloyd"]),
                    monto_total=random.uniform(5000, 25000),
                    monto_impuestos=random.uniform(500, 2500),
                    estado=random.choice(["pendiente", "procesada", "validada"]),
                    usuario_id=admin.id
                )
                db.add(f)
        db.commit()

        print("===== Base de Datos Poblada Correctamente =====")

    except Exception as e:
        print("Error en seed:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_seeder()
