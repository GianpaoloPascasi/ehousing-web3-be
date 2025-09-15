# Ehousing web3 Ethereum interaction

## Prerequisites
I will use experimental native TS parsing from node 22.18, make sure to install this node version using your preferred node version manager.
Then run `npm i` inside the directory.

## Test
To run tests just run in your cmd `npx hardhat test`

## Deploy
To deploy your contract:
- create a .env file in the directory
- in the .env add the following variables
    - DEPLOYER_PRIVATE_KEY=your private key
    - WSS_API_URL=your alchemy websocket url
- run `npm run deploy`
- it should appear a message showing the just deployed contract address.