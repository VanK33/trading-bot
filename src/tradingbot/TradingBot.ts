import { StrategyManager, BuyStrategy, SellStrategy, HoldStrategy } from "../strategyconfig/StrategyConfig.js";
import { DataManager, MarketDataParams } from "../datamanagement/DataManager.js";
import { TradingEngine } from "../tradingengine/TradingEngine.js"
import { IBApi, EventName } from "@stoqey/ib";
/* ----- initiate the StrategyManager class and register the strategies ----- */


/* ----- initiate the IBApi class ----- */
export class TradingBot {
    private ib: IBApi;
    private dataManager: DataManager;
    private strategyManager: StrategyManager;
    private tradingEngine: TradingEngine;
    private accountID: string;
    private marketDataParams: MarketDataParams;

    constructor(ib: IBApi, marketDataParams: MarketDataParams, accountID: string) {
        this.ib = ib;
        this.marketDataParams = marketDataParams;
        this.accountID = accountID;

        /* ------------------- initializing the DataManager class ------------------- */
        this.dataManager = new DataManager(ib, marketDataParams, 5000);

        /* ----- initiate the StrategyManager class and register the strategies ----- */
        this.strategyManager = new StrategyManager();
        this.strategyManager.registerStrategy(new BuyStrategy());
        this.strategyManager.registerStrategy(new SellStrategy());
        this.strategyManager.registerStrategy(new HoldStrategy());

        /* ------------------ initializing the TradingEngine class ------------------ */
        this.tradingEngine = new TradingEngine(this.dataManager, this.strategyManager, marketDataParams, ib, accountID);
    }

    /* -------------------------------------------------------------------------- */
    /*                 General bot startup and shutdown functions                 */
    /* -------------------------------------------------------------------------- */
    public start(): void {
        console.log("Starting trading bot...");
        this.setupListeners();
        this.ib.connect();
    }

    // General bot shutdown function
    public stop(): void {
        console.log("Stopping trading bot...");
        this.disconnect();
    }

    private disconnect(): void {
        this.ib.disconnect();
        console.log("Disconnected from TWS");
    }

    /* -------------------------------------------------------------------------- */
    /*                               Event listeners                              */
    /* -------------------------------------------------------------------------- */
    private setupListeners(): void {
        /* --------- General listeners for all interactions with the IB API --------- */
        this.ib.on(EventName.error, this.handleError.bind(this));
        this.ib.on(EventName.connected, this.dataManager.handleConnection.bind(this.dataManager));
        this.ib.on(EventName.tickPrice, this.dataManager.handlePriceUpdate.bind(this.dataManager));
        this.ib.on(EventName.nextValidId, this.dataManager.handleNextValidId.bind(this.dataManager));

        // Specific listeners that handle trading data and orders
        this.ib.on(EventName.position, this.dataManager.handlePositionStatus.bind(this.dataManager));
        this.ib.on(EventName.positionEnd, this.dataManager.handlePositionEnd.bind(this.dataManager));
        // Implementation for the future
        this.dataManager.on("priceUpdate", this.tradingEngine.handlePriceProcess.bind(this.tradingEngine));
        // this.ib.on(EventName.updatePortfolio, this.dataManager.handlePortfolioUpdate.bind(this.dataManager));
    }

    /* -------------------------------------------------------------------------- */
    /*                         Error logging and handling                         */
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
// Path: TradingBot.ts

