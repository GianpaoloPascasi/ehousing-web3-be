declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    DEPLOYER_PRIVATE_KEY: string;
    DEPLOYER_ADDRESS: `0x${string}`;
    WSS_API_URL: string;
  }
}
