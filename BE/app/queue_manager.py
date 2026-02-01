# queue_manager.py
import asyncio
import logging
from collections import deque
from datetime import datetime, timezone
from app.models import GenerationRequest

logger = logging.getLogger(__name__)


class QueueItem:
    def __init__(self, request: GenerationRequest, future: asyncio.Future):
        self.request = request
        self.future = future
        self.enqueued_at = datetime.now(timezone.utc)


class QueueManager:
    def __init__(self, batch_processor):
        self.batch_processor = batch_processor

        self.high_queue = deque()
        self.medium_queue = deque()
        self.low_queue = deque()

        self.lock = asyncio.Lock()

        self.windows = {
            "HIGH": 0.2,
            "MEDIUM": 1.0,
            "LOW": 4.0
        }

        self.max_batch = {
            "HIGH": 6,
            "MEDIUM": 4,
            "LOW": 4
        }

        asyncio.create_task(self._dispatcher_loop())

    async def enqueue(self, request: GenerationRequest):
        loop = asyncio.get_event_loop()
        future = loop.create_future()
        item = QueueItem(request, future)

        async with self.lock:
            lane = request.priority.name
            if lane == "HIGH":
                self.high_queue.append(item)
            elif lane == "MEDIUM":
                self.medium_queue.append(item)
            else:
                self.low_queue.append(item)
            
            logger.info(f"[ENQUEUE] Request {request.request_id} added to {lane} queue. Queue sizes: HIGH={len(self.high_queue)}, MEDIUM={len(self.medium_queue)}, LOW={len(self.low_queue)}")

        return await future

    async def _dispatcher_loop(self):
        while True:
            await asyncio.sleep(0.05)
            await self._dispatch()

    async def _dispatch(self):
        async with self.lock:
            now = datetime.now(timezone.utc)

            await self._try_dispatch(self.high_queue, "HIGH", now)
            await self._try_dispatch(self.medium_queue, "MEDIUM", now)
            await self._try_dispatch(self.low_queue, "LOW", now)

    async def _try_dispatch(self, queue, lane, now):
        if not queue:
            return

        oldest = queue[0]
        age = (now - oldest.enqueued_at).total_seconds()

        if age >= self.windows[lane] or len(queue) >= self.max_batch[lane]:
            batch = []
            while queue and len(batch) < self.max_batch[lane]:
                batch.append(queue.popleft())

            request_ids = [item.request.request_id for item in batch]
            logger.info(f"[DISPATCH] Dispatching {lane} batch with {len(batch)} requests (age={age:.2f}s, window={self.windows[lane]}s): {request_ids}")
            
            asyncio.create_task(self.batch_processor.process(batch))
