const schedule = require("node-cron");
const {
  queryDb,
  functionToreturnDummyResult,
  getAlredyPlacedBet,
  getAlredyPlacedBetOnWingo,
  queryDb2,
  randomStrNumeric,
} = require("../helper/adminHelper");
const moment = require("moment");
const soment = require("moment-timezone");
const { default: axios } = require("axios");
const { failMsg } = require("../helper/helperResponse");
const mailSender = require("../utils/Nodemailer");
const registrationSuccessfully = require("../templets/registrationSuccessfully");
const { passwordUpdated } = require("../templets/passwordUpdate");
const otpTemplate = require("../templets/emailVerificationTemplate");
const otpGenerator = require("otp-generator");
const sequelize = require("../config/seq.config");
const jwt = require("jsonwebtoken");

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
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  const { old_pass, new_pass, confirm_new_pass } = req.body;
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
  const data = req.userid;
  if (!data)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
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
exports.getGameHistoryTC = async (req, res) => {
  try {
    let query =
      "SELECT * FROM tr42_win_slot WHERE tr41_packtype = 1 ORDER BY tr_transaction_id DESC LIMIT 1";
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
  const data = req.userid;
  if (!data)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  const { gameid } = req.query;

  if (!gameid || !data) {
    return res.status(400).json({
      msg: "gameid and userid are required",
    });
  }
  const num_gameid = Number(gameid);
  const num_userid = Number(data);

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
  const data = req.userid;
  if (!data)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  const { gameid } = req.query;

  if (!gameid || !data) {
    return res.status(400).json({
      // Changed to 400 for bad request
      msg: "gameid and userid are required",
    });
  }
  const num_gameid = Number(gameid);
  const num_userid = Number(data);

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
    return res.status(500).json({
      msg: `Something went wrong api calling`,
    });
  }
};

