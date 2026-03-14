"""
Circuit breaker and retry utilities using tenacity.
Provides decorators for LLM calls with exponential backoff and fallback chains.
"""

from __future__ import annotations

import functools
from typing import Any, Callable, TypeVar

import structlog
from tenacity import (
    RetryError,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

logger = structlog.get_logger(__name__)

T = TypeVar("T")


def with_llm_retry(
    max_attempts: int = 3,
    min_wait: float = 1.0,
    max_wait: float = 30.0,
) -> Callable:
    """
    Decorator for LLM API calls with exponential backoff retry.

    Args:
        max_attempts: Maximum number of attempts.
        min_wait: Minimum wait time between retries (seconds).
        max_wait: Maximum wait time between retries (seconds).

    Usage:
        @with_llm_retry(max_attempts=3)
        async def call_openai(prompt: str) -> str:
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @retry(
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
            retry=retry_if_exception_type((Exception,)),
            before_sleep=before_sleep_log(logger, "warning"),
            reraise=True,
        )
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            return await func(*args, **kwargs)

        return wrapper
    return decorator


def with_fallback(
    primary: Callable[..., T],
    fallback: Callable[..., T],
    fallback_name: str = "fallback",
) -> Callable[..., T]:
    """
    Execute primary function; on failure, execute fallback.

    Args:
        primary: The primary async function to try.
        fallback: The fallback async function if primary fails.
        fallback_name: Name for logging.

    Returns:
        An async function that tries primary, then fallback.
    """
    @functools.wraps(primary)
    async def wrapper(*args: Any, **kwargs: Any) -> T:
        try:
            return await primary(*args, **kwargs)
        except (RetryError, Exception) as exc:
            logger.warning(
                "primary_failed_using_fallback",
                primary=primary.__name__,
                fallback=fallback_name,
                error=str(exc),
            )
            return await fallback(*args, **kwargs)

    return wrapper


class CircuitBreaker:
    """
    Simple circuit breaker that tracks failures and opens the circuit
    after a threshold is reached, preventing further calls for a cooldown period.
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        cooldown_seconds: float = 60.0,
        name: str = "circuit",
    ) -> None:
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.name = name
        self._failures = 0
        self._last_failure_time: float | None = None
        self._is_open = False

    @property
    def is_open(self) -> bool:
        """Check if circuit is open (blocking calls)."""
        if not self._is_open:
            return False

        import time
        if self._last_failure_time and (
            time.time() - self._last_failure_time > self.cooldown_seconds
        ):
            # Cooldown expired — half-open, allow one attempt
            logger.info("circuit_half_open", circuit=self.name)
            self._is_open = False
            self._failures = 0
            return False

        return True

    def record_success(self) -> None:
        """Record a successful call — reset failure count."""
        self._failures = 0
        self._is_open = False

    def record_failure(self) -> None:
        """Record a failed call — increment failure count."""
        import time
        self._failures += 1
        self._last_failure_time = time.time()

        if self._failures >= self.failure_threshold:
            self._is_open = True
            logger.error(
                "circuit_opened",
                circuit=self.name,
                failures=self._failures,
                cooldown=self.cooldown_seconds,
            )


# Pre-configured circuit breakers
openai_circuit = CircuitBreaker(
    failure_threshold=5,
    cooldown_seconds=60.0,
    name="openai",
)

ollama_circuit = CircuitBreaker(
    failure_threshold=3,
    cooldown_seconds=30.0,
    name="ollama",
)
