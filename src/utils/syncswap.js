import * as zksync from "zksync-web3";
import * as ethers from "ethers";
import { zksProvider, ethProvider } from "./index";
import classicPoolFactoryAbi from "../abi/syncswap/SyncSwapClassicPoolFactory.json";
import routerAbi from "../abi/syncswap/SyncSwapRouter.json";
import {L2_USDC_ADDY, L2_WETH_ADDY} from "./address";

const classicPoolFactoryAddy = '0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb';
const routerAddy = '0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295';
const vaultAddy = '0x621425a1Ef6abE91058E9712575dcc4258F8d091';

/**
 *
 * @param privateKey
 * @param {int} ratio // 交换金额的比例，百分比
 * @param {int} direction 0 -> ETH -> USDC, 1 -> USDC -> ETH
 * @returns
 */
export async function swapETHForUSDC(privateKey, ratio = 100, direction = 0) {
  // 创建钱包
  const wallet = new zksync.Wallet(privateKey, zksProvider, ethProvider);
  const classicPoolFactory = new zksync.Contract(
    classicPoolFactoryAddy,
    classicPoolFactoryAbi,
    wallet
  );

  const poolETHUSDCAddress = await classicPoolFactory.getPool(L2_WETH_ADDY, L2_USDC_ADDY);

  // 获取 ETH 余额
  const ethBalance = await wallet.getBalance(zksync.utils.ETH_ADDRESS);
  const usdcBalance = await wallet.getBalance(L2_USDC_ADDY);

  console.log('ETH 余额: ', ethers.utils.formatEther(ethBalance));
  console.log('USDC 余额:', ethers.utils.formatUnits(usdcBalance, 6));

  let tokenInAddress = '';
  let amount = 0;

  if (direction === 0) {
    tokenInAddress = L2_WETH_ADDY;
    amount = ethBalance.mul(ratio).div(100);
    console.log('SyncSwap 交互', ethers.utils.formatEther(amount), 'ETH');
  } else {
    tokenInAddress = L2_USDC_ADDY;
    amount = usdcBalance.mul(ratio).div(100);
    console.log('SyncSwap 交互', ethers.utils.formatUnits(amount, 6), 'USDC');

    // 查询当前 USDC 的授权额度
    const usdcContract = new ethers.Contract(L2_USDC_ADDY, zksync.utils.IERC20, wallet);
    let allowedAmount = await usdcContract.allowance(wallet.address, routerAddy);
    console.log('USDC 授权额度:', ethers.utils.formatUnits(allowedAmount, 6));

    if (allowedAmount.lt(amount)) {
      console.log('授权 USDC 额度', ethers.utils.formatUnits(amount, 6));
      try {
        let approveTx = await usdcContract.approve(routerAddy, amount);
        await approveTx.wait();
        console.log('授权 USDC 成功', approveTx.hash);
      } catch (error) {
        console.log('授权 USDC 失败', error.error);
        return;
      }
    }
  }

  // Checks whether the pool exists.
  if (classicPoolFactoryAddy === ethers.constants.AddressZero) {
    console.error('Pool is not exists');
    return;
  }

  const withdrawMode = 1; // 1 or 2 to withdraw to user's wallet
  const swapData = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address', 'uint8'],
    [tokenInAddress, wallet.address, withdrawMode] // tokenIn, to, withdraw mode
  );

  const steps = [
    {
      pool: poolETHUSDCAddress,
      data: swapData,
      callback: ethers.constants.AddressZero, // no callback
      callbackData: '0x'
    }
  ];

  const paths = [
    {
      steps: steps,
      tokenIn: direction === 0 ? ethers.constants.AddressZero : tokenInAddress,
      amountIn: amount
    }
  ];

  console.log('paths:', JSON.stringify(paths));

  const routerContract = new zksync.Contract(routerAddy, routerAbi, wallet);
  const deadline = ethers.BigNumber.from(Math.floor(Date.now() / 1000)).add(1800);

  // 估算需要的 gas 费用
  const gasPrice = await ethProvider.getGasPrice();
  console.log('gas price:', ethers.utils.formatUnits(gasPrice, 'gwei'), gasPrice.toString());

  const gasLimit = await routerContract.estimateGas.swap(paths, 0, deadline, {
    value: direction === 0 ? amount : 0
  });
  const fee = gasLimit.mul(gasPrice);
  console.log('gas limit:', gasLimit.toString(), 'eth fee:', ethers.utils.formatEther(fee));

  const response = await routerContract.swap(
    paths, // paths
    0, // amountOutMin // Note: ensures slippage here
    deadline, // deadline 30 minutes
    {
      value: direction === 0 ? amount : 0,
      gasLimit
    }
  );
  const tx = await response.wait();
  console.log('SyncSwap swap 成功:', tx.transactionHash);
}
