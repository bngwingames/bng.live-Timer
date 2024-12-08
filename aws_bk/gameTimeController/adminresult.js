const { queryDb } = require("../helper/adminHelper");

exports.sendGaziyabadAmountToTheAdmin = async (io) => {
  try {
    const data = await queryDb(
      "SELECT `number`,`amount` FROM `satta_bet_log` ORDER BY `amount` ASC;;",
      []
    );
    io.emit("oneminsattagaziyabadamount", JSON.stringify(data || ""));
  } catch (e) {
    console.log(e);
  }
};
exports.sendFaridabadAmountToTheAdmin = async (io) => {
  try {
    const data = await queryDb(
      "SELECT `number`,`amount` FROM `satta_bet_log_01` ORDER BY `amount` ASC;;",
      []
    );
    io.emit("oneminsattafaridabadamount", JSON.stringify(data || ""));
  } catch (e) {
    console.log(e);
  }
};
exports.sendGaliAmountToTheAdmin = async (io) => {
  try {
    const data = await queryDb(
      "SELECT `number`,`amount` FROM `satta_bet_log_02` ORDER BY `amount` ASC;;",
      []
    );
    io.emit("oneminsattagaliamount", JSON.stringify(data || ""));
  } catch (e) {
    console.log(e);
  }
};
exports.sendDisawarAmountToTheAdmin = async (io) => {
  try {
    const data = await queryDb(
      "SELECT `number`,`amount` FROM `satta_bet_log_03` ORDER BY `amount` ASC;;",
      []
    );
    io.emit("oneminsattadisawaramount", JSON.stringify(data || ""));
  } catch (e) {
    console.log(e);
  }
};
exports.sendRouletteAmountToTheAdmin = async (io) => {
  try {
    const data = await queryDb(
      "SELECT `number`,`amount` FROM `roulette_bet_log` ORDER BY `amount` ASC;",
      []
    );
    io.emit("oneminrouletteamount", JSON.stringify(data || ""));
  } catch (e) {
    console.log(e);
  }
};
exports.sendWingoAmountToTheAdmin = async (io) => {
  try {
    const data = await queryDb(
      "SELECT `slot_num`,`game_type`,`round_no`,`mid_amount` FROM wingo_get_amount_on_slot WHERE `game_type` = 1;",
      []
    );
    io.emit("oneminwingoamount", JSON.stringify(data || ""));
  } catch (e) {
    console.log(e);
  }
};
exports.sendWingoAmountToTheAdminThreeMin = async (io) => {
  try {
    const data = await queryDb(
      "SELECT `slot_num`,`game_type`,`round_no`,`mid_amount` FROM wingo_get_amount_on_slot WHERE `game_type` = 2;",
      []
    );
    io.emit("oneminwingoamountthreemin", JSON.stringify(data || ""));
  } catch (e) {
    console.log(e);
  }
};
exports.sendWingoAmountToTheAdminFiveMin = async (io) => {
  try {
    const data = await queryDb(
      "SELECT `slot_num`,`game_type`,`round_no`,`mid_amount` FROM wingo_get_amount_on_slot WHERE `game_type` = 3;",
      []
    );
    io.emit("oneminwingoamountfivemin", JSON.stringify(data || ""));
  } catch (e) {
    console.log(e);
  }
};
