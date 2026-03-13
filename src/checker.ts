import { createPublicClient, http, formatUnits } from "viem";
import { base } from "viem/chains";
import { ERC20_ABI } from "./fetcher.js";
import type { ApprovalLog, AllowanceResult } from "./fetcher.js";

const UNLIMITED_THRESHOLD = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") - BigInt(1000);

export async function checkAllowances(
  ownerAddress: string,
  logs: ApprovalLog[],
  rpcUrl?: string
): Promise<AllowanceResult[]> {
  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl ?? "https://mainnet.base.org"),
  });

  const results: AllowanceResult[] = [];

  // Batch calls
  for (const log of logs) {
    try {
      const [allowanceRaw, symbol, decimals, name] = await Promise.all([
        client.readContract({
          address: log.tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [ownerAddress as `0x${string}`, log.spenderAddress as `0x${string}`],
        }),
        client.readContract({ address: log.tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: "symbol" }).catch(() => "???"),
        client.readContract({ address: log.tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: "decimals" }).catch(() => 18),
        client.readContract({ address: log.tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: "name" }).catch(() => "Unknown Token"),
      ]);

      // Skip zero allowances (already revoked)
      if (allowanceRaw === 0n) continue;

      const isUnlimited = allowanceRaw >= UNLIMITED_THRESHOLD;
      const allowanceFormatted = isUnlimited
        ? "UNLIMITED"
        : formatUnits(allowanceRaw, decimals as number);

      results.push({
        tokenAddress: log.tokenAddress,
        tokenSymbol: symbol as string,
        tokenName: name as string,
        decimals: decimals as number,
        spenderAddress: log.spenderAddress,
        allowanceRaw,
        allowanceFormatted,
        isUnlimited,
        txHash: log.txHash,
      });
    } catch {
      // Skip tokens that error (likely not ERC-20 or contract no longer exists)
    }
  }

  return results;
}
