#!/usr/bin/env python3
"""Quick test to send multiple requests and see batching in action."""

import asyncio
import httpx
from datetime import datetime, timezone


async def send_request(client, req_id, priority, prompt):
    """Send a single request."""
    payload = {
        "username": "tester",
        "request_id": req_id,
        "prompt": prompt,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "priority": priority
    }
    
    print(f"→ Sending {req_id} ({priority})")
    response = await client.post("http://127.0.0.1:8000/v1/query", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ {req_id}: {len(data['text'])} chars, {data['tokens_used']} tokens")
    else:
        print(f"✗ {req_id}: Failed - {response.status_code}")


HIGH_TOPICS = ["What is LLM?", "What is RAG?", "What is AI?"]
MEDIUM_TOPICS = ["Explain machine learning", "Explain deep learning", "Explain neural networks"]
LOW_TOPICS = ["Provide a detailed explanation of quantum computing", "Provide a detailed explanation of blockchain"]


async def main():
    print("\n=== Testing Batch Processing ===\n")
    print("Sending 3 HIGH + 3 MEDIUM + 2 LOW priority requests simultaneously...")
    print("(Check server logs to see them batched by priority!)\n")

    tasks = []
    async with httpx.AsyncClient(timeout=70.0) as client:
        for i, topic in enumerate(HIGH_TOPICS):
            tasks.append(send_request(client, f"high-{i}", 2, topic))
        for i, topic in enumerate(MEDIUM_TOPICS):
            tasks.append(send_request(client, f"medium-{i}", 1, topic))
        for i, topic in enumerate(LOW_TOPICS):
            tasks.append(send_request(client, f"low-{i}", 0, topic))
        await asyncio.gather(*tasks)

    print("\n✓ Done! Check the server logs to see the batch processing.\n")


if __name__ == "__main__":
    asyncio.run(main())
