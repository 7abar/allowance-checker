import { describe, it, expect, vi } from "vitest";
import { checkAllowances } from "./checker.js";
import type { ApprovalLog } from "./fetcher.js";

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: vi.fn().mockImplementation(({ functionName }) => {
        if (functionName === "allowance") return Promise.resolve(BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));
        if (functionName === "symbol") return Promise.resolve("USDC");
        if (functionName === "decimals") return Promise.resolve(6);
        if (functionName === "name") return Promise.resolve("USD Coin");
        return Promise.resolve(null);
      }),
    })),
  };
});

describe("checkAllowances", () => {
  it("detects unlimited allowance", async () => {
    const logs: ApprovalLog[] = [{
      tokenAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      spenderAddress: "0x2626664c2603336e57b271c5c0b26f421741e481",
      txHash: "0xabc",
      blockNumber: 100,
    }];

    const results = await checkAllowances("0x2012F75004C6e889405D078780AB41AE8606b85b", logs);
    expect(results).toHaveLength(1);
    expect(results[0].isUnlimited).toBe(true);
    expect(results[0].allowanceFormatted).toBe("UNLIMITED");
    expect(results[0].tokenSymbol).toBe("USDC");
  });

  it("skips zero allowances", async () => {
    const { createPublicClient } = await import("viem");
    (createPublicClient as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      readContract: vi.fn().mockResolvedValue(0n),
    });

    const logs: ApprovalLog[] = [{
      tokenAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      spenderAddress: "0x2626664c2603336e57b271c5c0b26f421741e481",
      txHash: "0xdef",
      blockNumber: 200,
    }];

    const results = await checkAllowances("0x2012F75004C6e889405D078780AB41AE8606b85b", logs);
    expect(results).toHaveLength(0);
  });
});
