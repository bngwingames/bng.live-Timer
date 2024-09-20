const schedule = require("node-cron");
const {
  queryDb,
  functionToreturnDummyResult,
  getAlredyPlacedBet,
  getAlredyPlacedBetOnWingo,
} = require("../helper/adminHelper");
const moment = require("moment");
const soment = require("moment-timezone");
const { default: axios } = require("axios");
const { failMsg } = require("../helper/helperResponse");
const mailSender = require("../utils/Nodemailer");
const registrationSuccessfully = require("../templets/registrationSuccessfully");
const otpTemplate = require("../templets/emailVerificationTemplate");
const otpGenerator = require("otp-generator");

exports.generatedTimeEveryAfterEveryOneMin = (io) => {
  const job = schedule.schedule("* * * * * *", function () {
    const currentTime = new Date();
    const timeToSend =
      currentTime.getSeconds() > 0
        ? 60 - currentTime.getSeconds()
        : currentTime.getSeconds();
    io.emit("onemin", timeToSend);
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

    if (timeToSend === 6) {
      let timetosend = new Date();
      timetosend.setSeconds(54);
      timetosend.setMilliseconds(0);
      let updatedTimestamp = parseInt(timetosend.getTime().toString());
      const actualtome = soment.tz("Asia/Kolkata");
      const time = actualtome.add(5, "hours").add(30, "minutes").valueOf();
      setTimeout(async () => {
        const res = await axios
          .get(
            `https://apilist.tronscanapi.com/api/block`,
            {
              params: {
                sort: "-balance",
                start: "0",
                limit: "20",
                producer: "",
                number: "",
                start_timestamp: updatedTimestamp,
                end_timestamp: updatedTimestamp,
              },
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
          .then(async (result) => {
            if (result?.data?.data[0]) {
              const obj = result.data.data[0];
              sendOneMinResultToDatabase(time, obj);
            } else {
              sendOneMinResultToDatabase(
                time,
                functionToreturnDummyResult(
                  Math.floor(Math.random() * (4 - 0 + 1)) + 0
                )
              );
            }
          })
          .catch((e) => {
            console.log("error in tron api");
            sendOneMinResultToDatabase(
              time,
              functionToreturnDummyResult(
                Math.floor(Math.random() * (4 - 0 + 1)) + 0
              )
            );
          });
      }, [4000]);
    }
  });
};

const sendOneMinResultToDatabase = async (time, obj) => {
  const newString = obj.hash;
  let num = null;
  for (let i = newString.length - 1; i >= 0; i--) {
    if (!isNaN(parseInt(newString[i]))) {
      num = parseInt(newString[i]);
      break;
    }
  }
  const query = `CALL sp_insert_trx_one_min_result(?, ?, ?, ?, ?, ?, ?)`;
  await queryDb(query, [
    num,
    String(moment(time).format("HH:mm:ss")),
    1,
    `**${obj.hash.slice(-4)}`,
    JSON.stringify(obj),
    `${obj.hash.slice(-5)}`,
    obj.number,
  ])
    .then((result) => {})
    .catch((e) => {
      console.log(e);
    });
};

exports.chnagePassWord = async (req, res) => {
  const { userid, old_pass, new_pass, confirm_new_pass } = req.body;
  if (!userid || !old_pass || !new_pass || !confirm_new_pass)
    return res.status(401).json({
      msg: "Everything is requied!",
      error: true,
    });
  if (new_pass !== confirm_new_pass)
    return res.status(401).json({
      msg: "Password and new password should be same.",
      error: true,
    });

  const query = "UPDATE user SET password = ? WHERE id = ? AND password = ?;";
  await queryDb(query, [String(new_pass), Number(userid), String(old_pass)])
    .then((result) => {
      if (result?.length === 0)
        return res.status(401).json({
          msg: "Your old password is wrong!",
        });
      return res.status(200).json({
        msg: "Password updated successfully",
        data: result,
      });
    })
    .catch((e) => {
      return res.status(500).json({
        msg: "Password change successfully",
        data: result,
      });
    });
};

exports.getGameHistory = async (req, res) => {
  const { gameid, limit } = req.query;

  if (!gameid || !limit) {
    return res.status(400).json({
      // Changed to 400 for bad request
      msg: "gameid and limit are required",
    });
  }

  const num_gameid = Number(gameid);
  const num_limit = Number(limit);

  if (typeof num_gameid !== "number" || typeof num_limit !== "number") {
    return res.status(400).send("gameid and limit should be numbers");
  }
  try {
    // const query =
    //   "SELECT * FROM tr42_win_slot WHERE tr41_packtype = ? ORDER BY tr_transaction_id DESC LIMIT 200";
    let query = "";
    if (num_gameid === 1) {
      query =
        "SELECT * FROM tr42_win_slot WHERE tr41_packtype = 1 ORDER BY tr_transaction_id DESC LIMIT 200";
    } else if (num_gameid === 2) {
      query =
        "SELECT * FROM tr42_win_slot WHERE tr41_packtype = 2 ORDER BY tr_transaction_id DESC LIMIT 200";
    } else {
      query =
        "SELECT * FROM tr42_win_slot WHERE tr41_packtype = 3 ORDER BY tr_transaction_id DESC LIMIT 200";
    }
    await queryDb(query, [])
      .then((result) => {
        return res.status(200).json({
          msg: "Data fetched successfully",
          result: result,
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    return res.status(500).json({
      msg: `Something went wrong api calling`,
    });
  }
};
exports.getMyHistory = async (req, res) => {
  const { gameid, userid } = req.query;

  if (!gameid || !userid) {
    return res.status(400).json({
      // Changed to 400 for bad request
      msg: "gameid and userid are required",
    });
  }
  const num_gameid = Number(gameid);
  const num_userid = Number(userid);

  if (typeof num_gameid !== "number" || typeof num_userid !== "number") {
    return res.status(400).send("gameid and limit should be numbers");
  }
  try {
    let query = "";
    if (num_gameid === 1) {
      query = `SELECT * FROM trx_colour_bet WHERE userid = ? AND gameid = 1 ORDER BY gamesno DESC LIMIT 100;`;
    } else if (num_gameid === 2) {
      query = `SELECT * FROM trx_colour_bet WHERE userid = ? AND gameid = 2 ORDER BY gamesno DESC LIMIT 100;`;
    } else {
      query = `SELECT * FROM trx_colour_bet WHERE userid = ? AND gameid = 3 ORDER BY gamesno DESC LIMIT 100;`;
    }

    query !== "" &&
      (await queryDb(query, [Number(num_userid)])
        .then((result) => {
          return res.status(200).json({
            msg: "Data fetched successfully",
            data: result,
          });
        })
        .catch((e) => {
          return res.status(500).json({
            msg: `Something went wrong api calling`,
          });
        }));
  } catch (e) {
    return failMsg("Something went worng in node api");
  }
};
exports.getMyHistoryTemp = async (req, res) => {
  const { gameid, userid } = req.query;

  if (!gameid || !userid) {
    return res.status(400).json({
      // Changed to 400 for bad request
      msg: "gameid and userid are required",
    });
  }
  const num_gameid = Number(gameid);
  const num_userid = Number(userid);

  if (typeof num_gameid !== "number" || typeof num_userid !== "number") {
    return res.status(400).send("gameid and limit should be numbers");
  }
  try {
    let query = "";
    if (num_gameid === 1) {
      query = `SELECT * FROM trx_colour_bet_temp WHERE userid = ? AND gameid = 1 ORDER BY gamesno DESC LIMIT 100;`;
    } else if (num_gameid === 2) {
      query = `SELECT * FROM trx_colour_bet_temp WHERE userid = ? AND gameid = 2 ORDER BY gamesno DESC LIMIT 100;`;
    } else {
      query = `SELECT * FROM trx_colour_bet_temp WHERE userid = ? AND gameid = 3 ORDER BY gamesno DESC LIMIT 100;`;
    }

    query !== "" &&
      (await queryDb(query, [Number(num_userid)])
        .then((result) => {
          return res.status(200).json({
            msg: "Data fetched successfully",
            data: result,
          });
        })
        .catch((e) => {
          return res.status(500).json({
            msg: `Something went wrong api calling`,
          });
        }));
  } catch (e) {
    return res.status(500).json({
      msg: `Something went wrong api calling`,
    });
  }
};

exports.placeBetTrx = async (req, res) => {
  const { amount, gameid, gamesnio, number, userid } = req.body;
  if (gamesnio && Number(gamesnio) <= 1) {
    return res.status(200).json({
      msg: `Refresh your page may be your game history not updated.`,
    });
  }

  if (!amount || !gameid || !gamesnio || !String(number) || !userid)
    return res.status(200).json({
      msg: `Everything is required`,
    });

  if (userid && Number(userid) <= 0) {
    return res.status(200).json({
      msg: `Please refresh your page`,
    });
  }

  if (Number(amount) <= 0)
    return res.status(200).json({
      msg: `Amount should be grater or equal to 1.`,
    });
  if (gameid && Number(gameid) <= 0)
    return res.status(200).json({
      msg: `Type is not define`,
    });
  if (gameid && Number(gameid) >= 4)
    return res.status(200).json({
      msg: `Type is not define`,
    });

  const num_gameid = Number(gameid);

  if (typeof num_gameid !== "number")
    return res.status(200).json({
      msg: `Game id should be in number`,
    });

  let get_round = "";
  if (num_gameid === 1) {
    get_round = `SELECT tr_tranaction_id FROM tr_game WHERE tr_id = 4;`;
  } else if (num_gameid === 2) {
    get_round = `SELECT tr_tranaction_id FROM tr_game WHERE tr_id = 5;`;
  } else {
    get_round = `SELECT tr_tranaction_id FROM tr_game WHERE tr_id = 6;`;
  }
  const get_round_number =
    get_round !== "" &&
    (await queryDb(get_round, [])
      .then((result) => {
        return result;
      })
      .catch((e) => {
        console.log("Something went wrong in get round.");
      }));
  await getAlredyPlacedBet([
    String(Number(get_round_number?.[0]?.tr_tranaction_id) + 1),
    String(userid),
    num_gameid,
  ]).then(async (result) => {
    if (
      [10, 20, 30]?.includes(Number(number)) &&
      result?.find((i) => [10, 20, 30]?.includes(Number(i?.number)))
    ) {
      return res.status(200).json({
        msg: `Already Placed on color`,
      });
    } else if (
      [40, 50]?.includes(Number(number)) &&
      result?.find((i) => [40, 50]?.includes(Number(i?.number)))
    ) {
      return res.status(200).json({
        msg: `Already placed on big/small`,
      });
    } else if (
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]?.includes(Number(number)) &&
      result?.filter((i) =>
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]?.includes(Number(i?.number))
      )?.length > 2
    ) {
      return res.status(200).json({
        msg: `You have already placed 3  bets.`,
      });
    } else {
      try {
        const query = `CALL trx_bet_placed(?, ?, ?, ?, @result_msg); SELECT @result_msg;`;
        try {
          const newresult = await queryDb(query, [
            String(userid),
            Number(num_gameid),
            String(amount),
            String(number),
          ])
            .then((result) => {
              res.status(200).json({
                error: "200",
                msg: result?.[1]?.[0]?.["@result_msg"],
              });
            })
            .catch((e) => {
              return res.status(500).json({
                msg: "Something went wrong with the API call",
              });
            });
        } catch (error) {
          console.error("Error:", error);
          return res.status(500).json({
            msg: "Something went wrong with the API call",
          });
        }
      } catch (e) {
        return failMsg("Something went worng in node api");
      }
    }
  });
};

exports.loginPage = async (req, res) => {
  const { password, username, ipAddress } = req.body;
  if (!password || !username)
    return res.status(200).json({
      msg: `Everything is required`,
    });

  try {
    // const query = `SELECT id FROM user WHERE (email = ? OR mobile = ?)  AND password = ? AND is_blocked_status = 1;`;
    const query = `CALL sp_for_login_user(?,?,?,?,@user_id,@msg); SELECT @user_id,@msg;`;
    await queryDb(query, [
      username,
      username,
      password,
      String(ipAddress || ""),
    ])
      .then((newresult) => {
        return res.status(200).json({
          msg: newresult?.[1]?.[0]?.["@msg"],
          UserID: newresult?.[1]?.[0]?.["@user_id"],
        });
      })
      .catch((error) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    return failMsg("Something went worng in node api");
  }
};
exports.signupUser = async (req, res) => {
  const { mobile, email, name, pass, confirmpass, refid } = req.body;
  if (!mobile || !email || !name || !pass || !confirmpass || !refid)
    return res.status(201).json({
      msg: `Everything is required`,
    });
  if (pass !== confirmpass)
    return res.status(201).json({
      msg: `Password and confirm password doesn't match.`,
    });
  try {
    let randomId = Date.now();
    const replacement = [
      String(randomId),
      mobile,
      email,
      name,
      pass,
      Number(refid),
    ];
    const callsignupSp =
      "CALL registration_user(?,?,?,?,?,?,@result_msg); SELECT @result_msg;";
    await queryDb(callsignupSp, replacement)
      .then(async (newresult) => {
        await mailSender(
          email,
          `Congcongratulations,${name}`,
          registrationSuccessfully(name)
        );
        return res.status(200).json({
          msg: newresult?.[1]?.[0]?.["@result_msg"],
        });
      })
      .catch((error) => {
        console.log(error);
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: `Something went wrong api calling`,
    });
  }
};

exports.getUserNameByUserId = async (req, res) => {
  const { userid } = req.query;

  if (!userid)
    return res.status(200).json({
      msg: `Everything is required`,
    });

  try {
    const query = "SELECT id,full_name FROM `user` WHERE username = ? LIMIT 1;";
    await queryDb(query, [userid])
      .then((newresult) => {
        if (newresult?.length === 0) {
          return res.status(200).json({
            error: "201",
            msg: "User not found",
          });
        }

        return res.status(200).json({
          msg: "Get User Successfully",
          data: newresult?.[0],
        });
      })
      .catch((error) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    return res.status(500).json({
      msg: `Something went wrong api calling`,
    });
  }
};
exports.getBalance = async (req, res) => {
  const { userid } = req.query;

  if (!userid)
    return res.status(200).json({
      msg: `Everything is required`,
    });

  const num_gameid = Number(userid);

  if (typeof num_gameid !== "number")
    return res.status(200).json({
      msg: `User id should be in number`,
    });
  // fn_check_total_bet_for_withdrawl(?)
  try {
    const query = `SELECT total_payin,total_payout,transaction_status,working_wallet,cricket_wallet,wallet,winning_wallet,today_turnover,username,email,referral_code,full_name,mobile,0 AS need_amount_for_withdrawl FROM user WHERE id = ?;`;
    await queryDb(query, [Number(num_gameid)])
      .then((newresult) => {
        if (newresult?.length === 0) {
          return res.status(200).json({
            error: "400",
            msg: "Something went wrong",
          });
        }

        return res.status(200).json({
          error: "200",
          data: {
            transaction_status: newresult?.[0]?.transaction_status,
            cricket_wallet: newresult?.[0]?.cricket_wallet,
            working_wallet: newresult?.[0]?.working_wallet,
            wallet: newresult?.[0]?.wallet,
            winning: newresult?.[0]?.winning_wallet,
            total_turnover: newresult?.[0]?.today_turnover,
            username: newresult?.[0]?.username,
            email: newresult?.[0]?.email,
            referral_code: newresult?.[0]?.referral_code,
            full_name: newresult?.[0]?.full_name,
            need_amount_for_withdrawl:
              newresult?.[0]?.need_amount_for_withdrawl,
            mob_no: newresult?.[0]?.mobile,
            total_payin: newresult?.[0]?.total_payin,
            total_payout: newresult?.[0]?.total_payout,
          },
        });
      })
      .catch((error) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    return failMsg("Something went worng in node api");
  }
};
exports.getTopWinners = async (req, res) => {
  try {
    const query = `SELECT u.email, u.full_name, SUM(IFNULL(t.win,0)) AS win
      FROM trx_colour_bet AS t
      RIGHT JOIN user AS u ON u.id = t.userid 
      WHERE t.win IS NOT NULL 
  AND t.datetime IS NOT NULL 
  AND DATE(t.datetime) >= DATE(NOW()) - INTERVAL 3 DAY
  GROUP BY u.email, u.full_name  
  ORDER BY SUM(IFNULL(t.win,0)) DESC
  LIMIT 10;`;
    await queryDb(query, [])
      .then((newresult) => {
        return res.status(200).json({
          msg: "Data fetched successfully",
          data: newresult,
        });
      })
      .catch((error) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    return failMsg("Something went worng in node api");
  }
};

exports.myHistoryWingo = async (req, res) => {
  const { userid, gameid, limit } = req.query;

  if (!userid || !gameid) {
    return res.status(400).json({
      // Changed to 400 for bad request
      msg: "gameid and userid are required",
    });
  }

  const num_gameid = Number(gameid);
  const num_limit = Number(limit);
  const num_userid = Number(userid);

  if (
    typeof num_gameid !== "number" ||
    typeof num_limit !== "number" ||
    typeof num_userid !== "number"
  ) {
    return res.status(400).send("gameid and limit should be numbers");
  }
  try {
    let query = "";
    if (num_gameid === 1) {
      query = `SELECT * FROM colour_bet WHERE gameid = 1 AND userid = ?  ORDER BY id DESC LIMIT 150;`;
    } else if (num_gameid === 2) {
      query = `SELECT * FROM colour_bet WHERE gameid = 2 AND userid = ?  ORDER BY id DESC LIMIT 150;`;
    } else {
      query = `SELECT * FROM colour_bet WHERE gameid = 3 AND userid = ?  ORDER BY id DESC LIMIT 150;`;
    }
    query !== "" &&
      (await queryDb(query, [Number(num_userid)])
        .then((result) => {
          return res.status(200).json({
            msg: "Data fetched successfully",
            data: result,
          });
        })
        .catch((e) => {
          console.log(e);
          return res.status(500).json({
            msg: `Something went wrong api calling`,
          });
        }));
  } catch (e) {
    return failMsg("Something went worng in node api");
  }
};

exports.placeBetWingo = async (req, res) => {
  const { amount, gameid, number, userid } = req.body;
  if (!amount || !gameid || !String(number) || !userid)
    return res.status(200).json({
      msg: `Everything is required`,
    });

  if (userid && Number(userid) <= 0) {
    return res.status(200).json({
      msg: `Please refresh your page`,
    });
  }

  if (Number(amount) <= 0)
    return res.status(200).json({
      msg: `Amount should be grater or equal to 1.`,
    });
  if (gameid && Number(gameid) <= 0)
    return res.status(200).json({
      msg: `Type is not define`,
    });
  if (gameid && Number(gameid) >= 4)
    return res.status(200).json({
      msg: `Type is not define`,
    });

  const gameId = Number(gameid);
  if (typeof gameId !== "number")
    return res.status(201).json({
      msg: "Data type of number should be number.",
    });

  let get_round = "";
  if (Number(gameId) === 1) {
    get_round = `SELECT win_transactoin FROM wingo_round_number WHERE win_id = 1;`;
  } else if (Number(gameId) === 2) {
    get_round = `SELECT win_transactoin FROM wingo_round_number WHERE win_id = 2;`;
  } else {
    get_round = `SELECT win_transactoin FROM wingo_round_number WHERE win_id = 3;`;
  }
  const get_round_number =
    get_round !== "" &&
    (await queryDb(get_round, [])
      .then((result) => {
        return result;
      })
      .catch((e) => {
        console.log("Something went wrong in get round.");
      }));

  await getAlredyPlacedBetOnWingo([
    String(Number(get_round_number?.[0]?.win_transactoin) + 1),
    String(userid),
    Number(gameId),
  ]).then(async (result) => {
    if (
      [10, 20, 30]?.includes(Number(number)) &&
      result?.find((i) => [10, 20, 30]?.includes(Number(i?.number)))
    ) {
      return res.status(200).json({
        msg: `Already Placed on color`,
      });
    } else if (
      [40, 50]?.includes(Number(number)) &&
      result?.find((i) => [40, 50]?.includes(Number(i?.number)))
    ) {
      return res.status(200).json({
        msg: `Already placed on big/small`,
      });
    } else if (
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]?.includes(Number(number)) &&
      result?.filter((i) =>
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]?.includes(Number(i?.number))
      )?.length > 2
    ) {
      return res.status(200).json({
        msg: `You have already placed 3  bets.`,
      });
    } else {
      try {
        const query = `CALL wingo_bet_placed(?, ?, ?, ?, @result_msg); SELECT @result_msg;`;
        try {
          const newresult = await queryDb(query, [
            String(userid),
            Number(gameId),
            String(amount),
            String(number),
          ])
            .then((result) => {
              res.status(200).json({
                error: "200",
                msg: result?.[1]?.[0]?.["@result_msg"],
              });
            })
            .catch((e) => {
              return res.status(500).json({
                msg: "Something went wrong with the API call",
              });
            });
        } catch (error) {
          console.error("Error:", error);
          return res.status(500).json({
            msg: "Something went wrong with the API call",
          });
        }
      } catch (e) {
        return failMsg("Something went worng in node api");
      }
    }
  });
};

exports.gameHistoryWingo = async (req, res) => {
  const { gameid, limit } = req.query;

  if (!gameid || !limit) {
    return res.status(400).json({
      // Changed to 400 for bad request
      msg: "gameid and limit are required",
    });
  }

  const num_gameid = Number(gameid);
  const num_limit = Number(limit);

  if (typeof num_gameid !== "number" || typeof num_limit !== "number") {
    return res.status(400).send("gameid and limit should be numbers");
  }
  try {
    let query = "";
    if (num_gameid === 1) {
      query =
        "SELECT * FROM `colour_results` WHERE gameid = 1 ORDER BY id DESC LIMIT 150;";
    } else if (num_gameid === 2) {
      query =
        "SELECT * FROM `colour_results` WHERE gameid = 2 ORDER BY id DESC LIMIT 150;";
    } else {
      query =
        "SELECT * FROM `colour_results` WHERE gameid = 3 ORDER BY id DESC LIMIT 150;";
    }
    query !== "" &&
      (await queryDb(query, [])
        .then((result) => {
          return res.status(200).json({
            msg: "Data fetched successfully",
            data: result,
          });
        })
        .catch((e) => {
          console.log(e);
          return res.status(500).json({
            msg: `Something went wrong api calling`,
          });
        }));
  } catch (e) {
    return failMsg("Something went worng in node api");
  }
};

exports.getLevels = async (req, res) => {
  try {
    const { userid } = req.query;
    if (!userid)
      return res.status(201).json({
        msg: "Please provide uesr id.",
      });
    const id_in_number = Number(userid);
    if (typeof id_in_number !== "number")
      return res.status(201).json({
        msg: "Something went wrong.",
      });
    const query = `CALL sp_get_levels_data(?,?,@yesterday_income,@this_week_income,@total_commission); SELECT @yesterday_income,@this_week_income,@total_commission;`;
    await queryDb(query, [Number(id_in_number), 6]) ///////////////////// second parameter should be (level+1)
      .then((result) => {
        res.status(200).json({
          msg: "Data get successfully",
          data: result?.[0],
          yesterday_income: result?.[2]?.[0]?.["@yesterday_income"],
          this_week_income: result?.[2]?.[0]?.["@this_week_income"],
          total_commission: result?.[2]?.[0]?.["@total_commission"],
        });
      })
      .catch((e) => {
        console.log(e);
      });
  } catch (e) {
    res.status(500).json({
      msg: "Something went wrong.",
    });
  }
};

exports.getDepositlHistory = async (req, res) => {
  const { userid } = req.query;

  if (!userid)
    return res.status(200).json({
      msg: `Everything is required`,
    });

  const num_userid = Number(userid);

  if (typeof num_userid !== "number")
    return res.status(200).json({
      msg: `User id should be in number`,
    });
  try {
    const query = `SELECT user_id,to_coin,amt,order_id,status,created_at,success_date FROM m05_fund_gateway WHERE user_id = ?;`;
    await queryDb(query, [Number(num_userid)])
      .then((newresult) => {
        if (newresult?.length === 0) {
          return res.status(200).json({
            error: "400",
            msg: "Something went wrong",
          });
        }
        return res.status(200).json({
          error: "200",
          data: newresult,
        });
      })
      .catch((error) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    return failMsg("Something went worng in node api");
  }
};
exports.getWithdrawlHistory = async (req, res) => {
  const { userid } = req.query;

  if (!userid)
    return res.status(200).json({
      msg: `Everything is required`,
    });

  const num_userid = Number(userid);

  if (typeof num_userid !== "number")
    return res.status(200).json({
      msg: `User id should be in number`,
    });
  try {
    const query = `SELECT * FROM tr12_withdrawal WHERE m_u_id = ?;`;
    await queryDb(query, [Number(num_userid)])
      .then((newresult) => {
        if (newresult?.length === 0) {
          return res.status(200).json({
            error: "400",
            msg: "Something went wrong",
          });
        }
        return res.status(200).json({
          error: "200",
          data: newresult,
        });
      })
      .catch((error) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    return failMsg("Something went worng in node api");
  }
};

exports.addUSDTAddress = async (req, res) => {
  const { m_u_id, address, usdt_type } = req.body; // 1 for BEP20, 2 for TRC20
  if (!m_u_id || !address || !usdt_type)
    return res.status(200).json({
      msg: `Everything is required`,
    });

  const num_userid = Number(m_u_id);

  if (typeof num_userid !== "number")
    return res.status(200).json({
      msg: `User id should be in number`,
    });

  try {
    const query_for_check_already_exist_address =
      "SELECT id FROM coin_payment_address_record WHERE userid = ? AND usdt_type = ? LIMIT 1;";

    let isAvailable = 0;
    isAvailable = await queryDb(query_for_check_already_exist_address, [
      Number(num_userid),
      Number(usdt_type),
    ])
      ?.then((result) => {
        return result?.[0]?.id;
      })
      .catch((e) => {
        return res.status(500)?.json({ msg: "Something went wrong." });
      });
    if ((isAvailable || 0) !== 0)
      return res.status(201)?.json({
        msg: "You have already added USDT address.",
      });
    const query = `INSERT INTO coin_payment_address_record(userid,usdt_type,usdt_address) VALUES(?,?,?);`;
    await queryDb(query, [
      Number(num_userid),
      Number(usdt_type),
      String(address),
    ])
      .then((newresult) => {
        if (newresult?.length === 0) {
          return res.status(200).json({
            error: "400",
            msg: "Something went wrong",
          });
        }
        return res.status(200).json({
          error: "200",
          msg: "Record saved successfully.",
        });
      })
      .catch((error) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    return failMsg("Something went worng in node api");
  }
};

exports.uddtAddressHistory = async (req, res) => {
  const { m_u_id } = req.query;
  if (!m_u_id)
    return res.status(200).json({
      msg: `Everything is required`,
    });

  const num_userid = Number(m_u_id);

  if (typeof num_userid !== "number")
    return res.status(200).json({
      msg: `User id should be in number`,
    });

  try {
    const query = `SELECT * FROM coin_payment_address_record WHERE userid = ?;`;
    await queryDb(query, [Number(num_userid)])
      .then((newresult) => {
        return res.status(200).json({
          error: "200",
          msg: "Record saved successfully.",
          data: newresult,
        });
      })
      .catch((error) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    return failMsg("Something went worng in node api");
  }
};

exports.getLevelIncome = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(201).json({
        msg: "Please provide id.",
      });
    }

    const query_for_get_referral_bonus =
      "SELECT * FROM `leser` WHERE l01_user_id = ? AND l01_type = 'Level' ORDER BY DATE(l01_date) DESC;";
    const data = await queryDb(query_for_get_referral_bonus, [Number(id)])
      .then((result) => {
        return result;
      })
      .catch((e) => {
        console.log("Error in fetch level income");
      });

    return res.status(200).json({
      msg: "Data get successfully",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong.",
    });
    console.log("Error in massWithdrawilRequest");
  }
};
exports.getSelfDepositBonus = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(201).json({
        msg: "Please provide id.",
      });
    }

    const query_for_get_referral_bonus =
      "SELECT * FROM leser WHERE  l01_user_id = ? AND (l01_type = 'Bonus' OR l01_type = 'Self Deposit Bonus') ORDER BY lo1_id DESC;";
    const data = await queryDb(query_for_get_referral_bonus, [Number(user_id)])
      .then((result) => {
        return result;
      })
      .catch((e) => {
        console.log("Error in fetch level income");
      });

    return res.status(200).json({
      msg: "Data get successfully",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong.",
    });
    console.log("Error in massWithdrawilRequest");
  }
};
exports.getSponsorIncome = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(201).json({
        msg: "Please provide id.",
      });
    }

    const query_for_get_referral_bonus =
      "SELECT * FROM leser WHERE  l01_user_id = ? AND (l01_type = 'Reffral' OR l01_type = 'Sponsor Deposit Bonus') ORDER BY lo1_id DESC;";
    const data = await queryDb(query_for_get_referral_bonus, [Number(user_id)])
      .then((result) => {
        return result;
      })
      .catch((e) => {
        console.log("Error in fetch level income");
      });

    return res.status(200).json({
      msg: "Data get successfully",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong.",
    });
    console.log("Error in massWithdrawilRequest");
  }
};
exports.needToBet = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(201).json({
        msg: "Please provide id.",
      });
    }

    const query_for_get_referral_bonus =
      "SELECT fn_check_total_bet_for_withdrawl(?) AS amount;";
    const data = await queryDb(query_for_get_referral_bonus, [Number(user_id)])
      .then((result) => {
        return result;
      })
      .catch((e) => {
        console.log("Error in fetch level income");
      });

    return res.status(200).json({
      msg: "Data get successfully",
      data: data?.[0]?.amount,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong.",
    });
    console.log("Error in massWithdrawilRequest");
  }
};
exports.getDailySalaryIncome = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(201).json({
        msg: "Please provide id.",
      });
    }

    const query_for_get_referral_bonus =
      "SELECT * FROM `leser` WHERE l01_user_id = ? AND l01_type = 'Daily Income' ORDER BY DATE(l01_date) DESC;";
    const data = await queryDb(query_for_get_referral_bonus, [Number(id)])
      .then((result) => {
        return result;
      })
      .catch((e) => {
        console.log("Error in fetch level income");
      });

    return res.status(200).json({
      msg: "Data get successfully",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong.",
    });
    console.log("Error in massWithdrawilRequest");
  }
};
exports.getWeeklySalaryIncome = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(201).json({
        msg: "Please provide id.",
      });
    }

    const query_for_get_referral_bonus =
      "SELECT * FROM `leser` WHERE l01_user_id = ? AND l01_type = 'Weekly Bonus' ORDER BY DATE(l01_date) DESC;";
    const data = await queryDb(query_for_get_referral_bonus, [Number(id)])
      .then((result) => {
        return result;
      })
      .catch((e) => {
        console.log("Error in fetch level income");
      });

    return res.status(200).json({
      msg: "Data get successfully",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong.",
    });
    console.log("Error in massWithdrawilRequest");
  }
};

