import { CircularArray, DataManager, MarketDataParams } from "../data_management/DataManager";
import { Contract, IBApi } from "@stoqey/ib";

jest.mock("@stoqey/ib", () => {
    return {
        IBApi: jest.fn().mockImplementation(() => {
            return {
                connect: jest.fn(),
                disconnect: jest.fn(),
                reqAccountUpdates: jest.fn(),
                reqMktData: jest.fn(),
                on: jest.fn()
            };
        }),
        EventName: {
            connected: "connected",
            updatePortfolio: "updatePortfolio",
            updateAccountValue: "updateAccountValue",
            nextValidId: "123"
        }
    };
});

describe("DataManager", () => {
    let ibMock: IBApi;
    let dataManager: DataManager;
    let testContract = { symbol: "AAPL", secType: "STK", exchange: "NASDAQ", currency: "USD" }

    beforeEach(() => {
        ibMock = new IBApi();
        const marketDataParams: MarketDataParams = { reqId: 1, ...testContract };
        dataManager = new DataManager(ibMock, marketDataParams, 1000);
    });

    test("should create a new DataManager instance", () => {
        expect(dataManager).toBeInstanceOf(DataManager);
    });

    test("should get initial capital", () => {
        expect(dataManager.getInitialCapital()).toBe(1000);
    });

    test("should update next valid order ID", () => {
        const orderId = 0;
        dataManager.handleNextValidId(orderId);
        expect(dataManager.getNextValidId()).toBe(orderId);
    });

    test("should add or update position", () => {
        dataManager.handlePositionStatus("DU123456", testContract as Contract, 100, 120);
        expect(dataManager.getPositions()).toEqual([{ account: "DU123456", contract: testContract, position: 100, avgCost: 120 }]);
    });

    test("should end position updates", () => {
        console.log = jest.fn();
        dataManager.handlePositionEnd();
        expect(console.log).toHaveBeenCalledWith("Position updates completed");
    });

    test("should fetch market data", () => {
        dataManager.fetchMarketData(1);
        expect(ibMock.reqMktData).toHaveBeenCalledWith(1, testContract, "", false, false);
    });

    test("should update stock price and previous price when field is 4", () => {
        dataManager.handlePriceUpdate(1, 4, 100, {});
        expect(dataManager.getStockPrice()).toBe(100);
        expect(dataManager.getPrevPrice()).toBe(0);
    });

    test("should update previous price when field is 4", () => {
        dataManager.handlePriceUpdate(1, 4, 100, {});
        expect(dataManager.getPrevPrice()).toBe(0);
        expect(dataManager.getStockPrice()).toBe(100);
        // Update price again to check for getting previous price
        dataManager.handlePriceUpdate(1, 4, 105, {});
        expect(dataManager.getPrevPrice()).toBe(100);
        expect(dataManager.getStockPrice()).toBe(105);
    });

    test("should not update previous price when field is not 4", () => {

        dataManager.handlePriceUpdate(1, 3, 100, {});
        expect(dataManager.getPrevPrice()).toBe(0);
        expect(dataManager.getStockPrice()).toBe(0);

        dataManager.handlePriceUpdate(1, 5, 100, {});
        expect(dataManager.getPrevPrice()).toBe(0);
        expect(dataManager.getStockPrice()).toBe(0);

        dataManager.handlePriceUpdate(1, 40, 100, {});
        expect(dataManager.getPrevPrice()).toBe(0);
        expect(dataManager.getStockPrice()).toBe(0);

        dataManager.handlePriceUpdate(1, 9, 100, {});
        expect(dataManager.getPrevPrice()).toBe(0);
        expect(dataManager.getStockPrice()).toBe(0);
    });

    test("should update last day close when field is 9", () => {
        dataManager.handlePriceUpdate(1, 9, 95, {});
        expect(dataManager.getLastDayClose()).toBe(95);
    });

    test("should not update last day close when field is not 9", () => {
        dataManager.handlePriceUpdate(1, 4, 100, {});
        expect(dataManager.getLastDayClose()).toBe(0);

        dataManager.handlePriceUpdate(1, 6, 100, {});
        expect(dataManager.getLastDayClose()).toBe(0);

        dataManager.handlePriceUpdate(1, 8, 100, {});
        expect(dataManager.getLastDayClose()).toBe(0);

        dataManager.handlePriceUpdate(1, 10, 100, {});
        expect(dataManager.getLastDayClose()).toBe(0);

        dataManager.handlePriceUpdate(1, 40, 100, {});
        expect(dataManager.getLastDayClose()).toBe(0);
    });

    test("should update close price and calculate SMA and stdev", () => {
        dataManager.updateClosePrice(100);
        expect(dataManager.get20DaySMA()).toBe(100);
        expect(dataManager.get20DayStdDev()).toBe(0);
    });

    test("should update SMA20 and stdev20 based on added prices", () => {
        dataManager.updateClosePrice(100);
        dataManager.updateClosePrice(200);
        dataManager.updateClosePrice(300);
        dataManager.updateClosePrice(400);
        dataManager.updateClosePrice(500);

        expect(dataManager.get20DaySMA()).toBe(300);
        expect(dataManager.get20DayStdDev()).toBeCloseTo(158.11, 2);
    })
});