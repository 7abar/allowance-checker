// ERC-20 approve event: Approval(address indexed owner, address indexed spender, uint256 value)
// topic0: keccak256("Approval(address,address,uint256)")
const APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
const BASESCAN_API = "https://api.basescan.org/api";
const API_KEY = process.env.BASESCAN_API_KEY ?? "J3GQEYNW94YDJ7RM616Y2MSU9WC5SEUS63";

export const ERC20_ABI = [
  { name: "allowance", type: "function", stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }] },
  { name: "symbol", type: "function", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "string" }] },
  { name: "decimals", type: "function", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { name: "name", type: "function", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "string" }] },
] as const;

export interface ApprovalLog {
  tokenAddress: string;
  spenderAddress: string;
  txHash: string;
  blockNumber: number;
}

export interface AllowanceResult {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  decimals: number;
  spenderAddress: string;
  allowanceRaw: bigint;
  allowanceFormatted: string;
  isUnlimited: boolean;
  txHash: string;
}

// Fetch all Approval events where owner = address
export async function fetchApprovalLogs(ownerAddress: string): Promise<ApprovalLog[]> {
  const paddedOwner = "0x000000000000000000000000" + ownerAddress.slice(2).toLowerCase();
  const url = `${BASESCAN_API}?module=logs&action=getLogs`
    + `&fromBlock=0&toBlock=latest`
    + `&topic0=${APPROVAL_TOPIC}`
    + `&topic1=${paddedOwner}`
    + `&topic0_1_opr=and`
    + `&page=1&offset=1000`
    + `&apikey=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json() as { status: string; result: Array<{
    address: string; topics: string[]; data: string;
    transactionHash: string; blockNumber: string;
  }> };

  if (data.status !== "1" || !Array.isArray(data.result)) return [];

  // Dedupe: keep only latest approval per (token, spender) pair
  const seen = new Map<string, ApprovalLog>();
  for (const log of data.result) {
    const tokenAddress = log.address.toLowerCase();
    const spenderAddress = "0x" + (log.topics[2] ?? "").slice(26).toLowerCase();
    const key = `${tokenAddress}:${spenderAddress}`;
    const current = seen.get(key);
    const blockNum = parseInt(log.blockNumber, 16);
    if (!current || blockNum > current.blockNumber) {
      seen.set(key, {
        tokenAddress,
        spenderAddress,
        txHash: log.transactionHash,
        blockNumber: blockNum,
      });
    }
  }

  return Array.from(seen.values());
}
