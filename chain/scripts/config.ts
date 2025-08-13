import { createPublicClient, createWalletClient, webSocket } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
dotenv.config();

export const account = privateKeyToAccount(
  `0x${process.env.DEPLOYER_PRIVATE_KEY}`
);

export const walletClient = createWalletClient({
  chain: sepolia,
  transport: webSocket(process.env.WSS_API_URL),
  account,
});

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: webSocket(process.env.WSS_API_URL),
});
