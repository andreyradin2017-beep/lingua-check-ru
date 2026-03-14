from celery import Celery
from app.config import settings

# Принудительно для локальной разработки без Redis
broker_url = "memory://"
result_backend = "cache+memory://"

celery_app = Celery(
    "linguacheck",
    broker=broker_url,
    backend=result_backend,
    include=["app.tasks"]
)

celery_app.conf.update(
    broker_url="memory://",
    result_backend="cache+memory://",
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Moscow",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600, # 1 hour max
    task_always_eager=True,
    task_eager_propagates=True,
)

print(f"DEBUG: Celery Broker: {celery_app.conf.broker_url}")
print(f"DEBUG: Celery Always Eager: {celery_app.conf.task_always_eager}")
