export interface IStrategy {
    evaluate(data: TradeData): TradeAction | null;
}

export interface TradeAction {
    type: 'buy' | 'sell' | 'hold';
    percentage: number;
    triggerPrice: number;
}

export interface TradeData {
    price: number | undefined;
    prevPrice: number | undefined;
    sma: number;
    stdev: number;
}

export class StrategyManager {
    private strategies: IStrategy[];

    constructor() {
        this.strategies = [];
    }

    registerStrategy(strategy: IStrategy): void {
        this.strategies.push(strategy);
    }

    evaluateStrategies(data: TradeData): TradeAction | null {
        for (const strategy of this.strategies) {
            const action = strategy.evaluate(data);
            if (action) {
                return action;
            }
        }
        return null;
    }
}


export class BuyStrategy implements IStrategy {
    evaluate(data: TradeData): TradeAction | null {
        const lowerBound = data.sma - 2 * data.stdev;
        const midBound = data.sma - data.stdev;

        if (data.price && data.prevPrice) {
            // 判断价格在中轴和1个标准差之间，并且价格从上往下跨越中轴
            if (data.price < data.sma && data.price >= midBound && data.prevPrice >= data.sma) {
                return {
                    type: 'buy',
                    percentage: 20,
                    triggerPrice: data.price
                };
            }

            // 如果价格和前价都在SMA和SMA-1std之间，并且价格下跌
            if (data.price < data.sma && data.price >= midBound && data.prevPrice < data.sma && data.prevPrice >= midBound && data.prevPrice > data.price) {
                return {
                    type: 'buy',
                    percentage: 10,
                    triggerPrice: data.price
                };
            }

            // 判断价格低于1个标准差
            if (data.price < midBound && data.price >= lowerBound && data.prevPrice >= midBound) {
                return {
                    type: 'buy',
                    percentage: 40,
                    triggerPrice: data.price
                };
            }

            // 如果价格和前价都在SMA-1std和SMA-2std之间，并且价格下跌
            if (data.price < midBound && data.price >= lowerBound && data.prevPrice < midBound && data.prevPrice >= lowerBound && data.prevPrice > data.price) {
                return {
                    type: 'buy',
                    percentage: 30,
                    triggerPrice: data.price
                };
            }

            // 判断价格低于2个标准差
            if (data.price < lowerBound && data.prevPrice > lowerBound) {
                return {
                    type: 'buy',
                    percentage: 70,
                    triggerPrice: data.price
                };
            }
            return null;
        } else {
            return null;
        }
    }
}

export class SellStrategy implements IStrategy {
    evaluate(data: TradeData): TradeAction | null {
        const upperBound = data.sma + 2 * data.stdev;
        const midBound = data.sma + data.stdev;

        if (data.price && data.prevPrice) {
            // 判断价格在中轴和1个标准差之间
            if (data.price > data.sma && data.price <= midBound && data.prevPrice <= data.sma) {
                return {
                    type: 'sell',
                    percentage: 20,
                    triggerPrice: data.price
                };
            }

            // 如果价格和前价都在SMA和SMA+1std之间，并且价格上涨
            if (data.price > data.sma && data.price <= midBound && data.prevPrice > data.sma && data.prevPrice <= midBound && data.prevPrice < data.price) {
                return {
                    type: 'sell',
                    percentage: 10,
                    triggerPrice: data.price
                };
            }

            // 判断价格高于1个标准差
            if (data.price > midBound && data.price <= upperBound && data.prevPrice <= midBound) {
                return {
                    type: 'sell',
                    percentage: 40,
                    triggerPrice: data.price
                };
            }

            // 如果价格和前价都在SMA+1std和SMA+2std之间，并且价格上涨
            if (data.price > midBound && data.price <= upperBound && data.prevPrice > midBound && data.prevPrice <= upperBound && data.prevPrice < data.price) {
                return {
                    type: 'sell',
                    percentage: 30,
                    triggerPrice: data.price
                };
            }

            // 判断价格超过2个标准差
            if (data.price > upperBound && data.prevPrice <= upperBound) {
                return {
                    type: 'sell',
                    percentage: 100,
                    triggerPrice: data.price
                };
            }
            return null;
        } else {
            return null;
        }
    };
}

export class HoldStrategy implements IStrategy {
    evaluate(data: TradeData): TradeAction | null {
        const lowerBound = data.sma - 2 * data.stdev;

        if (data.price && data.prevPrice) {
            // 当价格低于下轨，决定持有
            if (data.price < lowerBound) {
                return {
                    type: 'hold',
                    percentage: 0,
                    triggerPrice: data.price
                };
            }

            if (data.price === data.prevPrice && data.price === data.sma && data.prevPrice === data.sma) {
                return {
                    type: 'hold',
                    percentage: 0,
                    triggerPrice: data.price
                };
            }
            return null;
        } else {
            return null;
        }
    }
}