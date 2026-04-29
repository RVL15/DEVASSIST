import time
import asyncio
import statistics
from typing import Callable, Awaitable
import httpx

BASE = "http://localhost:8000/api/v1"

SAMPLE_CODE = '''
def find_user(users, id):
    for i in range(len(users)):
        if users[i]["id"] == id:
            return users[i]
    return None
'''

BENCHMARKS = [
    ("explain",   {"code": SAMPLE_CODE, "language": "python", "detail_level": "brief"}),
    ("bugfix",    {"code": SAMPLE_CODE, "language": "python"}),
    ("refactor",  {"code": SAMPLE_CODE, "language": "python", "goals": ["performance", "readability"]}),
    ("autocomplete", {"prefix": "def hello(", "suffix": "):\n    pass", "max_tokens": 64}),
]


async def bench_endpoint(client: httpx.AsyncClient, endpoint: str, payload: dict, runs: int = 5):
    latencies = []
    for _ in range(runs):
        t0 = time.perf_counter()
        r = await client.post(f"{BASE}/{endpoint}", json=payload)
        r.raise_for_status()
        latencies.append((time.perf_counter() - t0) * 1000)
    return {
        "endpoint": endpoint,
        "runs": runs,
        "mean_ms": round(statistics.mean(latencies), 1),
        "median_ms": round(statistics.median(latencies), 1),
        "p95_ms": round(sorted(latencies)[int(0.95 * runs)], 1),
        "min_ms": round(min(latencies), 1),
        "max_ms": round(max(latencies), 1),
    }


async def run_all(runs: int = 5):
    async with httpx.AsyncClient(timeout=120) as client:
        results = []
        for endpoint, payload in BENCHMARKS:
            print(f"Benchmarking /{endpoint} ({runs} runs)...")
            result = await bench_endpoint(client, endpoint, payload, runs)
            results.append(result)
            print(f"  mean={result['mean_ms']}ms  p95={result['p95_ms']}ms")
        return results


if __name__ == "__main__":
    import json
    results = asyncio.run(run_all(runs=5))
    print("\n=== BENCHMARK RESULTS ===")
    print(json.dumps(results, indent=2))
