# LI.FI Agent Skills

Agent Skill for integrating [LI.FI](https://li.fi/) into your applications. Teaches AI agents how to help developers implement cross-chain swaps, bridging, DeFi deposits, yield discovery, and intent-based execution using LI.FI's REST APIs.

## Installation

```bash
npx skills add <owner>/lifi-agent-skills
```

## Available Skills

### lifi

Complete reference for LI.FI's APIs across the full product surface:

- **Core API** (`li.quest/v1`) — quotes, routes, transaction data, and status tracking for swaps and bridges across 75+ chains (EVM, Solana, Bitcoin, Sui, Tron)
- **Composer** — one-click DeFi: swap/bridge + deposit/withdraw into vaults, lending, and staking protocols (Aave, Morpho, Pendle, EtherFi, Yearn, and ~29 more) via the standard `/quote` endpoint
- **Earn** (`earn.li.fi`) — yield/vault discovery, APY & TVL analytics, and portfolio positions
- **Intents** (`order.li.fi`) — intent-based orders filled by a competitive solver network, with escrow and gasless (Compact) flows
- **Routing presets** — e.g. the stablecoin preset for optimized stable-to-stable transfers
- **Analytics & fees** — transfer history endpoints and integrator fee collection/withdrawal
- **Agent workflows** — the five-call recipe, approval handling, status recovery, partial-completion recovery, and error playbooks

**Use when:** building backends, bots, AI agents, or apps in any language that need cross-chain or DeFi functionality over HTTP. (For TypeScript frontends, the API works too — or see LI.FI's `@lifi/sdk` and Widget.)

### lifi-stablecoin-swap

Focused, end-to-end recipe for building a **1:1 stablecoin swap** with LI.FI Intents — where the amount the user sends equals the amount they receive (no visible gas or solver fees), same-chain or cross-chain, filled by the solver network and verifiable on-chain:

- **1:1 enablement** — how the LI.FI integrator ID / Partner Portal provisions 1:1 stablecoin quoting
- **Quote → approve → escrow open → status** — the full Intents escrow flow for stablecoins
- **EIP-7930 addresses, `StandardOrder`, order lifecycle** — everything needed to build and track an order to settlement
- **TypeScript SDK + REST** — `@lifi/intent` for TS apps (incl. a runnable Next.js quickstart) and the raw `order.li.fi` endpoints for any language

**Use when:** building a 1:1 stablecoin swap interface or backend — e.g. for a neobank, payment processor, or regulated fintech.

## What is LI.FI?

LI.FI is a multi-chain liquidity aggregation protocol that provides:

- **Cross-chain swaps and bridging** — transfer tokens across 75+ blockchain networks
- **DEX and bridge aggregation** — best route through DEXs, bridges, and intent solvers
- **Composer** — atomic multi-step DeFi execution (swap + bridge + deposit in one signature)
- **Earn** — normalized yield data across 20+ DeFi protocols
- **Intents** — solver marketplace built on the Open Intents Framework

### Supported Chains

Ethereum, Arbitrum, Optimism, Polygon, Base, BSC, Avalanche, Linea, Scroll, Berachain, HyperEVM, Sonic, Unichain, Katana, and more EVM chains — plus Solana (SVM), Bitcoin (UTXO), Sui (MVM), and Tron (TVM).

### Supported Standards

EIP-7702, EIP-5792, ERC-2612, EIP-712, EIP-7930, Permit2

## Resources

- [LI.FI Documentation](https://docs.li.fi/)
- [API Reference](https://docs.li.fi/api-reference/introduction)
- [For AI Agents](https://docs.li.fi/agents/overview)
- [Composer](https://docs.li.fi/composer/overview)
- [Earn](https://docs.li.fi/earn/overview)
- [LI.FI Intents](https://docs.li.fi/lifi-intents/introduction)
- [OpenAPI Spec](https://docs.li.fi/openapi.yaml) · [llms.txt](https://docs.li.fi/llms.txt)
- [Widget Playground](https://playground.li.fi/)

## License

Apache-2.0
