import { IBApi, SecType } from '@stoqey/ib';
import { DataManager, Position, MarketDataParams } from '../data_management/DataManager';
import { TradeData, StrategyManager, TradeAction } from '../strategy_config/StrategyConfig';
import { TradingEngine } from '../trading_engine/TradingEngine';
import { after } from 'node:test';



describe("TradingEngine", () => {
    let ibMock: IBApi;
    let dataManager: DataManager;
    let tradingEngine: TradingEngine;
    let strategyManager: StrategyManager;
    let testContract = { symbol: "AAPL", secType: "STK", exchange: "NASDAQ", currency: "USD" }
    let mockData: TradeData;
    let consoleSpy: jest.SpyInstance;

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
        jest.spyOn(dataManager, 'getStockPrice').mockReturnValue(100);
        jest.spyOn(dataManager, 'getPrevPrice').mockReturnValue(95);
        jest.spyOn(dataManager, 'get20DaySMA').mockReturnValue(98);
        jest.spyOn(dataManager, 'get20DayStdDev').mockReturnValue(2);
        jest.spyOn(dataManager, 'getPositions').mockReturnValue(positions);
        jest.spyOn(dataManager, 'getNextValidId').mockReturnValue(0);
        jest.spyOn(dataManager, 'getCurrentCapital').mockReturnValue(10000);

        strategyManager = new StrategyManager();
        jest.spyOn(strategyManager, 'evaluateStrategies').mockReturnValue({ type: 'sell', percentage: 20, triggerPrice: 100 });
        jest.spyOn(tradingEngine, 'executeSell');
        jest.spyOn(tradingEngine, 'executeBuy');
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
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
            price: 100,
            prevPrice: 95,
            sma: 98,
            stdev: 2
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

    /* -------------------------------------------------------------------------- */
    /*                          tests for creating order                          */
    /* -------------------------------------------------------------------------- */

    test("should create buy order", () => {
        const action: TradeAction = {
            type: 'buy',
            percentage: 100,
            triggerPrice: 150
        };
        const order = tradingEngine.createOrder(action, 6);
        expect(order).toEqual({
            orderId: 0,
            clientId: 0,
            action: "BUY",
            totalQuantity: 66,
            orderType: "MKT",
            tif: "DAY",
            transmit: true,
            outsideRth: false,
            account: "DU123456"
        });
    });

    test("should create buy order", () => {
        const action: TradeAction = {
            type: 'sell',
            percentage: 70,
            triggerPrice: 150
        };
        const order = tradingEngine.createOrder(action, 6);
        expect(order).toEqual({
            orderId: 0,
            clientId: 0,
            action: "SELL",
            totalQuantity: 4,
            orderType: "MKT",
            tif: "DAY",
            transmit: true,
            outsideRth: false,
            account: "DU123456"
        });
    });

    /* -------------------------------------------------------------------------- */
    /*                   tests for implementation of strategies                   */
    /* -------------------------------------------------------------------------- */

    test('should evaluate strategies correctly', () => {
        mockData = {
            price: 100,
            prevPrice: 95,
            sma: 98,
            stdev: 2
        };
        jest.spyOn(tradingEngine, 'getStockInfo').mockReturnValue(mockData);

        const expectedAction = { type: 'sell', percentage: 20, triggerPrice: 100 };
        const action = tradingEngine.evaluateStrategies();
        expect(action).toEqual(expectedAction);
        expect(tradingEngine.getStockInfo).toHaveBeenCalled();
    });

    test('should execute sell action correctly', () => {
        const action: TradeAction = { type: 'sell', percentage: 20, triggerPrice: 100 };
        tradingEngine.executeTrade(action);
        expect(tradingEngine.executeSell).toHaveBeenCalled();
    });

    test('should execute buy action correctly', () => {
        const action: TradeAction = { type: 'buy', percentage: 20, triggerPrice: 100 };
        tradingEngine.executeTrade(action);
        expect(tradingEngine.executeBuy).toHaveBeenCalled();
    });

    test('should log "Holding position" when action type is hold', () => {
        const action: TradeAction = { type: 'hold', percentage: 0, triggerPrice: 100 };
        tradingEngine.executeTrade(action);
        expect(console.log).toHaveBeenCalledWith('Holding position');
    });

});