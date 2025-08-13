import { getAddress } from "viem";
import * as dotenv from "dotenv";
import { account, publicClient, walletClient } from "./config";
import * as Ehousing from "../artifacts/contracts/Ehousing.sol/Ehousing.json";
dotenv.config();

async function main() {
  const tx = await walletClient.deployContract({
    abi: Ehousing.abi,
    account: account,
    bytecode: Ehousing.bytecode as `0x${string}`,
    args: [getAddress(process.env.DEPLOYER_ADDRESS)],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

  console.log(receipt.contractAddress);
  console.log("^^^^^^^^^^^ CONTRACT ADDRESS ^^^^^^^^^^^");
  process.exit(0);
}

main();
