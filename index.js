import { DataManager } from "./src/data_management/DataManager.js";
import ibpackage from "@stoqey/ib";
const { IBApi } = ibpackage;

const ib = new IBApi({
  clientId: 0,
  host: "127.0.0.1",
  port: 7497,
});

const marketDataParams = {
  tickerId: 1,
  symbol: "MSFT",
  secType: "STK",
  exchange: "SMART",
  currency: "USD",
};

const dataManager = new DataManager(ib, marketDataParams);

dataManager.initialize();
dataManager.setupListeners();

process.on("SIGINT", () => {
  console.log("Caught interrupt signal, shutting down gracefully.");
  dataManager.disconnect();
  process.exit();
});

// Path: src/data_management/DataManager.js
