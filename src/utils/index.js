import * as zksync from "zksync-web3";
import {Provider, utils} from "zksync-web3";
import {ethers} from "ethers";

export const zksProvider = new Provider('https://mainnet.era.zksync.io/');
export const ethProvider = new ethers.providers.JsonRpcProvider('https://rpc.builder0x69.io');

function getGas() {

}

export async function getBalanceInfo(priKey) {
  const zkSyncWallet = new zksync.Wallet(priKey, zksProvider, ethProvider);
  const eth = await zkSyncWallet.getBalance(zksync.utils.L2_ETH_TOKEN_ADDRESS);
  const ethNum = ethers.utils.formatUnits(eth);
  const address = await zkSyncWallet.getAddress();
  return {
    address,
    ethNum,
  }
}

export async function deposit(priKey) {
  const zkSyncWallet = new zksync.Wallet(priKey, zksProvider, ethProvider);
  const ethDepositHandle = await zkSyncWallet.deposit({
    token: utils.ETH_ADDRESS,
    amount: ethers.utils.parseEther('0.01'),
  });
  const result = await ethDepositHandle.wait();
}

export async function withdraw(priKey, zksProvider, ethProvider) {
  const zkSyncWallet = new zksync.Wallet(priKey, zksProvider, ethProvider);
  const withdrawL2 = await zkSyncWallet.withdraw({
    token: zksync.utils.ETH_ADDRESS,
    amount: ethers.utils.parseEther("0.5"),
  });
  const result = await withdrawL2.wait();
}


