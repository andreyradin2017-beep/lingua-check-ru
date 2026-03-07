import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
url = os.environ["DATABASE_URL"].replace("+asyncpg", "").replace("+psycopg", "")
print("Testing URL:", url)

try:
    engine = create_engine(url, pool_pre_ping=True)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT version();")).scalar()
        print("Success! PostgreSQL Version:", res)
except Exception as e:
    print("Error:", e)
