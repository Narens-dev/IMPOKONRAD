import requests
import json
from datetime import datetime, timedelta
import random

BASE_URL = "https://impokonrad.onrender.com"
EMAIL = "admin@impokonrad.com"
PASSWORD = "admin"

def main():
    print("Iniciando la carga de datos de prueba en", BASE_URL)
    
    # 1. Login para obtener token
    login_data = {"username": EMAIL, "password": PASSWORD}
    r = requests.post(f"{BASE_URL}/login/", data=login_data)
    if r.status_code != 200:
        print("Error en login:", r.text)
        return
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("Login exitoso.")

    # 2. Crear Bodegas
    bodegas_data = [
        {"nombre": "Bodega Buenaventura Principal", "ubicacion": "Buenaventura, Colombia", "capacidad_maxima": 5000},
        {"nombre": "Hub Logístico Miami", "ubicacion": "Miami, USA", "capacidad_maxima": 2000},
        {"nombre": "Distribución Shanghai", "ubicacion": "Shanghai, China", "capacidad_maxima": 10000},
        {"nombre": "Centro Rotterdam", "ubicacion": "Rotterdam, Países Bajos", "capacidad_maxima": 8000}
    ]
    bodegas_ids = []
    print("Creando bodegas...")
    for b in bodegas_data:
        r = requests.post(f"{BASE_URL}/bodegas/", headers=headers, json=b)
        if r.status_code == 200:
            bodegas_ids.append(r.json()["id"])
            print(f" Bodega creada: {b['nombre']}")
        elif r.status_code == 400 and "ya existe" in r.text.lower():
            print(f" Bodega existente saltada: {b['nombre']}")
            
    # Si las bodegas ya existían o por alguna razón no se crearon, intentar obtenerlas
    r = requests.get(f"{BASE_URL}/bodegas/", headers=headers)
    if r.status_code == 200:
        all_bodegas = r.json()
        bodegas_ids = [bod['id'] for bod in all_bodegas[:4]]

    if not bodegas_ids:
        print("No hay bodegas disponibles para continuar.")
        return

    # 3. Crear Manifiestos
    manifiestos_data = [
        {"codigo": "MAN-SH-BUE-001", "puerto_origen": "Shanghai, China", "puerto_destino": "Buenaventura, Colombia"},
        {"codigo": "MAN-MIA-BUE-002", "puerto_origen": "Miami, USA", "puerto_destino": "Buenaventura, Colombia"},
        {"codigo": "MAN-ROT-BUE-003", "puerto_origen": "Rotterdam, Países Bajos", "puerto_destino": "Buenaventura, Colombia"}
    ]
    manifiestos_ids = []
    print("\nCreando manifiestos...")
    for m in manifiestos_data:
        r = requests.post(f"{BASE_URL}/manifiestos/", headers=headers, json=m)
        if r.status_code == 200:
            manifiestos_ids.append(r.json()["id"])
            print(f" Manifiesto creado: {m['codigo']}")

    r = requests.get(f"{BASE_URL}/manifiestos/", headers=headers)
    if r.status_code == 200:
        all_man = r.json()
        manifiestos_ids = [m['id'] for m in all_man[:3]]

    # 4. Crear Contenedores
    estados = ["en_puerto_origen", "en_transito", "en_aduana", "en_puerto_destino", "entregado"]
    tipos = ["20ft", "40ft", "40ft_hc", "Reefer"]
    
    print("\nCreando contenedores...")
    for i in range(1, 21):
        codigo = f"CNTR-{random.randint(10000, 99999)}"
        estado = random.choice(estados)
        bod_id = random.choice(bodegas_ids) if estado in ["en_puerto_origen", "entregado", "en_puerto_destino"] else None
        man_id = random.choice(manifiestos_ids) if manifiestos_ids else None
        
        cntr_data = {
            "codigo": codigo,
            "tipo": random.choice(tipos),
            "estado": estado,
            "bodega_id": bod_id,
            "manifiesto_id": man_id,
            "puerto_origen": "Miami, USA" if man_id == manifiestos_ids[1] else ("Shanghai, China" if man_id == manifiestos_ids[0] else "Rotterdam"),
            "puerto_destino": "Buenaventura, Colombia"
        }
        r = requests.post(f"{BASE_URL}/contenedores/", headers=headers, json=cntr_data)
        if r.status_code == 200:
            print(f" Contenedor {codigo} creado ({estado}).")

    # 5. Crear Facturas
    print("\nCreando facturas...")
    proveedores = ["Oceanic Logistics Inc.", "Evergreen Transport", "Maersk Line", "CMA CGM", "MSC"]
    
    for i in range(1, 16):
        num_fact = f"INV-2026-{random.randint(1000, 9999)}"
        monto = round(random.uniform(1500.0, 15000.0), 2)
        estado = random.choice(["pendiente", "pagada", "vencida"])
        
        fac_data = {
            "numero_factura": num_fact,
            "proveedor": random.choice(proveedores),
            "monto_total": monto,
            "monto_impuestos": round(monto * 0.19, 2),
            "moneda": "USD",
            "estado": estado
        }
        r = requests.post(f"{BASE_URL}/facturas/", headers=headers, json=fac_data)
        if r.status_code == 200:
            print(f" Factura {num_fact} ({estado}) por ${monto} creada.")

    print("\n¡Carga masiva de datos completada exitosamente!")

if __name__ == "__main__":
    main()
