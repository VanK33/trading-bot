import { EventName, IBApi } from "@stoqey/ib";

// 创建 IBApi 实例，设置客户端ID、主机和端口
const ib = new IBApi({
    clientId: 0,  // 你的客户端ID
    host: "127.0.0.1",
    port: 7497  // 确保这是正确的端口
});

// 连接到IB
ib.connect();

// 注册事件监听器以获取账户更新信息
ib.on(EventName.connected, () => {
    console.log("Connected to IB.");
    ib.reqAccountUpdates(true, "DU9459613");  // 订阅特定账户信息更新
});

// 接收账户的投资组合更新
ib.on(EventName.updatePortfolio, (contract, position, marketPrice, marketValue) => {
    console.log(`Account Portfolio Update: Symbol: ${contract.symbol}, Position: ${position}, Market Price: ${marketPrice}, Market Value: ${marketValue}`);
});

// 注册事件监听器以获取账户现金余额更新
ib.on(EventName.updateAccountValue, (key: string, value: string, currency: string, accountName: string) => {
    if (key === "CashBalance") {
        console.log(`账户名称: ${accountName}, 货币: ${currency}, 现金余额更新为: ${value}`);
    }
});

// 确保在完成后断开连接
setTimeout(() => {
    ib.disconnect();
    console.log("Disconnected from IB.");
}, 10000);  // 增加等待时间至10秒以确保接收全部信息
