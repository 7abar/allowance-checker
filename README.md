# allowance-checker 🔐

> Scan any wallet for active ERC-20 approvals on Base. Know what you've approved. Know your risks.

Every time you approve a token spend on a DeFi protocol, that approval stays active until you revoke it. This tool scans a wallet address and shows you exactly what's approved, who can spend it, and how much.

## Why This Matters

When you approve a token on a DeFi protocol, you're giving that contract permission to move your tokens. **An unlimited approval means a protocol can take all your tokens at any time. If the protocol is hacked, your tokens are at risk.**

Most wallets don't show you this. This tool does.

## Usage

```bash
git clone https://github.com/7abar/allowance-checker
cd allowance-checker
npm install

# Scan any wallet
node src/index.js 0x2012F75004C6e889405D078780AB41AE8606b85b

# Optional: use your own RPC URL
node src/index.js 0xYourAddress https://your-rpc-url.com
```

## Example Output

```
  ════════════════════════════════════════════════════
  ALLOWANCE CHECKER  Base Mainnet
  ════════════════════════════════════════════════════
  Wallet: 0x2012F75004C6e889405D078780AB41AE8606b85b
  Active approvals: 3  (2 unlimited)

  ⚠️  UNLIMITED APPROVALS (revoke these if no longer needed)

  USDC     → Uniswap V3: SwapRouter02
          Token:   0x833589fcd6edb6e08f4c7c32d4f71b54bda02913
          Spender: 0x2626664c2603336e57b271c5c0b26f421741e481
          TX:      https://basescan.org/tx/0xabc...

  WETH     → Aave V3: Pool
          Token:   0x4200000000000000000000000000000000000006
          Spender: 0xa238dd80c259a72e81d7e4664a9801593f98d1c5
          TX:      https://basescan.org/tx/0xdef...

  LIMITED APPROVALS

  DAI      → Morpho  (1500.00)

  ════════════════════════════════════════════════════
  To revoke: visit revoke.cash or use cast send
  cast send <token> "approve(address,uint256)" <spender> 0 \
    --rpc-url https://mainnet.base.org --private-key $PK
```

## How It Works

1. Fetches all `Approval()` events from BaseScan where you are the owner
2. Deduplicates to keep only the latest approval per (token, spender) pair
3. Checks current allowance value via RPC for each pair
4. Filters out already-revoked (zero) allowances
5. Displays remaining approvals sorted by risk (unlimited first)

## How to Revoke

**Easy way:** Visit [revoke.cash](https://revoke.cash) and connect your wallet.

**CLI way (Foundry):**

```bash
# Revoke a specific approval
cast send <token_address> "approve(address,uint256)" <spender_address> 0 \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY
```

## Known Spenders

The tool automatically labels common protocol addresses:

- Uniswap V3: SwapRouter02
- Permit2
- Aave V3: Pool
- Morpho
- Aerodrome: Router

Unknown spenders show the raw address — look them up on [BaseScan](https://basescan.org).

## Requirements

- Node.js 18+
- No API key needed (uses public BaseScan API + public Base RPC)
- Optional: set `BASESCAN_API_KEY` env var for higher rate limits

## Notes

> Works on **Base mainnet**. For Ethereum mainnet, change the RPC URL to `https://eth.llamarpc.com` and update the API endpoint to `https://api.etherscan.io/api` with your Etherscan API key.

## License

MIT
