#!/usr/bin/env python3
"""Test script to verify batch processing with multiple simultaneous requests."""

import asyncio
import httpx
from datetime import datetime, timezone
import json


BASE_URL = "http://127.0.0.1:8000"


async def send_request(client: httpx.AsyncClient, request_id: str, priority: str, prompt: str):
    """Send a single request and measure response time."""
    start_time = datetime.now(timezone.utc)
    
    payload = {
        "username": "test_user",
        "request_id": request_id,
        "prompt": prompt,
        "created_at": start_time.isoformat(),
        "priority": priority
    }
    
    try:
        print(f"[{request_id}] Sending {priority} priority request...")
        response = await client.post(f"{BASE_URL}/v1/query", json=payload)
        end_time = datetime.now(timezone.utc)
        elapsed_ms = (end_time - start_time).total_seconds() * 1000
        
        if response.status_code == 200:
            data = response.json()
            print(f"[{request_id}] ✓ SUCCESS ({elapsed_ms:.0f}ms)")
            print(f"  Priority: {priority}")
            print(f"  Response length: {len(data['text'])} chars")
            print(f"  Tokens used: {data['tokens_used']}")
            print(f"  Server latency: {data['latency_ms']:.2f}ms")
            print(f"  Response preview: {data['text'][:100]}...")
            print()
            return True
        else:
            print(f"[{request_id}] ✗ FAILED: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"[{request_id}] ✗ ERROR: {e}")
        return False


async def test_scenario_1():
    """Test 1: Send 5 HIGH priority requests simultaneously (should batch together)."""
    print("\n" + "="*80)
    print("TEST 1: 5 HIGH priority requests (should batch in ~0.2s)")
    print("="*80 + "\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = [
            send_request(client, f"high-{i}", "HIGH", f"What is {topic}?")
            for i, topic in enumerate([
                "artificial intelligence",
                "machine learning",
                "neural networks",
                "deep learning",
                "natural language processing"
            ])
        ]
        results = await asyncio.gather(*tasks)
        print(f"Results: {sum(results)}/{len(results)} succeeded\n")


async def test_scenario_2():
    """Test 2: Send 6 MEDIUM priority requests simultaneously (should batch together)."""
    print("\n" + "="*80)
    print("TEST 2: 6 MEDIUM priority requests (should batch in ~1s)")
    print("="*80 + "\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = [
            send_request(client, f"medium-{i}", 2, f"Explain {topic}")
            for i, topic in enumerate([
                "quantum computing",
                "blockchain technology",
                "cloud computing",
                "edge computing",
                "distributed systems",
                "microservices"
            ])
        ]
        results = await asyncio.gather(*tasks)
        print(f"Results: {sum(results)}/{len(results)} succeeded\n")


async def test_scenario_3():
    """Test 3: Send 8 LOW priority requests simultaneously (should batch together)."""
    print("\n" + "="*80)
    print("TEST 3: 8 LOW priority requests (should batch in ~4s)")
    print("="*80 + "\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = [
            send_request(client, f"low-{i}", "LOW", f"Provide a detailed explanation of {topic}")
            for i, topic in enumerate([
                "quantum mechanics",
                "general relativity",
                "string theory",
                "dark matter",
                "black holes",
                "the big bang",
                "cosmic inflation",
                "multiverse theory"
            ])
        ]
        results = await asyncio.gather(*tasks)
        print(f"Results: {sum(results)}/{len(results)} succeeded\n")


async def test_scenario_4():
    """Test 4: Mixed priorities - should separate into different batches."""
    print("\n" + "="*80)
    print("TEST 4: Mixed priorities (3 HIGH, 3 MEDIUM, 3 LOW)")
    print("="*80 + "\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = []
        
        # 3 HIGH priority
        for i in range(3):
            tasks.append(send_request(client, f"mixed-high-{i}", "HIGH", f"Quick answer about topic {i}"))
        
        # 3 MEDIUM priority
        for i in range(3):
            tasks.append(send_request(client, f"mixed-medium-{i}", "MEDIUM", f"Balanced answer about topic {i}"))
        
        # 3 LOW priority
        for i in range(3):
            tasks.append(send_request(client, f"mixed-low-{i}", "LOW", f"Detailed answer about topic {i}"))
        
        results = await asyncio.gather(*tasks)
        print(f"Results: {sum(results)}/{len(results)} succeeded\n")


async def test_scenario_5():
    """Test 5: Staggered requests to test time-based batching."""
    print("\n" + "="*80)
    print("TEST 5: Staggered HIGH priority requests (test time-based batching)")
    print("="*80 + "\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Send 2 requests
        print("Sending first 2 requests...")
        tasks1 = [
            send_request(client, f"stagger-1-{i}", "HIGH", f"Question {i}")
            for i in range(2)
        ]
        
        # Wait 0.1s and send 2 more (should be in same batch)
        await asyncio.sleep(0.1)
        print("Sending 2 more requests after 0.1s...")
        tasks2 = [
            send_request(client, f"stagger-2-{i}", "HIGH", f"Question {i}")
            for i in range(2)
        ]
        
        results = await asyncio.gather(*tasks1, *tasks2)
        print(f"Results: {sum(results)}/{len(results)} succeeded\n")


async def main():
    """Run all test scenarios."""
    print("\n" + "="*80)
    print("BATCH PROCESSING TEST SUITE")
    print("="*80)
    print("\nMake sure the server is running at http://127.0.0.1:8000")
    print("Watch the server logs to see batching behavior!")
    print("\nPress Ctrl+C to cancel\n")
    
    await asyncio.sleep(2)
    
    try:
        await test_scenario_1()
        await asyncio.sleep(1)
        
        await test_scenario_2()
        await asyncio.sleep(1)
        
        await test_scenario_3()
        await asyncio.sleep(1)
        
        await test_scenario_4()
        await asyncio.sleep(1)
        
        await test_scenario_5()
        
        print("\n" + "="*80)
        print("ALL TESTS COMPLETED!")
        print("="*80 + "\n")
        
    except KeyboardInterrupt:
        print("\n\nTests cancelled by user.")


if __name__ == "__main__":
    asyncio.run(main())
