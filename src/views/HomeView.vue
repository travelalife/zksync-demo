<template>
  <main>
    <textarea v-model="priKey"></textarea>
    <button @click="save">导入</button>
    <div class="list">
      <div class="header">
        <div class="h-name">账号</div>
        <div class="h-balance">余额</div>
        <div class="h-op">操作</div>
      </div>
      <div class="row" v-for="(acc, idx) in accList" :key="idx">
        <div class="h-name">{{ acc.address }}</div>
        <div class="h-balance">
          <div class="h-b-row">
            <div class="h-b-name">ETH</div>
            <div class="h-b-name">{{ acc.ethNum }}</div>
          </div>
          <div class="h-b-row">
            <div class="h-b-name">USDC</div>
            <div class="h-b-name">{{ acc.usdcNum }}</div>
          </div>
        </div>
        <div class="h-op">
          <div class="op-row">
            <input type="text"><button>存款</button>
          </div>
          <div class="op-row">
            <input type="range" v-model="acc.ratio"> {{ acc.ratio }}%
            <button @click="swapByType(acc, 0)">ETH->USDC</button>
            <button @click="swapByType(acc, 1)">USDC->ETH</button>
            <button @click="lp(acc)">LP</button>
          </div>
        </div>
      </div>
    </div>

    <div class="log-area"></div>
  </main>
</template>
<script>
import {getBalanceInfo} from "../utils";
import {addLP, swapETHForUSDC} from "../utils/syncswap";

export default {
  data() {
    return {
      ratio: 0,
      accList: [],
      priKey: '',
    }
  },
  methods: {
    async save() {
      const list = this.priKey.split('\n').filter(item => !!item);
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const info = await getBalanceInfo(item);
        this.accList.push({
          ...info,
          priKey: item
        })
      }
    },
    async swapByType(acc, type) {
      const { priKey, ratio } = acc;
      const result = await swapETHForUSDC(priKey, ratio, type);
      console.log(result);
    },
    async lp(acc) {
      const { priKey } = acc;
      await addLP(priKey);
    }
  }
}
</script>
<style>
.list {
  border-left: 1px solid #ccc;
  border-top: 1px solid #ccc;
}
.header, .row {
  display: flex;
}
.header > div,
.row > div {
  width: 100px;
  overflow: hidden;
  word-break: break-all;
  flex-grow: 1;
  border-right: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  padding: 4px 8px;
}
.h-name {

}
.h-balance {
  display: flex;
}

.h-b-row {
  margin-right: 4px;
}
</style>
