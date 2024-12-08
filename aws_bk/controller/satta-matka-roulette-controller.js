const sequelize = require("../config/seq.config");
const moment = require("moment")
exports.betPlacedRoulette = async (req, res) => {
  const userid = req.userid;
  const { bet_array } = req.body;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  if (!bet_array)
    return res.status(201)?.json({
      msg: "Plese place bet first.",
    });

  const decodeJson = JSON.parse(bet_array)?.bet_array;
  if (decodeJson?.length === 0) {
    return res.status(201)?.json({
      msg: "Plese place bet first.",
    });
  }

  try {
    let amount_user_string = "";
    let number_user = "";
    let amount_user = 0;
    decodeJson.forEach((element, index) => {
      amount_user_string += String(element?.amount);
      number_user += String(element?.number);
      amount_user += Number(element?.amount || 0);
      if (index < decodeJson.length - 1) {
        amount_user_string += ",";
        number_user += ",";
      }
    });

    const replacement = [
      String(userid),
      String(amount_user),
      number_user,
      amount_user_string,
    ];
    const query_for_bet_placing =
      "CALL roulette_bet_placed(?,?,?,?,@result_msg);";
    await sequelize.query(query_for_bet_placing, {
      replacements: replacement,
    });
    const query_for_get_response = "SELECT @result_msg;";
    const [data] = await sequelize.query(query_for_get_response);
    return res.status(200)?.json({
      msg: data?.[0]?.["@result_msg"],
    });
  } catch (e) {
    console.log(e)
    return res.status(500).json({
      msg: "Something went worng in node api",
    });
  }
};
exports.getMyHistoryRoulette = async (req, res) => {
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  try {
    const query =
      " SELECT * FROM `roulette_bet` WHERE `userid` = ? ORDER BY id DESC LIMIT 20;";
    const [result] = await sequelize.query(query, {
      replacements: [Number(userid)],
    });
    return res.status(200).json({
      msg: "Get balance successfully.",
      data: result,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went worng in node api",
    });
  }
};
exports.getRouletteGameHistory = async (req, res) => {
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  try {
    const query =
      " SELECT * FROM `roulette_results` ORDER BY id DESC LIMIT 10;";
    const [result] = await sequelize.query(query, {
      replacements: [Number(userid)],
    });
    return res.status(200).json({
      msg: "Get balance successfully.",
      data: result,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went worng in node api",
    });
  }
};
exports.betPlacedSatta = async (req, res) => {
  const userid = req.userid;
  const { bet_array, satta_type_user } = req.body;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  if (!bet_array)
    return res.status(201)?.json({
      msg: "Plese place bet first.",
    });
  if (!satta_type_user)
    return res.status(201)?.json({
      msg: "Satta type is missing.",
    });

  const decodeJson = JSON.parse(bet_array);
  if (decodeJson?.length === 0) {
    return res.status(201)?.json({
      msg: "Plese place bet first.",
    });
  }

  try {
    let amount_user_string = "";
    let number_user = "";
    let amount_user = 0;
    decodeJson.forEach((element, index) => {
      amount_user_string += String(element?.amount);
      number_user += String(element?.number);
      amount_user += Number(element?.amount || 0);
      if (index < decodeJson.length - 1) {
        amount_user_string += ",";
        number_user += ",";
      }
    });

    const replacement = [
      Number(satta_type_user),
      String(userid),
      String(amount_user),
      number_user,
      amount_user_string,
    ];
    const query_for_bet_placing =
      "CALL satta_bet_placed(?,?,?,?,?,@result_msg);";
    await sequelize.query(query_for_bet_placing, {
      replacements: replacement,
    });
    const query_for_get_response = "SELECT @result_msg;";
    const [data] = await sequelize.query(query_for_get_response);
    return res.status(200)?.json({
      msg: data?.[0]?.["@result_msg"],
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went worng in node api",
    });
  }
};
exports.getSattaGameHistoryLastFour = async (req, res) => {
  try {
    const query =
      "SELECT (SELECT number FROM `satta_results` WHERE satta_type = 1 ORDER BY id DESC LIMIT 1) AS gaziyabad,(SELECT number FROM `satta_results` WHERE satta_type = 2 ORDER BY id DESC LIMIT 1) AS faridabad,(SELECT number FROM `satta_results` WHERE satta_type = 3 ORDER BY id DESC LIMIT 1) AS gali,(SELECT number FROM `satta_results` WHERE satta_type = 4 ORDER BY id DESC LIMIT 1) AS disawar FROM `satta_results` LIMIT 1; ";
    const [result] = await sequelize.query(query);
    return res.status(200).json({
      msg: "Get balance successfully.",
      data: result,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went worng in node api",
    });
  }
};
exports.getSattaGameHistory = async (req, res) => {
  try {
    const { startDate, endDate, satta_type } = req.body;
    let query = "";
    if (Number(satta_type) === 1)
      query =
        "SELECT number,gamesno,`datetime`,satta_type FROM `satta_results` WHERE satta_type = 1 AND DATE(`datetime`) >=  DATE(?)  AND DATE(`datetime`) <=  DATE(?) ORDER BY id DESC";
    else if (Number(satta_type) === 2)
      query =
        "SELECT number,gamesno,`datetime`,satta_type FROM `satta_results` WHERE satta_type = 2 AND DATE(`datetime`) >=  DATE(?)  AND DATE(`datetime`) <=  DATE(?) ORDER BY id DESC";
    else if (Number(satta_type) === 3)
      query =
        "SELECT number,gamesno,`datetime`,satta_type FROM `satta_results` WHERE satta_type = 3 AND DATE(`datetime`) >=  DATE(?)  AND DATE(`datetime`) <=  DATE(?) ORDER BY id DESC";
    else
      query =
        "SELECT number,gamesno,`datetime`,satta_type FROM `satta_results` WHERE satta_type = 4 AND DATE(`datetime`) >=  DATE(?)  AND DATE(`datetime`) <=  DATE(?) ORDER BY id DESC";

    const replacement = [
      moment(startDate || Date.now())?.format("YYYY-MM-DD"),
      moment(endDate || Date.now())?.format("YYYY-MM-DD"),
    ];
    const [result] = await sequelize.query(query, {
      replacements: replacement,
    });
    return res.status(200).json({
      msg: "Data found successfully.",
      data: result,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went worng in node api",
    });
  }
};
exports.getSattaMyHistory = async (req, res) => {
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  try {
    const query =
      "SELECT * FROM `satta_bet` WHERE CAST(userid AS UNSIGNED) = ? ORDER BY id DESC LIMIT 50;";
    const [result] = await sequelize.query(query, {
      replacements: [Number(userid)],
    });
    return res.status(200).json({
      msg: "Data found successfully.",
      data: result,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went worng in node api",
    });
  }
};
exports.getStatusSattaMatka = async (req, res) => {
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  try {
    const query = "SELECT * FROM `admin_setting` WHERE id IN(23,24,25,26);";
    const [result] = await sequelize.query(query, {
      replacements: [Number(userid)],
    });
    return res.status(200).json({
      msg: "Data found successfully.",
      data: result,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went worng in node api",
    });
  }
};
