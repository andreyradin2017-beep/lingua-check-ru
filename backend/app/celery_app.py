from celery import Celery
from app.config import settings

celery_app = Celery(
    "linguacheck",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Moscow",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600, # 1 hour max
    task_always_eager=settings.celery_task_always_eager,
)
