import { IBApi, Contract, SecType } from "@stoqey/ib";
import { EventEmitter } from "events";

export interface MarketDataParams {
  reqId: number;
  symbol: string;
  secType: string;
  exchange: string;
  currency: string;
}
export interface Position {
  account: string;
  contract: Contract;
  position: number;
  avgCost: number;
}

export class DataManager extends EventEmitter {
  private ib: IBApi;
  private contract: Contract;
  private reqId: number;
  private initialCapital: number;
  private currentCapital: number;
  private stockPrice: number;
  private prevPrice: number;
  private SMA20: number;
  private stdDev20: number;
  private lastDayClose: number;
  private pricesHistory: CircularArray;
  private nextValidId: number;
  private positions: Position[];

  constructor(ib: IBApi, marketDataParams: MarketDataParams, initialCapital: number) {
    super();
    this.ib = ib;
    this.reqId = marketDataParams.reqId;
    this.contract = {
      symbol: marketDataParams.symbol,
      secType: marketDataParams.secType as SecType,
      exchange: marketDataParams.exchange,
      currency: marketDataParams.currency
    };
    this.initialCapital = initialCapital;
    this.currentCapital = initialCapital;
    this.pricesHistory = new CircularArray(20);
    this.stockPrice = 0;
    this.prevPrice = 0;
    this.positions = [];
    this.SMA20 = 0;
    this.stdDev20 = 0;
    this.lastDayClose = 0;
    this.nextValidId = 0;
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

  getStockPrice(): number {
    return this.stockPrice;
  }

  getPrevPrice(): number {
    return this.prevPrice;
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

  getNextValidId(): number {
    return this.nextValidId;
  }

  getPositions(): Position[] {
    return this.positions;
  }

  updateClosePrice(price: number): void {
    this.pricesHistory.add(price);
    this.SMA20 = this.pricesHistory.calculateSMA();
    this.stdDev20 = this.pricesHistory.calculateStdev();
  }


  /* -------------------------------------------------------------------------- */
  /*                               event listeners                              */
  /* -------------------------------------------------------------------------- */

  handleConnection(): void {
    console.log("Successfully connected to TWS");
    this.fetchMarketData(this.reqId);
    this.ib.reqPositions(); // This will need to update whenever a new position is opened or closed
  }

  handlePriceUpdate(tickerId: number, field: number, price: number, attribs: any): void {
    console.log(`Price update - ${field}: ${price}`);
    if (field === 2) {
      this.prevPrice = this.stockPrice;
      this.stockPrice = price;
      console.log('Emitting priceUpdate');
      this.emit('priceUpdate');
      console.log('priceUpdate emitted');
    }
    // if field 9 is updated, stored in lastDayClose variable
    if (field === 9) {
      this.lastDayClose = price;
    }
  }


  handleNextValidId(orderId: number): number {
    console.log(`Next valid order ID: ${orderId}`);
    // Handle next valid order ID
    return orderId;  // used to keep track of order IDs
  }

  handlePositionStatus(account: string, contract: Contract, position: number, avgCost?: number): void {
    console.log(`Position - ${contract.symbol}: ${position} @ ${avgCost}`);
    // Handle position updates
    const index = this.positions.findIndex(p => p.contract.symbol === contract.symbol && p.account === account)
    if (index >= 0) {
      this.positions[index] = { account, contract, position, avgCost: avgCost ?? 0 };
    } else {
      this.positions.push({ account, contract, position, avgCost: avgCost ?? 0 });
    }
  }

  handlePositionEnd(): void {
    console.log("Position updates completed");
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
}


export class CircularArray {
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