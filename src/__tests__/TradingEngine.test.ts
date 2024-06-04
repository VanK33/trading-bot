import { IBApi, Order, OrderAction, OrderType, SecType } from '@stoqey/ib';
import { DataManager, Position, MarketDataParams } from '../datamanagement/DataManager';
import { TradeData, StrategyManager, TradeAction } from '../strategyconfig/StrategyConfig';
import { TradingEngine } from '../tradingengine/TradingEngine';


describe("TradingEngine", () => {
    let ibMock: IBApi;
    let dataManager: DataManager;
    let tradingEngine: TradingEngine;
    let strategyManager: StrategyManager;
    let testContract = { symbol: "AAPL", secType: "STK", exchange: "NASDAQ", currency: "USD" }
    let mockData: TradeData;
    let consoleSpy: jest.SpyInstance;
    let accountID = "DU123456"

    beforeEach(() => {
        ibMock = new IBApi();
        const marketDataParams: MarketDataParams = { reqId: 1, ...testContract };

        const positions: Position[] = [
            {
                account: "A12345",
                contract: { symbol: "AAPL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
                position: 100,
                avgCost: 150.50
            },
            {
                account: "DU123456",
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

        tradingEngine = new TradingEngine(dataManager, strategyManager, marketDataParams, ibMock, accountID);
        dataManager.on("priceUpdate", tradingEngine.handlePriceProcess.bind(tradingEngine));
        jest.spyOn(tradingEngine, "handlePriceProcess").mockImplementation();
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
                account: "DU123456",
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
        const position = tradingEngine.findCurrentPosition("AAPL", accountID);
        expect(position).toEqual({
            account: "DU123456",
            contract: { symbol: "AAPL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
            position: 100,
            avgCost: 150.50
        });
    });

    test("should return null if id is correct but position does not exist", () => {
        const position = tradingEngine.findCurrentPosition("FAKE", accountID);
        expect(position).toBeNull();
    });

    test("should return null if position exists but not in the same accountID", () => {
        const position = tradingEngine.findCurrentPosition("AAPL", "FAKE");
        expect(position).toBeNull();
    });

    test("should find current position", () => {
        const position = tradingEngine.findCurrentPosition("FAKE", accountID);
        expect(position).toBeNull();
    });

    test("should called handlePriceProcess when price is updated", () => {
        // tradingEngine.handlePriceProcess();
        dataManager.emit('priceUpdate');
        expect(consoleSpy).toHaveBeenCalledWith('Handling price process');
        expect(tradingEngine.handlePriceProcess).toHaveBeenCalled();
    });

    test("should executeTrade if action is present", () => {
        const action: TradeAction = { type: 'sell', percentage: 20, triggerPrice: 100 };
        const trade = tradingEngine.executeTrade(action);
        expect(trade).toHaveBeenCalled();
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

    /* -------------------- tests for executeBuy specifically ------------------- */
    test('executeBuy shgould place an order correctly when no position exists', () => {
        const mockReturn = null;
        jest.spyOn(tradingEngine, 'findCurrentPosition').mockReturnValue(mockReturn);
        // currentCapital = 10000, percentage = 20, triggerPrice = 100, quantityToBuy = 20
        const mockOrder: Order = {
            orderId: 0,
            clientId: 0,
            action: "BUY" as OrderAction,
            totalQuantity: 20,
            orderType: OrderType.MKT,
            tif: "DAY",
            transmit: true,
            outsideRth: false,
            account: "DU123456"
        }
        jest.spyOn(tradingEngine, 'createOrder').mockReturnValue(mockOrder);
        jest.spyOn(ibMock, 'placeOrder').mockImplementation();


        const action: TradeAction = { type: 'buy', percentage: 20, triggerPrice: 100 };
        tradingEngine.executeBuy(action);
        expect(tradingEngine.createOrder).toHaveBeenCalledWith(action, 20);
        expect(ibMock.placeOrder).toHaveBeenCalledWith(0, testContract, tradingEngine.createOrder(action, 20));
    });

    test('executeBuy shgould place an order correctly when position exists', () => {
        const mockReturn = {
            account: "A12345",
            contract: { symbol: "AAPL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
            position: 100,
            avgCost: 150.50
        };
        // currentCapital = 10000, percentage = 20, triggerPrice = 100, quantityToBuy = 20
        jest.spyOn(tradingEngine, 'findCurrentPosition').mockReturnValue(mockReturn);

        const mockOrder: Order = {
            orderId: 0,
            clientId: 0,
            action: "BUY" as OrderAction,
            totalQuantity: 20,
            orderType: OrderType.MKT,
            tif: "DAY",
            transmit: true,
            outsideRth: false,
            account: "DU123456"
        }
        jest.spyOn(tradingEngine, 'createOrder').mockReturnValue(mockOrder);
        jest.spyOn(ibMock, 'placeOrder').mockImplementation();

        const action: TradeAction = { type: 'buy', percentage: 20, triggerPrice: 100 };
        tradingEngine.executeBuy(action);
        expect(tradingEngine.createOrder).toHaveBeenCalledWith(action, 20);
        expect(ibMock.placeOrder).toHaveBeenCalledWith(0, mockReturn.contract, tradingEngine.createOrder(action, 20));
    });

    test('executeBuy should not place an order when capital is not enough to buy a single', () => {
        const mockReturn = null;
        jest.spyOn(tradingEngine, 'findCurrentPosition').mockReturnValue(mockReturn);
        const action: TradeAction = { type: 'buy', percentage: 20, triggerPrice: 2001 };
        tradingEngine.executeBuy(action);
        expect(consoleSpy).toHaveBeenCalledWith('Not enough capital to buy');
        consoleSpy.mockRestore();
    });

    test('executeBuy should place an order when capital is just enough to buy a single', () => {
        const mockReturn = null;
        jest.spyOn(tradingEngine, 'findCurrentPosition').mockReturnValue(mockReturn);
        // currentCapital = 10000, percentage = 20, triggerPrice = 2000, quantityToBuy = 1
        const mockOrder: Order = {
            orderId: 0,
            clientId: 0,
            action: "BUY" as OrderAction,
            totalQuantity: 20,
            orderType: OrderType.MKT,
            tif: "DAY",
            transmit: true,
            outsideRth: false,
            account: "DU123456"
        }
        jest.spyOn(tradingEngine, 'createOrder').mockReturnValue(mockOrder);
        jest.spyOn(ibMock, 'placeOrder').mockImplementation();


        const action: TradeAction = { type: 'buy', percentage: 20, triggerPrice: 2000 };
        tradingEngine.executeBuy(action);
        expect(tradingEngine.createOrder).toHaveBeenCalledWith(action, 1);
        expect(ibMock.placeOrder).toHaveBeenCalledWith(0, testContract, tradingEngine.createOrder(action, 1));
        consoleSpy.mockRestore();
    });

    test('executeBuy should place an order when capital is just enough to buy a single with slightly capital left', () => {
        const mockReturn = null;
        jest.spyOn(tradingEngine, 'findCurrentPosition').mockReturnValue(mockReturn);
        // currentCapital = 10000, percentage = 20, triggerPrice = 2000, quantityToBuy = 1
        const mockOrder: Order = {
            orderId: 0,
            clientId: 0,
            action: "BUY" as OrderAction,
            totalQuantity: 20,
            orderType: OrderType.MKT,
            tif: "DAY",
            transmit: true,
            outsideRth: false,
            account: "DU123456"
        }
        jest.spyOn(tradingEngine, 'createOrder').mockReturnValue(mockOrder);
        jest.spyOn(ibMock, 'placeOrder').mockImplementation();


        const action: TradeAction = { type: 'buy', percentage: 20, triggerPrice: 1999 };
        tradingEngine.executeBuy(action);
        expect(tradingEngine.createOrder).toHaveBeenCalledWith(action, 1);
        expect(ibMock.placeOrder).toHaveBeenCalledWith(0, testContract, tradingEngine.createOrder(action, 1));
        consoleSpy.mockRestore();
    });

    test('executeBuy handles errors gracefully when ib.placeOrder fails', () => {
        const mockReturn = {
            account: "A12345",
            contract: { symbol: "AAPL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
            position: 100,
            avgCost: 150.50
        };
        // currentCapital = 10000, percentage = 20, triggerPrice = 100, quantityToBuy = 20
        jest.spyOn(tradingEngine, 'findCurrentPosition').mockReturnValue(mockReturn);
        const action: TradeAction = { type: 'buy', percentage: 20, triggerPrice: 100 };
        const mockError = new Error('Failed to place order');

        // Mock the placeOrder to throw an error
        jest.spyOn(ibMock, 'placeOrder').mockImplementation(() => {
            throw mockError;
        });

        // Optionally, spy on console.log if you expect to log the error
        const consoleSpy = jest.spyOn(console, 'log');

        tradingEngine.executeBuy(action);

        // Check that the error was logged
        expect(consoleSpy).toHaveBeenCalledWith('Error in placing order:', mockError);
    });

    test('executeBuy can heanlde repeated calls without side effects', () => {
        const mockReturn = {
            account: "A12345",
            contract: { symbol: "AAPL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
            position: 100,
            avgCost: 150.50
        };

        jest.spyOn(tradingEngine, 'findCurrentPosition').mockReturnValue(mockReturn);
        const mockOrder: Order = {
            orderId: 0,
            clientId: 0,
            action: "BUY" as OrderAction,
            totalQuantity: 20,
            orderType: OrderType.MKT,
            tif: "DAY",
            transmit: true,
            outsideRth: false,
            account: "DU123456"
        }
        jest.spyOn(tradingEngine, 'createOrder').mockReturnValue(mockOrder);
        jest.spyOn(ibMock, 'placeOrder').mockImplementation();

        const action: TradeAction = { type: 'buy', percentage: 20, triggerPrice: 100 };

        tradingEngine.executeBuy(action);
        tradingEngine.executeBuy(action);
        tradingEngine.executeBuy(action);

        expect(tradingEngine.createOrder).toHaveBeenCalledTimes(3);
        expect(ibMock.placeOrder).toHaveBeenCalledTimes(3);
        expect(ibMock.placeOrder).toHaveBeenCalledWith(0, mockReturn.contract, tradingEngine.createOrder(action, 20));
    });


    /* ------------------- tests for executeSell specifically ------------------- */
    test('executeSell should place an order correctly when position does not exist ', () => {
        const mockReturn = null;
        jest.spyOn(tradingEngine, 'findCurrentPosition').mockReturnValue(mockReturn);

        const action: TradeAction = { type: 'sell', percentage: 45, triggerPrice: 100 };
        tradingEngine.executeSell(action);

        expect(consoleSpy).toHaveBeenCalledWith('No position to sell')
        consoleSpy.mockRestore();
    });

    test('executeSell should place an order correctly when position exists ', () => {
        const mockReturn = {
            account: "A12345",
            contract: { symbol: "AAPL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
            position: 100,
            avgCost: 150.50
        };
        jest.spyOn(tradingEngine, 'findCurrentPosition').mockReturnValue(mockReturn);
        // currentPosition = 100, percentage = 45, quantityToSell = 45
        const mockOrder: Order = {
            orderId: 0,
            clientId: 0,
            action: "SELL" as OrderAction,
            totalQuantity: 45,
            orderType: OrderType.MKT,
            tif: "DAY",
            transmit: true,
            outsideRth: false,
            account: "DU123456"
        };

        jest.spyOn(tradingEngine, 'createOrder').mockReturnValue(mockOrder);
        jest.spyOn(ibMock, 'placeOrder').mockImplementation();

        const action: TradeAction = { type: 'sell', percentage: 45, triggerPrice: 100 };
        tradingEngine.executeSell(action);
        expect(tradingEngine.createOrder).toHaveBeenCalledWith(action, 45);
        expect(ibMock.placeOrder).toHaveBeenCalledWith(0, testContract, tradingEngine.createOrder(action, 45));
    });

    // TODO: Edge cases for executeSell
    test('executeBuy handles errors gracefully when ib.placeOrder fails', () => {
        const mockReturn = {
            account: "A12345",
            contract: { symbol: "AAPL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
            position: 100,
            avgCost: 150.50
        };
        // currentCapital = 10000, percentage = 20, triggerPrice = 100, quantityToBuy = 20
        jest.spyOn(tradingEngine, 'findCurrentPosition').mockReturnValue(mockReturn);
        const action: TradeAction = { type: 'sell', percentage: 20, triggerPrice: 100 };
        const mockError = new Error('Failed to place order');

        // Mock the placeOrder to throw an error
        jest.spyOn(ibMock, 'placeOrder').mockImplementation(() => {
            throw mockError;
        });

        // Optionally, spy on console.log if you expect to log the error
        const consoleSpy = jest.spyOn(console, 'log');

        tradingEngine.executeSell(action);

        // Check that the error was logged
        expect(consoleSpy).toHaveBeenCalledWith('Error in placing order:', mockError);
    });

    test('executeBuy can heanlde repeated calls without side effects', () => {
        const mockReturn = {
            account: "A12345",
            contract: { symbol: "AAPL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
            position: 100,
            avgCost: 150.50
        };

        jest.spyOn(tradingEngine, 'findCurrentPosition').mockReturnValue(mockReturn);
        const mockOrder: Order = {
            orderId: 0,
            clientId: 0,
            action: "SELL" as OrderAction,
            totalQuantity: 20,
            orderType: OrderType.MKT,
            tif: "DAY",
            transmit: true,
            outsideRth: false,
            account: "DU123456"
        }
        jest.spyOn(tradingEngine, 'createOrder').mockReturnValue(mockOrder);
        jest.spyOn(ibMock, 'placeOrder').mockImplementation();

        const action: TradeAction = { type: 'sell', percentage: 20, triggerPrice: 100 };

        tradingEngine.executeSell(action);
        tradingEngine.executeSell(action);
        tradingEngine.executeSell(action);

        expect(tradingEngine.createOrder).toHaveBeenCalledTimes(3);
        expect(ibMock.placeOrder).toHaveBeenCalledTimes(3);
        expect(ibMock.placeOrder).toHaveBeenCalledWith(0, mockReturn.contract, tradingEngine.createOrder(action, 20));
    });

    test('executeSell should not place an order when quantity to sell is 0', () => {
        const mockReturn = {
            account: "A12345",
            contract: { symbol: "AAPL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
            position: 100,
            avgCost: 150.50
        };
        jest.spyOn(tradingEngine, 'findCurrentPosition').mockReturnValue(mockReturn);

        const action: TradeAction = { type: 'sell', percentage: 0, triggerPrice: 100 };
        tradingEngine.executeSell(action);

        expect(consoleSpy).toHaveBeenCalledWith('Not enough quantity to sell')
        consoleSpy.mockRestore();
    });

    test('executeSell should place an order to sell all positions when percentage is 100', () => {
        const mockReturn = {
            account: "A12345",
            contract: { symbol: "AAPL", secType: "STK" as SecType, currency: "USD", exchange: "NASDAQ" },
            position: 100,
            avgCost: 150.50
        };
        jest.spyOn(tradingEngine, 'findCurrentPosition').mockReturnValue(mockReturn);
        // currentPosition = 100, percentage = 100, quantityToSell = 100
        const mockOrder: Order = {
            orderId: 0,
            clientId: 0,
            action: "SELL" as OrderAction,
            totalQuantity: 100,
            orderType: OrderType.MKT,
            tif: "DAY",
            transmit: true,
            outsideRth: false,
            account: "DU123456"
        };

        jest.spyOn(tradingEngine, 'createOrder').mockReturnValue(mockOrder);
        jest.spyOn(ibMock, 'placeOrder').mockImplementation();

        const action: TradeAction = { type: 'sell', percentage: 100, triggerPrice: 100 };
        tradingEngine.executeSell(action);
        expect(tradingEngine.createOrder).toHaveBeenCalledWith(action, 100);
        expect(ibMock.placeOrder).toHaveBeenCalledWith(0, testContract, tradingEngine.createOrder(action, 100));
    });

});