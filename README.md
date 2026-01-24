# LI.FI Agent Skills

Agent Skills for integrating [LI.FI](https://li.fi/) cross-chain swap and bridge protocol into your applications. These skills teach AI agents how to help developers implement cross-chain operations using LI.FI's SDK and REST API.

## Installation

Install all skills from this repository:

```bash
npx skills add <owner>/lifi-agent-skills
```

Or install individual skills:

```bash
npx skills add <owner>/lifi-agent-skills/li-fi-sdk
npx skills add <owner>/lifi-agent-skills/li-fi-api
```

## Available Skills

### li-fi-sdk

Comprehensive guide for integrating the `@lifi/sdk` TypeScript/JavaScript package. Covers SDK configuration, requesting routes and quotes, executing cross-chain transfers, and handling execution lifecycle with hooks.

**Use when:** Building frontend applications, React/Next.js apps, or Node.js backends that need cross-chain swap and bridge functionality with full TypeScript support.

### li-fi-api

Complete reference for LI.FI's REST API endpoints. Covers authentication, rate limiting, requesting quotes and routes, tracking transaction status, and discovering available chains, tokens, and tools.

**Use when:** Building backend services, working with non-JavaScript languages, or needing direct HTTP API access for cross-chain operations.

## What is LI.FI?

LI.FI is a multi-chain liquidity aggregation protocol that provides:

- **Cross-chain swaps and bridging** - Transfer tokens across 30+ blockchain networks
- **DEX aggregation** - Access liquidity from multiple decentralized exchanges
- **Bridge aggregation** - Route through the best available bridges
- **Smart routing** - Automatically find the cheapest and fastest path for any transfer

### Supported Chains

Ethereum, Arbitrum, Optimism, Polygon, Base, BSC, Avalanche, Solana, Bitcoin, SUI, and many more.

### Supported Standards

EIP-7702, EIP-5792, ERC-2612, EIP-712, Permit2

## Resources

- [LI.FI Documentation](https://docs.li.fi/)
- [LI.FI SDK Reference](https://docs.li.fi/sdk/overview)
- [LI.FI API Reference](https://docs.li.fi/api-reference/introduction)
- [Widget Playground](https://playground.li.fi/)
- [Chain Overview](https://docs.li.fi/introduction/chains)

## License

Apache-2.0
