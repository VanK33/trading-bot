import { IStrategy, TradeAction, TradeData, StrategyManager, HoldStrategy, BuyStrategy, SellStrategy } from "../strategy_config/StrategyConfig";

describe('StrategyManager', () => {
    let strategies: IStrategy[];
    let tradeData: TradeData;
    let expected: TradeAction | null;
    let strategyManager: StrategyManager = new StrategyManager();
    let buyStrategy: BuyStrategy = new BuyStrategy();
    let sellStrategy: SellStrategy = new SellStrategy();
    let holdStrategy: HoldStrategy = new HoldStrategy();

    beforeEach(() => {
        strategyManager.registerStrategy(buyStrategy);
        strategyManager.registerStrategy(sellStrategy);
        strategyManager.registerStrategy(holdStrategy);
    });

    test("should register strategies", () => {
        expect(strategyManager['strategies']).toEqual([buyStrategy, sellStrategy, holdStrategy]);
    });

    /* -------------------------------------------------------------------------- */
    /*                           tests for holdStrategy                           */
    /* -------------------------------------------------------------------------- */

    test("HoldStrategy should return hold action when price < lowerbound", () => {
        tradeData = {
            price: 95,
            prevPrice: 95,
            sma: 105,
            stdev: 4
        };
        expected = {
            type: 'hold',
            percentage: 0,
            triggerPrice: 95
        }
        expect(holdStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("HoldStrategy should return null when price = lowerBound", () => {
        tradeData = {
            price: 95,
            prevPrice: 95,
            sma: 105,
            stdev: 5
        };
        expect(holdStrategy.evaluate(tradeData)).toEqual(null);
    });

    test("HoldStrategy should return hold action when price = prevPrice = sma", () => {
        tradeData = {
            price: 105,
            prevPrice: 105,
            sma: 105,
            stdev: 4
        };
        expected = {
            type: 'hold',
            percentage: 0,
            triggerPrice: 105
        }
        expect(holdStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("HoldStrategy should return null when price > lowerbound", () => {
        tradeData = {
            price: 105,
            prevPrice: 95,
            sma: 105,
            stdev: 4
        };
        expect(holdStrategy.evaluate(tradeData)).toBeNull();
    });

    /* -------------------------------------------------------------------------- */
    /*                            tests for buyStrategy                           */
    /* -------------------------------------------------------------------------- */


    /* --------------- tests for price between sma and sma - stdev -------------- */
    test("BuyStrategy should return null when price >> sma ", () => {
        tradeData = {
            price: 105,
            prevPrice: 110,
            sma: 100,
            stdev: 5
        };
        expect(buyStrategy.evaluate(tradeData)).toBeNull();
    });

    test("BuyStrategy should return null when price > sma", () => {
        tradeData = {
            price: 101,
            prevPrice: 110,
            sma: 100,
            stdev: 5
        };
        expect(buyStrategy.evaluate(tradeData)).toBeNull();
    });

    test("BuyStrategy should return null when price = sma", () => {
        tradeData = {
            price: 100,
            prevPrice: 110,
            sma: 100,
            stdev: 5
        };
        expect(buyStrategy.evaluate(tradeData)).toBeNull();
    });

    test("BuyStrategy should return buy 20% action when price < sma and price > sma - stdev", () => {
        tradeData = {
            price: 98,
            prevPrice: 110,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 20,
            triggerPrice: 98
        };
        expect(buyStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("BuyStrategy should return buy 20% action when price = sma - stdev", () => {
        tradeData = {
            price: 95,
            prevPrice: 110,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 20,
            triggerPrice: 95
        };
        expect(buyStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("BuyStrategy should return buy 20% action when prevPrice > sma", () => {
        tradeData = {
            price: 98,
            prevPrice: 105,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 20,
            triggerPrice: 98
        };
        expect(buyStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("BuyStrategy should return buy 20% action when prevPrice = sma", () => {
        tradeData = {
            price: 98,
            prevPrice: 100,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 20,
            triggerPrice: 98
        };
        expect(buyStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("BuyStrategy should return buy 10% action when prevPrice > price between sma and sma - stdev", () => {
        tradeData = {
            price: 96,
            prevPrice: 98,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 10,
            triggerPrice: 96
        };
        expect(buyStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("BuyStrategy should return null when prevPrice < price between sma and sma - stdev", () => {
        tradeData = {
            price: 98,
            prevPrice: 95,
            sma: 100,
            stdev: 5
        };
        expect(buyStrategy.evaluate(tradeData)).toBeNull();
    });

    test("BuyStrategy should return null when prevPrice = price between sma and sma - stdev", () => {
        tradeData = {
            price: 98,
            prevPrice: 98,
            sma: 100,
            stdev: 5
        };
        expect(buyStrategy.evaluate(tradeData)).toBeNull();
    });


    /* --------- tests for price between sma - stdev and sma - 2 * stdev -------- */

    // the condition where price = sma - stdev is covered in previous tests

    test("BuyStrategy should return buy 40% action when price < sma - stdev slightly", () => {
        tradeData = {
            price: 94,
            prevPrice: 110,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 40,
            triggerPrice: 94
        };
        expect(buyStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("BuyStrategy should return buy 40% action when price > sma - 2 * stdev slightly", () => {
        tradeData = {
            price: 91,
            prevPrice: 110,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 40,
            triggerPrice: 91
        };
        expect(buyStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("BuyStrategy should return buy 40% action when price = sma - 2 * stdev", () => {
        tradeData = {
            price: 90,
            prevPrice: 110,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 40,
            triggerPrice: 90
        };
        expect(buyStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("BuyStrategy should return buy 40% action when prevPrice > sma - stdev", () => {
        tradeData = {
            price: 94,
            prevPrice: 100,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 40,
            triggerPrice: 94
        };
        expect(buyStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("BuyStrategy should return buy 40% action when prevPrice = sma - stdev", () => {
        tradeData = {
            price: 94,
            prevPrice: 95,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 40,
            triggerPrice: 94
        };
        expect(buyStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("BuyStrategy should return buy 30% action when prevPrice > price between sma - stdev and sma - 2 * stdev", () => {
        tradeData = {
            price: 92,
            prevPrice: 94,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 30,
            triggerPrice: 92
        };
        expect(buyStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("BuyStrategy should return null when prevPrice < price between sma - stdev and sma - 2 * stdev", () => {
        tradeData = {
            price: 94,
            prevPrice: 91,
            sma: 100,
            stdev: 5
        };
        expect(buyStrategy.evaluate(tradeData)).toBeNull();
    });

    test("BuyStrategy should return null when prevPrice = price between sma - stdev and sma - 2 * stdev", () => {
        tradeData = {
            price: 92,
            prevPrice: 92,
            sma: 100,
            stdev: 5
        };
        expect(buyStrategy.evaluate(tradeData)).toBeNull();
    });


    /* ------------------ tests for price below sma - 2 * stdev ----------------- */

    // the condition where price = sma + 2* stdev is covered in previous tests
    test("BuyStrategy should return buy 70% action when price < sma - 2 * stdev", () => {
        tradeData = {
            price: 85,
            prevPrice: 110,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 70,
            triggerPrice: 85
        };
        expect(buyStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("BuyStrategy should return buy 70% action when price << sma - 2 * stdev", () => {
        tradeData = {
            price: 80,
            prevPrice: 110,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 70,
            triggerPrice: 80
        };
        expect(buyStrategy.evaluate(tradeData)).toEqual(expected);
    });

    /* -------------------------------------------------------------------------- */
    /*                           tests for sellStrategy                           */
    /* -------------------------------------------------------------------------- */

    /* --------------- tests for price between sma and sma + stdev -------------- */
    test("SellStrategy should return null when price << sma", () => {
        tradeData = {
            price: 90,
            prevPrice: 85,
            sma: 100,
            stdev: 5
        };
        expect(sellStrategy.evaluate(tradeData)).toBeNull();
    });

    test("SellStrategy should return null when price < sma", () => {
        tradeData = {
            price: 99,
            prevPrice: 85,
            sma: 100,
            stdev: 5
        };
        expect(sellStrategy.evaluate(tradeData)).toBeNull();
    });

    test("SellStrategy should return null when price = sma", () => {
        tradeData = {
            price: 100,
            prevPrice: 85,
            sma: 100,
            stdev: 5
        };
        expect(sellStrategy.evaluate(tradeData)).toBeNull();
    });

    test("SellStrategy should return sell 20% action when price > sma and price < sma + stdev", () => {
        tradeData = {
            price: 103,
            prevPrice: 95,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 20,
            triggerPrice: 103
        };
        expect(sellStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("SellStrategy should return sell 20% action when price = sma + stdev", () => {
        tradeData = {
            price: 105,
            prevPrice: 95,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 20,
            triggerPrice: 105
        };
        expect(sellStrategy.evaluate(tradeData)).toEqual(expected);
    });


    test("SellStrategy should return sell 20% when prevPrice < sma", () => {
        tradeData = {
            price: 103,
            prevPrice: 90,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 20,
            triggerPrice: 103
        };
        expect(sellStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("SellStrategy should return sell 20% when prevPrice = sma", () => {
        tradeData = {
            price: 103,
            prevPrice: 100,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 20,
            triggerPrice: 103
        };
        expect(sellStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("SellStrategy should return sell 10% action when prevPrice < price between sma and sma + stdev", () => {
        tradeData = {
            price: 103,
            prevPrice: 101,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 10,
            triggerPrice: 103
        };
        expect(sellStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("SellStrategy should return null when prevPrice > price between sma and sma + stdev", () => {
        tradeData = {
            price: 101,
            prevPrice: 103,
            sma: 100,
            stdev: 5
        };
        expect(sellStrategy.evaluate(tradeData)).toBeNull();
    });

    test("SellStrategy should return null when prevPrice = price between sma and sma + stdev", () => {
        tradeData = {
            price: 103,
            prevPrice: 103,
            sma: 100,
            stdev: 5
        };
        expect(sellStrategy.evaluate(tradeData)).toBeNull();
    });

    /* --------- tests for price between sma + stdev and sma + 2 * stdev -------- */

    // the condition where price = sma + stdev is covered in previous tests

    test("SellStrategy should return sell 40% action when price > sma + stdev slightly", () => {
        tradeData = {
            price: 106,
            prevPrice: 100,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 40,
            triggerPrice: 106
        };
        expect(sellStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("SellStrategy should return sell 40% action when price < sma + 2 * stdev slightly", () => {
        tradeData = {
            price: 109,
            prevPrice: 100,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 40,
            triggerPrice: 109
        };
        expect(sellStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("SellStrategy should return sell 40% action when price = sma + 2 * stdev", () => {
        tradeData = {
            price: 110,
            prevPrice: 100,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 40,
            triggerPrice: 110
        };
        expect(sellStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("SellStrategy should return sell 40% action when prevPrice < sma + stdev", () => {
        tradeData = {
            price: 110,
            prevPrice: 104,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 40,
            triggerPrice: 110
        };
        expect(sellStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("SellStrategy should return sell 40% action when prevPrice = sma + stdev", () => {
        tradeData = {
            price: 110,
            prevPrice: 105,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 40,
            triggerPrice: 110
        };
        expect(sellStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("SellStrategy should return sell 30% action when prevPrice < price between sma + stdev and sma + 2 * stdev", () => {
        tradeData = {
            price: 108,
            prevPrice: 106,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 30,
            triggerPrice: 108
        };
        expect(sellStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("SellStrategy should return null when prevPrice > price between sma + stdev and sma + 2 * stdev", () => {
        tradeData = {
            price: 106,
            prevPrice: 108,
            sma: 100,
            stdev: 5
        };
        expect(sellStrategy.evaluate(tradeData)).toBeNull();
    });

    test("SellStrategy should return null when prevPrice = price between sma + stdev and sma + 2 * stdev", () => {
        tradeData = {
            price: 108,
            prevPrice: 108,
            sma: 100,
            stdev: 5
        };
        expect(sellStrategy.evaluate(tradeData)).toBeNull();
    });

    /* --------------- tests for price > sma + 2 * stdev -------------- */

    // the condition where price = sma + 2* stdev is covered in previous tests
    test("SellStrategy should return sell 100% action when price > sma + 2 * stdev", () => {
        tradeData = {
            price: 116,
            prevPrice: 100,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 100,
            triggerPrice: 116
        };
        expect(sellStrategy.evaluate(tradeData)).toEqual(expected);
    });

    test("SellStrategy should return sell 100% action when price >> sma + 2 * stdev", () => {
        tradeData = {
            price: 120,
            prevPrice: 100,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 100,
            triggerPrice: 120
        };
        expect(sellStrategy.evaluate(tradeData)).toEqual(expected);
    });

    /* -------------------------------------------------------------------------- */
    /*                          tests for strategyManager                         */
    /* -------------------------------------------------------------------------- */

    test("should evaluate strategies and return sell 20% action", () => {
        tradeData = {
            price: 103,
            prevPrice: 100,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 20,
            triggerPrice: 103
        };
        const action: TradeAction | null = strategyManager.evaluateStrategies(tradeData);
        expect(action).toEqual(expected);
    });

    test("should evaluate strategies and return buy 20% action", () => {
        tradeData = {
            price: 96,
            prevPrice: 100,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'buy',
            percentage: 20,
            triggerPrice: 96
        };
        const action: TradeAction | null = strategyManager.evaluateStrategies(tradeData);
        expect(action).toEqual(expected);
    });

    test("should evaluate strategies and return hold action", () => {
        tradeData = {
            price: 100,
            prevPrice: 100,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'hold',
            percentage: 0,
            triggerPrice: 100
        };
        const action: TradeAction | null = strategyManager.evaluateStrategies(tradeData);
        expect(action).toEqual(expected);
    });

    /* ------------------------- tests for missing data ------------------------- */

    test("should evaluate strategies, when prevPrice is wrong and return null", () => {
        tradeData = {
            price: 95,
            prevPrice: NaN,
            sma: 100,
            stdev: 5
        };
        const action: TradeAction | null = strategyManager.evaluateStrategies(tradeData);
        expect(action).toBeNull();
    });

    test("should evaluate strategies, when price is wrong and return null", () => {
        tradeData = {
            price: undefined,
            prevPrice: 95,
            sma: 100,
            stdev: 5
        };
        const action: TradeAction | null = strategyManager.evaluateStrategies(tradeData);
        expect(action).toBeNull();
    });

    /* ------------------------ tests for extreme prices ------------------------ */

    test("should evaluate strategies for extreme high prices - REPORT FOR ERROR", () => {
        tradeData = {
            price: 1000,
            prevPrice: 500,
            sma: 300,
            stdev: 50
        };
        const action: TradeAction | null = strategyManager.evaluateStrategies(tradeData);
        expect(action).toBeNull();
    });

    // 未来要考虑是否亏损继续购入
    test("should evaluate strategies for extreme low prices - REPORT FOR ERROR", () => {
        tradeData = {
            price: 10,
            prevPrice: 50,
            sma: 300,
            stdev: 50
        };
        expected = {
            type: 'hold',
            percentage: 0,
            triggerPrice: 10
        };
        const action: TradeAction | null = strategyManager.evaluateStrategies(tradeData);
        expect(action).toEqual(expected);
    });

    /* --------------------- tests for extreme fluctuations --------------------- */
    test("should evaluate strategies for extreme upward fluctuations - REPORT FOR ERROR", () => {
        tradeData = {
            price: 1000,
            prevPrice: 10,
            sma: 300,
            stdev: 50
        };
        expected = {
            type: 'sell',
            percentage: 100,
            triggerPrice: 1000
        };
        const action: TradeAction | null = strategyManager.evaluateStrategies(tradeData);
        expect(action).toEqual(expected);
    });

    test("should evaluate strategies for extreme downward fluctuations - REPORT FOR ERROR", () => {
        tradeData = {
            price: 10,
            prevPrice: 1000,
            sma: 300,
            stdev: 50
        };
        expected = {
            type: 'buy',
            percentage: 70,
            triggerPrice: 10
        };
        const action: TradeAction | null = strategyManager.evaluateStrategies(tradeData);
        expect(action).toEqual(expected);
    });

    /* ------------------ test when multiple conditions are met ----------------- */
    test("should evaluate strategies when multiple conditions are met", () => {
        tradeData = {
            price: 105,
            prevPrice: 100,
            sma: 100,
            stdev: 5
        };
        expected = {
            type: 'sell',
            percentage: 20,
            triggerPrice: 105
        };
        const action: TradeAction | null = strategyManager.evaluateStrategies(tradeData);
        expect(action).toEqual(expected);
    });
});
