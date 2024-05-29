import { EventName, IBApi, Contract, SecType } from "@stoqey/ib";

interface marketDataParams {
  reqId: number;
  symbol: string;
  secType: string;
  exchange: string;
  currency: string;
}

export class DataManager {
  private ib: IBApi;
  private contract: Contract;
  private initialCapital: number;
  private currentCapital: number;
  private stockPrice: number;
  private SMA20: number;
  private stdDev20: number;
  private lastDayClose: number;
  private prices: CircularArray;

  constructor(ib: IBApi, marketDataParams: marketDataParams, initialCapital: number) {
    this.ib = ib;
    this.contract = {
      symbol: marketDataParams.symbol,
      secType: marketDataParams.secType as SecType,
      exchange: marketDataParams.exchange,
      currency: marketDataParams.currency
    };
    this.initialCapital = initialCapital;
    this.currentCapital = initialCapital;
    this.prices = new CircularArray(20);
  }

  /* -------------------------------------------------------------------------- */
  /*                assisting functions in the DataManager class                */
  /* -------------------------------------------------------------------------- */

  getInitialCapital(): number {
    return this.initialCapital;
  }

  getCurrentCapital(): number {
    return this.currentCapital;
  }

  setCurrentCapital(capital: number): void {
    this.currentCapital += capital;
    console.log(`Current capital updated: ${this.currentCapital}`);
  }

  getStockPrice(): number {
    return this.stockPrice;
  }

  getLastDayClose(): number {
    return this.lastDayClose;
  }

  get20DaySMA(): number {
    return this.SMA20;
  }

  get20DayStdDev(): number {
    return this.stdDev20;
  }

  updateClosePrice(price: number): void {
    this.prices.add(price);
    this.SMA20 = this.prices.calculateSMA();
    this.stdDev20 = this.prices.calculateStdev();
  }


  /* -------------------------------------------------------------------------- */
  /*                      initializaiton and disconnection                      */
  /* -------------------------------------------------------------------------- */

  // Initialize the data manager
  initialize(): void {
    console.log("Initializing data manager");
    this.ib.connect();
    this.setupListeners();
  }

  // Disconnect from TWS
  disconnect(): void {
    this.ib.disconnect();
    console.log("Disconnected from TWS");
  }

  /* -------------------------------------------------------------------------- */
  /*                               event listeners                              */
  /* -------------------------------------------------------------------------- */

  handleConnection(): void {
    console.log("Successfully connected to TWS");
    this.fetchMarketData(1);
  }

  handlePriceUpdate(tickerId: number, field: number, price: number, attribs: any): void {
    console.log(`Price update - ${field}: ${price}`);
    if (field === 4) {
      this.stockPrice = price;
    }
    // if field 9 is updated, stored in lastDayClose variable
    if (field === 9) {
      this.lastDayClose = price;
    }
  }

  handleOrderStatus(orderId: number, status: string, filled: number, remaining: number, avgFillPrice: number, permId: number, parentId: number, lastFillPrice: number, clientId: number, whyHeld: string, mktCapPrice: number, lastLiquidity: number): void {
    console.log(`Order Status - Order ID: ${orderId}, Status: ${status}`);
    // Handle order status updates
  }

  setupListeners(): void {
    this.ib.on(EventName.error, this.handleError.bind(this));
    this.ib.on(EventName.connected, this.handleConnection.bind(this));
    this.ib.on(EventName.tickPrice, this.handlePriceUpdate.bind(this));
    this.ib.on(EventName.orderStatus, this.handleOrderStatus.bind(this));
  }

  /* -------------------------------------------------------------------------- */
  /*                            Fetching Market Data                            */
  /* -------------------------------------------------------------------------- */

  // Fetch market data from TWS
  fetchMarketData(reqId: number): void {
    const { symbol, secType, exchange, currency } = this.contract;
    const contract = {
      symbol: symbol,
      secType: secType,
      exchange: exchange,
      currency: currency
    };

    this.ib.reqMktData(reqId, contract, "", false, false);
  }


  /* -------------------------------------------------------------------------- */
  /*                         error logging and handling                         */
  /* -------------------------------------------------------------------------- */

  // Log error messages
  logError(message: string): void {
    console.error(`Error: ${message}`);
  }

  handleError(err: any, code: number, reqId: number): void {
    console.error(`Error: ${err.message} - code: ${code} - reqId: ${reqId}`);
  }

  // future can import logging save module for better error handling

}


class CircularArray {
  private arr: number[];
  private capacity: number;
  private start: number = 0;
  private count: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.arr = new Array(capacity).fill(0);
  }

  add(value: number): void {
    let index = (this.start + this.count) % this.capacity;
    this.arr[index] = value;
    if (this.count < this.capacity) {
      this.count++;
    } else {
      this.start = (this.start + 1) % this.capacity;
    }
  }


  calculateSMA(): number {
    if (this.count === 0) return 0;
    let sum = 0;
    for (let i = 0; i < this.count; i++) {
      sum += this.arr[(this.start + i) % this.capacity];
    }

    return sum / this.count;
  }

  calculateStdev(): number {
    if (this.count < 2) return 0; // need at least 2 data points to calculate stdev

    const mean = this.calculateSMA();
    let variance = 0;

    for (let i = 0; i < this.count; i++) {
      let diff = this.arr[(this.start + i) % this.capacity] - mean;
      variance += diff * diff;
    }

    variance /= (this.count - 1);
    return Math.sqrt(variance);
  }

}