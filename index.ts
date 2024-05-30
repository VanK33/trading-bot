import { StrategyManager, BuyStrategy, SellStrategy, HoldStrategy } from "./src/strategy_config/StrategyConfig";
/* ----- initiate the StrategyManager class and register the strategies ----- */
const strategyManager = new StrategyManager();
strategyManager.registerStrategy(new BuyStrategy());
strategyManager.registerStrategy(new SellStrategy());
strategyManager.registerStrategy(new HoldStrategy());