exports.getStatus = async (req, res) => {
  try {
    const query = "SELECT * FROM `admin_setting` WHERE id IN (14,15,16)";
    const result = await queryDb(query, [])
      ?.then((result) => {
        return result;
      })
      .catch((e) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
    return res.status(200).json({
      msg: `Data get successfully`,
      data: result,
    });
  } catch (e) {
    return res.status(500).json({
      msg: `Something went wrong api calling`,
    });
  }
};

exports.getSubOrdinateData = async (req, res) => {
  try {
    const { user_main_id, level_no, in_date } = req.body;

    if (!user_main_id || !String(level_no) || !in_date)
      return res.status(201).json({
        msg: `Please provide everything`,
      });

    let actual_level = Number(level_no);
    if (typeof actual_level !== "number") {
      return res.status(201).json({
        msg: `Please provide Valid Level No.`,
      });
    }

    const query = "CALL get_all_income_from_team(?,?,?);";
    const params = [
      Number(user_main_id),
      Number(level_no),
      moment(in_date)?.format("YYYY-MM-DD"),
    ];
    const result = await queryDb(query, params)
      ?.then((result) => {
        return result;
      })
      .catch((e) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
    return res.status(200).json({
      msg: `Data get successfully`,
      data: result?.[0],
    });
  } catch (e) {
    return res.status(500).json({
      msg: `Something went wrong api calling`,
    });
  }
};

exports.getAllCommission = async (req, res) => {
  try {
    const { user_main_id, in_date } = req.body;

    if (!user_main_id || !in_date)
      return res.status(201).json({
        msg: `Please provide everything`,
      });
    const query = "CALL sp_get_commission_details_perday(?,?);";
    const params = [
      Number(user_main_id),
      moment(in_date)?.format("YYYY-MM-DD"),
    ];
    const result = await queryDb(query, params)
      ?.then((result) => {
        return result;
      })
      .catch((e) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
    return res.status(200).json({
      msg: `Data get successfully`,
      data: result?.[0],
    });
  } catch (e) {
    return res.status(500).json({
      msg: `Something went wrong api calling`,
    });
  }
};

exports.transfer_Amount_to_mainWallet_from_WorkingWallet = async (req, res) => {
  try {
    const { userid, amount, password } = req.body;

    if (!userid || !amount || !password)
      return res.status(201).json({
        msg: `Please provide everything`,
      });

    if (Number(amount) <= 0)
      return res.status(201).json({
        msg: `Please Enter Your Amount.`,
      });

    const query_for_check_working_wallet =
      "CALL sp_transfer_amount_working_wallet_to_main_wallet(?,?,?,?,@result_msg); SELECT @result_msg;";

    await queryDb(query_for_check_working_wallet, [
      Number(amount)?.toFixed(4),
      Number(userid),
      String(Date.now()),
      password,
    ])
      ?.then((result) => {
        return res.status(200).json({
          msg: result?.[1]?.[0]?.["@result_msg"],
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    return res.status(500).json({
      msg: `Something went wrong api calling`,
    });
  }
};
exports.get_transfer_history_working_to_main_wallet = async (req, res) => {
  try {
    const { userid } = req.query;

    if (!userid)
      return res.status(201).json({
        msg: `Please provide everything`,
      });

    const query_for_check_working_wallet =
      "SELECT * FROM `leser_transfer_wallet` WHERE `l01_user_id` = ?;";

    await queryDb(query_for_check_working_wallet, [Number(userid)])
      ?.then((result) => {
        return res.status(200).json({
          msg: "Data seccessfully fount",
          data: result,
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    return res.status(500).json({
      msg: `Something went wrong api calling`,
    });
  }
};
exports.getCashBack = async (req, res) => {
  try {
    const { userid } = req.query;

    if (!userid)
      return res.status(201).json({
        msg: `Please provide everything`,
      });

    const query_for_check_working_wallet =
      "SELECT * FROM leser WHERE `l01_user_id` = ? AND `l01_type` = 'Caseback';";

    await queryDb(query_for_check_working_wallet, [Number(userid)])
      ?.then((result) => {
        return res.status(200).json({
          msg: "Data seccessfully fount",
          data: result,
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    return res.status(500).json({
      msg: `Something went wrong api calling`,
    });
  }
};

exports.getTotalBetAndIncomeYesterday = async (req, res) => {
  try {
    const { userid } = req.query;

    if (!userid)
      return res.status(201).json({
        msg: `Please provide everything`,
      });

    const query_for_check_working_wallet =
      "SELECT level_1_income,level_2_income,level_3_income,level_4_income,level_5_income,level_6_income,level_1_total_bet,level_2_total_bet,level_3_total_bet,level_4_total_bet,level_5_total_bet,level_6_total_bet,yesterday_income,direct_reg,team_reg,direct_depo_mem,team_depo_mem,direct_yest_depo,team_yest_depo,this_week_commission,total_commission,total_my_deposit_till_yest,total_direct_depo_till_yest,total_my_team_depo_till_this_month,total_my_withdr_till_yest,total_direct_withdr_till_yest,total_my_team_withdr_till_this_month,current_week_team_bet,total_my_salary,salary_achiever_member,my_withdrawal_status FROM user WHERE id = ?;";

    await queryDb(query_for_check_working_wallet, [Number(userid)])
      ?.then((result) => {
        return res.status(200).json({
          msg: "Data seccessfully fount",
          data: result,
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: `Something went wrong api calling`,
        });
      });
  } catch (e) {
    return res.status(500).json({
      msg: `Something went wrong api calling`,
    });
  }
};
exports.ticketRaised = async (req, res) => {
  const { user_id, files, type, description } = req.body;

  // Define maximum file size in bytes (e.g., 2MB)
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  // Function to calculate file size from base64 string
  const calculateBase64Size = (base64String) => {
    const padding = (base64String.match(/=*$/) || [""])[0].length; // Get the padding length
    const sizeInBytes = (base64String.length * 3) / 4 - padding;
    return sizeInBytes;
  };

  // Check if user_id is provided and valid
  if (!user_id || !type || !description) {
    return res.status(400).json({
      msg: `User ID is required`,
    });
  }

  if (Number(user_id) <= 0) {
    return res.status(400).json({
      msg: `Invalid User ID. Please refresh your page`,
    });
  }

  const id = Number(user_id);

  if (isNaN(id)) {
    return res.status(400).json({
      msg: `User ID must be a number`,
    });
  }

  // Validate the file size
  if (files) {
    const fileSize = calculateBase64Size(files.split(",")[1]); // Split the base64 data to get the actual data part
    if (fileSize > MAX_FILE_SIZE) {
      return res.status(400).json({
        msg: `File size exceeds the limit of ${
          MAX_FILE_SIZE / (1024 * 1024)
        } MB`,
      });
    }
  } else {
    return res.status(400).json({
      msg: "File data is required",
    });
  }

  try {
    const query =
      "INSERT INTO ticket_raised_table(`userid`,ticket_id,`ticket_type`,description,`file_name`) VALUES(?,?,?,?,?);";
    await queryDb(query, [
      id,
      Date.now(),
      Number(type || 1),
      description || "",
      files,
    ])
      .then((result) => {
        return res.status(200).json({
          msg: "Data saved successfully",
        });
      })
      .catch((e) => {
        console.log(e);
        return res.status(500).json({
          msg: "Something went wrong while saving data.",
        });
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};

exports.getTicketRaisedHistory = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      msg: `User ID is required`,
    });
  }

  if (Number(user_id) <= 0) {
    return res.status(400).json({
      msg: `Invalid User ID. Please refresh your page`,
    });
  }

  const id = Number(user_id);

  if (isNaN(id)) {
    return res.status(400).json({
      msg: `User ID must be a number`,
    });
  }

  try {
    const query =
      "SELECT * FROM `ticket_raised_table` WHERE userid = ? ORDER BY id DESC;";
    const results = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Data retrieved successfully",
      data: results,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getAttendanceBonus = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      msg: `User ID is required`,
    });
  }

  if (Number(user_id) <= 0) {
    return res.status(400).json({
      msg: `Invalid User ID. Please refresh your page`,
    });
  }

  const id = Number(user_id);

  if (isNaN(id)) {
    return res.status(400).json({
      msg: `User ID must be a number`,
    });
  }

  try {
    const query =
      "SELECT * FROM `leser_before_clame` WHERE `l01_user_id` = ? AND `l01_type` = 'Attendance Bonus'";
    const results = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Data retrieved successfully",
      data: results,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.clameBonus = async (req, res) => {
  const { t_id } = req.query;

  if (!t_id) {
    return res.status(400).json({
      msg: `User ID is required`,
    });
  }

  if (Number(t_id) <= 0) {
    return res.status(400).json({
      msg: `Invalid User ID. Please refresh your page`,
    });
  }

  const id = Number(t_id);

  if (isNaN(id)) {
    return res.status(400).json({
      msg: `User ID must be a number`,
    });
  }

  try {
    const query = "CALL sp_activate_clame(?,@res_msg); SELECT @res_msg;";
    const results = await queryDb(query, [id]);
    return res.status(200).json({
      msg: results?.[1]?.[0]?.["@res_msg"],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getInvitationBonus = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      msg: `User ID is required`,
    });
  }

  if (Number(user_id) <= 0) {
    return res.status(400).json({
      msg: `Invalid User ID. Please refresh your page`,
    });
  }

  const id = Number(user_id);

  if (isNaN(id)) {
    return res.status(400).json({
      msg: `User ID must be a number`,
    });
  }

  try {
    const query =
      "SELECT * FROM `leser_before_clame` WHERE `l01_user_id` = ? AND `l01_type` = 'Invitation Bonus'";
    const results = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Data retrieved successfully",
      data: results,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getWinningStreakBonus = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      msg: `User ID is required`,
    });
  }

  if (Number(user_id) <= 0) {
    return res.status(400).json({
      msg: `Invalid User ID. Please refresh your page`,
    });
  }

  const id = Number(user_id);

  if (isNaN(id)) {
    return res.status(400).json({
      msg: `User ID must be a number`,
    });
  }

  try {
    const query =
      "SELECT * FROM `leser` WHERE `l01_user_id` = ? AND `l01_type` = 'Winning Streak Bonus'";
    const results = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Data retrieved successfully",
      data: results,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getVipBonus = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      msg: `User ID is required`,
    });
  }

  if (Number(user_id) <= 0) {
    return res.status(400).json({
      msg: `Invalid User ID. Please refresh your page`,
    });
  }

  const id = Number(user_id);

  if (isNaN(id)) {
    return res.status(400).json({
      msg: `User ID must be a number`,
    });
  }

  try {
    const query =
      "SELECT * FROM `leser` WHERE `l01_user_id` = ? AND `l01_type` = 'VIP BONUS'";
    const results = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Data retrieved successfully",
      data: results,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getDailySalary = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      msg: `User ID is required`,
    });
  }

  if (Number(user_id) <= 0) {
    return res.status(400).json({
      msg: `Invalid User ID. Please refresh your page`,
    });
  }

  const id = Number(user_id);

  if (isNaN(id)) {
    return res.status(400).json({
      msg: `User ID must be a number`,
    });
  }

  try {
    const query =
      "SELECT * FROM `leser` WHERE `l01_user_id` = ? AND `l01_type` = 'Daily Income'";
    const results = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Data retrieved successfully",
      data: results,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getDepositBonus = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      msg: `User ID is required`,
    });
  }

  if (Number(user_id) <= 0) {
    return res.status(400).json({
      msg: `Invalid User ID. Please refresh your page`,
    });
  }

  const id = Number(user_id);

  if (isNaN(id)) {
    return res.status(400).json({
      msg: `User ID must be a number`,
    });
  }

  try {
    const query =
      "SELECT * FROM `leser` WHERE `l01_user_id` = ? AND `l01_type` = 'Deposit Bonus'";
    const results = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Data retrieved successfully",
      data: results,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.forGetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      msg: `Email is required`,
    });
  }
  try {
    const query = "SELECT * FROM `user` WHERE `email` = ? LIMIT 1;";
    const results = await queryDb(query, [email]);

    if (results?.length <= 0)
      return res.status(200).json({
        msg: "Your Email is not registered.",
      });
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const query_for_insert_otp =
      "CALL sp_forget_password(1,?,?,?,@res_msg); SELECT @res_msg;";
    await queryDb(query_for_insert_otp, [results?.[0]?.email, otp, ""])
      .then(async (result) => {
        console.log(result);
        if (result?.[1]?.[0]?.["@res_msg"] === "1")
          return res.status(200).json({
            msg: "OTP alredy send ,Your OTP is valid upto 5 min , Please try after some time.",
          });
        const response = await mailSender(
          results?.[0]?.email,
          `Dear, ${results?.[0]?.full_name}`,
          otpTemplate(otp)
        );
        if (response === "250 OK")
          return res.status(200).json({
            msg: result?.[1]?.[0]?.["@res_msg"],
          });
        else
          return res.status(200).json({
            msg: "OTP Does not sent , Contact to Admin.",
          });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: "Something went wrong in the node API",
        });
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.veryFyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      msg: `Email and otp is required`,
    });
  }

  try {
    const query_for_insert_otp =
      "CALL sp_forget_password(2,?,?,?,@res_msg); SELECT @res_msg;";
    await queryDb(query_for_insert_otp, [email, otp, ""])
      .then(async (result) => {
        return res.status(200).json({
          msg: result?.[1]?.[0]?.["@res_msg"],
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: "Something went wrong in the node API",
        });
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.updatePassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      msg: `Email and otp is required`,
    });
  }

  try {
    const query_for_insert_otp =
      "CALL sp_forget_password(3,?,?,?,@res_msg); SELECT @res_msg;";
    await queryDb(query_for_insert_otp, [email, 1213, password])
      .then(async (result) => {
        return res.status(200).json({
          msg: result?.[1]?.[0]?.["@res_msg"],
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: "Something went wrong in the node API",
        });
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.payInRequest = async (req, res) => {
  // const userid = req.userid;
  const {
    userid,
    req_amount,
    utr_no,
    deposit_type,
    bank_upi_table_id,
    receipt_image,
  } = req.body;
  if (
    !userid ||
    !req_amount ||
    !utr_no ||
    !deposit_type ||
    !bank_upi_table_id ||
    !receipt_image
  )
    return res.status(201)?.json({
      msg: "Everything is required.",
    });
  try {
    const query =
      "CALL sp_manual_fund_request(?,?,?,?,?,?,?,?,@res_msg); SELECT @res_msg;";
    await queryDb(query, [
      1,
      Number(userid),
      Number(req_amount || 0),
      utr_no,
      Number(deposit_type),
      Number(bank_upi_table_id),
      1,
      receipt_image,
    ])
      .then((result) => {
        return res.status(200).json({
          msg: result?.[1]?.[0]?.["@res_msg"],
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: "Something went wrong in the node API",
        });
      });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went worng in node api",
    });
  }
};
exports.payOutRequest = async (req, res) => {
  const { req_type, u_user_id, request_amount } = req.body;
  if (!u_user_id || !req_type || !request_amount)
    return res.status(201)?.json({
      msg: "Everything is required.",
    });
  try {
    const query =
      "CALL sp_for_withdrawal_request(?,?,?,?,?,@res_msg); SELECT @res_msg;";
    await queryDb(query, [
      1,
      Number(req_type),
      Number(u_user_id),
      Number(request_amount || 0),
      1,
    ])
      .then((result) => {
        return res.status(200).json({
          msg: result?.[1]?.[0]?.["@res_msg"],
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: "Something went wrong in the node API",
        });
      });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went worng in node api",
    });
  }
};
exports.getDepositHistoryUSDT = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      msg: `User ID is required`,
    });
  }

  if (Number(user_id) <= 0) {
    return res.status(400).json({
      msg: `Invalid User ID. Please refresh your page`,
    });
  }

  const id = Number(user_id);

  if (isNaN(id)) {
    return res.status(400).json({
      msg: `User ID must be a number`,
    });
  }

  try {
    const query =
      "SELECT * FROM `tr15_fund_request` WHERE `tr15_uid` = ? AND `type` = 1 AND `usdt_type` IS NOT NULL ORDER BY `tr15_id` DESC;";
    const results = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Data retrieved successfully",
      data: results,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getWithdrawalHistoryUSDT = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      msg: `User ID is required`,
    });
  }

  if (Number(user_id) <= 0) {
    return res.status(400).json({
      msg: `Invalid User ID. Please refresh your page`,
    });
  }

  const id = Number(user_id);

  if (isNaN(id)) {
    return res.status(400).json({
      msg: `User ID must be a number`,
    });
  }

  try {
    const query =
      "SELECT * FROM `tr15_fund_request` WHERE `tr15_uid` = ? AND `type` = 2 AND `usdt_type` IS NOT NULL ORDER BY `tr15_id` DESC;";
    const results = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Data retrieved successfully",
      data: results,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};