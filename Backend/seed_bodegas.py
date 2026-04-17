import requests
import json
import random

BASE_URL = "https://impokonrad.onrender.com"
EMAIL = "admin@impokonrad.com"
PASSWORD = "admin"

def main():
    print("Iniciando la carga global de bodegas en", BASE_URL)
    
    # 1. Login para obtener token
    r = requests.post(f"{BASE_URL}/login/", data={"username": EMAIL, "password": PASSWORD})
    if r.status_code != 200:
        print("Error en login:", r.text)
        return
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 2. Lista de 20 puertos globales
    bodegas_data = [
        {"nombre": "Terminal Puerto Ningbo", "ubicacion": "Ningbo, China"},
        {"nombre": "Shenzhen Logistics Hub", "ubicacion": "Shenzhen, China"},
        {"nombre": "Guangzhou Port Storage", "ubicacion": "Guangzhou, China"},
        {"nombre": "Busan Marina Warehouse", "ubicacion": "Busan, Corea del Sur"},
        {"nombre": "Hong Kong Central Depot", "ubicacion": "Hong Kong"},
        {"nombre": "Singapore PSA Terminal", "ubicacion": "Singapur"},
        {"nombre": "Antwerp Euro-Logistics", "ubicacion": "Amberes, Bélgica"},
        {"nombre": "Hamburg Port Facility", "ubicacion": "Hamburgo, Alemania"},
        {"nombre": "Los Angeles APM Terminals", "ubicacion": "Los Ángeles, USA"},
        {"nombre": "Long Beach Transit Center", "ubicacion": "Long Beach, USA"},
        {"nombre": "Dubai Jebel Ali Storage", "ubicacion": "Dubai, EAU"},
        {"nombre": "Klang Port Warehouse", "ubicacion": "Port Klang, Malasia"},
        {"nombre": "Santos Logística Brasil", "ubicacion": "Santos, Brasil"},
        {"nombre": "Callao Terminal Andino", "ubicacion": "Callao, Perú"},
        {"nombre": "Manzanillo Pacific Hub", "ubicacion": "Manzanillo, México"},
        {"nombre": "Valencia Puerto Base", "ubicacion": "Valencia, España"},
        {"nombre": "Tokyo Bay Global Cargo", "ubicacion": "Tokio, Japón"},
        {"nombre": "Auckland NZ Transport", "ubicacion": "Auckland, Nueva Zelanda"},
        {"nombre": "Cape Town Trans-Africa", "ubicacion": "Ciudad del Cabo, Sudáfrica"},
        {"nombre": "Sydney Kingsford Depot", "ubicacion": "Sídney, Australia"}
    ]

    for b in bodegas_data:
        # Añadida capacidad aleatoria
        b["capacidad_maxima"] = random.choice([2000, 5000, 8000, 10000, 15000])
        r = requests.post(f"{BASE_URL}/bodegas/", headers=headers, json=b)
        if r.status_code == 200:
            print(f" Bodega creada: {b['nombre']}")
        else:
            print(f" Error al crear {b['nombre']}:", r.text)

    print("\n¡Carga de 20 bodegas adicionales completada!")

if __name__ == "__main__":
    main()
