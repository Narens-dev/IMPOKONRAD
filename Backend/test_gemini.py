import os
from dotenv import load_dotenv
load_dotenv(override=True)

from google import genai

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key loaded (first 10 chars): {api_key[:10]}...")

client = genai.Client(api_key=api_key)

print("Testing gemini-2.0-flash...")
resp = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=["Responde solo con JSON: {\"status\": \"ok\", \"modelo\": \"gemini-2.0-flash\"}"]
)
print("RESPONSE:", resp.text[:200])
print("TEST PASSED!")
