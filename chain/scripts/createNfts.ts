import { getAddress } from "viem";
import * as dotenv from "dotenv";
import { account, publicClient, walletClient } from "./config.ts";
import { readFileSync } from "fs";
dotenv.config();

const { abi, bytecode } = JSON.parse(
  readFileSync(`./artifacts/contracts/Ehousing.sol/Ehousing.json`).toString()
);

async function main() {
  if (!process.env.CONTRACT_ADDRESS) {
    throw new Error(
      "No contract address provided! First deploy then add the address in .env file."
    );
  }
  for (let i = 0; i < 5; i++) {
    const tx = await walletClient.writeContract({
      abi: abi,
      address: process.env.CONTRACT_ADDRESS,
      functionName: "createHouse",
      args: [`https://pascasi.it/web3/house_{i}.json`],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

    console.log("Token" + i + " status " + receipt.status);
  }
  process.exit(0);
}

main();
