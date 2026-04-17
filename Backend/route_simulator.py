"""
route_simulator.py — Simulador de rutas para contenedores en tránsito.

Genera datos de tracking progresivos para los contenedores existentes en la base de datos,
simulando su movimiento desde el puerto de origen hacia el destino.

USO:
    cd Backend
    .\\venv\\Scripts\\python route_simulator.py

    # Con parámetros opcionales:
    .\\venv\\Scripts\\python route_simulator.py --intervalos 10 --pasos 20

El script inserta una nueva coordenada de tracking cada N segundos.
Funciona en bucle continuo hasta que se detenga con Ctrl+C.
"""

import sys
import time
import math
import random
import argparse
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, '.')  # Asegurarse de que los módulos locales se encuentren

from database import SessionLocal
import models

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

geolocator = Nominatim(user_agent="impokonrad_tracker")
_geocode_cache = {}

def get_coordinates(location_name):
    """Geolocaliza un nombre de texto y devuelve (lat, lng). Usa caché para no abusar de la API."""
    if not location_name:
        return None
    
    loc_clean = location_name.strip().lower()
    if loc_clean in _geocode_cache:
        return _geocode_cache[loc_clean]
        
    try:
        time.sleep(1) # Rate limit rudimentario
        location = geolocator.geocode(location_name)
        if location:
            coords = (location.latitude, location.longitude)
            _geocode_cache[loc_clean] = coords
            return coords
    except Exception as e:
        pass
    
    return None

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [SIMULADOR] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# ==================== RUTAS PREDEFINIDAS ====================
# Cada ruta es una lista de puntos (lat, lng) que representan
# hitos clave de una ruta maritima real.
RUTAS_MARITIMAS = {
    "SHANGHAI_ROTTERDAM": [
        (31.2304, 121.4737),   # Shanghai, China
        (13.7563, 100.5018),   # Bangkok, Tailandia (paso)
        (1.3521, 103.8198),    # Singapur
        (11.5625, 43.1448),    # Djibouti (Cuerno de Africa)
        (12.3535, 43.1477),    # Golfo de Aden
        (14.0945, 42.9439),    # Mar Rojo
        (28.0339, 30.7760),    # Canal de Suez
        (36.8969, 10.1858),    # Túnez (Mediterráneo)
        (36.1408, -5.3536),    # Gibraltar
        (43.2965, 5.3698),     # Marsella (paso)
        (51.9244, 4.4777),     # Rotterdam, Países Bajos
    ],
    "BUENAVENTURA_SHANGHAI": [
        (3.8801, -77.0750),    # Buenaventura, Colombia
        (8.9936, -79.5197),    # Canal de Panamá (entrada)
        (9.0820, -79.6674),    # Canal de Panamá (salida)
        (19.4326, -99.1332),   # Ciudad de México (paso)
        (21.3069, -157.8583),  # Honolulu, Hawaii (paso)
        (31.2304, 121.4737),   # Shanghai, China
    ],
    "CARTAGENA_MIAMI": [
        (10.3910, -75.4794),   # Cartagena, Colombia
        (15.1997, -77.4500),   # Jamaica (paso)
        (23.5893, -80.0000),   # Estrecho de Florida
        (25.7617, -80.1918),   # Miami, USA
    ],
    "BARRANQUILLA_ROTTERDAM": [
        (10.9639, -74.7965),   # Barranquilla, Colombia
        (13.0000, -60.0000),   # Caribe (paso)
        (26.0000, -40.0000),   # Atlántico Norte (paso)
        (39.0000, -20.0000),   # Atlántico Central (paso)
        (51.9244, 4.4777),     # Rotterdam, Países Bajos
    ],
}

NOMBRES_RUTAS = list(RUTAS_MARITIMAS.keys())


def interpolar_punto(p1, p2, t):
    """Interpola linealmente entre dos puntos. t va de 0 a 1."""
    lat = p1[0] + (p2[0] - p1[0]) * t
    lng = p1[1] + (p2[1] - p1[1]) * t
    return (lat, lng)


def agregar_ruido(lat, lng, magnitud=0.05):
    """Agrega un pequeño ruido para que la ruta no parezca perfectamente lineal."""
    return (
        lat + random.uniform(-magnitud, magnitud),
        lng + random.uniform(-magnitud, magnitud)
    )


