import * as zksync from "zksync-web3";
import {Provider, utils} from "zksync-web3";
import {ethers} from "ethers";
import {L2_USDC_ADDY} from "./address";

export const zksProvider = new Provider('https://mainnet.era.zksync.io/');
export const ethProvider = new ethers.providers.JsonRpcProvider('https://rpc.builder0x69.io');

export async function getBalanceInfo(priKey) {
  const zkSyncWallet = new zksync.Wallet(priKey, zksProvider, ethProvider);
  const eth = await zkSyncWallet.getBalance(zksync.utils.L2_ETH_TOKEN_ADDRESS);
  const ethNum = ethers.utils.formatUnits(eth);
  const usdc = await zkSyncWallet.getBalance(L2_USDC_ADDY);
  const usdcNum = ethers.utils.formatUnits(usdc, 6)
  const address = await zkSyncWallet.getAddress();
  return {
    address,
    ethNum,
    usdcNum
  }
}

export async function deposit(priKey, amount) {
  const zkSyncWallet = new zksync.Wallet(priKey, zksProvider, ethProvider);
  const ethDepositHandle = await zkSyncWallet.deposit({
    token: utils.ETH_ADDRESS,
    amount: ethers.utils.parseEther(amount),
  });
  const result = await ethDepositHandle.wait();
}

export async function withdraw(priKey, amount) {
  const zkSyncWallet = new zksync.Wallet(priKey, zksProvider, ethProvider);
  const withdrawL2 = await zkSyncWallet.withdraw({
    token: zksync.utils.ETH_ADDRESS,
    amount: ethers.utils.parseEther(amount),
  });
  const result = await withdrawL2.wait();
}


