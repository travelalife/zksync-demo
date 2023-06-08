import * as zksync from "zksync-web3";
import * as ethers from "ethers";
import { zksProvider, ethProvider } from "./index";

const classicPoolFactoryAddy = '0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb';
const routerAddy = '0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295';
const vaultAddy = '0x621425a1Ef6abE91058E9712575dcc4258F8d091';
const privateKey = "";
const classicPoolFactoryAbi = require('../abi/syncswap/SyncSwapClassicPoolFactory.json');
const routerAbi = require('../abi/syncswap/SyncSwapRouter.json');
const http = "";
const zkSyncWallet = new zksync.Wallet(privateKey, zksProvider, ethProvider);
const router = new zksync.Contract(routerAddy, routerAbi, zkSyncWallet);
const classicPoolFactory = new zksync.Contract(
  classicPoolFactoryAddy,
  classicPoolFactoryAbi,
  zkSyncWallet
);

const poolETHUSDCAddress = await classicPoolFactory.getPool(zksync.utils.L2_ETH_TOKEN_ADDRESS, L2_USDC_ADDY);
const value = 10000000;
const withdrawMode = 1;

const swapData = ethers.utils.defaultAbiCoder.encode(
  ["address", "address", "uint8"],
  [zksync.utils.L2_ETH_TOKEN_ADDRESS, zkSyncWallet.address, withdrawMode], // tokenIn, to, withdraw mode
);

const steps = [{
  pool: poolETHUSDCAddress,
  data: swapData,
  callback: zksync.utils.ETH_ADDRESS,
  callbackData: '0x',
}];

const nativeETHAddress = zksync.utils.ETH_ADDRESS;

const paths = [{
  steps: steps,
  tokenIn: nativeETHAddress,
  amountIn: value,
}];

// const response = await router.swap(
//   paths, // paths
//   0, // amountOutMin // Note: ensures slippage here
//   ethers.BigNumber.from(Math.floor(Date.now() / 1000)).add(1800), // deadline // 30 minutes
//   {
//     value: value,
//   }
// );
//
// await response.wait();
