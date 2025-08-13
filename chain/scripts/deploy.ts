import { getAddress } from "viem";
import * as dotenv from "dotenv";
import { account, walletClient } from "./config";
import * as Ehousing from "../artifacts/contracts/Ehousing.sol/Ehousing.json";
import { sepolia } from "viem/chains";
dotenv.config();

async function main() {
  const tx = await walletClient.deployContract({
    abi: Ehousing.abi,
    account: account,
    bytecode: Ehousing.bytecode as `0x${string}`,
    args: [getAddress(process.env.DEPLOYER_ADDRESS)],
  });
  console.log("Transaction hash" + tx);
}

main();
