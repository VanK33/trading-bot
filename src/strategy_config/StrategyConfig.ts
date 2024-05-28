interface IStrategy {
    evaluate(data: TradeData): TradeAction | null;
}

interface TradeAction {
    type: 'buy' | 'sell' | 'hold';
    percentage?: number;
    triggerPrice: number;
}

interface TradeData {
    price: number;
    prevPrice: number;
    sma: number;
    stdev: number;
}

class buyStrategy implements IStrategy {
    evaluate(data: TradeData): TradeAction | null {
        const lowerBound = data.sma - 2 * data.stdev;

        // 判断从下轨向上突破但未超过中轴
        if (data.price > lowerBound && data.price < data.sma && data.prevPrice <= lowerBound) {
            return {
                type: 'buy',
                percentage: 10,
                triggerPrice: data.price
            };
        }

        // 判断从中轴向下跌，未超过下轨
        if (data.price < data.sma && data.price > lowerBound && data.prevPrice >= data.sma) {
            return {
                type: 'buy',
                percentage: 20,
                triggerPrice: data.price
            };
        }
        return null;
    }
}

class sellStrategy implements IStrategy {
    evaluate(data: TradeData): TradeAction | null {
        const upperBound = data.sma + 2 * data.stdev;

        // 判断价格在中轴和1个标准差之间
        if (data.price > data.sma && data.price < (data.sma + data.stdev) && data.prevPrice <= data.sma) {
            return {
                type: 'sell',
                percentage: 20,
                triggerPrice: data.price
            };
        }

        // 判断价格高于1个标准差
        if (data.price > (data.sma + data.stdev) && data.price < upperBound && data.prevPrice <= (data.sma + data.stdev)) {
            return {
                type: 'sell',
                percentage: 40,
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
    }
}

class HoldStrategy implements IStrategy {
    evaluate(data: TradeData): TradeAction | null {
        const lowerBound = data.sma - 2 * data.stdev;

        // 当价格低于下轨，决定持有
        if (data.price < lowerBound) {
            return {
                type: 'hold',
                triggerPrice: data.price
            };
        }
        return null;
    }
}