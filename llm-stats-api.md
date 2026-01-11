

# Benchmarks

0. All Models

Endpoint:
```
https://api.zeroeval.com/leaderboard/models/full?justCanonicals=true
```

Response:
```json
[{
    "model_id": "chatgpt-4o-latest",
    "name": "ChatGPT-4o Latest",
    "organization": "OpenAI",
    "organization_id": "openai",
    "organization_country": "US",
    "params": null,
    "context": 128000,
    "canonical_model_id": null,
    "release_date": "2024-05-13",
    "announcement_date": "2024-05-13",
    "multimodal": true,
    "license": "proprietary",
    "knowledge_cutoff": null,
    "input_price": "2.5000000000000000",
    "output_price": "10.0000000000000000",
    "throughput": "132.0",
    "latency": null,
    "aime_2025_score": null,
    "hle_score": null,
    "gpqa_score": 0.84,
    "swe_bench_verified_score": null,
    "mmmu_score": null
}
]
```

1. List of Categories

Endpoint:
```
https://api.zeroeval.com/leaderboard/categories
```

Response:
```json
[{
    "category_id": "3d",
    "name": "3D",
    "description": "Category for 3d benchmarks",
    "sort_order": 1000
}, {
    "category_id": "agent",
    "name": "Agent",
    "description": "Category for agent benchmarks",
    "sort_order": 1000
}, {
    "category_id": "agents",
    "name": "Agents",
    "description": "Category for agents benchmarks",
    "sort_order": 1000
}, {
    "category_id": "audio",
    "name": "Audio",
    "description": "Category for audio benchmarks",
    "sort_order": 1000
}, {
    "category_id": "chemistry",
    "name": "Chemistry",
    "description": "Category for chemistry benchmarks",
    "sort_order": 1000
}, {
    "category_id": "code",
    "name": "Code",
    "description": "Category for code benchmarks",
    "sort_order": 1000
}, {
    "category_id": "coding",
    "name": "Coding",
    "description": "Category for coding benchmarks",
    "sort_order": 1000
}]
```

2. Leaderboard by Catergory

Endpoints:
```
https://api.zeroeval.com/leaderboard/categories/{category_id}/benchmarks?top_n=15

https://api.zeroeval.com/leaderboard/categories/code/benchmarks?top_n=15

https://api.zeroeval.com/leaderboard/categories/healthcare/benchmarks?top_n=15

https://api.zeroeval.com/leaderboard/categories/agent/benchmarks?top_n=15
```

Response:
```json
{
    "category": {
        "category_id": "finance",
        "name": "Finance",
        "description": "Category for finance benchmarks"
    },
    "benchmarks": [
        {
            "benchmark_id": "acebench",
            "name": "ACEBench",
            "description": "ACEBench is a comprehensive benchmark for evaluating Large Language Models' tool usage capabilities across three primary evaluation types: Normal (basic tool usage scenarios), Special (tool usage with ambiguous or incomplete instructions), and Agent (multi-agent interactions simulating real-world dialogues). The benchmark covers 4,538 APIs across 8 major domains and 68 sub-domains including technology, finance, entertainment, society, health, culture, and environment, supporting both English and Chinese languages.",
            "modality": "text",
            "max_score": 1,
            "verified": false,
            "model_count": 2,
            "top_models": [
                {
                    "rank": 1,
                    "model_id": "kimi-k2-instruct",
                    "model_name": "Kimi K2 Instruct",
                    "organization_name": "Moonshot AI",
                    "benchmark_score": 0.765,
                    "normalized_score": 0.765,
                    "verified": false
                },
                {
                    "rank": 2,
                    "model_id": "kimi-k2-instruct-0905",
                    "model_name": "Kimi K2-Instruct-0905",
                    "organization_name": "Moonshot AI",
                    "benchmark_score": 0.765,
                    "normalized_score": 0.765,
                    "verified": false
                }
            ]
        }
    ]
}
```

1. Leaderboard by Arenas

Endpoints:
```
https://api.zeroeval.com/magia/arenas/chat-arena/leaderboard?limit=10&offset=0
https://api.zeroeval.com/magia/arenas/text-to-svg/leaderboard?limit=10&offset=0
https://api.zeroeval.com/magia/arenas/chat-arena/leaderboard?limit=50&offset=0
```

Response:
```json
{
    "leaderboard": [
       {
            "variant_id": "claude-opus-4-5-20251101",
            "variant_key": "claude-opus-4-5-20251101",
            "variant_metadata": {
                "model_name": "Claude Opus 4.5",
                "organization": "anthropic"
            },
            "mu": 15.884192194213362,
            "sigma": 0.8142277379904116,
            "conservative_rating": 13.441508980242128,
            "matches_played": 207,
            "wins": 120,
            "win_rate": 57.97,
            "created_at": "2025-12-07T16:13:23.929148+00:00",
            "updated_at": "2026-01-10T14:51:33.078322+00:00",
            "model_id": "claude-opus-4-5-20251101",
            "model_name": "Claude Opus 4.5",
            "organization": "anthropic",
            "announcement_date": "2025-11-24",
            "throughput_cps": 149.81749748348145,
            "input_price": 5,
            "output_price": 25,
            "license": "Proprietary",
            "is_open_source": false
        },
    ],
    "total_count": 22,
    "limit": 10,
    "offset": 0
}
```

5. AI Organization Logo URL

```
https://llm-stats.com/logos/{organization_id}.svg
```
