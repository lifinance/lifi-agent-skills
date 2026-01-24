# LI.FI SDK Reference

Detailed parameter tables, TypeScript interfaces, and advanced patterns for the `@lifi/sdk`.

## Table of Contents

- [Configuration](#configuration)
- [Routes Request](#routes-request)
- [Quote Request](#quote-request)
- [Route Options](#route-options)
- [Execution Options](#execution-options)
- [TypeScript Interfaces](#typescript-interfaces)
- [Status and Process Types](#status-and-process-types)
- [Chain Types and IDs](#chain-types-and-ids)
- [Token Addresses](#common-token-addresses)
- [SDK Functions Reference](#sdk-functions-reference)
- [Example Responses](#example-responses)
- [Error Codes](#error-codes)

## Configuration

### createConfig Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `integrator` | string | Yes | Your application name for analytics |
| `apiKey` | string | No | API key for higher rate limits |
| `rpcUrls` | Record<number, string[]> | No | Custom RPC URLs per chain |
| `chains` | ChainsConfig | No | Chain allow/deny configuration |
| `bridges` | BridgesConfig | No | Bridge allow/deny configuration |
| `exchanges` | ExchangesConfig | No | Exchange allow/deny configuration |
| `providers` | Provider[] | No | EVM/Solana/Bitcoin/SUI providers |
| `preloadChains` | boolean | No | Preload chain data on init |

### ChainsConfig

```typescript
interface ChainsConfig {
  allow?: number[];  // Only allow these chain IDs
  deny?: number[];   // Block these chain IDs
}
```

## Routes Request

### RoutesRequest Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromChainId` | number | Yes | Source chain ID |
| `fromTokenAddress` | string | Yes | Source token contract address |
| `fromAmount` | string | Yes | Amount in smallest unit (wei) |
| `fromAddress` | string | No | Sender wallet address |
| `toChainId` | number | Yes | Destination chain ID |
| `toTokenAddress` | string | Yes | Destination token contract address |
| `toAddress` | string | No | Recipient address (defaults to fromAddress) |
| `fromAmountForGas` | string | No | Amount to receive as gas on destination |
| `options` | RouteOptions | No | Additional route options |

### Example

```typescript
const routesRequest: RoutesRequest = {
  fromChainId: 1,
  toChainId: 137,
  fromTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  toTokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  fromAmount: '1000000000', // 1000 USDC
  fromAddress: '0x...',
  options: {
    slippage: 0.005,
    order: 'CHEAPEST',
  },
};
```

## Quote Request

### QuoteRequest Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromChain` | number | Yes | Source chain ID |
| `fromToken` | string | Yes | Source token address |
| `fromAmount` | string | Yes | Amount in smallest unit |
| `fromAddress` | string | Yes | Sender wallet address |
| `toChain` | number | Yes | Destination chain ID |
| `toToken` | string | Yes | Destination token address |
| `toAddress` | string | No | Recipient address |
| `fromAmountForGas` | string | No | Amount for destination gas |
| `slippage` | number | No | Slippage tolerance (e.g., 0.005 = 0.5%) |
| `integrator` | string | No | Integrator identifier |
| `fee` | number | No | Integrator fee percentage |
| `allowBridges` | string[] | No | Allowed bridge keys |
| `denyBridges` | string[] | No | Denied bridge keys |
| `preferBridges` | string[] | No | Preferred bridge keys |
| `allowExchanges` | string[] | No | Allowed exchange keys |
| `denyExchanges` | string[] | No | Denied exchange keys |
| `preferExchanges` | string[] | No | Preferred exchange keys |

## Route Options

### RouteOptions Interface

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `integrator` | string | - | Integrator name |
| `fee` | number | 0 | Integrator fee (0.03 = 3%) |
| `maxPriceImpact` | number | - | Max price impact threshold |
| `order` | 'CHEAPEST' \| 'FASTEST' | 'CHEAPEST' | Route sorting preference |
| `slippage` | number | 0.005 | Slippage tolerance |
| `referrer` | string | - | Referrer wallet address |
| `allowSwitchChain` | boolean | true | Allow 2-step routes |
| `allowDestinationCall` | boolean | true | Allow destination calls |
| `bridges` | AllowDenyPrefer | - | Bridge preferences |
| `exchanges` | AllowDenyPrefer | - | Exchange preferences |

### AllowDenyPrefer Interface

```typescript
interface AllowDenyPrefer {
  allow?: string[];   // Only use these (default: all)
  deny?: string[];    // Never use these (default: none)
  prefer?: string[];  // Prefer these if available
}
```

### Available Bridge Keys

```
stargate, hop, across, cbridge, multichain, synapse, polygon, 
arbitrum, optimism, connext, amarok, squid, wormhole, allbridge,
layerswap, symbiosis, debridge, lifi
```

### Available Exchange Keys

```
1inch, paraswap, openocean, 0x, uniswap, sushiswap, quickswap,
pancakeswap, traderjoe, spookyswap, spiritswap, velodrome,
balancer, curve, dodo, kyberswap
```

## Execution Options

### ExecutionOptions Interface

| Parameter | Type | Description |
|-----------|------|-------------|
| `updateRouteHook` | (route: RouteExtended) => void | Called on route state changes |
| `updateTransactionRequestHook` | (tx: TransactionRequestParameters) => Promise<TransactionParameters> | Modify TX before sending |
| `acceptExchangeRateUpdateHook` | (token: Token, oldAmount: string, newAmount: string) => Promise<boolean> | Handle rate changes |
| `switchChainHook` | (chainId: number) => Promise<WalletClient \| undefined> | Handle chain switches |
| `executeInBackground` | boolean | Continue without user interaction |
| `disableMessageSigning` | boolean | Disable EIP-712 signing |

### updateRouteHook Example

```typescript
updateRouteHook(route) {
  route.steps.forEach((step, stepIndex) => {
    const execution = step.execution;
    if (!execution) return;
    
    execution.process.forEach((process, processIndex) => {
      console.log(`Step ${stepIndex}, Process ${processIndex}:`, {
        type: process.type,
        status: process.status,
        txHash: process.txHash,
        txLink: process.txLink,
      });
    });
  });
}
```

### acceptExchangeRateUpdateHook Example

```typescript
async acceptExchangeRateUpdateHook(toToken, oldAmount, newAmount) {
  const oldValue = BigInt(oldAmount);
  const newValue = BigInt(newAmount);
  const percentChange = Number((newValue - oldValue) * 10000n / oldValue) / 100;
  
  if (Math.abs(percentChange) < 1) {
    // Auto-accept changes under 1%
    return true;
  }
  
  // Show UI for larger changes
  return await showRateChangeModal({
    token: toToken.symbol,
    oldAmount: formatUnits(oldAmount, toToken.decimals),
    newAmount: formatUnits(newAmount, toToken.decimals),
    percentChange,
  });
}
```

## TypeScript Interfaces

### Route

```typescript
interface Route {
  id: string;
  fromChainId: number;
  toChainId: number;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  steps: LiFiStep[];
  gasCostUSD?: string;
  tags?: string[];
}
```

### LiFiStep

```typescript
interface LiFiStep {
  id: string;
  type: 'swap' | 'cross' | 'lifi' | 'protocol';
  tool: string;
  action: Action;
  estimate: Estimate;
  execution?: Execution;
  transactionRequest?: TransactionRequest;
}
// Step types: swap (DEX), cross (bridge), lifi (multi-action), protocol (fee collection, vault interactions)
```

### Action

```typescript
interface Action {
  fromChainId: number;
  toChainId: number;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  slippage: number;
  fromAddress?: string;
  toAddress?: string;
}
```

### Estimate

```typescript
interface Estimate {
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  approvalAddress: string;
  feeCosts?: FeeCost[];
  gasCosts?: GasCost[];
  executionDuration: number;
}
```

### Token

```typescript
interface Token {
  address: string;
  chainId: number;
  symbol: string;
  decimals: number;
  name: string;
  priceUSD?: string;
  logoURI?: string;
}
```

### Execution

```typescript
interface Execution {
  status: ExecutionStatus;
  process: Process[];
  fromAmount?: string;
  toAmount?: string;
}
```

### Process

```typescript
interface Process {
  type: ProcessType;
  status: ProcessStatus;
  message?: string;
  txHash?: string;
  txLink?: string;
  startedAt?: number;
  doneAt?: number;
  error?: Error;
}
```

## Status and Process Types

### ExecutionStatus

| Status | Description |
|--------|-------------|
| `NOT_STARTED` | Execution hasn't begun |
| `STARTED` | Execution in progress |
| `ACTION_REQUIRED` | User action needed |
| `CHAIN_SWITCH_REQUIRED` | Chain switch needed |
| `PENDING` | Waiting for confirmation |
| `DONE` | Successfully completed |
| `FAILED` | Execution failed |

### ProcessType

| Type | Description |
|------|-------------|
| `TOKEN_ALLOWANCE` | Token approval process |
| `SWITCH_CHAIN` | Chain switching process |
| `SWAP` | On-chain swap |
| `CROSS_CHAIN` | Cross-chain transfer |
| `RECEIVING_CHAIN` | Receiving on destination |
| `TRANSACTION` | Generic transaction |

### ProcessStatus

| Status | Description |
|--------|-------------|
| `NOT_STARTED` | Process not started |
| `STARTED` | Process in progress |
| `ACTION_REQUIRED` | User action needed |
| `PENDING` | Waiting for blockchain |
| `DONE` | Successfully completed |
| `FAILED` | Process failed |
| `CANCELLED` | User cancelled |
| `REFUNDED` | Transfer was refunded |

## Chain Types and IDs

### EVM Chains

| Chain | ID | Native Token |
|-------|-----|--------------|
| Ethereum | 1 | ETH |
| Optimism | 10 | ETH |
| BSC | 56 | BNB |
| Gnosis | 100 | xDAI |
| Polygon | 137 | MATIC |
| Fantom | 250 | FTM |
| zkSync Era | 324 | ETH |
| Polygon zkEVM | 1101 | ETH |
| Base | 8453 | ETH |
| Arbitrum | 42161 | ETH |
| Avalanche | 43114 | AVAX |
| Linea | 59144 | ETH |
| Scroll | 534352 | ETH |

### Non-EVM Chains

| Chain | ID | Type |
|-------|-----|------|
| Solana | 1151111081099710 | SVM |
| Bitcoin | - | UTXO |
| SUI | - | Move |

### ChainType Enum

```typescript
enum ChainType {
  EVM = 'EVM',
  SVM = 'SVM',    // Solana
  UTXO = 'UTXO',  // Bitcoin
  MVM = 'MVM',    // Move (SUI)
}
```

## Common Token Addresses

### Native Token Address

Use `0x0000000000000000000000000000000000000000` for native tokens (ETH, BNB, MATIC, etc.)

### USDC Addresses

| Chain | Address |
|-------|---------|
| Ethereum | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| Arbitrum | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Optimism | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| Polygon | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |
| Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| BSC | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` |

### USDT Addresses

| Chain | Address |
|-------|---------|
| Ethereum | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| Arbitrum | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` |
| Optimism | `0x94b008aA00579c1307B0EF2c499aD98a8ce58e58` |
| Polygon | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` |
| BSC | `0x55d398326f99059fF775485246999027B3197955` |

### WETH Addresses

| Chain | Address |
|-------|---------|
| Ethereum | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| Arbitrum | `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1` |
| Optimism | `0x4200000000000000000000000000000000000006` |
| Polygon | `0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619` |
| Base | `0x4200000000000000000000000000000000000006` |

## SDK Functions Reference

### Core Functions

#### getRoutes(request: RoutesRequest): Promise<RoutesResponse>

Returns multiple route options for comparison.

```typescript
interface RoutesResponse {
  routes: Route[];
  unavailableRoutes: {
    filteredOut: Array<{ overallPath: string; reason: string }>;
    failed: Array<{ overallPath: string; subpaths: object }>;
  };
}
```

#### getQuote(request: QuoteRequest): Promise<LiFiStep>

Returns the single best quote with transaction data ready.

```typescript
// Returns LiFiStep with transactionRequest populated
const quote: LiFiStep = await getQuote(request);
// quote.transactionRequest contains { to, from, data, value, gasLimit, gasPrice, chainId }
```

#### executeRoute(route: Route, options?: ExecutionOptions): Promise<Route>

Executes a route and returns the updated route with execution status.

```typescript
// Returns Route with execution field populated on each step
const executedRoute = await executeRoute(route, options);
// executedRoute.steps[0].execution contains { status, process[], fromAmount, toAmount }
```

#### getStatus(request: StatusRequest): Promise<StatusResponse>

Track transaction status across chains.

```typescript
interface StatusRequest {
  txHash: string;
  fromChain?: number;
  toChain?: number;
  bridge?: string;
}

interface StatusResponse {
  transactionId: string;
  sending: TransactionInfo;
  receiving: TransactionInfo;
  lifiExplorerLink: string;
  fromAddress: string;
  toAddress: string;
  tool: string;
  status: 'NOT_FOUND' | 'INVALID' | 'PENDING' | 'DONE' | 'FAILED';
  substatus: string;
  substatusMessage: string;
}

interface TransactionInfo {
  txHash: string;
  txLink: string;
  amount: string;
  token: Token;
  chainId: number;
  gasPrice?: string;
  gasUsed?: string;
  gasAmountUSD?: string;
  amountUSD: string;
  timestamp?: number;
}
```

### Discovery Functions

#### getChains(params?): Promise<Chain[]>

```typescript
interface Chain {
  id: number;
  key: string;
  name: string;
  chainType: 'EVM' | 'SVM' | 'UTXO';
  coin: string;
  mainnet: boolean;
  logoURI: string;
  tokenlistUrl?: string;
  nativeToken: Token;
  metamask?: {
    chainId: string;
    chainName: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: string[];
    blockExplorerUrls: string[];
  };
}
```

#### getTokens(params): Promise<TokensResponse>

```typescript
interface TokensResponse {
  tokens: Record<string, Token[]>;  // Keyed by chainId
}

// Example: tokens['1'] returns Token[] for Ethereum
```

#### getToken(chainId, address): Promise<Token>

Returns a single Token object (see Token interface below).

#### getTools(params?): Promise<ToolsResponse>

```typescript
interface ToolsResponse {
  bridges: Bridge[];
  exchanges: Exchange[];
}

interface Bridge {
  key: string;
  name: string;
  logoURI: string;
  supportedChains: Array<{ fromChainId: number; toChainId: number }>;
}

interface Exchange {
  key: string;
  name: string;
  logoURI: string;
  supportedChains: number[];
}
```

#### getConnections(request): Promise<ConnectionsResponse>

```typescript
interface ConnectionsResponse {
  connections: Array<{
    fromChainId: number;
    toChainId: number;
    fromTokens: Token[];
    toTokens: Token[];
  }>;
}
```

### Utility Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `convertQuoteToRoute(quote)` | `Route` | Convert LiFiStep quote to Route for execution |
| `getStepTransaction(step)` | `LiFiStep` | Populate step with transactionRequest |
| `getContractCallsQuote(request)` | `LiFiStep` | Quote with destination contract calls |
| `resumeRoute(route, options)` | `Promise<Route>` | Resume interrupted execution |
| `stopRouteExecution(route)` | `Route` | Stop and return current route state |
| `getActiveRoutes()` | `Route[]` | All currently executing routes |
| `getActiveRoute(routeId)` | `Route \| undefined` | Specific active route |

## Example Responses

### getQuote() Response Example

```json
{
  "id": "a8dc011a-f52d-4492-9e99-21de64b5453a",
  "type": "lifi",
  "tool": "stargate",
  "toolDetails": {
    "key": "stargate",
    "name": "Stargate",
    "logoURI": "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/stargate.png"
  },
  "action": {
    "fromChainId": 1,
    "toChainId": 137,
    "fromToken": {
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "symbol": "USDC",
      "decimals": 6,
      "chainId": 1,
      "name": "USD Coin",
      "priceUSD": "1.00"
    },
    "toToken": {
      "address": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      "symbol": "USDC",
      "decimals": 6,
      "chainId": 137,
      "name": "USD Coin (PoS)",
      "priceUSD": "1.00"
    },
    "fromAmount": "1000000000",
    "slippage": 0.005,
    "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
    "toAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0"
  },
  "estimate": {
    "fromAmount": "1000000000",
    "toAmount": "998500000",
    "toAmountMin": "993507500",
    "approvalAddress": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
    "executionDuration": 120,
    "feeCosts": [],
    "gasCosts": [
      {
        "type": "SEND",
        "price": "50000000000",
        "estimate": "252364",
        "limit": "315455",
        "amount": "12618200000000000",
        "amountUSD": "25.00",
        "token": {
          "address": "0x0000000000000000000000000000000000000000",
          "symbol": "ETH",
          "decimals": 18,
          "chainId": 1,
          "priceUSD": "2000.00"
        }
      }
    ]
  },
  "transactionRequest": {
    "from": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
    "to": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
    "data": "0x...",
    "value": "0x0",
    "gasPrice": "0xba43b7400",
    "gasLimit": "0x4d097",
    "chainId": 1
  }
}
```

### getRoutes() Response Example

```json
{
  "routes": [
    {
      "id": "0x1e21fad9c26fff48b67ae2925f878e43bf81211da8b1cd9b7faa8bfd8d7ea9d9",
      "fromChainId": 42161,
      "toChainId": 10,
      "fromAmountUSD": "10.00",
      "fromAmount": "10000000",
      "fromToken": {
        "address": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        "symbol": "USDC",
        "decimals": 6,
        "chainId": 42161,
        "name": "USD Coin",
        "priceUSD": "1.00"
      },
      "toAmountUSD": "9.95",
      "toAmount": "9950000",
      "toAmountMin": "9900250",
      "toToken": {
        "address": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        "symbol": "USDC",
        "decimals": 6,
        "chainId": 10,
        "name": "USD Coin",
        "priceUSD": "1.00"
      },
      "gasCostUSD": "0.50",
      "steps": [
        {
          "id": "step-1",
          "type": "cross",
          "tool": "stargate",
          "action": { "...": "..." },
          "estimate": { "...": "..." }
        }
      ]
    }
  ],
  "unavailableRoutes": {
    "filteredOut": [],
    "failed": []
  }
}
```

### getStatus() Response Example

```json
{
  "transactionId": "0x0959ee0fbb37a868752d7ae40b25dbfa3b7d72f499fa8386fd5f4105b18b62bd",
  "sending": {
    "txHash": "0x5862726dbc6643c6a34b3496bb15e91f11771f6756ccf83826304846bbc93c0a",
    "txLink": "https://etherscan.io/tx/0x5862726dbc6643c6a34b3496bb15e91f11771f6756ccf83826304846bbc93c0a",
    "amount": "1000000000",
    "token": { "symbol": "USDC", "decimals": 6, "priceUSD": "1.00" },
    "chainId": 1,
    "gasPrice": "23079962248",
    "gasUsed": "231727",
    "gasAmountUSD": "14.03",
    "amountUSD": "1000.00",
    "timestamp": 1704067200
  },
  "receiving": {
    "txHash": "0x2862726dbc6643c6a34b3496bb15e91f11771f6756ccf83826604846bbc93c0b",
    "txLink": "https://polygonscan.com/tx/0x2862726dbc6643c6a34b3496bb15e91f11771f6756ccf83826604846bbc93c0b",
    "amount": "998500000",
    "token": { "symbol": "USDC", "decimals": 6, "priceUSD": "1.00" },
    "chainId": 137,
    "amountUSD": "998.50",
    "timestamp": 1704067320
  },
  "lifiExplorerLink": "https://scan.li.fi/tx/0x0959ee0fbb37a868752d7ae40b25dbfa3b7d72f499fa8386fd5f4105b18b62bd",
  "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
  "toAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
  "tool": "stargate",
  "status": "DONE",
  "substatus": "COMPLETED",
  "substatusMessage": "The transfer is complete."
}
```

## Error Codes

| Error | Description | Solution |
|-------|-------------|----------|
| `Exchange rate has changed!` | Rate changed during execution | Implement `acceptExchangeRateUpdateHook` |
| `Insufficient balance` | Not enough tokens | Check balance before execution |
| `User rejected` | User rejected transaction | Handle gracefully in UI |
| `Allowance not sufficient` | Token not approved | SDK handles automatically |
| `Slippage too high` | Price impact exceeded | Increase slippage or reduce amount |
| `No routes found` | No path available | Try different token pair or amount |
