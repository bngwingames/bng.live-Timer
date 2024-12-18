const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config({ path: __dirname + "/.env" });
const app = express();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const httpServer = http.createServer(app);
const allroutes = require("./controller/index");
const moment = require("moment");
const allRoutes = require("./routes/Routes");
const allRoutesaws = require("./aws_bk/routes/Routes");
const {
  aviator_Start_function,
} = require("./controller/aviator_Start_function");
const {
  sendWingoAmountToTheAdmin,
  sendRouletteAmountToTheAdmin,
  sendWingoAmountToTheAdminThreeMin,
  sendWingoAmountToTheAdminFiveMin,
  sendGaziyabadAmountToTheAdmin,
  sendFaridabadAmountToTheAdmin,
  sendGaliAmountToTheAdmin,
  sendDisawarAmountToTheAdmin,
} = require("./aws_bk/gameTimeController/adminresult");
const {
  aviator_Start_functionAWS,
} = require("./aws_bk/gameTimeController/aviator_Start_function");
const {
  rouletteResultAWS,
  jobRunByCroneAWS,
  generatedTimeEveryAfterEveryOneMinAWS,
  // jobRunByCroneAWSForWingoGame,
} = require("./aws_bk/gameTimeController");
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    credentials: true,
    optionSuccessStatus: 200,
  },
});
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
const PORT = process.env.PORT || 2000;
app.use(cors(corsOptions)); // Apply CORS middleware
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/v1", allRoutes);
app.use("/api/v1/aws", allRoutesaws);
io.on("connection", (socket) => {});
//
let x = true;
if (x) {
  console.log("Waiting for the next minute to start...");
  const now = new Date();
  const secondsUntilNextMinute = 60 - now.getSeconds();
  console.log(
    "start after ",
    moment(new Date()).format("HH:mm:ss"),
    secondsUntilNextMinute
  );
  setTimeout(() => {
    allroutes.jobRunByCrone();
    allroutes.generatedTimeEveryAfterEveryOneMinTRX(io);
    allroutes.generatedTimeEveryAfterEveryOneMin(io);

    x = false;
  }, secondsUntilNextMinute * 1000);
}

aviator_Start_function(io);

//////////////////////////////////////////////   aws /////////////
// setInterval(() => {
//   sendRouletteAmountToTheAdmin(io);
// }, 5000);
setInterval(() => {
  sendWingoAmountToTheAdmin(io);
}, 5000);
setInterval(() => {
  sendWingoAmountToTheAdminThreeMin(io);
}, 10000);
setInterval(() => {
  sendWingoAmountToTheAdminFiveMin(io);
}, 15000);
// setInterval(() => {
//   sendGaziyabadAmountToTheAdmin(io);
//   sendFaridabadAmountToTheAdmin(io);
//   sendGaliAmountToTheAdmin(io);
//   sendDisawarAmountToTheAdmin(io);
// }, 5 * 60 * 1000);
aviator_Start_functionAWS(io);
// rouletteResultAWS(io);

let y = true;
if (y) {
  console.log("Waiting for the next minute to start...");
  const now = new Date();
  const secondsUntilNextMinute = 60 - now.getSeconds();
  console.log(
    "start after ",
    moment(new Date()).format("HH:mm:ss"),
    secondsUntilNextMinute
  );
  setTimeout(() => {
    // jobRunByCroneAWS();
    // jobRunByCroneAWSForWingoGame();

    // generatedTimeEveryAfterEveryOneMinAWS(io);
    x = false;
  }, secondsUntilNextMinute * 1000);
}

app.get("/", (req, res) => {
  res.status(200).json({
    msg: "Server is running on port 2343",
  });
});

httpServer.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
////////////////
