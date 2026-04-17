"""
Script de pruebas para el backend de IMPOKONRAD
Ejecutar con: python test_backend.py
"""

import sys
import os

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database import SessionLocal, engine
import models
import security
from datetime import datetime

def test_database_connection():
    """Prueba 1: Conexión a la base de datos"""
    print("1. Probando conexion a la base de datos...")
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT 1")).scalar()
        db.close()
        print(f"   [OK] Conexion exitosa (resultado: {result})")
        return True
    except Exception as e:
        print(f"   [ERROR] {e}")
        return False

def test_tablas_existentes():
    """Prueba 2: Verificar que las tablas existen"""
    print("2. Verificando tablas existentes...")
    try:
        db = SessionLocal()
        result = db.execute(text("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)).fetchall()
        db.close()
        tablas = [t[0] for t in result]
        print(f"   [OK] Tablas encontradas: {', '.join(tablas)}")
        return True
    except Exception as e:
        print(f"   [ERROR] {e}")
        return False

def test_password_hashing():
    """Prueba 3: Hash de contraseñas"""
    print("3. Probando hash de contraseñas...")
    try:
        password = "test123"
        hashed = security.hashear_password(password)
        es_valido = security.verificar_password(password, hashed)
        no_valido = not security.verificar_password("wrong", hashed)

        if es_valido and no_valido:
            print(f"   [OK] Hash funcionando correctamente")
            return True
        else:
            print(f"   [ERROR] Error en verificacion")
            return False
    except Exception as e:
        print(f"   [ERROR] {e}")
        return False

def test_tokens_jwt():
    """Prueba 4: Generación y verificación de tokens JWT"""
    print("4. Probando tokens JWT...")
    try:
        # Crear token de acceso
        access_token = security.crear_token_acceso({"sub": "test@test.com"})
        assert access_token is not None and len(access_token) > 50

        # Crear refresh token
        refresh_token = security.crear_refresh_token({"sub": "test@test.com"})
        assert refresh_token is not None

        # Verificar token de acceso
        email = security.verificar_token(access_token, "access")
        assert email == "test@test.com"

        # Verificar refresh token
        email_refresh = security.verificar_token(refresh_token, "refresh")
        assert email_refresh == "test@test.com"

        print(f"   [OK] Tokens JWT funcionando correctamente")
        return True
    except Exception as e:
        print(f"   [ERROR] {e}")
        return False

def test_modelos():
    """Prueba 5: Verificar modelos SQLAlchemy"""
    print("5. Verificando modelos SQLAlchemy...")
    try:
        modelos_esperados = ['Usuario', 'Bodega', 'Contenedor', 'Manifiesto', 'Factura', 'Tracking']
        modelos_encontrados = []

        for modelo in modelos_esperados:
            if hasattr(models, modelo):
                modelos_encontrados.append(modelo)

        if len(modelos_encontrados) == len(modelos_esperados):
            print(f"   [OK] Todos los modelos encontrados: {', '.join(modelos_encontrados)}")
            return True
        else:
            faltantes = set(modelos_esperados) - set(modelos_encontrados)
            print(f"   [ERROR] Faltan modelos: {faltantes}")
            return False
    except Exception as e:
        print(f"   [ERROR] {e}")
        return False

def test_crud_usuario():
    """Prueba 6: CRUD básico de usuarios"""
    print("6. Probando CRUD de usuarios...")
    try:
        db = SessionLocal()

        # Crear usuario de prueba
        email_test = f"test_{datetime.now().timestamp()}@test.com"
        usuario = models.Usuario(
            nombre="Test User",
            email=email_test,
            password_hash=security.hashear_password("password123"),
            rol=models.RolEnum.USUARIO
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

        # Leer usuario
        usuario_db = db.query(models.Usuario).filter(models.Usuario.email == email_test).first()
        assert usuario_db is not None
        assert usuario_db.nombre == "Test User"

        # Eliminar usuario
        db.delete(usuario_db)
        db.commit()
        db.close()

        print(f"   [OK] CRUD de usuarios funcionando")
        return True
    except Exception as e:
        print(f"   [ERROR] {e}")
        return False

def main():
    print("=" * 50)
    print("PRUEBAS DEL BACKEND IMPOKONRAD")
    print("=" * 50)
    print()

    resultados = []

    resultados.append(("Conexion BD", test_database_connection()))
    resultados.append(("Tablas BD", test_tablas_existentes()))
    resultados.append(("Hash Password", test_password_hashing()))
    resultados.append(("Tokens JWT", test_tokens_jwt()))
    resultados.append(("Modelos", test_modelos()))
    resultados.append(("CRUD Usuario", test_crud_usuario()))

    print()
    print("=" * 50)
    print("RESUMEN")
    print("=" * 50)

    aprobados = sum(1 for _, r in resultados if r)
    total = len(resultados)

    for nombre, resultado in resultados:
        estado = "[OK]" if resultado else "[ERROR]"
        print(f"{estado} {nombre}")

    print()
    print(f"Resultados: {aprobados}/{total} pruebas aprobadas")

    if aprobados == total:
        print("\n[EXITO] Todas las pruebas pasaron! El backend esta funcionando correctamente.")
        return 0
    else:
        print(f"\n[ALERTA] {total - aprobados} prueba(s) fallaron. Revisar errores arriba.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
