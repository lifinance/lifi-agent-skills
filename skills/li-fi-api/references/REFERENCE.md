# LI.FI API Reference

Complete endpoint documentation, request/response schemas, and error codes for the LI.FI REST API.

## Table of Contents

- [Base Configuration](#base-configuration)
- [Quote Endpoint](#quote-endpoint)
- [Routes Endpoint](#routes-endpoint)
- [Status Endpoint](#status-endpoint)
- [Chains Endpoint](#chains-endpoint)
- [Tokens Endpoint](#tokens-endpoint)
- [Tools Endpoint](#tools-endpoint)
- [Connections Endpoint](#connections-endpoint)
- [Gas Endpoints](#gas-endpoints)
- [Contract Calls Endpoint](#contract-calls-endpoint)
- [Response Schemas](#response-schemas)
- [Error Reference](#error-reference)
- [Chain IDs](#chain-ids)
- [Token Addresses](#common-token-addresses)

## Base Configuration

### Base URL

```
https://li.quest/v1
```

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `x-lifi-api-key` | No | API key for higher rate limits |
| `Content-Type` | For POST | `application/json` |

### Rate Limits

- Without API key: Limited per IP address
- With API key: Higher limits per key

## Quote Endpoint

### GET /quote

Returns a single-step quote with transaction data.

**URL:** `https://li.quest/v1/quote`

**Method:** `GET`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromChain` | number | Yes | Source chain ID |
| `toChain` | number | Yes | Destination chain ID |
| `fromToken` | string | Yes | Source token contract address |
| `toToken` | string | Yes | Destination token contract address |
| `fromAmount` | string | Yes | Amount in smallest unit (wei) |
| `fromAddress` | string | Yes | Sender wallet address |
| `toAddress` | string | No | Recipient address (defaults to fromAddress) |
| `slippage` | number | No | Slippage tolerance (0.005 = 0.5%) |
| `integrator` | string | No | Integrator identifier |
| `fee` | number | No | Integrator fee (0.03 = 3%) |
| `order` | string | No | `CHEAPEST` or `FASTEST` |
| `allowBridges` | string | No | Comma-separated bridge keys |
| `denyBridges` | string | No | Comma-separated bridge keys |
| `preferBridges` | string | No | Comma-separated bridge keys |
| `allowExchanges` | string | No | Comma-separated exchange keys |
| `denyExchanges` | string | No | Comma-separated exchange keys |
| `preferExchanges` | string | No | Comma-separated exchange keys |
| `fromAmountForGas` | string | No | Amount to convert to gas on destination |
| `maxPriceImpact` | number | No | Max price impact threshold (0.15 = 15%, default: 10%) |
| `allowDestinationCall` | boolean | No | Allow contract calls on destination (default: true) |
| `skipSimulation` | boolean | No | Skip TX simulation for faster response |
| `swapStepTimingStrategies` | string[] | No | Timing for swap rates (format: `minWaitTime-600-4-300`) |
| `routeTimingStrategies` | string[] | No | Timing for route selection (format: `minWaitTime-600-4-300`) |

### GET /quote/toAmount

Alternative quote endpoint that calculates the required `fromAmount` based on a specified `toAmount`. Same parameters as `/quote` except `toAmount` instead of `fromAmount`.

**URL:** `https://li.quest/v1/quote/toAmount`

**Key Difference:** Specify the desired output amount, and the API calculates how much input is needed.

### Example Request

```bash
curl "https://li.quest/v1/quote?\
fromChain=1&\
toChain=137&\
fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&\
toToken=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174&\
fromAmount=1000000000&\
fromAddress=0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0&\
slippage=0.005&\
integrator=YourApp"
```

### Response Schema

```json
{
  "id": "string",
  "type": "lifi",
  "tool": "string",
  "toolDetails": {
    "key": "string",
    "name": "string",
    "logoURI": "string"
  },
  "action": {
    "fromChainId": "number",
    "toChainId": "number",
    "fromToken": "Token",
    "toToken": "Token",
    "fromAmount": "string",
    "slippage": "number",
    "fromAddress": "string",
    "toAddress": "string"
  },
  "estimate": {
    "fromAmount": "string",
    "toAmount": "string",
    "toAmountMin": "string",
    "approvalAddress": "string",
    "executionDuration": "number",
    "feeCosts": "FeeCost[]",
    "gasCosts": "GasCost[]"
  },
  "transactionRequest": {
    "to": "string",
    "from": "string",
    "data": "string",
    "value": "string",
    "gasLimit": "string",
    "gasPrice": "string",
    "chainId": "number"
  },
  "includedSteps": "Step[]"
}
```

## Routes Endpoint

### POST /advanced/routes

Returns multiple route options for comparison. Routes do not include transaction data initially - use `/advanced/stepTransaction` to populate a step with TX data.

**URL:** `https://li.quest/v1/advanced/routes`

**Method:** `POST`

### Request Body

```json
{
  "fromChainId": "number (required)",
  "toChainId": "number (required)",
  "fromTokenAddress": "string (required)",
  "toTokenAddress": "string (required)",
  "fromAmount": "string (required)",
  "fromAddress": "string (optional)",
  "toAddress": "string (optional)",
  "fromAmountForGas": "string (optional) - Amount to convert to gas on destination",
  "options": {
    "slippage": "number",
    "order": "CHEAPEST | FASTEST",
    "integrator": "string",
    "fee": "number (<1)",
    "referrer": "string",
    "maxPriceImpact": "number (default: 0.1 = 10%)",
    "allowSwitchChain": "boolean (default: false)",
    "allowDestinationCall": "boolean (default: true)",
    "bridges": {
      "allow": "string[] (default: ['all'])",
      "deny": "string[]",
      "prefer": "string[]"
    },
    "exchanges": {
      "allow": "string[] (default: ['all'])",
      "deny": "string[]",
      "prefer": "string[]"
    },
    "timing": {
      "swapStepTimingStrategies": [{
        "strategy": "minWaitTime",
        "minWaitTimeMs": "number (0-15000)",
        "startingExpectedResults": "number (0-100)",
        "reduceEveryMs": "number (0-15000)"
      }],
      "routeTimingStrategies": [{
        "strategy": "minWaitTime",
        "minWaitTimeMs": "number",
        "startingExpectedResults": "number",
        "reduceEveryMs": "number"
      }]
    }
  }
}
```

### Example Request

```bash
curl -X POST "https://li.quest/v1/advanced/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "fromChainId": 100,
    "fromAmount": "1000000000000000000",
    "fromTokenAddress": "0x0000000000000000000000000000000000000000",
    "toChainId": 137,
    "toTokenAddress": "0x0000000000000000000000000000000000000000",
    "options": {
      "integrator": "YourApp",
      "referrer": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
      "slippage": 0.003,
      "fee": 0.02,
      "bridges": {
        "allow": ["relay"]
      },
      "exchanges": {
        "allow": ["1inch", "openocean"]
      },
      "allowSwitchChain": true,
      "order": "CHEAPEST",
      "maxPriceImpact": 0.1
    }
  }'
```

### Response Schema

```json
{
  "routes": [
    {
      "id": "string",
      "fromChainId": "number",
      "toChainId": "number",
      "fromToken": "Token",
      "toToken": "Token",
      "fromAmount": "string",
      "fromAmountUSD": "string",
      "toAmount": "string",
      "toAmountMin": "string",
      "toAmountUSD": "string",
      "gasCostUSD": "string",
      "steps": "Step[]",
      "fromAddress": "string (optional)",
      "toAddress": "string (optional)",
      "containsSwitchChain": "boolean (optional)"
    }
  ],
  "unavailableRoutes": {
    "filteredOut": [{
      "overallPath": "string",
      "reason": "string"
    }],
    "failed": [{
      "overallPath": "string",
      "subpaths": "object"
    }]
  }
}
```

### POST /advanced/stepTransaction

Populate a step with transaction data. After selecting a route from `/advanced/routes`, use this endpoint to get the actual transaction to execute.

**URL:** `https://li.quest/v1/advanced/stepTransaction`

**Method:** `POST`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `skipSimulation` | boolean | No | Skip TX simulation for faster response |

### Request Body

Send the full `Step` object from a route.

### Response

Returns the Step object with `transactionRequest` populated.

## Status Endpoint

### GET /status

Track the status of a cross-chain transaction. Only `txHash` is required - can be sending TX hash, receiving TX hash, or transactionId.

**URL:** `https://li.quest/v1/status`

**Method:** `GET`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `txHash` | string | Yes | Transaction hash (sending, receiving, or transactionId) |
| `fromChain` | number | No | Source chain ID (speeds up request, recommended) |
| `toChain` | number | No | Destination chain ID |
| `bridge` | string | No | Bridge tool key (can be omitted for swaps) |

For same-chain swaps, set `fromChain` and `toChain` to the same value. The `bridge` parameter can be omitted.

### Example Request

```bash
# Minimal request (just txHash)
curl "https://li.quest/v1/status?txHash=0x1234567890abcdef..."

# Full request (faster response)
curl "https://li.quest/v1/status?\
txHash=0x1234567890abcdef...&\
fromChain=1&\
toChain=137"
```

### Response Schema

```json
{
  "transactionId": "string",
  "sending": {
    "txHash": "string",
    "txLink": "string",
    "amount": "string",
    "token": "Token",
    "chainId": "number",
    "gasPrice": "string",
    "gasUsed": "string",
    "gasToken": "Token",
    "gasAmount": "string",
    "gasAmountUSD": "string",
    "amountUSD": "string",
    "value": "string",
    "timestamp": "number"
  },
  "receiving": {
    "txHash": "string",
    "txLink": "string",
    "amount": "string",
    "token": "Token",
    "chainId": "number",
    "gasPrice": "string",
    "gasUsed": "string",
    "gasToken": "Token",
    "gasAmount": "string",
    "gasAmountUSD": "string",
    "amountUSD": "string",
    "value": "string",
    "timestamp": "number"
  },
  "lifiExplorerLink": "string",
  "fromAddress": "string",
  "toAddress": "string",
  "tool": "string",
  "status": "NOT_FOUND | INVALID | PENDING | DONE | FAILED",
  "substatus": "string",
  "substatusMessage": "string",
  "metadata": {
    "integrator": "string"
  }
}
```

### Status Values

| Status | Description |
|--------|-------------|
| `NOT_FOUND` | Transaction doesn't exist or not yet mined |
| `INVALID` | Hash is not tied to the requested tool |
| `PENDING` | Bridging is still in progress |
| `DONE` | Transaction completed successfully |
| `FAILED` | Bridging process failed |

### Substatus Values (PENDING)

| Substatus | Description |
|-----------|-------------|
| `WAIT_SOURCE_CONFIRMATIONS` | Waiting for source chain confirmations |
| `WAIT_DESTINATION_TRANSACTION` | Waiting for destination transaction |
| `BRIDGE_NOT_AVAILABLE` | Bridge API is unavailable |
| `CHAIN_NOT_AVAILABLE` | Source/destination chain RPC unavailable |
| `REFUND_IN_PROGRESS` | Refund in progress (if supported) |
| `UNKNOWN_ERROR` | Status is indeterminate |

### Substatus Values (DONE)

| Substatus | Description |
|-----------|-------------|
| `COMPLETED` | Transfer was successful |
| `PARTIAL` | Only partial transfer completed (common with across, hop, stargate, amarok) |
| `REFUNDED` | Tokens were refunded |

### Substatus Values (FAILED)

| Substatus | Description |
|-----------|-------------|
| `NOT_PROCESSABLE_REFUND_NEEDED` | Cannot complete, refund needed |
| `OUT_OF_GAS` | Transaction ran out of gas |
| `SLIPPAGE_EXCEEDED` | Received amount too low |
| `INSUFFICIENT_ALLOWANCE` | Not enough allowance |
| `INSUFFICIENT_BALANCE` | Not enough balance |
| `EXPIRED` | Transaction expired |
| `UNKNOWN_ERROR` | Unknown or invalid state |
| `REFUNDED` | Tokens were refunded |

## Chains Endpoint

### GET /chains

Get all supported chains.

**URL:** `https://li.quest/v1/chains`

**Method:** `GET`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chainTypes` | string | No | Comma-separated: `EVM`, `SVM` |

### Example Requests

```bash
curl "https://li.quest/v1/chains"
curl "https://li.quest/v1/chains?chainTypes=EVM,SVM"
```

### Response Schema

```json
{
  "chains": [
    {
      "id": "number",
      "key": "string",
      "name": "string",
      "chainType": "EVM | SVM | UTXO",
      "coin": "string",
      "mainnet": "boolean",
      "logoURI": "string",
      "tokenlistUrl": "string",
      "multicallAddress": "string",
      "metamask": {
        "chainId": "string",
        "chainName": "string",
        "nativeCurrency": {
          "name": "string",
          "symbol": "string",
          "decimals": "number"
        },
        "rpcUrls": "string[]",
        "blockExplorerUrls": "string[]"
      },
      "nativeToken": "Token"
    }
  ]
}
```

## Tokens Endpoint

### GET /tokens

Get all known tokens, optionally filtered by chains.

**URL:** `https://li.quest/v1/tokens`

**Method:** `GET`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chains` | string | No | Comma-separated chain IDs or keys (e.g., `POL,DAI`) |
| `chainTypes` | string | No | Filter: `EVM,SVM` |
| `minPriceUSD` | number | No | Min token price filter (default: 0.0001) |

### Example Request

```bash
curl "https://li.quest/v1/tokens?chains=POL,DAI"
curl "https://li.quest/v1/tokens?chainTypes=EVM,SVM&minPriceUSD=0.01"
```

### Response Schema

```json
{
  "tokens": {
    "137": [
      {
        "address": "string",
        "chainId": "number",
        "symbol": "string",
        "decimals": "number",
        "name": "string",
        "priceUSD": "string",
        "logoURI": "string",
        "coinKey": "string"
      }
    ]
  }
}
```

### GET /token

Get information about a specific token.

**URL:** `https://li.quest/v1/token`

**Method:** `GET`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chain` | string | Yes | Chain ID or key (e.g., `POL` or `137`) |
| `token` | string | Yes | Token address or symbol (e.g., `DAI`) |

### Example Request

```bash
curl "https://li.quest/v1/token?chain=POL&token=DAI"
```

### Response Schema

```json
{
  "address": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
  "symbol": "DAI",
  "decimals": 18,
  "chainId": 137,
  "name": "(PoS) Dai Stablecoin",
  "coinKey": "DAI",
  "priceUSD": "1",
  "logoURI": "https://..."
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid chain ID or key |
| 404 | Token not found |

## Tools Endpoint

### GET /tools

Get available bridges and exchanges. Use the returned keys when filtering quotes with `allowBridges`, `denyBridges`, `allowExchanges`, etc.

**URL:** `https://li.quest/v1/tools`

**Method:** `GET`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chains` | array | No | Filter by chain IDs (can be string keys or numbers) |

### Example Request

```bash
curl "https://li.quest/v1/tools"
curl "https://li.quest/v1/tools?chains=1,137"
```

### Response Schema

```json
{
  "bridges": [
    {
      "key": "string",
      "name": "string",
      "logoURI": "string",
      "supportedChains": [
        {
          "fromChainId": "number",
          "toChainId": "number"
        }
      ]
    }
  ],
  "exchanges": [
    {
      "key": "string",
      "name": "string",
      "logoURI": "string",
      "supportedChains": ["number[]"]
    }
  ]
}
```

### Tool Keys

Bridge and exchange keys are **dynamic** and should be retrieved from the `/v1/tools` endpoint. The following special values are supported in `allow*`, `deny*`, and `prefer*` parameters:

| Value | Description |
|-------|-------------|
| `all` | All tools of the current type |
| `none` | No tools (empty) |
| `default` | Default tool settings |
| `[]` | Empty array (same as `none`) |

**Example Bridge Keys** (verify with `/v1/tools`):
- `relay` - Relay Bridge
- `stargateV2` - Stargate V2
- `hop` - Hop Protocol
- `across` - Across
- `cbridge` - cBridge

**Example Exchange Keys** (verify with `/v1/tools`):
- `1inch` - 1inch
- `lifidexaggregator` - LI.FI DEX Aggregator
- `paraswap` - ParaSwap
- `0x` - 0x
- `openocean` - OpenOcean

## Connections Endpoint

### GET /connections

Get available token pair connections.

**URL:** `https://li.quest/v1/connections`

**Method:** `GET`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromChain` | string | No | Source chain ID or key |
| `toChain` | string | No | Destination chain ID or key |
| `fromToken` | string | No | Source token address or symbol |
| `toToken` | string | No | Destination token address or symbol |
| `chainTypes` | string | No | Filter: `EVM,SVM` |
| `allowBridges` | string[] | No | Allowed bridge keys |
| `denyBridges` | string[] | No | Denied bridge keys |
| `preferBridges` | string[] | No | Preferred bridge keys |
| `allowExchanges` | string[] | No | Allowed exchange keys |
| `denyExchanges` | string[] | No | Denied exchange keys |
| `preferExchanges` | string[] | No | Preferred exchange keys |
| `allowSwitchChain` | boolean | No | Include chain switch routes (default: true) |
| `allowDestinationCall` | boolean | No | Include destination calls (default: true) |

**Note:** At least one filter parameter (chain, token, bridge, or exchange) is required.

### Response Schema

```json
{
  "connections": [
    {
      "fromChainId": "number",
      "toChainId": "number",
      "fromTokens": "Token[]",
      "toTokens": "Token[]"
    }
  ]
}
```

## Gas Endpoints

### GET /gas/prices

Get current gas prices for all enabled chains.

**URL:** `https://li.quest/v1/gas/prices`

### Response

```json
{
  "1": {
    "standard": "number",
    "fast": "number",
    "fastest": "number",
    "lastUpdated": "number (timestamp)"
  }
}
```

### GET /gas/prices/{chainId}

Get gas price for a specific chain.

**URL:** `https://li.quest/v1/gas/prices/{chainId}`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chainId` | string | Yes | Chain ID (path param) |

### GET /gas/suggestion/{chain}

Get suggested gas amount for a chain.

**URL:** `https://li.quest/v1/gas/suggestion/{chain}`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chain` | string | Yes | Chain ID or key (path param) |
| `fromChain` | string | No | Source chain for conversion |
| `fromToken` | string | No | Source token for conversion |

### Response

```json
{
  "available": true,
  "recommended": {
    "token": "Token",
    "amount": "string",
    "amountUsd": "string"
  },
  "limit": {
    "token": "Token",
    "amount": "string",
    "amountUsd": "string"
  },
  "fromToken": "Token (if fromChain/fromToken specified)",
  "fromAmount": "string (if fromChain/fromToken specified)"
}
```

## Contract Calls Endpoint

### POST /quote/contractCalls

Perform multiple contract calls across blockchains. This enables 1-click DeFi workflows like bridge + swap + deposit into a vault.

**URL:** `https://li.quest/v1/quote/contractCalls`

**Method:** `POST`

### Request Body

```json
{
  "fromChain": "number (required) - Sending chain ID or key",
  "fromToken": "string (required) - Token address or symbol",
  "fromAddress": "string (required) - Wallet address",
  "toChain": "number (required) - Receiving chain ID or key",
  "toToken": "string (required) - Token required by contract interaction",
  "toAmount": "string (required) - Amount required for contract interaction",
  "toFallbackAddress": "string (optional) - Fallback address if call fails",
  "contractOutputsToken": "string (optional) - Token output from contract (e.g., staking)",
  "slippage": "number (optional) - Max slippage (0.005 = 0.5%)",
  "integrator": "string (optional) - Integrator identifier",
  "referrer": "string (optional) - Referrer identifier",
  "fee": "number (optional) - Integrator fee (<1 = <100%)",
  "allowBridges": "string[] (optional)",
  "denyBridges": "string[] (optional)",
  "preferBridges": "string[] (optional)",
  "allowExchanges": "string[] (optional)",
  "denyExchanges": "string[] (optional)",
  "preferExchanges": "string[] (optional)",
  "allowDestinationCall": "boolean (optional, default: true)",
  "contractCalls": [
    {
      "fromAmount": "string (required) - Expected amount for this call",
      "fromTokenAddress": "string (required) - Input token address",
      "toTokenAddress": "string (optional) - Output token address if any",
      "toContractAddress": "string (required) - Contract to interact with",
      "toContractCallData": "string (required) - Encoded call data",
      "toContractGasLimit": "string (required) - Gas limit for the call",
      "toApprovalAddress": "string (optional) - If different from contract",
      "toFallbackAddress": "string (optional) - Fallback if call fails"
    }
  ]
}
```

### Example Request

```bash
curl -X POST "https://li.quest/v1/quote/contractCalls" \
  -H "Content-Type: application/json" \
  -d '{
    "fromChain": 10,
    "fromToken": "0x4200000000000000000000000000000000000042",
    "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",
    "toChain": 1,
    "toToken": "ETH",
    "toAmount": "100000000000001",
    "integrator": "YourApp",
    "contractCalls": [
      {
        "fromAmount": "100000000000001",
        "fromTokenAddress": "0x0000000000000000000000000000000000000000",
        "toTokenAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
        "toContractAddress": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
        "toContractCallData": "0x",
        "toContractGasLimit": "110000"
      }
    ]
  }'
```

## Response Schemas

### Token

```json
{
  "address": "string",
  "chainId": "number",
  "symbol": "string",
  "decimals": "number",
  "name": "string",
  "priceUSD": "string",
  "logoURI": "string",
  "coinKey": "string"
}
```

### Step

The `type` field indicates what kind of action the step performs:
- `swap`: DEX swap on a single chain
- `cross`: Bridge assets between chains
- `lifi`: LI.FI's internal multi-action logic
- `protocol`: Protocol-level actions (fee collection, vault interactions)

```json
{
  "id": "string",
  "type": "swap | cross | lifi | protocol",
  "tool": "string",
  "toolDetails": {
    "key": "string",
    "name": "string",
    "logoURI": "string"
  },
  "action": {
    "fromChainId": "number",
    "toChainId": "number",
    "fromToken": "Token",
    "toToken": "Token",
    "fromAmount": "string",
    "slippage": "number",
    "fromAddress": "string",
    "toAddress": "string"
  },
  "estimate": {
    "fromAmount": "string",
    "toAmount": "string",
    "toAmountMin": "string",
    "approvalAddress": "string",
    "executionDuration": "number",
    "feeCosts": "FeeCost[]",
    "gasCosts": "GasCost[]"
  }
}
```

### FeeCost

```json
{
  "name": "string",
  "description": "string",
  "percentage": "string",
  "token": "Token",
  "amount": "string",
  "amountUSD": "string",
  "included": "boolean"
}
```

### GasCost

```json
{
  "type": "SEND | APPROVE",
  "estimate": "string",
  "limit": "string",
  "amount": "string",
  "amountUSD": "string",
  "price": "string",
  "token": "Token"
}
```

## Error Reference

### Error Response Format

```json
{
  "message": "string",
  "code": "number",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| 1000 | 400 | Invalid request parameters |
| 1001 | 404 | Resource not found |
| 1002 | 400 | Validation error |
| 1003 | 429 | Rate limit exceeded |
| 1004 | 500 | Internal server error |
| 1005 | 400 | Insufficient amount |
| 1006 | 400 | No routes available |
| 1007 | 400 | Slippage too high |

### Common Error Messages

| Message | Solution |
|---------|----------|
| `No routes found` | Try different tokens or amount |
| `Amount too low` | Increase transfer amount |
| `Slippage too high` | Reduce slippage or change route |
| `Token not supported` | Use supported token |
| `Chain not supported` | Use supported chain |

## Chain IDs

### EVM Chains

| Chain | ID | Key | Native Token |
|-------|-----|-----|--------------|
| Ethereum | 1 | `eth` | ETH |
| Optimism | 10 | `opt` | ETH |
| Cronos | 25 | `cro` | CRO |
| BSC | 56 | `bsc` | BNB |
| Gnosis | 100 | `dai` | xDAI |
| Polygon | 137 | `pol` | MATIC |
| Fantom | 250 | `ftm` | FTM |
| zkSync Era | 324 | `era` | ETH |
| Polygon zkEVM | 1101 | `pze` | ETH |
| Moonbeam | 1284 | `moo` | GLMR |
| Moonriver | 1285 | `mor` | MOVR |
| Base | 8453 | `bas` | ETH |
| Arbitrum | 42161 | `arb` | ETH |
| Celo | 42220 | `cel` | CELO |
| Avalanche | 43114 | `ava` | AVAX |
| Linea | 59144 | `lna` | ETH |
| Scroll | 534352 | `scr` | ETH |

### Non-EVM Chains

| Chain | Type |
|-------|------|
| Solana | SVM |

**Note:** Chain types filter via `chainTypes` parameter: `EVM`, `SVM`

## Common Token Addresses

### Native Token

Use for ETH, BNB, MATIC, AVAX, etc.:
```
0x0000000000000000000000000000000000000000
```

### USDC

| Chain | Address |
|-------|---------|
| Ethereum (1) | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| Optimism (10) | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| BSC (56) | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` |
| Polygon (137) | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |
| Base (8453) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Arbitrum (42161) | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Avalanche (43114) | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` |

### USDT

| Chain | Address |
|-------|---------|
| Ethereum (1) | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| Optimism (10) | `0x94b008aA00579c1307B0EF2c499aD98a8ce58e58` |
| BSC (56) | `0x55d398326f99059fF775485246999027B3197955` |
| Polygon (137) | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` |
| Arbitrum (42161) | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` |
| Avalanche (43114) | `0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7` |

### WETH

| Chain | Address |
|-------|---------|
| Ethereum (1) | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| Optimism (10) | `0x4200000000000000000000000000000000000006` |
| Polygon (137) | `0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619` |
| Base (8453) | `0x4200000000000000000000000000000000000006` |
| Arbitrum (42161) | `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1` |

### DAI

| Chain | Address |
|-------|---------|
| Ethereum (1) | `0x6B175474E89094C44Da98b954EedeAC495271d0F` |
| Optimism (10) | `0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1` |
| Polygon (137) | `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063` |
| Arbitrum (42161) | `0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1` |
