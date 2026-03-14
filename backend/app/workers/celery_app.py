"""
Celery application configuration.
Uses Redis as broker and result backend.
"""

from __future__ import annotations

from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "unisync",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.tasks"],
)

# Configuration
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # Timezone
    timezone="UTC",
    enable_utc=True,

    # Concurrency
    worker_concurrency=settings.max_concurrent_processing,
    worker_prefetch_multiplier=2,

    # Task behavior
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max per task
    task_soft_time_limit=240,  # 4 minutes soft limit
    task_acks_late=True,  # Don't ack until task completes
    task_reject_on_worker_lost=True,

    # Rate limiting for Gmail API (250 quota units/user/second)
    worker_max_tasks_per_child=500,  # Restart worker after 500 tasks

    # Result expiry
    result_expires=3600,  # 1 hour

    # Retry policy for broker connection
    broker_connection_retry_on_startup=True,

    # Task routes
    task_routes={
        "app.workers.tasks.process_email": {"queue": "email_processing"},
        "app.workers.tasks.bulk_sync_account": {"queue": "sync"},
        "app.workers.tasks.sync_to_calendar": {"queue": "calendar"},
    },
)
