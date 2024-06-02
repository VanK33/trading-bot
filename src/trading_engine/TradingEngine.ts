import { IBApi, Order, OrderAction, OrderType, TimeInForce, SecType } from '@stoqey/ib';
import { DataManager, Position, MarketDataParams } from '../data_management/DataManager';
import { TradeData, StrategyManager, TradeAction } from '../strategy_config/StrategyConfig';


export class TradingEngine {
    private dataManager: DataManager;
    private strategyManager: StrategyManager;
    private stockSymbol: string;
    private ib: IBApi;
    private accountID: string;
    private marketDataParams: MarketDataParams;

    constructor(dataManager: DataManager, strategyManager: StrategyManager, marketDataParams: MarketDataParams, ib: IBApi, accountID: string) {
        this.ib = ib;
        this.dataManager = dataManager;
        this.strategyManager = strategyManager;
        this.stockSymbol = marketDataParams.symbol;
        this.accountID = accountID;
        this.marketDataParams = marketDataParams;
    }

    /* -------------------------------------------------------------------------- */
    /*       get data from DataManager and evaluate from StrategyConfig           */
    /* -------------------------------------------------------------------------- */

    getStockInfo(): TradeData {
        const stockPrice = this.dataManager.getStockPrice();
        const prevPrice = this.dataManager.getPrevPrice();
        const SMA20 = this.dataManager.get20DaySMA();
        const stdDev20 = this.dataManager.get20DayStdDev();

        const tradeData: TradeData = {
            price: stockPrice,
            prevPrice: prevPrice,
            sma: SMA20,
            stdev: stdDev20
        };

        return tradeData;
    }

    getPositions(): Position[] {
        return this.dataManager.getPositions();
    }

    getUniqueOrderId(): number {
        return this.dataManager.getNextValidId();
    }

    /* -------------------------------------------------------------------------- */
    /*            checking and find the stock in the current positions            */
    /* -------------------------------------------------------------------------- */

    findCurrentPosition(symbol: string): Position | null {
        const positions = this.dataManager.getPositions();
        const position = positions.find(p => p.contract.symbol === symbol && p.position !== 0);
        return position ? position : null;
    }

    /* -------------------------------------------------------------------------- */
    /*                                create order                                */
    /* -------------------------------------------------------------------------- */

    createOrder(action: TradeAction, currentPosition: number): Order {
        const order: Order = {
            orderId: this.dataManager.getNextValidId(),
            clientId: 0,
            action: action.type.toUpperCase() as OrderAction,
            totalQuantity: action.type.toUpperCase() === "BUY"
                ? Math.floor((this.dataManager.getCurrentCapital() * action.percentage) / 100 / action.triggerPrice)
                : Math.floor(currentPosition * (action.percentage / 100)),
            orderType: OrderType.MKT,
            tif: TimeInForce.DAY,
            transmit: true,
            outsideRth: false,
            account: this.accountID
        };

        return order;
    }


    /* -------------------------------------------------------------------------- */
    /*               implementing buying/selling/holding strategies               */
    /* -------------------------------------------------------------------------- */


    evaluateStrategies(): TradeAction | null {
        const tradeData = this.getStockInfo();
        const action = this.strategyManager.evaluateStrategies(tradeData);
        return action;
    }

    executeTrade(action: TradeAction): void {
        switch (action.type) {
            case 'buy':
                this.executeBuy(action);
                break;
            case 'sell':
                this.executeSell(action);
                break;
            case 'hold':
                console.log('Holding position');
                break;
        }
    }

    executeBuy(action: TradeAction): void {
        console.log(`Buying ${action.percentage}% at price ${action.triggerPrice}`);
        const id = this.getUniqueOrderId();
        const hasPosition = this.findCurrentPosition(this.stockSymbol);

        const capitalAvailable = this.dataManager.getCurrentCapital();
        const quantityToBuy = Math.round((capitalAvailable * action.percentage) / 100 / action.triggerPrice);

        if (hasPosition) {
            const contract = hasPosition.contract;
            this.ib.placeOrder(id, contract, this.createOrder(action, quantityToBuy));
        } else {
            this.ib.placeOrder(id, {
                symbol: this.marketDataParams.symbol,
                secType: this.marketDataParams.secType as SecType,
                exchange: this.marketDataParams.exchange,
                currency: this.marketDataParams.currency
            }, this.createOrder(action, quantityToBuy));
        }

        // execute buy order
    }

    executeSell(action: TradeAction): void {
        console.log(`Selling ${action.percentage}% at price ${action.triggerPrice}`);
        const hasPosition = this.findCurrentPosition(this.stockSymbol);
        if (hasPosition) {
            const id = this.getUniqueOrderId();
            const contract = hasPosition.contract;
            this.ib.placeOrder(id, contract, this.createOrder(action, hasPosition.position));
        } else {
            console.log('No position to sell');
        }
    }
}   