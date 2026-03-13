import type { AllowanceResult } from "./fetcher.js";

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", yellow: "\x1b[33m", green: "\x1b[32m",
  cyan: "\x1b[36m", gray: "\x1b[90m", white: "\x1b[37m",
};
const col = (t: string, ...c: string[]) => c.join("") + t + C.reset;

const KNOWN_SPENDERS: Record<string, string> = {
  "0x2626664c2603336e57b271c5c0b26f421741e481": "Uniswap V3: SwapRouter02",
  "0x6cb442acf35158d68425b350ec2b277965af49e2": "Uniswap V3: Permit2",
  "0x000000000022d473030f116ddee9f6b43ac78ba3": "Permit2",
  "0xa238dd80c259a72e81d7e4664a9801593f98d1c5": "Aave V3: Pool",
  "0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb": "Morpho",
  "0x2dc219e716793fb4b21548c0f009ba3af753ab01": "Aerodrome: Router",
};

function labelSpender(address: string): string {
  return KNOWN_SPENDERS[address.toLowerCase()] ?? address;
}

export function formatResults(address: string, results: AllowanceResult[]): string {
  const unlimited = results.filter(r => r.isUnlimited);
  const limited = results.filter(r => !r.isUnlimited);
  const lines: string[] = [
    "",
    col("  ════════════════════════════════════════════════════", C.bold),
    col("  ALLOWANCE CHECKER", C.bold, C.cyan) + col("  Base Mainnet", C.gray),
    col("  ════════════════════════════════════════════════════", C.bold),
    col(`  Wallet: ${address}`, C.gray),
    col(`  Active approvals: ${results.length}  `, C.gray) +
      col(`(${unlimited.length} unlimited)`, unlimited.length > 0 ? C.red + C.bold : C.green),
    "",
  ];

  if (results.length === 0) {
    lines.push(col("  ✓ No active allowances found. Clean wallet.", C.green, C.bold), "");
    return lines.join("\n");
  }

  if (unlimited.length > 0) {
    lines.push(col("  ⚠️  UNLIMITED APPROVALS (revoke these if no longer needed)", C.red, C.bold), "");
    for (const r of unlimited) {
      lines.push(
        col(`  ${r.tokenSymbol.padEnd(8)}`, C.bold, C.white) +
        col(` → ${labelSpender(r.spenderAddress)}`, C.red),
        col(`          Token:   ${r.tokenAddress}`, C.dim),
        col(`          Spender: ${r.spenderAddress}`, C.dim),
        col(`          TX:      https://basescan.org/tx/${r.txHash}`, C.dim),
        "",
      );
    }
  }

  if (limited.length > 0) {
    lines.push(col("  LIMITED APPROVALS", C.yellow, C.bold), "");
    for (const r of limited) {
      lines.push(
        col(`  ${r.tokenSymbol.padEnd(8)}`, C.bold, C.white) +
        col(` → ${labelSpender(r.spenderAddress)}`, C.yellow) +
        col(`  (${r.allowanceFormatted})`, C.gray),
        "",
      );
    }
  }

  lines.push(
    col("  ════════════════════════════════════════════════════", C.bold),
    col("  To revoke: visit revoke.cash or use cast send", C.dim),
    col(`  cast send <token> "approve(address,uint256)" <spender> 0 \\`, C.dim),
    col(`    --rpc-url https://mainnet.base.org --private-key $PK`, C.dim),
    "",
  );

  return lines.join("\n");
}
