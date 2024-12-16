const schedule = require("node-cron");
const {
  queryDb,
  functionToreturnDummyResult,
} = require("../helper/adminHelper");
const moment = require("moment");
const soment = require("moment-timezone");
const { default: axios } = require("axios");
let recurstionCount = 0;
const { TronWeb } = require("tronweb");

exports.generatedTimeEveryAfterEveryOneMin = (io) => {
  const job = schedule.schedule("* * * * * *", function () {
    const now = new Date();
    const nowIST = soment(now).tz("Asia/Kolkata");

    const currentMinute = nowIST.minutes();
    const currentSecond = nowIST.seconds();
    io.emit("onemin", `${currentMinute}_${currentSecond}`);
    // io.emit("onemin", timeToSend);
  });
};

exports.generatedTimeEveryAfterEveryOneMinTRX = (io) => {
  let oneMinTrxJob = schedule.schedule("* * * * * *", function () {
    const currentTime = new Date();
    const timeToSend =
      currentTime.getSeconds() > 0
        ? 60 - currentTime.getSeconds()
        : currentTime.getSeconds();
    io.emit("onemintrx", timeToSend);
  });
};
exports.jobRunByCrone = async () => {
  schedule.schedule("54 * * * * *", async function () {
    const actualtome = soment.tz("Asia/Kolkata");
    const time = actualtome;
    // .add(5, "hours").add(30, "minutes").valueOf();
    const getTime = await queryDb(
      "SELECT `utc_time`,block_id,created_at_utc FROM `trx_UTC_timer` ORDER BY `id` DESC LIMIT 1;",
      []
    );
    let time_to_Tron = getTime?.[0]?.utc_time;
    // Number(moment(getTime?.[0]?.created_at_utc)?.format("HH")) % 6 === 0 &&
    setTimeout(async () => {
      if (Number(moment(getTime?.[0]?.created_at_utc)?.format("mm")) === 0) {
        await callTronAPISecond(time_to_Tron, time);
      } else {
        await getBlockDetails(time, getTime?.[0]?.block_id, time_to_Tron);
      }
      recurstionCount = 0;
    }, 4000);
  });
};
const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io", // Mainnet URL; for testnet use 'https://api.shasta.trongrid.io'
});

async function callTronAPISecond(time_to_Tron, time) {
  await axios
    .get(
      `https://apilist.tronscan.org/api/block`,
      {
        params: {
          sort: "-balance",
          start: "0",
          limit: "20",
          producer: "",
          number: "",
          start_timestamp: time_to_Tron,
          end_timestamp: time_to_Tron,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then(async (result) => {
      if (result?.data?.data?.[0]) {
        recurstionCount = 0;
        const obj = result?.data?.data?.[0];
        // sendOneMinResultToDatabase(time, obj, time_to_Tron);
        await getBlockDetails(time, obj?.number, time_to_Tron);
        await queryDb(
          "UPDATE `trx_UTC_timer` SET `block_id` = ? WHERE `utc_time` = ?;",
          [String(obj?.number), String(time_to_Tron)]
        );
      } else {
        console.log("recursion called", time_to_Tron, result?.data?.data);
        setTimeout(async () => {
          await callTronAPISecond(time_to_Tron, time);
        }, 1500);
      }
    })
    .catch((e) => {
      console.log("error in tron api", time_to_Tron);
      if (recurstionCount <= 4) {
        setTimeout(() => {
          recurstionCount = recurstionCount + 1;
          callTronAPISecond(time_to_Tron, time);
        }, 1000);
      } else {
        console.log("else function is called", time_to_Tron);
        sendOneMinResultToDatabase(
          time,
          functionToreturnDummyResult(
            Math.floor(Math.random() * (4 - 0 + 1)) + 0
          ),
          time_to_Tron
        );
      }
    });
}

async function getBlockDetails(time, blockId, time_to_Tron) {
  try {
    let hash =
      "0000000003faeeb56f27fc55d82a45a5e2a417c19e328c7745f2d48e167ff926";
    const block = await tronWeb.trx.getBlock(Number(blockId));
    if (block?.blockID) {
      let obj = {
        hash: block?.blockID,
        time: String(moment(time).format("HH:mm:ss")),
        time_to_Tron: time_to_Tron,
        blockId: blockId,
        number: blockId,
      };
      await sendOneMinResultToDatabase(time, obj, time_to_Tron);
    } else {
      let obj = {
        thisisdummy: "this is dummy",
        hash: hash,
        time: String(moment(time).format("HH:mm:ss")),
        time_to_Tron: time_to_Tron,
        blockId: blockId,
        number: blockId,
      };
      await sendOneMinResultToDatabase(time, obj, time_to_Tron);
    }
  } catch (error) {
    await callTronAPISecond(time_to_Tron, time);
    console.error("Error fetching block details:", error);
  }
}

const sendOneMinResultToDatabase = async (time, obj, updatedTimestamp) => {
  const newString = obj.hash;
  let num = null;
  for (let i = newString.length - 1; i >= 0; i--) {
    if (!isNaN(parseInt(newString[i]))) {
      num = parseInt(newString[i]);
      break;
    }
  }
  const query = `CALL sp_insert_trx_one_min_result_new(?, ?, ?, ?, ?, ?, ?)`;
  await queryDb(query, [
    num,
    String(moment(time).format("HH:mm:ss")),
    1,
    `**${obj.hash.slice(-4)}`,
    JSON.stringify({
      ...obj,
      updatedTimestamp: updatedTimestamp,
      lateTimeStamp: moment(Date.now())?.format("HH:mm:ss"),
    }),
    `${obj.hash.slice(-5)}`,
    obj.number,
  ])
    .then((result) => {})
    .catch((e) => {
      console.log(e);
    });
};
