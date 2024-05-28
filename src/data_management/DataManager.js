import ibpackage from "@stoqey/ib";
const { EventName } = ibpackage;

export class DataManager {
  constructor(ib, marketDataParams) {
    this.data = [];
    this.ib = ib;
    this.marketDataParams = marketDataParams;
  }

  initialize() {
    console.log("Initializing data manager");
    this.ib.connect();
  }

  // Set up event listeners
  setupListeners() {
    this.ib.on(EventName.error, (err, code, reqId) => {
      console.error(`${err.message} - code: ${code} - reqId: ${reqId}`);
    });

    // After successful connection, fetch market data
    this.ib.on(EventName.connected, () => {
      console.log("Successfuuly connected to TWS");
      this.fetchMarketData(); // 获取市场数据
    });

    // Listen for price updates
    // tickerId: Unique ID to identify market data
    // field: Price field - Reference: https://interactivebrokers.github.io/tws-api/tick_types.html
    // price: Price
    // attribs: Additional attributes - e.g. timestamp of market data
    this.ib.on(EventName.tickPrice, (tickerId, field, price, attribs) => {
      console.log(`Price update - ${field}: ${price}`);
    });

    // Listen for order status updates
    // orderId: Order ID
    // status: Order status
    // filled: Quantity filled
    // remaining: Remaining quantity
    // avgFillPrice: Average fill price
    // permId: Permanent order ID
    // parentId: Parent order ID
    // lastFillPrice: Last fill price
    // clientId: Client ID
    // whyHeld: Reason for order hold
    // mktCapPrice: Market cap price
    this.ib.on(
      EventName.orderStatus,
      (
        orderId,
        status,
        filled,
        remaining,
        avgFillPrice,
        permId,
        parentId,
        lastFillPrice,
        clientId,
        whyHeld,
        mktCapPrice
      ) => {
        console.log(`Order Status - Order ID: ${orderId}, Status: ${status}`);
      }
    );
  }

  // Fetch market data
  fetchMarketData() {
    // tickerId: Unique ID to identify market data
    // symbol: Stock symbol
    // secType: Security type - STK represents stock
    // exchange: Exchange - SMART
    // currency: Currency
    const { tickerId, symbol, secType, exchange, currency } =
      this.marketDataParams;
    const contract = {
      symbol: symbol,
      secType: secType,
      exchange: exchange,
      currency: currency,
    };

    this.ib.reqMktData(tickerId, contract, "", false, false, []);
  }
  disconnect() {
    this.ib.disconnect();
    console.log("Disconnected from TWS");
  }
}

// Path: src/data_management/DataManager.js
