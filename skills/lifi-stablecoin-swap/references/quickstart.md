# Quickstart — a 1:1 stablecoin swap interface (Next.js + @lifi/intent)

A minimal, runnable interface that quotes 1:1, opens an escrow order, and tracks it to delivered,
using the `@lifi/intent` SDK (quote + order build) with `viem`/`wagmi` for the wallet and the
`open` call. The quote/build flows here are verified against the production solver network.

> Prerequisite: a LI.FI integrator account with 1:1 stablecoin quoting enabled (register at
> https://portal.li.fi). Without it, the same code returns standard market quotes.

## 1. Scaffold & install

```bash
npx create-next-app@latest lifi-1to1-swap --ts --app --no-tailwind
cd lifi-1to1-swap
npm install @lifi/intent viem wagmi @tanstack/react-query
```

```bash
# .env.local
NEXT_PUBLIC_LIFI_INTEGRATOR_KEY=your-onboarded-integrator-key
```

## 2. The `open` ABI — `lib/abi.ts`

The escrow `open(StandardOrder)` ABI (the SDK builds the `order` value you pass to it):

```ts
export const OPEN_ABI = [
  {
    type: "function", name: "open", stateMutability: "nonpayable", outputs: [],
    inputs: [{
      name: "order", type: "tuple",
      components: [
        { name: "user", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "originChainId", type: "uint256" },
        { name: "expires", type: "uint32" },
        { name: "fillDeadline", type: "uint32" },
        { name: "inputOracle", type: "address" },
        { name: "inputs", type: "uint256[2][]" },
        {
          name: "outputs", type: "tuple[]",
          components: [
            { name: "oracle", type: "bytes32" },
            { name: "settler", type: "bytes32" },
            { name: "chainId", type: "uint256" },
            { name: "token", type: "bytes32" },
            { name: "amount", type: "uint256" },
            { name: "recipient", type: "bytes32" },
            { name: "callbackData", type: "bytes" },
            { name: "context", type: "bytes" },
          ],
        },
      ],
    }],
  },
] as const;
```

## 3. Swap logic — `lib/swap.ts`

```ts
import { IntentApi, Intent, type IntentDeps } from "@lifi/intent";
import type { WalletClient } from "viem";
import { OPEN_ABI } from "./abi";

const KEY = process.env.NEXT_PUBLIC_LIFI_INTEGRATOR_KEY!;
const api = new IntentApi(true); // true = mainnet / production solver network

export type Tok = { address: `0x${string}`; chainId: number; decimals: number; name: string };

const POLYMER_ORACLE = "0x0000003E06000007A224AeE90052fA6bb46d43C9" as const; // mainnet
const deps: IntentDeps = {
  getOracle: (verifier) => (verifier === "polymer" ? POLYMER_ORACLE : undefined),
};

// 1) 1:1 quote — the integrator key is what makes supported stablecoin pairs come back 1:1.
export async function getQuote(from: Tok, to: Tok, amount: bigint, user: `0x${string}`) {
  const res = await api.getQuotes({
    user,
    userChainId: from.chainId,
    integratorKey: KEY,
    inputs:  [{ sender: user,   asset: from.address, chainId: from.chainId, amount }],
    outputs: [{ receiver: user, asset: to.address,   chainId: to.chainId,   amount: 0n }],
  });
  const quote = res.quotes[0];
  if (!quote) throw new Error("No quote available for this pair");
  return BigInt(quote.preview.outputs[0].amount); // what the user receives (== input for 1:1)
}

// 2) Build the order (SDK assembles the StandardOrder) and open it on-chain.
export async function openSwap(
  from: Tok, to: Tok, amountIn: bigint, amountOut: bigint,
  user: `0x${string}`, wallet: WalletClient,
) {
  const ctx = (t: Tok, amount: bigint) => ({
    token: { address: t.address, name: t.name, chainId: BigInt(t.chainId),
             decimals: t.decimals, chainNamespace: "eip155" as const },
    amount,
  });

  const intent = new Intent({
    inputTokens:  [ctx(from, amountIn)],
    outputTokens: [ctx(to, amountOut)],
    verifier: "polymer",
    account: user,
    outputRecipient: user,
    lock: { type: "escrow" },
  }, deps).order();

  const order   = intent.asOrder();
  const orderId = intent.orderId();

  // Approve the source token to `intent.inputSettler` first if allowance is insufficient.
  const txHash = await wallet.writeContract({
    address: intent.inputSettler, // InputSettlerEscrow (SDK-provided)
    abi: OPEN_ABI,
    functionName: "open",
    args: [order],
  });
  return { txHash, orderId };
}

// 3) Poll status until delivered/settled.
export async function trackOrder(orderId: string) {
  const res = await fetch(
    `https://order.li.fi/orders/status?onChainOrderId=${orderId}`,
  ).then((r) => r.json());
  return res; // res.meta?.orderStatus: Signed -> Delivered -> Settled (or Expired -> refundable)
}
```

## 4. Interface — `app/page.tsx`

```tsx
"use client";
import { useState } from "react";
import { useAccount, useConnect, useWalletClient } from "wagmi";
import { getQuote, openSwap, trackOrder, type Tok } from "../lib/swap";

const USDC_BASE: Tok = { name: "usdc", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", chainId: 8453,  decimals: 6 };
const USDC_ARB:  Tok = { name: "usdc", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", chainId: 42161, decimals: 6 };

export default function Page() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: wallet } = useWalletClient();
  const [out, setOut] = useState<bigint>();
  const [status, setStatus] = useState("");

  const amountIn = 100_000_000n; // 100 USDC (6 decimals)

  async function quote() { setOut(await getQuote(USDC_BASE, USDC_ARB, amountIn, address!)); }

  async function swap() {
    const { orderId } = await openSwap(USDC_BASE, USDC_ARB, amountIn, out!, address!, wallet!);
    setStatus("Submitted...");
    const timer = setInterval(async () => {
      const s = await trackOrder(orderId);
      setStatus(s.meta?.orderStatus ?? "pending");
      if (["Delivered", "Settled", "Expired"].includes(s.meta?.orderStatus)) clearInterval(timer);
    }, 3000);
  }

  if (!isConnected)
    return <button onClick={() => connect({ connector: connectors[0] })}>Connect wallet</button>;

  return (
    <main style={{ maxWidth: 420, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1>Send 100 USDC (Base) → receive {out ? Number(out) / 1e6 : "—"} USDC (Arbitrum)</h1>
      <button onClick={quote}>Get 1:1 quote</button>
      <button onClick={swap} disabled={!out}>Swap</button>
      <p>{status}</p>
    </main>
  );
}
```

(Wrap the app in `WagmiProvider` + `QueryClientProvider` in `app/layout.tsx` per the wagmi docs.
Add an ERC-20 `approve(intent.inputSettler, amountIn)` before `open` if allowance is insufficient.)

## 5. Run

```bash
npm run dev
```

Click **Get 1:1 quote** — under a 1:1-enabled integrator you'll see "receive 100 USDC". Click
**Swap**, sign once, and the status flips Submitted → Delivered → Settled as the solver fills on
Arbitrum. The `orderId` is the on-chain receipt anyone can verify on a block explorer.

## Notes

- Swap the token constants / amount for your pairs; query `GET https://order.li.fi/chains/supported`
  and `GET /routes` for live coverage.
- For a non-TypeScript backend, use the REST flow in `SKILL.md` §7 — same endpoints and contracts.
