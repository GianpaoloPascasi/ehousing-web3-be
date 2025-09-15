import { getAddress } from "viem";
import * as dotenv from "dotenv";
import { account, publicClient, walletClient } from "./config.ts";
import { readFileSync } from "fs";
dotenv.config();

const { abi, bytecode } = JSON.parse(
  readFileSync(`./artifacts/contracts/Ehousing.sol/Ehousing.json`).toString()
);

async function main() {
  const tx = await walletClient.deployContract({
    abi: abi,
    account: account,
    bytecode: bytecode as `0x${string}`,
    args: [getAddress(process.env.DEPLOYER_ADDRESS)],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

  console.log(receipt.contractAddress);
  console.log("^^^^^^^^^^^ CONTRACT ADDRESS ^^^^^^^^^^^");
  process.exit(0);
}

main();