def obtener_siguiente_posicion(historial_tracking, ruta_puntos):
    """
    Calcula la siguiente posición en la ruta basado en cuántos pasos ya se han dado.
    """
    n_pasos = len(historial_tracking)
    n_segmentos = len(ruta_puntos) - 1
    
    if n_segmentos <= 0:
        return ruta_puntos[0]
    
    # Calcular qué segmento de la ruta estamos recorriendo
    pasos_por_segmento = max(1, 30 // n_segmentos)  # Aprox 30 pasos totales por ruta
    segmento_actual = min(n_pasos // pasos_por_segmento, n_segmentos - 1)
    t = (n_pasos % pasos_por_segmento) / pasos_por_segmento
    
    p1 = ruta_puntos[segmento_actual]
    p2 = ruta_puntos[min(segmento_actual + 1, len(ruta_puntos) - 1)]
    
    lat, lng = interpolar_punto(p1, p2, t)
    lat, lng = agregar_ruido(lat, lng, magnitud=0.03)
    
    return (lat, lng)


def simular_paso(db, contenedor, ruta_fallback, p_origen, p_destino):
    """Inserta una nueva coordenada de tracking para un contenedor."""
    
    historial = db.query(models.Tracking).filter(
        models.Tracking.contenedor_id == contenedor.id
    ).count()

    ruta_puntos = ruta_fallback

    # Geocodificar origen y destino para ruta dinámica
    if p_origen and p_destino:
        c_origen = get_coordinates(p_origen)
        c_destino = get_coordinates(p_destino)
        
        if c_origen and c_destino:
            # Añadir un punto intermedio curvo o usar línea recta
            lat_med = (c_origen[0] + c_destino[0]) / 2 + random.uniform(-5, 5)
            lng_med = (c_origen[1] + c_destino[1]) / 2 + random.uniform(-5, 5)
            ruta_puntos = [c_origen, (lat_med, lng_med), c_destino]

    # Si está en puerto de origen pero apenas inicia
    if contenedor.estado == models.EstadoContenedor.EN_PUERTO_ORIGEN:
        # Generar un único punto en el origen
        lat, lng = ruta_puntos[0]
        velocidad = 0.0
        estado = "En puerto de origen"
    elif contenedor.estado == models.EstadoContenedor.ENTREGADO:
        lat, lng = ruta_puntos[-1]
        velocidad = 0.0
        estado = "Entregado"
    else:
        # En tránsito: interpolar la posición
        lat, lng = obtener_siguiente_posicion(list(range(historial)), ruta_puntos)
        velocidad = round(random.uniform(12.0, 24.0), 1)
        
        progreso = historial / 30.0
        if progreso < 0.1: estado = "Saliendo del puerto"
        elif progreso < 0.4: estado = "En tránsito marítimo"
        elif progreso < 0.7: estado = "Mitad de ruta"
        elif progreso < 0.9: estado = "Aproximando destino"
        else: estado = "Llegando al destino"

    nuevo_tracking = models.Tracking(
        contenedor_id=contenedor.id,
        latitud=round(lat, 6),
        longitud=round(lng, 6),
        velocidad=velocidad,
        estado=estado,
        notas=f"Simulado {'dinámico' if (p_origen and p_destino) else 'predefinido'} - paso {historial + 1}"
    )

    db.add(nuevo_tracking)
    db.commit()

    return lat, lng, velocidad


def main(intervalos_segundos=15, max_pasos=None):
    """Función principal del simulador."""
    logger.info("=" * 60)
    logger.info("  IMPOKONRAD — Simulador de Rutas Marítimas")
    logger.info("=" * 60)
    logger.info(f"Intervalo entre actualizaciones: {intervalos_segundos}s")
    logger.info("Presiona Ctrl+C para detener.\n")

    db = SessionLocal()
    paso_global = 0

    try:
        while True:
            # Obtener todos los contenedores que no estén inactivos de tracking
            contenedores = db.query(models.Contenedor).filter(
                models.Contenedor.estado.in_([
                    models.EstadoContenedor.EN_PUERTO_ORIGEN,
                    models.EstadoContenedor.EN_TRANSITO,
                    models.EstadoContenedor.EN_ADUANA,
                    models.EstadoContenedor.EN_PUERTO_DESTINO
                ])
            ).all()

            if not contenedores:
                logger.warning("No hay contenedores activos para procesar. Esperando...")
                time.sleep(intervalos_segundos * 2)
                continue

            logger.info(f"Paso #{paso_global + 1} — Actualizando {len(contenedores)} contenedor(es)...")
            
            for i, contenedor in enumerate(contenedores):
                nombre_ruta = NOMBRES_RUTAS[i % len(NOMBRES_RUTAS)]
                ruta_fallback = RUTAS_MARITIMAS[nombre_ruta]
                
                try:
                    lat, lng, vel = simular_paso(
                        db, 
                        contenedor, 
                        ruta_fallback, 
                        contenedor.puerto_origen, 
                        contenedor.puerto_destino
                    )
                    tipo_ruta = "Dinámica" if contenedor.puerto_origen else f"Fallback ({nombre_ruta})"
                    logger.info(
                        f"  ✓ [{contenedor.codigo}] → Ruta: {tipo_ruta} | "
                        f"Pos: ({lat:.4f}, {lng:.4f}) | Vel: {vel} kts"
                    )
                except Exception as e:
                    logger.error(f"  ✗ Error con contenedor {contenedor.codigo}: {e}")
                    db.rollback()

            paso_global += 1

            if max_pasos and paso_global >= max_pasos:
                logger.info(f"\nSimulación completada: {paso_global} pasos ejecutados.")
                break

            logger.info(f"  → Esperando {intervalos_segundos}s para el siguiente paso...\n")
            time.sleep(intervalos_segundos)

    except KeyboardInterrupt:
        logger.info("\n\nSimulación detenida por el usuario. ¡Hasta luego!")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulador de rutas marítimas para IMPOKONRAD")
    parser.add_argument(
        "--intervalos",
        type=int,
        default=15,
        help="Segundos entre cada actualización de coordenadas (default: 15)"
    )
    parser.add_argument(
        "--pasos",
        type=int,
        default=None,
        help="Número máximo de pasos antes de parar (default: infinito)"
    )
    args = parser.parse_args()
    main(intervalos_segundos=args.intervalos, max_pasos=args.pasos)
