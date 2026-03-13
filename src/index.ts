#!/usr/bin/env node
import { fetchApprovalLogs } from "./fetcher.js";
import { checkAllowances } from "./checker.js";
import { formatResults } from "./format.js";

const address = process.argv[2];
const rpcUrl = process.argv[3];

if (!address || !address.startsWith("0x") || address.length !== 42) {
  console.error("\nUsage: node src/index.js <0x_wallet_address> [rpc_url]\n");
  console.error("Example:");
  console.error("  node src/index.js 0x2012F75004C6e889405D078780AB41AE8606b85b\n");
  process.exit(1);
}

async function main() {
  console.log(`\nScanning allowances for ${address}...`);

  const logs = await fetchApprovalLogs(address);
  console.log(`Found ${logs.length} approval events. Checking current values...\n`);

  const results = await checkAllowances(address, logs, rpcUrl);
  console.log(formatResults(address, results));
}

main().catch(err => {
  console.error("\nError:", err.message);
  process.exit(1);
});
