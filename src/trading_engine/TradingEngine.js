import ibpackage from "@stoqey/ib";
const { IBApi, EventName, ErrorCode, Contract, Order } = ibpackage;

// Function breakdown:
// Mark data analysis
// 策略集成
// 实时数据处理
// 执行交易
// 错误处理
export class TradingEngine {
  constructor(dataManager, marketDataParams) {
    this.dataManager = dataManager;
    this.activeOrders = [];
    this.position = {};
    this.strategy = null;
  }

  applyStrategy(strategy) {
    this.strategy = strategy;
  }

  onDataUpdate(data) {
    if (this.strategy) {
      const signal = this.strategy.evaluate(data);
      this.executeTrade(signal);
    }
  }

  executeTrade(signal) {
    // BUY, SELL, HOLD, closePosition
    // AT what price, how many shares?
  }

  placeOrder(action) {
    // create order to do action
  }

  closePosition() {
    // close position
  }
}

//  Path: src/data_management/DataManager.js
