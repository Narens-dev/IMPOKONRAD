"""
ai_agent.py — Agente de IA para procesamiento de facturas.

Usa el SDK 'google-genai' (nuevo, requerido por esta API key).
Modelo: gemini-2.0-flash (confirmado disponible con listModels).
Soporta:
  - Imágenes: JPG, PNG, WEBP (envío inline en bytes)
  - PDFs: subida con el File API y referencia por URI
"""

import os
import base64
import json
import logging
import time
from datetime import datetime

from dotenv import load_dotenv

load_dotenv(override=True)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [AI_AGENT] %(message)s")

# ==================== CONFIGURACIÓN ====================
# Modelo confirmado disponible con esta API key
GEMINI_MODEL = "gemini-2.0-flash"

try:
    from google import genai
    from google.genai import types
except ImportError:
    raise ImportError(
        "El SDK 'google-genai' no está instalado. "
        "Ejecuta: .\\venv\\Scripts\\python -m pip install google-genai"
    )


def _get_client():
    """Crea un cliente Gemini leyendo la API key fresca del entorno."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY no encontrada en .env")
    return genai.Client(api_key=api_key)


# ==================== PROMPT ====================
PROMPT_EXTRACCION = """
Eres un agente contable experto en análisis de facturas comerciales internacionales.
Analiza el documento y extrae la información en formato JSON estricto:

{
  "proveedor": "Nombre completo de quien emite la factura",
  "numero_factura": "Número o código de la factura",
  "fecha_emision": "Fecha en formato YYYY-MM-DD",
  "monto_total": 0.00,
  "monto_impuestos": 0.00,
  "moneda": "Código ISO 4217 (USD, EUR, COP, etc.)",
  "descripcion": "Descripción breve de los bienes/servicios",
  "confianza": 95
}

REGLAS:
- Solo responde con el JSON. Sin texto adicional ni bloques de código.
- Si un campo no aparece claramente, infiere o usa null.
- `monto_total` y `monto_impuestos` deben ser números, no strings.
- `confianza` es tu nivel de certeza del 0 al 100.
- Compatible con facturas en cualquier idioma.
"""


def _limpiar_json_respuesta(texto: str) -> str:
    """Limpia bloques markdown y espacios del JSON devuelto por Gemini."""
    texto = texto.strip()
    if texto.startswith("```"):
        lineas = texto.split("\n")
        lineas = [l for l in lineas if not l.startswith("```")]
        texto = "\n".join(lineas).strip()
    return texto


def _normalizar(datos: dict) -> dict:
    """Normaliza y valida los campos del JSON extraído."""
    return {
        "proveedor":       str(datos.get("proveedor") or "Proveedor Desconocido"),
        "numero_factura":  str(datos.get("numero_factura") or f"IA-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
        "monto_total":     float(datos.get("monto_total") or 0.0),
        "monto_impuestos": float(datos.get("monto_impuestos") or 0.0),
        "moneda":          str(datos.get("moneda") or "USD"),
        "fecha_emision":   datos.get("fecha_emision"),
        "descripcion":     str(datos.get("descripcion") or ""),
        "confianza":       int(datos.get("confianza") or 0),
        "datos_crudos":    datos,
        "modelo_usado":    GEMINI_MODEL,
    }


# ==================== FUNCIÓN PRINCIPAL ====================
def procesar_imagen_factura_sync(imagen_base64: str, mime_type: str = "image/jpeg") -> dict:
    """
    Procesa una factura (imagen o PDF) usando Gemini Vision.

    Args:
        imagen_base64: El archivo en base64 (con o sin prefijo data:...).
        mime_type:     El tipo MIME del archivo.

    Returns:
        dict con los campos extraídos y normalizados.
    """
    client = _get_client()

    # Extraer mime_type del prefijo data: si viene incluido
    if ',' in imagen_base64:
        header, imagen_base64 = imagen_base64.split(',', 1)
        if 'data:' in header and ';' in header:
            mime_type = header.replace('data:', '').split(';')[0]

    try:
        archivo_bytes = base64.b64decode(imagen_base64)
    except Exception as e:
        raise ValueError(f"Base64 inválido: {e}")

    logger.info(f"Procesando con {GEMINI_MODEL} — tipo: {mime_type}, tamaño: {len(archivo_bytes)} bytes")

    # ── PDF: subir con File API ───────────────────────────────────────────────
    if mime_type == "application/pdf":
        import tempfile, os as _os

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(archivo_bytes)
            tmp_path = tmp.name

        try:
            logger.info("Subiendo PDF al File API de Gemini...")
            archivo_gemini = client.files.upload(
                file=tmp_path,
                config=types.UploadFileConfig(mime_type="application/pdf")
            )

            # Esperar a que el archivo esté ACTIVE
            for _ in range(10):
                archivo_gemini = client.files.get(name=archivo_gemini.name)
                if archivo_gemini.state.name == "ACTIVE":
                    break
                logger.info(f"Archivo en estado {archivo_gemini.state.name}, esperando 2s...")
                time.sleep(2)

            logger.info(f"PDF listo — URI: {archivo_gemini.uri}")
            respuesta = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[PROMPT_EXTRACCION, archivo_gemini],
            )

            # Limpiar el archivo de Gemini
            try:
                client.files.delete(name=archivo_gemini.name)
            except Exception:
                pass

        finally:
            _os.unlink(tmp_path)

    # ── Imagen: envío inline ──────────────────────────────────────────────────
    else:
        parte_imagen = types.Part.from_bytes(data=archivo_bytes, mime_type=mime_type)
        respuesta = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[PROMPT_EXTRACCION, parte_imagen],
        )

    texto_respuesta = respuesta.text
    logger.info(f"Respuesta Gemini (primeros 300 chars): {texto_respuesta[:300]}")

    try:
        json_limpio = _limpiar_json_respuesta(texto_respuesta)
        datos = json.loads(json_limpio)
    except json.JSONDecodeError as e:
        logger.error(f"Gemini no devolvió JSON válido:\n{texto_respuesta}")
        raise ValueError(f"Gemini no retornó JSON válido: {e}")

    return _normalizar(datos)
