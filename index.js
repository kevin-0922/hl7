const { MLLPServer } = require("mllp-node");
const hl7 = require("hl7");  // 需要重新加入 hl7 解析套件

const PORT = 3000;

// 創建 HL7 MLLP 伺服器
const server = new MLLPServer("0.0.0.0", PORT);

server.on("message", (data, callback) => {
    try {
        console.log("收到 HL7 訊息：" + data.toString());
        
        // 解析 HL7
        const hl7Message = hl7.parse(data.toString());

        const messageControlId = hl7Message.get("MSH.10");  
        const sendingApp = hl7Message.get("MSH.3"); 
        const sendingFacility = hl7Message.get("MSH.4");  
        const receivingApp = hl7Message.get("MSH.5");
        const receivingFacility = hl7Message.get("MSH.6");
        const messageType = hl7Message.get("MSH.9");

        // 建構 ACK 訊息
        const ackMessage = `MSH|^~\\&|${receivingApp}|${receivingFacility}|${sendingApp}|${sendingFacility}|${new Date().toISOString().replace(/[-T:]/g, "")}||ACK^${messageType}|${messageControlId}|P|2.3\rMSA|AA|${messageControlId}\r`;
        
        console.log("發送 ACK 訊息：\n" + ackMessage);
        callback(null, ackMessage);
    } catch (error) {
        console.error("處理 HL7 訊息時發生錯誤:", error);
        
        const errorAckMessage = `MSH|^~\\&|NODE|SERVER|HAPI|CLIENT|${new Date().toISOString().replace(/[-T:]/g, "")}||ACK|${Date.now()}|P|2.3\rMSA|AE|${Date.now()}|發生錯誤：${error.message}\r`;
        callback(null, errorAckMessage);
    }
});

server.on("error", (err) => {
    console.error("HL7 伺服器錯誤:", err);
});


console.log(`HL7 伺服器已啟動，監聽端口 ${PORT}`);


//關閉處理
process.on("SIGINT", () => {
    console.log("正在關閉伺服器...");
    server.stop(() => {
        console.log("HL7 伺服器已關閉");
        process.exit(0);
    });
});