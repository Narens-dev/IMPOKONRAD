import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Usamos la variable de entorno, y si no existe (por seguridad) ponemos la local
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://impokonrad:impokonrad123@localhost:5433/impokonrad")
# Creamos el motor de la base de datos
engine = create_engine(DATABASE_URL)

# Creamos la sesión para poder hacer consultas después
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para nuestros modelos
Base = declarative_base()