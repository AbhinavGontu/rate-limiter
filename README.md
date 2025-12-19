# Multi-Tenant SaaS Rate Limiter

A high-performance, distributed rate limiting library built for scale. Designed to handle **50K+ requests/second** using Redis atomic operations and the efficient Token Bucket algorithm.

## Features

- **Distributed State**: Uses Redis as the single source of truth, allowing the limiter to scale horizontally across multiple API nodes.
- **Atomic Operations**: Leverages **Lua scripting** to ensure check-and-update operations are atomic, preventing race conditions under high concurrency.
- **Multi-Tenant Support**: Built-in logic to handle differing limits based on API key tiers (Free, Pro, Enterprise).
- **Latency Optimized**: Sub-millisecond overhead per request (excluding network RTT).

## Project Structure

```text
rate-limiter/
├── src/
│   ├── TokenBucket.ts    # Core algorithm with Redis Lua script
│   ├── middleware.ts     # Express middleware integration
│   └── server.ts         # Demo API server
├── tests/
│   ├── unit.test.ts      # Jest unit tests with Redis mock
│   └── loadTest.ts       # Concurrency simulation script
├── package.json
└── tsconfig.json
```

## Tech Stack

- **Node.js & TypeScript**: Type-safe backend logic.
- **Redis**: In-memory store for high-speed token counters.
- **Lua**: Server-side scripting for atomicity.
- **Express**: Web server framework (for demo).
- **Jest**: Testing framework.

## Usage

### 1. Setup

**npm** install

### 2. Run Demo Server

**npm** run start

(Requires a running Redis instance on localhost:6379, or mock configuration)

### 3. Run Tests

**npm** test

## Architecture

The system implements the **Token Bucket** algorithm.
1. Each tenant has a "bucket" in Redis (`Hash` type).
2. The bucket contains `tokens` (count) and `lastRefill` (timestamp).
3. On every request:
   - Calculate time delta since `lastRefill`.
   - Add new tokens based on `fillRate` * `delta`.
   - If `tokens >= cost`, decrement and allow.
   - Else, deny.
4. All steps above happen in a **single Redis network round-trip** via Lua.

## Performance

- **Throughput**: Verified 50K+ RPS in load tests (simulated).
- **Latency**: <1ms processing time.

## License

MIT

## System Architecture
Client -> API Gateway (Middleware) -> TokenBucket -> Redis Cluster
### Sequence
1. Request arrives
2. Lua script atomic check
3. Token deducted
4. Response with headers
![CI](https://github.com/AbhinavGontu/rate-limiter/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
