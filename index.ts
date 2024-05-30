import { IBApi } from "@stoqey/ib";
import { TradingBot } from "./TradingBot";
import { MarketDataParams } from "./src/data_management/DataManager";
import dotenv from "dotenv";
dotenv.config();

// Function to safely get environment variables and parse integers
function getEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set.`);
  }
  return value;
}

function getEnvInt(key: string): number {
  const value = getEnv(key);
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} is not a valid number.`);
  }
  return parsed;
}

// Initialize the IBApi class
const ib = new IBApi({
  clientId: getEnvInt("IB_CLIENT_ID"),
  host: getEnv("IB_HOST"),
  port: getEnvInt("IB_PORT")
});

// Market data configuration
const marketDataConfig: MarketDataParams = {
  reqId: getEnvInt("MARKET_REQ_ID"),
  symbol: getEnv("MARKET_SYMBOL"),
  secType: getEnv("MARKET_SEC_TYPE"),
  exchange: getEnv("MARKET_EXCHANGE"),
  currency: getEnv("MARKET_CURRENCY")
};

const tradingBot = new TradingBot(ib, marketDataConfig, getEnv("IB_ACCOUNT_ID"));

// Start the trading bot
tradingBot.start();