exports.placeBetTrx = async (req, res) => {
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  const { amount, gameid, gamesnio, number } = req.body;
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
  await queryDb(
    "SELECT number FROM trx_colour_bet WHERE gamesno = ? AND userid = ? AND gameid = ? AND status = 0;",
    [
      String(Number(get_round_number?.[0]?.tr_tranaction_id) + 1),
      String(userid),
      num_gameid,
    ]
  ).then(async (result) => {
    if (
      [10, 20, 30]?.includes(Number(number)) &&
      result?.find((i) => [10, 20, 30]?.includes(Number(i?.number))) &&
      Number(
        result?.find((i) => [10, 20, 30]?.includes(Number(i?.number)))?.number
      ) !== Number(number)
    ) {
      return res.status(200).json({
        msg: `Already Placed on color`,
      });
    } else if (
      [40, 50]?.includes(Number(number)) &&
      result?.find((i) => [40, 50]?.includes(Number(i?.number))) &&
      Number(
        result?.find((i) => [40, 50]?.includes(Number(i?.number)))?.number
      ) !== Number(number)
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
        const query = `CALL trx_bet_placed(?, ?, ?, ?, @result_msg);`;
        try {
          await queryDb(query, [
            String(userid),
            Number(num_gameid),
            String(amount),
            String(number),
          ]);
          await queryDb("SELECT @result_msg;", [])
            .then((result) => {
              res.status(200).json({
                error: "200",
                msg: result?.[0]?.["@result_msg"],
              });
            })
            .catch((e) => {
              return res.status(500).json({
                msg: "Something went wrong with the API call",
              });
            });
        } catch (error) {
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
  const { password, username, ipAddress, u_finger_id } = req.body;
  if (!password || !username || !u_finger_id)
    return res.status(200).json({
      msg: `Everything is required`,
    });

  try {
    const query = `CALL sp_for_login_user(?,?,?,?,?,@user_id,@msg);`;
    await sequelize.query(query, {
      replacements: [
        username,
        username,
        password,
        String(ipAddress || ""),
        u_finger_id,
      ],
    });

    const query_for_get_response = "SELECT @user_id,@msg;";
    const [data] = await sequelize.query(query_for_get_response);

    const query_for_get_type = "SELECT user_type FROM user WHERE id = ?;";
    const user_type = await sequelize.query(query_for_get_type, {
      replacements: [Number(data?.[0]?.["@user_id"])],
    });
    const payload = {
      username: username,
      password: password,
      userid: data?.[0]?.["@user_id"],
      user_type: user_type?.[0]?.[0]?.user_type,
    };
    try {
      token = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 60,
          data: payload,
          algorithm: "RS256",
        },
        process.env.JWT_SECRET
      );
    } catch (e) {
      console.log("Error in jwt token encript.");
    }

    if (data?.[0]?.["@msg"] === "Login Successfully") {
      const update_token_user =
        "UPDATE login_credentitals SET token = ? WHERE u_userid = ?;";
      sequelize.query(update_token_user, {
        replacements: [token, data?.[0]?.["@user_id"]],
      });
    }
    // .cookie("anandCookie", token).
    return res.status(200).json({
      msg: data?.[0]?.["@msg"],
      token: token,
      UserID: data?.[0]?.["@user_id"] || 0,
      user_type: user_type?.[0]?.[0]?.user_type,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went worng in node api",
    });
  }
};
exports.signupUser = async (req, res) => {
  const {
    mobile,
    email,
    name,
    pass,
    confirmpass,
    refid,
    u_finger_id,
    through,
  } = req.body;
  if (
    !mobile ||
    !email ||
    !name ||
    !pass ||
    !confirmpass ||
    !refid ||
    !u_finger_id ||
    !through
  )
    return res.status(201).json({
      msg: `Everything is required`,
    });
  if (pass !== confirmpass)
    return res.status(201).json({
      msg: `Password and confirm password doesn't match.`,
    });
  try {
    let str = randomStrNumeric(7);
    let randomId = "ZG" + str;
    const replacement = [
      String(randomId),
      mobile,
      email,
      name,
      pass,
      Number(refid),
      Number(through) === 1 ? "Approve" : u_finger_id,
    ];
    const callsignupSp = "CALL registration_user(?,?,?,?,?,?,?,@result_msg);";
    await queryDb(callsignupSp, replacement);
    await queryDb("SELECT @result_msg;", [])
      .then(async (newresult) => {
        // await mailSender(
        //   email,
        //   `Congcongratulations,${name}`,
        //   registrationSuccessfully(name, mobile, pass)
        // );
        return res.status(200).json({
          msg: newresult?.[0]?.["@result_msg"],
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
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  if (!userid)
    return res.status(200).json({
      msg: `Everything is required`,
    });

  try {
    const query =
      "SELECT id,full_name,username,mobile,status,winning_wallet,wallet FROM `user` WHERE username = ? LIMIT 1;";
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
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
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
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
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
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  const { gameid, limit } = req.query;

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
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  const { amount, gameid, number } = req.body;
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

  await queryDb(
    "SELECT number FROM colour_bet WHERE gamesno = ? AND userid = ? AND gameid = ? AND status = 0;",
    [
      String(Number(get_round_number?.[0]?.win_transactoin) + 1),
      String(userid),
      Number(gameId),
    ]
  ).then(async (result) => {
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
        const query = `CALL wingo_bet_placed(?, ?, ?, ?, @result_msg);`;
        try {
          await queryDb(query, [
            String(userid),
            Number(gameId),
            String(amount),
            String(number),
          ]);
          await queryDb("SELECT @result_msg;", [])
            .then((result) => {
              res.status(200).json({
                error: "200",
                msg: result?.[0]?.["@result_msg"],
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
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
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
    const userid = req.userid;
    if (!userid)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { level_id } = req.query;
    if (!userid)
      return res.status(201).json({
        msg: "Please provide uesr id.",
      });
    const id_in_number = Number(userid);
    if (typeof id_in_number !== "number")
      return res.status(201).json({
        msg: "Something went wrong.",
      });
    let q = "";
    let replacement = [];
    if (!level_id) {
      q =
        "SELECT m.`level_id`,COUNT(m.`id`) AS cnt,IFNULL(SUM(IFNULL(m.`first_deposit_amnt`,0)),0) AS total_deposit,IFNULL(SUM(IFNULL(u.`today_betting_by_user`,0)),0) AS total_bet FROM `manage_team_data` AS m INNER JOIN `user` AS u ON u.id = m.`parent_id` WHERE m.`member_id` = ? GROUP BY m.`level_id`;";
      replacement.push(Number(id_in_number));
    } else {
      q =
        "SELECT m.`level_id`,u.`username`,u.`full_name`,u.`mobile`,u.`today_betting_by_user`,m.`first_deposit_amnt`,m.`registr_date`,m.`first_depo_date`, (SELECT s.username FROM `user` AS s WHERE s.id = u.`referral_user_id`) AS spon_id, (SELECT s.full_name FROM `user` AS s WHERE s.id = u.`referral_user_id`) AS spon_name, IFNULL(m.`first_deposit_amnt`,0) AS total_deposit,IFNULL(u.`total_betting_by_user`,0) AS total_bet FROM `manage_team_data` AS m INNER JOIN `user` AS u ON u.id = m.`parent_id` WHERE m.`member_id` = ? AND m.`level_id` = ?;";
      replacement.push(Number(id_in_number), Number(level_id));
    }
    await queryDb(q, replacement) ///////////////////// second parameter should be (level+1)
      .then((result) => {
        return res.status(200).json({
          msg: "Data get successfully",
          data: result,
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
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });

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
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });

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
  const m_u_id = req.userid;
  if (!m_u_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  const { address, usdt_type } = req.body; // 1 for BEP20, 2 for TRC20
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
  const m_u_id = req.userid;
  if (!m_u_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
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
    const id = req.userid;
    if (!id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!id)
      return res.status(200).json({
        msg: `Everything is required`,
      });
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
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!user_id)
      return res.status(200).json({
        msg: `Everything is required`,
      });
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
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!user_id)
      return res.status(200).json({
        msg: `Everything is required`,
      });
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
  }
};
exports.needToBet = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!user_id)
      return res.status(200).json({
        msg: `Everything is required`,
      });
    if (!user_id) {
      return res.status(201).json({
        msg: "Please provide id.",
      });
    }

    const query_for_get_referral_bonus =
      "SELECT need_to_bet_for_withdrawal(?) AS amount;";
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
  }
};
exports.getDailySalaryIncome = async (req, res) => {
  try {
    const id = req.userid;
    if (!id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!id)
      return res.status(200).json({
        msg: `Everything is required`,
      });
    if (!id) {
      return res.status(201).json({
        msg: "Please provide id.",
      });
    }

    const query_for_get_referral_bonus =
      "SELECT * FROM `leser_before_clame` WHERE l01_user_id = ? AND l01_type = 'Daily Income' ORDER BY DATE(l01_date) DESC;";
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
    const id = req.userid;
    if (!id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!id)
      return res.status(200).json({
        msg: `Everything is required`,
      });
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
  const user_id = req.userid;
  if (!user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  if (!user_id)
    return res.status(200).json({
      msg: `Everything is required`,
    });
  try {
    const query = "SELECT * FROM `admin_setting` WHERE id IN (14,15,16,21,22)";
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
  const user_main_id = req.userid;
  if (!user_main_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  if (!user_main_id)
    return res.status(200).json({
      msg: `Everything is required`,
    });
  try {
    const { level_no, in_date } = req.body;
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
    await queryDb(query, params)
      ?.then((result) => {
        res.status(200).json({
          msg: `Data get successfully`,
          data: result?.[0],
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

exports.getAllCommission = async (req, res) => {
  const user_main_id = req.userid;
  if (!user_main_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  if (!user_main_id)
    return res.status(200).json({
      msg: `Everything is required`,
    });
  try {
    const { in_date } = req.body;

    if (!user_main_id || !in_date)
      return res.status(201).json({
        msg: `Please provide everything`,
      });
    const query = "CALL sp_get_commission_details_perday(?,?);";
    const params = [
      Number(user_main_id),
      moment(in_date)?.format("YYYY-MM-DD"),
    ];
    const result = await queryDb2(query, params)
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
    const userid = req.userid;
    if (!userid)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!userid)
      return res.status(200).json({
        msg: `Everything is required`,
      });
    const { amount, password } = req.body;

    if (!userid || !amount || !password)
      return res.status(201).json({
        msg: `Please provide everything`,
      });

    if (Number(amount) <= 0)
      return res.status(201).json({
        msg: `Please Enter Your Amount.`,
      });

    const query_for_check_working_wallet =
      "CALL sp_transfer_amount_working_wallet_to_main_wallet(?,?,?,?,@result_msg);";

    await queryDb(query_for_check_working_wallet, [
      Number(amount)?.toFixed(4),
      Number(userid),
      String(Date.now()),
      password,
    ]);
    await queryDb("SELECT @result_msg;", [])
      ?.then((result) => {
        return res.status(200).json({
          msg: result?.[0]?.["@result_msg"],
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
    const userid = req.userid;
    if (!userid)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

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
    const userid = req.userid;
    if (!userid)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    if (!userid)
      return res.status(201).json({
        msg: `Please provide everything`,
      });

    const query_for_check_working_wallet =
      "SELECT * FROM leser WHERE `l01_user_id` = ? AND `l01_type` = 'Caseback' ORDER BY lo1_id DESC;";

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
exports.getCompanyPromoterBonusList = async (req, res) => {
  try {
    const userid = req.userid;
    if (!userid)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    if (!userid)
      return res.status(201).json({
        msg: `Please provide everything`,
      });

    const query_for_check_working_wallet =
      "SELECT * FROM leser WHERE `l01_user_id` = ? AND `l01_type` = 'Company Promoter' ORDER BY lo1_id DESC;";

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
    const userid = req.userid;
    if (!userid)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!userid)
      return res.status(201).json({
        msg: `Please provide everything`,
      });

    const query_for_check_working_wallet = "SELECT * FROM user WHERE id = ?;";

    await queryDb(query_for_check_working_wallet, [Number(userid)])
      ?.then((result) => {
        return res.status(200).json({
          msg: "Data seccessfully fount",
          data: result?.[0],
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
  const user_id = req.userid;
  if (!user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  const { files, type, description } = req.body;

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
      msg: `Everything is required.`,
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
  const user_id = req.userid;
  if (!user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });

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
  const user_id = req.userid;
  if (!user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });

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
      "SELECT * FROM `leser_before_clame` WHERE `l01_user_id` = ? AND `l01_type` = 'Attendance Bonus' ORDER BY lo1_id DESC;";
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
    const query = "CALL sp_coupon_handler(2,1,1,?,@res_msg);";
    await queryDb(query, [id]);
    const results = await queryDb("SELECT @res_msg;", []);
    return res.status(200).json({
      msg: results?.[0]?.["@res_msg"],
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getInvitationBonus = async (req, res) => {
  const user_id = req.userid;
  if (!user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });

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
      "SELECT * FROM `leser_before_clame` WHERE `l01_user_id` = ? AND `l01_type` = 'Invitation Bonus' ORDER BY lo1_id DESC;";
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
exports.getTeamRechargeBonus = async (req, res) => {
  const user_id = req.userid;
  if (!user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
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
      "SELECT * FROM `leser` WHERE `l01_user_id` = ? AND `l01_type` = 'Team  Referral First Recharge Salary' ORDER BY lo1_id DESC;";
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
  const user_id = req.userid;
  if (!user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });

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
      "SELECT * FROM `leser` WHERE `l01_user_id` = ? AND `l01_type` = 'VIP BONUS' ORDER BY lo1_id DESC;";
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
  const user_id = req.userid;
  if (!user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });

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
      "SELECT * FROM `leser` WHERE `l01_user_id` = ? AND `l01_type` = 'Daily Income' ORDER BY lo1_id DESC;";
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
  const user_id = req.userid;
  if (!user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });

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
      "SELECT * FROM `leser` WHERE `l01_user_id` = ? AND `l01_type` = 'Deposit Bonus' ORDER BY lo1_id DESC;";
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
    await queryDb2(query_for_insert_otp, [results?.[0]?.email, otp, ""])
      .then(async (result) => {
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
    await queryDb(query_for_insert_otp, [email, otp, ""]);
    await queryDb("SELECT @res_msg;", [])
      .then(async (result) => {
        return res.status(200).json({
          msg: result?.[0]?.["@res_msg"],
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
    await queryDb(query_for_insert_otp, [email, 1213, password]);
    await queryDb("SELECT @res_msg;", [])
      .then(async (result) => {
        return res.status(200).json({
          msg: result?.[0]?.["@res_msg"],
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
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  const { req_amount, utr_no, deposit_type, bank_upi_table_id, receipt_image } =
    req.body;
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
    const query = "CALL sp_manual_fund_request(?,?,?,?,?,?,?,?,?,@res_msg);";
    await queryDb(query, [
      1,
      Number(userid),
      Number(req_amount || 0),
      utr_no,
      Number(deposit_type),
      Number(bank_upi_table_id),
      1,
      receipt_image,
      "",
    ]);
    await queryDb("SELECT @res_msg;", [])
      .then((result) => {
        return res.status(200).json({
          msg: result?.[0]?.["@res_msg"],
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
      msg: "Something went worng in node api",
    });
  }
};
exports.payOutRequest = async (req, res) => {
  const u_user_id = req.userid;
  if (!u_user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  const { req_type, request_amount } = req.body;
  if (!u_user_id || !req_type || !request_amount)
    return res.status(201)?.json({
      msg: "Everything is required.",
    });
  try {
    const query = "CALL sp_for_withdrawal_request(?,?,?,?,?,?,@res_msg);";
    await queryDb(query, [
      1,
      Number(req_type),
      Number(u_user_id),
      Number(request_amount || 0),
      1,
      "",
    ]);
    await queryDb("SELECT @res_msg;", [])
      .then((result) => {
        return res.status(200).json({
          msg: result?.[0]?.["@res_msg"],
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
  const user_id = req.userid;
  if (!user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });

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
  const user_id = req.userid;
  if (!user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });

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
exports.getAdminQrAddress = async (req, res) => {
  const user_id = req.userid;
  if (!user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  if (!user_id)
    return res.status(200).json({
      msg: `Everything is required`,
    });
  try {
    const query = "SELECT * FROM `admin_usdt_address`;";
    const results = await queryDb(query, []);

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
exports.getProfileData = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!user_id)
      return res.status(200).json({
        msg: `Everything is required`,
      });

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
    const query = "SELECT * FROM `user` WHERE id = ?;";
    const results = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Data retrieved successfully",
      data: results?.[0],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getDepositHistoryINR = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!user_id)
      return res.status(200).json({
        msg: `Everything is required`,
      });

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
    const query =
      "SELECT `tr15_amt`,`Deposit_type`,`tr15_trans`,`tr15_status`,`success_date` FROM `tr15_fund_request` WHERE `tr15_uid`= ? AND `type` = 1 AND `usdt_type` = 4 ORDER BY `tr15_id` DESC;";
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
exports.getWihdrawalHistoryINR = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!user_id)
      return res.status(200).json({
        msg: `Everything is required`,
      });

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
    const query =
      "SELECT `tr15_amt`,`Deposit_type`,`tr15_trans`,`tr15_status`,`success_date`,`tr15_date` FROM `tr15_fund_request` WHERE `tr15_uid`= ? AND `type` = 2 AND `usdt_type` = 4 ORDER BY `tr15_id` DESC;";
    const results = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Data retrieved successfully",
      data: results,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.addBankAddress = async (req, res) => {
  const user_id = req.userid;
  if (!user_id)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  if (!user_id)
    return res.status(200).json({
      msg: `Everything is required`,
    });
  try {
    const { bank_name, mobile, email, name, ifsc_code, account_number } =
      req.body;
    if (
      !user_id ||
      !bank_name ||
      !mobile ||
      !email ||
      !name ||
      !ifsc_code ||
      !account_number
    ) {
      return res.status(400).json({
        msg: `Everything is required`,
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
    const query = "SELECT id FROM `bank` WHERE `user_id` = ? LIMIT 1;";
    const results = await queryDb(query, [id]);

    if (results?.length >= 1)
      return res.status(200).json({
        msg: "Bank Already Exist.",
      });

    const query_for_add_bank =
      "INSERT INTO `bank`(`user_id`,`holder_name`,`bank_name`,`account`,`ifsc`,`email`,`mobile`,`status`) VALUES(?,?,?,?,?,?,?,?);";
    await queryDb(query_for_add_bank, [
      id,
      name,
      bank_name,
      account_number,
      ifsc_code,
      email,
      mobile,
      1,
    ])
      .then((result) => {
        return res.status(200).json({
          msg: "Bank Add Successfully.",
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: "Something went wrong in the node API",
        });
      });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};

exports.userBankDetails = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!user_id)
      return res.status(200).json({
        msg: `Everything is required`,
      });

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
    const query = "SELECT * FROM `bank` WHERE `user_id` = ? LIMIT 1;";
    const results = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Data retrieved successfully",
      data: results,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.userGetLevelData = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!user_id)
      return res.status(200).json({
        msg: `Everything is required`,
      });

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
    const query = `
    SELECT 
      (
        SELECT IFNULL(SUM(l01_amount), 0) 
        FROM leser 
        WHERE DATE(l01_date) = DATE(NOW()) 
          AND l01_user_id = ? 
          AND l01_type IN ('Level', 'Winning Streak Bonus')
      ) AS yesterday_income,
      
      (
        SELECT IFNULL(SUM(l01_amount), 0) 
        FROM leser 
        WHERE DATE(l01_date) = DATE(NOW()) 
          AND l01_user_id = ? 
          AND l01_type IN ('Daily Income')
      ) AS daily_salary_today,
      
      (
        SELECT IFNULL(SUM(l01_amount), 0) 
        FROM leser 
        WHERE l01_user_id = ? 
          AND l01_type IN ('Daily Income')
      ) AS daily_salary_total,
      
      (
        SELECT IFNULL(SUM(tr15_amt), 0) 
        FROM tr15_fund_request 
        WHERE tr15_uid = ? 
          AND tr15_status = 2 
          AND type = 2 
          AND success_date IS NOT NULL
      ) AS total_withdrawal,
      
      (
        SELECT IFNULL(SUM(tr15_amt), 0) 
        FROM tr15_fund_request 
        WHERE tr15_uid = ? 
          AND tr15_status = 2 
          AND type = 2 
          AND success_date IS NOT NULL 
          AND DATE(success_date) = DATE(NOW())
      ) AS today_withdrawal,
      
      (
        SELECT fn_get_commission_total(?)
      ) AS this_week_commission,
      
      (
        SELECT fn_get_commission_today(?)
      ) AS total_commission;
    `;

    const results = await queryDb(query, [id, id, id, id, id, id, id]);

    return res.status(200).json({
      msg: "Data retrieved successfully",
      data: results,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.hideStatusOfDepositPopup = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!user_id)
      return res.status(200).json({
        msg: `Everything is required`,
      });

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
    const query = "UPDATE user SET status_of_deposit_popup = 0 WHERE id = ?;";
    await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Status Updated successfully",
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getGiftCardList = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!user_id)
      return res.status(200).json({
        msg: `Everything is required`,
      });

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
    const query =
      "SELECT g.*,a.`coupon_amount`,a.`coupon_code`,a.`created_at` AS coupon_born FROM `get_coupon_user` AS g LEFT JOIN `admin_coupon_code` AS a ON g.`coupon_id` = a.`id` WHERE `user_id` = ?;";
    const result = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Gift List get successfully.",
      data: result,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.clameGiftCard = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    if (!user_id)
      return res.status(200).json({
        msg: `Everything is required`,
      });
    const { t_id } = req.body;

    if (!user_id || !t_id) {
      return res.status(400).json({
        msg: `User ID and t_id is required`,
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

    const query =
      "CALL sp_gift_card(2,'12345','2024-10-12 12:20:10','2024-10-12 12:20:10',12,?,?,12.2,@response_msg);";
    await queryDb(query, [String(t_id), id]);
    const result = await queryDb("SELECT @response_msg;", []);
    return res.status(200).json({
      msg: "Gift List get successfully.",
      data: result?.[0]?.["@response_msg"],
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getGiftBonusList = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

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
    const query =
      "SELECT * FROM leser WHERE `l01_user_id` = ? AND `l01_type` = 'Coupon' ORDER BY lo1_id DESC;";
    const result = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Gift List get successfully.",
      data: result,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getWelcomeBonusListUser = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

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
    const query =
      "SELECT * FROM leser WHERE `l01_user_id` = ? AND `l01_type` = 'Welcome' ORDER BY lo1_id DESC;";
    const result = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Gift List get successfully.",
      data: result,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getFundTransferHistory = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

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
    const query =
      "SELECT * FROM leser WHERE `l01_user_id` = ? AND `l01_type` = 'P_2_P_Transfer' ORDER BY lo1_id DESC;";
    const result = await queryDb(query, [id]);

    return res.status(200).json({
      msg: "Gift List get successfully.",
      data: result,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};

exports.sendRegistrationOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      msg: `Email is required`,
    });
  }
  try {
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const query_for_insert_otp =
      "CALL sp_for_otp_registration(1,?,?,@res_msg);";
    await queryDb(query_for_insert_otp, [email, otp]);
    await queryDb("SELECT @res_msg;", [])
      .then(async (result) => {
        if (result?.[0]?.["@res_msg"] === "1")
          return res.status(200).json({
            msg: "OTP alredy send ,Your OTP is valid upto 5 min , Please try after some time.",
          });
        const response = await mailSender(
          email,
          `ONE TIME PASSWORD FROM BNG.LIVE`,
          otpTemplate(otp)
        );
        if (response?.rejected?.length === 0)
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
exports.verifyRegistrationOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      msg: `Email and otp is required`,
    });
  }

  try {
    const query_for_insert_otp =
      "CALL sp_for_otp_registration(2,?,?,@res_msg);";
    await queryDb(query_for_insert_otp, [email, otp]);
    await queryDb("SELECT @res_msg;", [])
      .then(async (result) => {
        return res.status(200).json({
          msg: result?.[0]?.["@res_msg"],
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: "Something went wrong in the node API",
        });
      });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.p2pFundTransfer = async (req, res) => {
  try {
    const from_id = req.userid;
    if (!from_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { from_wallet_type, to_id, transfer_amount, from_password } =
      req.body;
    if (
      !from_id ||
      !from_wallet_type ||
      !to_id ||
      !transfer_amount ||
      !from_password
    )
      return res.status(201).json({
        msg: "Everything is required",
      });

    let q = "CALL sp_fund_transfer(?,?,?,?,?,@res_msg);";
    await queryDb(q, [
      from_password || "",
      Number(from_id),
      Number(from_wallet_type),
      Number(to_id),
      Number(transfer_amount),
    ]);

    await queryDb("SELECT @res_msg;", [])
      .then(async (result) => {
        return res.status(200).json({
          msg: result?.[0]?.["@res_msg"],
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: "Something went wrong in the node API",
        });
      });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getZPDepositlHistory = async (req, res) => {
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });

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
    const query =
      "SELECT `zp_token`,`tr15_amt`,`Deposit_type`,`user_wallet_address`,`transaction_hash`,`tr15_trans`,`tr15_status`,`success_date` FROM `tr15_fund_request` WHERE `tr15_uid`= ? AND `type` = 1 AND `usdt_type` = 3 ORDER BY `tr15_id` DESC;";
    await queryDb(query, [Number(num_userid)])
      .then((newresult) => {
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
exports.getZPWithdrawallHistory = async (req, res) => {
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });

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
    const query =
      "SELECT `zp_token`,`tr15_amt`,`Deposit_type`,`user_wallet_address`,`transaction_hash`,`tr15_trans`,`tr15_status`,`success_date` FROM `tr15_fund_request` WHERE `tr15_uid`= ? AND `type` = 2 AND `usdt_type` = 3 ORDER BY `tr15_id` DESC;";
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
