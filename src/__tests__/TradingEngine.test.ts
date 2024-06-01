import { IBApi, SecType } from '@stoqey/ib';
import { DataManager, Position, MarketDataParams } from '../data_management/DataManager';
import { TradeData, StrategyManager, TradeAction } from '../strategy_config/StrategyConfig';
import { TradingEngine } from '../trading_engine/TradingEngine';



describe("TradingEngine", () => {
    let ibMock: IBApi;
    let dataManager: DataManager;
    let tradingEngine: TradingEngine;
    let strategyManager: StrategyManager;
    let testContract = { symbol: "AAPL", secType: "STK", exchange: "NASDAQ", currency: "USD" }

    beforeEach(() => {
        ibMock = new IBApi();
        const marketDataParams: MarketDataParams = { reqId: 1, ...testContract };
        const accountID = "DU123456";

        const positions: Position[] = [
            {
                account: "A12345",
                contract: { symbol: "AAPL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
                position: 100,
                avgCost: 150.50
            },
            {
                account: "A12345",
                contract: { symbol: "GOOGL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
                position: 200,
                avgCost: 1220.75
            },
            {
                account: "B67890",
                contract: { symbol: "AMZN", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
                position: 50,
                avgCost: 3100.00
            },
            {
                account: "B67890",
                contract: { symbol: "TSLA", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
                position: 150,
                avgCost: 720.40
            }
        ];


        tradingEngine = new TradingEngine(dataManager, strategyManager, marketDataParams, ibMock, accountID);

        dataManager = new DataManager(ibMock, marketDataParams, 1000);
        jest.spyOn(dataManager, 'getStockPrice').mockReturnValue(150);
        jest.spyOn(dataManager, 'getPrevPrice').mockReturnValue(145);
        jest.spyOn(dataManager, 'get20DaySMA').mockReturnValue(140);
        jest.spyOn(dataManager, 'get20DayStdDev').mockReturnValue(5);
        jest.spyOn(dataManager, 'getPositions').mockReturnValue(positions);
        jest.spyOn(dataManager, 'getNextValidId').mockReturnValue(0);
        strategyManager = new StrategyManager();
    });

    test("should create a new DataManager instance", () => {
        expect(dataManager).toBeInstanceOf(DataManager);
    });

    test("should create a new StrategyManager instance", () => {
        expect(strategyManager).toBeInstanceOf(StrategyManager);
    });

    test("should create a new TradingEngine instance", () => {
        expect(tradingEngine).toBeInstanceOf(TradingEngine);
    });

    test("should get stock info", () => {
        const expectedTradeDate: TradeData = {
            price: 150,
            prevPrice: 145,
            sma: 140,
            stdev: 5
        };
        expect(tradingEngine.getStockInfo()).toEqual(expectedTradeDate);
    });

    test("should get positions", () => {
        const expectedPositions: Position[] = [
            {
                account: "A12345",
                contract: { symbol: "AAPL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
                position: 100,
                avgCost: 150.50
            },
            {
                account: "A12345",
                contract: { symbol: "GOOGL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
                position: 200,
                avgCost: 1220.75
            },
            {
                account: "B67890",
                contract: { symbol: "AMZN", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
                position: 50,
                avgCost: 3100.00
            },
            {
                account: "B67890",
                contract: { symbol: "TSLA", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
                position: 150,
                avgCost: 720.40
            }
        ];
        expect(tradingEngine.getPositions()).toEqual(expectedPositions);
    });

    test("should get unique order ID", () => {
        expect(tradingEngine.getUniqueOrderId()).toBe(0);
    });

    test("should find current position", () => {
        const position = tradingEngine.findCurrentPosition("AAPL");
        expect(position).toEqual({
            account: "A12345",
            contract: { symbol: "AAPL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
            position: 100,
            avgCost: 150.50
        });
    });

    test("should find current position", () => {
        const position = tradingEngine.findCurrentPosition("FAKE");
        expect(position).toBeNull();
    });
});