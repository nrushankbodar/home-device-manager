import os

from dotenv import load_dotenv
from sqlalchemy import URL, create_engine, text


load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

database_url = os.getenv("DATABASE_URL")

if database_url:
    print("DATABASE_URL is set. The app will use DATABASE_URL before MYSQL_* values.")
    print("If your password contains @, remove DATABASE_URL and use MYSQL_* values instead.")
else:
    user = os.getenv("MYSQL_USER", "root").strip()
    password = os.getenv("MYSQL_PASSWORD", "password").strip()
    host = os.getenv("MYSQL_HOST", "localhost").strip()
    port = int(os.getenv("MYSQL_PORT", "3306").strip())
    database = os.getenv("MYSQL_DATABASE", "home_device_manager").strip()

    print("DATABASE_URL is not set. The app will use MYSQL_* values.")
    print(f"MYSQL_USER={user}")
    print(f"MYSQL_HOST={host}")
    print(f"MYSQL_PORT={port}")
    print(f"MYSQL_DATABASE={database}")
    print(f"MYSQL_PASSWORD_LENGTH={len(password)}")

    database_url = URL.create(
        "mysql+pymysql",
        username=user,
        password=password,
        host=host,
        port=port,
        database=database,
    )

engine = create_engine(database_url, pool_pre_ping=True)

with engine.connect() as connection:
    version = connection.execute(text("SELECT VERSION()")).scalar_one()
    print(f"MySQL connection ok. Version: {version}")
