const { default: axios } = require("axios");
const { queryDb, deCryptData } = require("../helper/adminHelper");
const moment = require("moment");
const schedule = require("node-cron");
const jwt = require("jsonwebtoken");
require("dotenv").config();
exports.updateUserStatus = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { u_id } = req.query;
    if (!u_id)
      return res.status(201)?.json({
        msg: "User ID found.",
      });
    const payoutrequestList =
      "UPDATE `user` SET `status`= CASE WHEN `status` = 1 THEN 0 ELSE 1 END WHERE id = ?;";
    await queryDb(payoutrequestList, [Number(u_id)]);
    return res.status(200).json({
      msg: "Status Updated Successfully.",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.userList = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    const { end_date, start_date, search, from_amount, to_amount } = req.body;
    let q = "";
    let replace = [];
    q +=
      "SELECT u.*,(IFNULL(u.winning_wallet,0)+IFNULL(u.wallet,0)) AS total_amount,(SELECT v.`username` FROM `user` AS v WHERE v.`id` = u.`referral_user_id`) AS spon_id FROM user AS u ";
    if (search?.trim()) {
      q +=
        " WHERE u.username LIKE ? OR u.mobile LIKE ? OR u.email LIKE ? OR u.password LIKE ? ";
      replace.push(
        `%${String(search?.trim())}%`,
        `%${String(search?.trim())}%`,
        `%${String(search?.trim())}%`,
        `%${String(search?.trim())}%`
      );
    } else if (end_date?.trim() && start_date?.trim()) {
      q += " WHERE DATE(u.created_at) >= ? AND DATE(u.created_at) <= ?";
      replace.push(moment(start_date?.trim())?.format("YYYY-MM-DD"));
      replace.push(moment(end_date?.trim())?.format("YYYY-MM-DD"));
    } else if (to_amount?.trim() && from_amount?.trim()) {
      q +=
        " WHERE (IFNULL(winning_wallet,0)+IFNULL(wallet,0)) >= ? AND (IFNULL(winning_wallet,0)+IFNULL(wallet,0)) <= ?";
      replace.push(Number(from_amount?.trim() || 0));
      replace.push(Number(to_amount?.trim() || 0));
    } else {
      q +=
        " WHERE DATE(u.created_at) >= DATE(NOW()) AND DATE(u.created_at) <= DATE(NOW())";
    }
    const data = await queryDb(q, replace);
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
      total_winning_wallet:
        data?.reduce((a, b) => a + Number(b?.winning_wallet || 0), 0) || 0,
      total_main_wallet:
        data?.reduce((a, b) => a + Number(b?.wallet || 0), 0) || 0,
      all_total:
        data?.reduce((a, b) => a + Number(b?.total_amount || 0), 0) || 0,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};

exports.payOutRequestList = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { start_date, end_date } = req.body;
    const payoutrequestList =
      "SELECT u.`username`,u.`full_name`, u.`mobile`,b.`account`,b.`bank_name`,b.`ifsc`,t.tr15_id, t.`tr15_amt`,t.`tr15_date`,t.`tr15_status` FROM `tr15_fund_request` AS t LEFT JOIN `user` AS u ON t.`tr15_uid` = u.`id` LEFT JOIN `bank` AS b ON b.`id` = t.`bank_id` WHERE t.`type` = 2 AND t.`tr15_status` = 1 AND t.admin_approval = 2 AND t.tr15_date IS NOT NULL AND t.tr15_response IS NULL AND DATE(t.tr15_date) >= ? AND DATE(t.tr15_date) <= ? ORDER BY t.`tr15_id` DESC;";
    const data = await queryDb(payoutrequestList, [
      moment(start_date || new Date())?.format("YYYY-MM-DD"),
      moment(end_date || new Date())?.format("YYYY-MM-DD"),
    ]);
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.payOutRequestListSuccess = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { start_date, end_date } = req.body;
    const payoutrequestList =
      "SELECT u.`username`,u.`full_name`, u.`mobile`,b.`account`,b.`bank_name`,b.`ifsc`,t.tr15_id, t.`tr15_amt`,t.`tr15_date`,t.`tr15_status` FROM `tr15_fund_request` AS t LEFT JOIN `user` AS u ON t.`tr15_uid` = u.`id` LEFT JOIN `bank` AS b ON b.`id` = t.`bank_id` WHERE t.`type` = 2 AND t.`tr15_status` = 2 AND t.admin_approval = 1 AND t.tr15_date IS NOT NULL AND DATE(t.tr15_date) >= ? AND DATE(t.tr15_date) <= ? ORDER BY t.`tr15_id` DESC;";
    const data = await queryDb(payoutrequestList, [
      moment(start_date || new Date())?.format("YYYY-MM-DD"),
      moment(end_date || new Date())?.format("YYYY-MM-DD"),
    ]);
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.payOutRequestListFailed = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { start_date, end_date } = req.body;
    const payoutrequestList =
      "SELECT u.`username`,u.`full_name`, u.`mobile`,b.`account`,b.`bank_name`,b.`ifsc`,t.tr15_id, t.`tr15_amt`,t.`tr15_date`,t.`tr15_status` FROM `tr15_fund_request` AS t LEFT JOIN `user` AS u ON t.`tr15_uid` = u.`id` LEFT JOIN `bank` AS b ON b.`id` = t.`bank_id` WHERE t.`type` = 2 AND t.`tr15_status` = 3 AND t.admin_approval = 1 AND t.tr15_date IS NOT NULL AND DATE(t.tr15_date) >= ? AND DATE(t.tr15_date) <= ? ORDER BY t.`tr15_id` DESC;";
    const data = await queryDb(payoutrequestList, [
      moment(start_date || new Date())?.format("YYYY-MM-DD"),
      moment(end_date || new Date())?.format("YYYY-MM-DD"),
    ]);
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.payOutRequestListPendingFromGateway = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { start_date, end_date } = req.body;
    const payoutrequestList =
      "SELECT u.`username`,u.`full_name`, u.`mobile`,b.`account`,b.`bank_name`,b.`ifsc`,t.tr15_id, t.`tr15_amt`,t.`tr15_date`,t.`tr15_status` FROM `tr15_fund_request` AS t LEFT JOIN `user` AS u ON t.`tr15_uid` = u.`id` LEFT JOIN `bank` AS b ON b.`id` = t.`bank_id` WHERE t.`type` = 2 AND t.`tr15_status` = 1 AND t.admin_approval = 1 AND t.tr15_date IS NOT NULL AND DATE(t.tr15_date) >= ? AND DATE(t.tr15_date) <= ? ORDER BY t.`tr15_id` DESC;";
    const data = await queryDb(payoutrequestList, [
      moment(start_date || new Date())?.format("YYYY-MM-DD"),
      moment(end_date || new Date())?.format("YYYY-MM-DD"),
    ]);
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};

exports.inrPayOutRejectedByAdmin = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { t_id } = req.query;
    if (!Number(t_id))
      return res.status(201).json({
        msg: "Invalid Withdrawal",
      });

    const tableData = await queryDb(
      "SELECT u.`username`,u.id AS userid ,u.`full_name`,u.email, u.`mobile`,b.`account`,b.`bank_name`,b.`ifsc`,t.tr15_trans, t.`tr15_amt`,t.`tr15_date`,t.`tr15_status` FROM `tr15_fund_request` AS t LEFT JOIN `user` AS u ON t.`tr15_uid` = u.`id` LEFT JOIN `bank` AS b ON b.`id` = t.`bank_id` WHERE t.`type` = 2 AND `tr15_status` = 1 AND tr15_id = ?;",
      [Number(t_id)]
    );

    let result = {
      data: {
        message: "Tranasaction Rejected By Admin.",
      },
    };
    const save_data =
      "UPDATE `tr15_fund_request` SET admin_approval = 1,`tr15_status` = 3,success_date = NOW(),tr15_response = ?,callback_response=? WHERE `tr15_id` = ? AND `tr15_trans` = ? AND `tr15_status` = 1;";
    await queryDb(save_data, [
      JSON.stringify(result?.data || ""),
      JSON.stringify(result?.data || ""),
      Number(t_id),
      String(tableData?.[0]?.tr15_trans),
    ]);
    const callback_leser =
      "INSERT INTO leser(`l01_user_id`,`l01_type`,`l01_transection_type`,`l01_amount`) VALUES(?,?,?,?);";
    await queryDb(callback_leser, [
      Number(tableData?.[0]?.userid),
      "Caseback",
      `Withdrawal Cashback get successfully. From TransId: ${tableData?.[0]?.tr15_trans}`,
      tableData?.[0]?.tr15_amt,
    ]);
    const callback_user =
      "UPDATE `user` SET `winning_wallet` = IFNULL(`winning_wallet`,0) + ? WHERE `id` = ?;";
    await queryDb(callback_user, [
      Number(tableData?.[0]?.tr15_amt),
      Number(tableData?.[0]?.userid),
    ]);
    return res.status(200).json({
      msg: "Request accepted Successfully",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.inrPayOutApproveByAdmin = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { t_id } = req.query;
    if (!Number(t_id))
      return res.status(201).json({
        msg: "Invalid Withdrawal",
      });

    const tableData = await queryDb(
      "SELECT u.`username`,u.id AS userid ,u.`full_name`,u.email, u.`mobile`,b.`account`,b.`bank_name`,b.`ifsc`,t.tr15_trans, t.`tr15_amt`,t.`tr15_date`,t.`tr15_status` FROM `tr15_fund_request` AS t LEFT JOIN `user` AS u ON t.`tr15_uid` = u.`id` LEFT JOIN `bank` AS b ON b.`id` = t.`bank_id` WHERE t.`type` = 2 AND `tr15_status` = 1 AND tr15_id = ?;",
      [Number(t_id)]
    );

    if (!tableData || tableData?.length === 0)
      return res.status(201).json({
        msg: "Invalid ",
      });

    const fd = new FormData();
    fd.append("UserID", "7985913351");
    fd.append("Token", "32543253535796018096423746274583570018");
    fd.append("Account", tableData?.[0]?.account);
    fd.append("Ifsc", tableData?.[0]?.ifsc);
    fd.append("Name", tableData?.[0]?.full_name);
    fd.append("Mobile", tableData?.[0]?.mobile);
    fd.append("email", tableData?.[0]?.email);
    fd.append("Amount", tableData?.[0]?.tr15_amt);
    fd.append("Description", "Testing Description");
    fd.append("TransactionID", tableData?.[0]?.tr15_trans);
    fd.append("BankName", tableData?.[0]?.bank_name);

    const result = await axios.post(
      "https://indian.vpayout.com/v1/Payoutindian/payout",
      fd
    );
    if (result?.data?.status === "SUCCESS") {
      const save_data =
        "UPDATE `tr15_fund_request` SET admin_approval = 1,approval_date = NOW(), `tr15_status` = 2,success_date = NOW(),tr15_response = ?,callback_response = ? WHERE `tr15_id` = ? AND `tr15_trans` = ? AND `tr15_status` = 1;";
      await queryDb(save_data, [
        JSON.stringify(result?.data || ""),
        JSON.stringify(result?.data || ""),
        Number(t_id),
        String(tableData?.[0]?.tr15_trans),
      ]);
    } else if (result?.data?.status === "FAILED") {
      const save_data =
        "UPDATE `tr15_fund_request` SET admin_approval = 1,approval_date = NOW(),`tr15_status` = 3,success_date = NOW(),tr15_response = ?,callback_response=? WHERE `tr15_id` = ? AND `tr15_trans` = ? AND `tr15_status` = 1;";
      await queryDb(save_data, [
        JSON.stringify(result?.data || ""),
        JSON.stringify(result?.data || ""),
        Number(t_id),
        String(tableData?.[0]?.tr15_trans),
      ]);
      const callback_leser =
        "INSERT INTO leser(`l01_user_id`,`l01_type`,`l01_transection_type`,`l01_amount`) VALUES(?,?,?,?);";
      await queryDb(callback_leser, [
        Number(tableData?.[0]?.userid),
        "Caseback",
        `Withdrawal Cashback get successfully. From TransId: ${tableData?.[0]?.tr15_trans}`,
        tableData?.[0]?.tr15_amt,
      ]);
      const callback_user =
        "UPDATE `user` SET `winning_wallet` = IFNULL(`winning_wallet`,0) + ? WHERE `id` = ?;";
      await queryDb(callback_user, [
        Number(tableData?.[0]?.tr15_amt),
        Number(tableData?.[0]?.userid),
      ]);
    } else {
      const save_data =
        "UPDATE `tr15_fund_request` SET admin_approval = 1,approval_date = NOW(),`tr15_status` = 1,tr15_response = ? WHERE `tr15_id` = ? AND `tr15_trans` = ? AND `tr15_status` = 1;";
      await queryDb(save_data, [
        JSON.stringify(result?.data || ""),
        Number(t_id),
        String(tableData?.[0]?.tr15_trans),
      ]);
    }
    return res.status(200).json({
      msg: "Request accepted Successfully",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.generatedTimeEveryAfterEveryOneMinbyCrown = () => {
  schedule.schedule("*/5 * * * *", function () {
    INRWITHDRAWALCALLBACK();
    console.log("function is called now");
  });
};
exports.INRWITHDRAWALCALLBACK = async () => {
  console.log("function is called now is side");
  try {
    const get_all_pending_record =
      "SELECT * FROM `tr15_fund_request` WHERE `admin_approval` = 1 AND `tr15_status` = 1;";
    const data = await queryDb(get_all_pending_record, []);
    data.forEach(async (element) => {
      await CAllbackAPIunction(element);
    });
  } catch (e) {
    console.log(e);
  }
};

const CAllbackAPIunction = async (tableData) => {
  try {
    const fd = new FormData();
    fd.append("UserID", "7985913351");
    fd.append("Token", "32543253535796018096423746274583570018");
    fd.append("txttransid", tableData?.tr15_trans);

    const result = await axios.post(
      "https://indian.vpayout.com/Callback_payout/check_transaction_status_withdrwal",
      fd
    );
    if (result?.data?.status === "SUCCESS") {
      const save_data =
        "UPDATE `tr15_fund_request` SET admin_approval = 1,`tr15_status` = 2,success_date = NOW(),tr15_response = ?,callback_response = ? WHERE `tr15_id` = ? AND `tr15_trans` = ? AND `tr15_status` = 1;";
      await queryDb(save_data, [
        JSON.stringify(result?.data || ""),
        JSON.stringify(result?.data || ""),
        Number(tableData?.tr15_id),
        String(tableData?.tr15_trans),
      ]);
    } else if (result?.data?.status === "FAILED") {
      const save_data =
        "UPDATE `tr15_fund_request` SET admin_approval = 1,`tr15_status` = 3,success_date = NOW(),tr15_response = ?,callback_response=? WHERE `tr15_id` = ? AND `tr15_trans` = ? AND `tr15_status` = 1;";
      await queryDb(save_data, [
        JSON.stringify(result?.data || ""),
        JSON.stringify(result?.data || ""),
        Number(tableData?.tr15_id),
        String(tableData?.tr15_trans),
      ]);
      const callback_leser =
        "INSERT INTO leser(`l01_user_id`,`l01_type`,`l01_transection_type`,`l01_amount`) VALUES(?,?,?,?);";
      await queryDb(callback_leser, [
        Number(tableData?.userid),
        "Caseback",
        `Withdrawal Cashback get successfully. From TransId: ${tableData?.tr15_trans}`,
        tableData?.tr15_amt,
      ]);
      const callback_user =
        "UPDATE `user` SET `winning_wallet` = IFNULL(`winning_wallet`,0) + ? WHERE `id` = ?;";
      await queryDb(callback_user, [
        Number(tableData?.tr15_amt),
        Number(tableData?.userid),
      ]);
    } else {
      const save_data =
        "UPDATE `tr15_fund_request` SET admin_approval = 1,`tr15_status` = 1,tr15_response = ? WHERE `tr15_id` = ? AND `tr15_trans` = ? AND `tr15_status` = 1;";
      await queryDb(save_data, [
        JSON.stringify(result?.data || ""),
        Number(tableData?.tr15_id),
        String(tableData?.tr15_trans),
      ]);
    }
  } catch (e) {
    console.log(e);
  }
};
exports.getWelcomeBonusList = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.`l01_type` = 'Welcome' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};

exports.getSelfDepositBonusList = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE (ls.l01_type = 'Bonus' OR ls.l01_type = 'Self Deposit Bonus') ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getDepositBonusList = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.`l01_type` = 'Deposit Bonus' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getROIBonusList = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { start_date, end_date, username } = req.body;
    const q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.`l01_type` = 'ROI Bonus' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getDailySalaySalaryList = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser_before_clame AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.l01_type = 'Daily Income' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getbetIncomeList = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.l01_type = 'BetIncome' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getLevelIncomeList = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.l01_type = 'Level' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.setWingoResultByAdmin = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { release_no, gid } = req.body;
    if (!String(release_no) || !String(gid))
      return res.status(201)?.json({
        msg: "Everythig is required",
      });
    const payoutrequestList =
      "SELECT `win_transactoin` FROM `wingo_round_number` WHERE `win_id` = ?;";
    const data = await queryDb(payoutrequestList, [Number(gid)]);
    const setResult =
      "INSERT INTO  `colour_admin_result`(`gamesno`,`gameid`,`number`,`status`) VALUES(?,?,?,?);";
    await queryDb(setResult, [
      Number(data?.[0]?.win_transactoin || 0) + 1,
      Number(gid),
      Number(release_no),
      1,
    ])
      .then(() => {
        return res.status(200).json({
          msg: "Request Accepted Successfully",
          releaseNo: release_no,
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: "Something went wrong.",
        });
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.fundAddByAdmin = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { u_req_amount, user_id, wallet_type } = req.body;
    if (
      !Number(u_req_amount) ||
      !Number(u_req_user_id) ||
      !Number(wallet_type) ||
      !user_id
    )
      return res.status(201).json({
        msg: "Everything is required.",
      });

    await queryDb("CALL INR_ADD_FUND(?,?,?,@response_msg)", [
      Number(u_req_amount),
      user_id,
      Number(wallet_type),
    ]);
    const responseapi = await queryDb("SELECT @response_msg;", []);
    return res.status(200).json({
      msg: responseapi?.[0]?.["@response_msg"],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getAviatorReport = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const data = await queryDb(
      "SELECT * FROM `aviator_user_report_day_wise` ORDER BY `id` DESC;",
      []
    );
    return res.status(200).json({
      msg: "Data get successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getTRXReport = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { start_date, end_date, game_id } = req.body;
    let q = "";
    if (!start_date || !end_date) {
      q =
        "SELECT u.`username`,u.`full_name`,IFNULL(SUM(IFNULL(t.`amount`,0)),0) AS betting_amount,IFNULL(SUM(IFNULL(t.`win`,0)),0) AS winning_amount FROM `trx_colour_bet` AS t LEFT JOIN `user` AS u ON t.`userid` = u.`id` WHERE t.gameid = ? GROUP BY t.`userid`";
    } else {
      q =
        "SELECT u.`username`,u.`full_name`,IFNULL(SUM(IFNULL(t.`amount`,0)),0) AS betting_amount,IFNULL(SUM(IFNULL(t.`win`,0)),0) AS winning_amount FROM `trx_colour_bet` AS t LEFT JOIN `user` AS u ON t.`userid` = u.`id` WHERE t.gameid = ? AND DATE(t.`datetime`) >= ? AND DATE(t.`datetime`) <= ? GROUP BY t.`userid`";
    }
    const data = await queryDb(q, [
      Number(game_id || 1),
      moment(start_date || new Date())?.format("YYYY-MM-DD"),
      moment(end_date || new Date())?.format("YYYY-MM-DD"),
    ]);
    return res.status(200).json({
      msg: "Data get successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getWingoReport = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { start_date, end_date, game_id, user_id } = req.body;
    let q = "";
    if (!start_date || !end_date) {
      q =
        "SELECT u.`username`,u.`full_name`,IFNULL(SUM(IFNULL(t.`amount`,0)),0) AS betting_amount,IFNULL(SUM(IFNULL(t.`win`,0)),0) AS winning_amount FROM `colour_bet` AS t LEFT JOIN `user` AS u ON t.`userid` = u.`id` WHERE t.gameid = ? GROUP BY t.`userid`";
    } else {
      q =
        "SELECT u.`username`,u.`full_name`,IFNULL(SUM(IFNULL(t.`amount`,0)),0) AS betting_amount,IFNULL(SUM(IFNULL(t.`win`,0)),0) AS winning_amount FROM `colour_bet` AS t LEFT JOIN `user` AS u ON t.`userid` = u.`id` WHERE t.gameid = ? AND DATE(t.`datetime`) >= ? AND DATE(t.`datetime`) <= ? GROUP BY t.`userid`";
    }
    const data = await queryDb(q, [
      Number(game_id || 1),
      moment(start_date || new Date())?.format("YYYY-MM-DD"),
      moment(end_date || new Date())?.format("YYYY-MM-DD"),
      String(user_id),
    ]);
    return res.status(200).json({
      msg: "Data get successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getFundTransferHistoryReport = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    let q =
      "SELECT  u.`username`,u.`full_name`,u.`mobile`,f.`tr15_amt`,f.`Deposit_type`,f.`tr15_trans`,f.`tr15_status`,f.`tr15_date` FROM `tr15_fund_request` AS f LEFT JOIN `user` AS u ON f.`tr15_uid` = u.id WHERE f.`trans_by` = 1 ORDER BY `tr15_id` DESC";
    const data = await queryDb(q, []);
    return res.status(200).json({
      msg: "Data get successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.changePermission = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    // profile_type: 1 for User, 2 for Admin , 3 for  super_admin, 4 for dummy user
    const { user_id, profile_type } = req.body;
    if (!user_id || !profile_type)
      return res.status(201)?.json({
        msg: "Everything is requred.",
      });
    let q = "UPDATE `user` SET user_type = ? WHERE id = ?;";
    await queryDb(q, [Number(profile_type), Number(user_id)]);
    return res.status(200).json({
      msg: "Profile Updated Successfully.",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.dayBookReport = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { game_id, username, date_time, day_book_type } = req.body;
    if (!username || !day_book_type)
      return res.status(201)?.json({
        msg: "Everything is requred.",
      });
    let q = "";
    let replacement = [];
    if (day_book_type === "wingo") {
      q =
        "SELECT u.`username`,u.`full_name`,IFNULL((IFNULL(t.`amount`,0)),0) AS betting_amount,IFNULL((IFNULL(t.`win`,0)),0) AS winning_amount,t.`datetime` FROM `colour_bet` AS t LEFT JOIN `user` AS u ON t.`userid` = u.`id` WHERE t.gameid = ? AND u.`username` = ? AND DATE(t.`datetime`) = ? ORDER BY t.`datetime` DESC";
      replacement = [
        Number(game_id),
        Number(username),
        moment(date_time || Date.now())?.format("YYYY-MM-DD"),
      ];
    } else if (day_book_type === "trx") {
      q =
        "SELECT u.`username`,u.`full_name`,IFNULL((IFNULL(t.`amount`,0)),0) AS betting_amount,IFNULL((IFNULL(t.`win`,0)),0) AS winning_amount,t.`datetime` FROM `trx_colour_bet` AS t LEFT JOIN `user` AS u ON t.`userid` = u.`id` WHERE t.gameid = ? AND u.`username` = ? AND DATE(t.`datetime`) = ? ORDER BY t.`datetime` DESC";
      replacement = [
        Number(game_id),
        Number(username),
        moment(date_time || Date.now())?.format("YYYY-MM-DD"),
      ];
    } else if (day_book_type === "aviator") {
      q =
        "SELECT u.`username`,u.`full_name`,IFNULL((IFNULL(t.`amount`,0)),0) AS betting_amount,IFNULL((IFNULL(t.`amountcashed`,0)),0) AS winning_amount,t.`createdAt` FROM `aviator_bet_place_ledger` AS t LEFT JOIN `user` AS u ON t.`userid` = u.`id` WHERE u.`username` = ? AND DATE(t.`createdAt`) = ? ORDER BY t.`createdAt` DESC";
      replacement = [
        Number(username),
        moment(date_time || Date.now())?.format("YYYY-MM-DD"),
      ];
    } else if (day_book_type === "leser") {
      q =
        "SELECT u.`username`,u.`full_name`,IFNULL((IFNULL(t.`l01_amount`,0)),0) AS income_amount,t.`l01_date`,t.`l01_type`,t.`l01_transection_type` FROM `leser` AS t LEFT JOIN `user` AS u ON t.`l01_user_id` = u.`id` WHERE u.`username` = ? AND DATE(t.`l01_date`) = ?";
      replacement = [
        Number(username),
        moment(date_time || Date.now())?.format("YYYY-MM-DD"),
      ];
    }
    const data = await queryDb(q, replacement);
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.dasbboardAPI = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    let q = `SELECT 
(5) AS total_game,
(SELECT COUNT(DISTINCT id) FROM user) AS total_player,
(SELECT COUNT(DISTINCT tr15_id) FROM tr15_fund_request WHERE tr15_status = 2 AND type = 1) AS total_active_user,
(SELECT IFNULL(SUM(IFNULL(tr15_amt,0)),0) FROM tr15_fund_request WHERE tr15_status = 2 AND type = 1) AS total_recharge,
(SELECT IFNULL(SUM(IFNULL(tr15_amt,0)),0) FROM tr15_fund_request WHERE tr15_status = 2 AND type = 1 AND success_date IS NOT NULL AND DATE(success_date) = DATE(NOW())) AS  today_recharge,
(SELECT COUNT(tr15_id) FROM tr15_fund_request WHERE admin_approval = 1 AND type = 2 AND approval_date IS NOT NULL AND DATE(approval_date) = DATE(NOW()) ) AS today_withdrawal_approval,
(SELECT COUNT(tr15_id) FROM tr15_fund_request WHERE tr15_status = 1 AND type = 2 AND DATE(tr15_date) = DATE(NOW()) ) AS today_withdrawal_pending,
(SELECT COUNT(tr15_id) FROM tr15_fund_request WHERE admin_approval = 1 AND type = 2 AND approval_date IS NOT NULL) AS total_withdrawal_approval,
(SELECT COUNT(tr15_id) FROM tr15_fund_request WHERE tr15_status = 1 AND type = 2 AND approval_date IS NULL) AS total_withdrawal_pending,
(SELECT COUNT(tr15_id) FROM tr15_fund_request WHERE tr15_status = 3 AND type = 2) AS total_rejected_withdrawal,
(SELECT IFNULL(SUM(IFNULL(total_betting_by_user,0)),0) FROM user) AS total_bets,
(SELECT IFNULL(SUM(IFNULL(total_betting_by_user,0)),0) * 0.02 FROM user) AS commisstion,
(SELECT IFNULL(SUM(zp_token),0) FROM tr15_fund_request WHERE success_date IS NOT NULL AND type = 1) AS total_payin_token,
(SELECT IFNULL(SUM(zp_token),0) FROM tr15_fund_request WHERE success_date IS NOT NULL AND type = 2) AS total_payout_token
`;

    const data = await queryDb(q, []);
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.changeUserPassword = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { username, new_password } = req.body;
    if (!username || !new_password)
      return res.status(201)?.json({
        msg: "Everything is requred.",
      });
    let q = "UPDATE `login_credentitals` SET password = ? WHERE username = ?;";
    await queryDb(q, [String(new_password), String(username)]);
    return res.status(200).json({
      msg: "Password Updated Successfully.",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getDownlineTeam = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { username } = req.query;
    if (!username)
      return res.status(201)?.json({
        msg: "Everything is requred.",
      });
    let q =
      "CALL `get_intro_downline_level`(IFNULL((SELECT id FROM `user` WHERE username = ? LIMIT 1),0),IFNULL((SELECT CAST(`admin_setting`.`longtext` AS DECIMAL(20,4)) FROM `admin_setting` WHERE id = 17 LIMIT 1),0));";
    await queryDb(q, [String(username)]);
    const data = await queryDb(
      "SELECT d.level_id, u.`username`,u.`full_name`,u.`mobile`,u.`password`,u.user_type FROM tmp_downline AS d LEFT JOIN `user` AS u ON d.member_id = u.id;",
      []
    );
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getUplineTeam = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { username } = req.query;
    if (!username)
      return res.status(201)?.json({
        msg: "Everything is requred.",
      });
    let q =
      "CALL `sp_upline_member`(IFNULL((SELECT id FROM `user` WHERE username = ? LIMIT 1),0),IFNULL((SELECT CAST(`admin_setting`.`longtext` AS DECIMAL(20,4)) FROM `admin_setting` WHERE id = 17 LIMIT 1),0));";
    await queryDb(q, [String(username)]);
    const data = await queryDb(
      "SELECT d.level_id, u.`username`,u.`full_name`,u.`mobile`,u.`password`,u.user_type FROM tmp_downline AS d LEFT JOIN `user` AS u ON d.member_id = u.id WHERE d.member_id <> 0;",
      []
    );
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.userRegistrationStatusBarChart = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    let q =
      "SELECT COUNT(id),DATE(created_at) FROM `user` WHERE DATE(created_at) >= DATE(NOW()) - INTERVAL 10 DAY GROUP BY DATE(`created_at`) ORDER BY DATE(`created_at`) DESC LIMIT 10;";
    const data = await queryDb(q, []);

    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.userBusinessStatusBarChart = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    let q =
      "SELECT IFNULL(SUM(IFNULL(`tr15_amt`,0)),0),DATE(`success_date`) FROM `tr15_fund_request` WHERE DATE(`success_date`) >= DATE(NOW()) - INTERVAL 10 DAY GROUP BY DATE(`success_date`) ORDER BY DATE(`success_date`) DESC LIMIT 10;";
    const data = await queryDb(q, []);

    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.userTRXBetStatusBarChart = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    let q =
      "SELECT IFNULL(SUM(IFNULL(`amount`,0)),0),DATE(`datetime`) FROM `trx_colour_bet` WHERE DATE(`datetime`) >= DATE(NOW()) - INTERVAL 10 DAY GROUP BY DATE(`datetime`) ORDER BY DATE(`datetime`) DESC LIMIT 10;";
    const data = await queryDb(q, []);

    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.userWingoBetStatusBarChart = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    let q =
      "SELECT IFNULL(SUM(IFNULL(`amount`,0)),0),DATE(`datetime`) FROM `colour_bet` WHERE DATE(`datetime`) >= DATE(NOW()) - INTERVAL 10 DAY GROUP BY DATE(`datetime`) ORDER BY DATE(`datetime`) DESC LIMIT 10;";
    const data = await queryDb(q, []);

    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.userAviatorBetStatusBarChart = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    let q =
      "SELECT IFNULL(SUM(IFNULL(`amount`,0)),0),DATE(`createdAt`) FROM `aviator_bet_place_ledger` WHERE DATE(`createdAt`) >= DATE(NOW()) - INTERVAL 10 DAY GROUP BY DATE(`createdAt`) ORDER BY DATE(`createdAt`) DESC LIMIT 10;";
    const data = await queryDb(q, []);

    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.set_IncomeAmountFunction = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    const { t_id, bonus_value } = req.body;
    if (
      !t_id ||
      !Number(t_id) ||
      !bonus_value ||
      Number(bonus_value || 0) <= 0
    ) {
      return res.status(200).json({
        msg: "Everything is required",
      });
    }
    let q = "UPDATE bonusTable SET value = ? WHERE id = ?;";
    await queryDb(q, [Number(bonus_value), Number(t_id)]);

    return res.status(200).json({
      msg: "Updated successfully.",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.set_ZPFunction = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    const { zp_amount } = req.body;
    if (!zp_amount) {
      return res.status(200).json({
        msg: "Everything is required",
      });
    }
    let q = "UPDATE `admin_setting` SET `longtext` = ? WHERE `id` = 17;";
    await queryDb(q, [Number(zp_amount)]);

    return res.status(200).json({
      msg: "Updated successfully.",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.set_GameStatus = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    const { t_id } = req.query;
    if (!t_id) {
      return res.status(200).json({
        msg: "Everything is required",
      });
    }
    let q =
      "UPDATE `admin_setting` SET `longtext` = CASE WHEN `longtext` = 1 THEN 0 ELSE 1 END WHERE `id` = ?;";
    await queryDb(q, [Number(t_id)]);

    return res.status(200).json({
      msg: "Updated successfully.",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.get_Coupon_list_admin = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    let q = "SELECT * FROM `admin_coupon_code` ORDER BY `created_at` DESC;";
    const data = await queryDb(q, []);

    return res.status(200).json({
      msg: "List Get successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.add_Coupon_list_admin = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { coupon_code, coupon_amount, coupon_limit } = req.body;
    if (!coupon_code || !coupon_amount || !coupon_limit)
      return res.status(201).json({
        msg: "Everything is required",
      });

    let qifexist =
      "SELECT * FROM admin_coupon_code WHERE coupon_code = ? LIMIT 1;";
    const getPre = await queryDb(qifexist, [String(coupon_code)]);
    if (getPre?.[0]) {
      return res.status(201).json({
        msg: "This coupon already exist",
      });
    }
    let q =
      "INSERT INTO `admin_coupon_code`(`coupon_code`,`coupon_amount`,`coupon_limit`) VALUES(?,?,?);";
    await queryDb(q, [
      String(coupon_code),
      Number(coupon_amount || 0),
      Number(coupon_limit || 0),
    ]);

    return res.status(200).json({
      msg: "Coupon Added Successfully",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.update_status_Coupon_admin = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { t_id } = req.query;
    if (!t_id)
      return res.status(201).json({
        msg: "Everything is required",
      });

    let q =
      "UPDATE admin_coupon_code SET coupon_status = CASE WHEN coupon_status = 1 THEN 2 ELSE 1 END WHERE id = ?;";
    await queryDb(q, [Number(t_id)]);

    return res.status(200).json({
      msg: "Coupon Updated Successfully",
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.approveForOtherBrowser = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { t_id } = req.query;

    let q = "UPDATE user SET finger_id = 'Approve' WHERE id = ?";
    await queryDb(q, [Number(t_id)]);

    return res.status(200).json({
      msg: "Status Updated Successfully.",
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getZPTokenPayinAdmin = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { username, start_date, end_date } = req.body;
    let q = "";
    let replace = [];
    q +=
      "SELECT u.`username`,u.`full_name`,u.`mobile`,f.`zp_token`,`tr15_amt`,f.`Deposit_type`,f.`transaction_hash`,f.`user_wallet_address`,f.`tr15_trans`,f.`tr15_status`,f.`success_date`,f.`usdt_type` FROM `tr15_fund_request` AS f LEFT JOIN `user` AS u ON f.`tr15_uid` = u.`id` WHERE f.usdt_type = 3 AND `type` = 1 ";
    if (username) {
      q += " AND  u.`username` = ? OR u.mobile = ?";
      replace.push(String(username), String(username));
    } else {
      if (end_date && start_date) {
        q += " AND  DATE(`tr15_date`) >= ? AND DATE(tr15_date) <= ?";
        replace.push(
          moment(start_date)?.format("YYYY-MM-DD"),
          moment(end_date)?.format("YYYY-MM-DD")
        );
      } else
        q +=
          " AND  DATE(`tr15_date`) >= DATE(NOW()) AND DATE(tr15_date) <= DATE(NOW())";
    }
    q += " ORDER BY f.`tr15_id` DESC";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data || [],
      total: data?.reduce((a, b) => a + Number(b?.tr15_amt || 0), 0) || 0,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getZPTokenPayOutAdmin = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { username, start_date, end_date } = req.body;
    let q = "";
    let replace = [];
    q +=
      "SELECT u.`username`,u.`full_name`,u.`mobile`,f.`zp_token`,`tr15_amt`,f.`Deposit_type`,f.`transaction_hash`,f.`user_wallet_address`,f.`tr15_trans`,f.`tr15_status`,f.`success_date`,f.`usdt_type` FROM `tr15_fund_request` AS f LEFT JOIN `user` AS u ON f.`tr15_uid` = u.`id` WHERE f.usdt_type = 3 AND `type` = 2 ";
    if (username) {
      q += "AND  u.`username` = ? OR u.mobile = ?";
      replace.push(String(username), String(username));
    } else {
      if (end_date && start_date) {
        q += "AND  DATE(`tr15_date`) >= ? AND DATE(tr15_date) <= ?";
        replace.push(
          moment(start_date)?.format("YYYY-MM-DD"),
          moment(end_date)?.format("YYYY-MM-DD")
        );
      } else
        q +=
          "AND  DATE(`tr15_date`) >= DATE(NOW()) AND DATE(tr15_date) <= DATE(NOW())";
    }
    q += "ORDER BY f.`tr15_id` DESC";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data || [],
      total: data?.reduce((a, b) => a + Number(b?.tr15_amt || 0), 0) || 0,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getGiftBonusListAdmin = async (req, res) => {
  try {
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
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.`l01_type` = 'Coupon' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Gift List get successfully.",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getWeeklyRecoveryBonusListAdmin = async (req, res) => {
  try {
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
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.`l01_type` = 'Weekly Bonus' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Gift List get successfully.",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getCompanyPromoterBonusListAdmin = async (req, res) => {
  try {
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
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.`l01_type` = 'Company Promoter' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Company Promoter List get successfully.",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getCompanyPromoterBonusListAdminActive = async (req, res) => {
  try {
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
    let q =
      "SELECT u.id,u.`full_name`,u.`username`,u.`mobile`,u.`email`,u.x_percent_from_downline,u.is_company_promotor FROM user AS u WHERE u.is_company_promotor = 1;";
    const data = await queryDb(q, []);

    return res.status(200).json({
      msg: "Company Promoter List get successfully.",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getVIPBonusListAdmin = async (req, res) => {
  try {
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
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.`l01_type` = 'VIP BONUS' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Gift List get successfully.",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};

exports.getCashBackBonusListAdmin = async (req, res) => {
  try {
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
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.`l01_type` = 'Caseback' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Gift List get successfully.",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getP2PListAdmin = async (req, res) => {
  try {
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
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.`l01_type` = 'P_2_P_Transfer' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Gift List get successfully.",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getTeamReferralFirstListAdmin = async (req, res) => {
  try {
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
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.`l01_type` = 'Team  Referral First Recharge Salary' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Gift List get successfully.",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.addCouponToUserByAdminDirectly = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    const { c_id, u_id } = req.body;
    if (!c_id || !u_id) {
      return res.status(200).json({
        msg: "Everything is required",
      });
    }
    let q = "CALL sp_coupon_handler(?,?,?,?,@res_msg);";
    await queryDb(q, [3, 1, u_id, c_id]);
    const responseapi = await queryDb("SELECT @res_msg;", []);
    return res.status(200).json({
      msg: responseapi?.[0]?.["@res_msg"],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.makeCompanyPromotorbyAdmin = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    const { set_prcnt, u_id } = req.body;
    if (!set_prcnt || !u_id) {
      return res.status(200).json({
        msg: "Everything is required",
      });
    }
    let q =
      "UPDATE user SET x_percent_from_downline = ?,is_company_promotor = 1 WHERE id = ?;";
    await queryDb(q, [Number(set_prcnt), Number(u_id)]);
    return res.status(200).json({
      msg: "Status Updated Successfully.",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getCompanyPromotorbyAdmin = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    let q =
      "SELECT id,`full_name`,`username`,`user_type`,`mobile`,`email`,x_percent_from_downline FROM `user` WHERE `is_company_promotor` = 1;";
    const data = await queryDb(q, []);
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.changePromotorStatus = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    const { u_id } = req.query;
    if (!u_id) {
      return res.status(200).json({
        msg: "Everything is required",
      });
    }
    let q = "UPDATE `user` SET `is_company_promotor` = 0 WHERE id = ?;";
    await queryDb(q, [Number(u_id)]);
    return res.status(200).json({
      msg: "Status Updated Successfully.",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.setRouletteResultByAdmin = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { release_no } = req.body;
    if (!String(release_no))
      return res.status(201)?.json({
        msg: "Everythig is required",
      });
    const payoutrequestList =
      "SELECT `rount_no` FROM `roulette_game_round` WHERE `id` = 1;";
    const data = await queryDb(payoutrequestList, []);
    const setResult =
      "INSERT INTO `roulette_admin_result`(`gamesno`,`gameid`,`number`,`status`) VALUES(?,?,?,?);";
    await queryDb(setResult, [
      Number(data?.[0]?.rount_no || 0) + 1,
      1,
      Number(release_no),
      1,
    ])
      .then(() => {
        return res.status(200).json({
          msg: "Request Accepted Successfully",
          releaseNo: release_no,
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: "Something went wrong.",
        });
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.seSatttaResultByAdmin = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { release_no, gid } = req.body;
    if (!String(release_no) || !String(gid))
      return res.status(201)?.json({
        msg: "Everythig is required",
      });
    const payoutrequestList =
      "SELECT `round_no` FROM `satta_round_number` WHERE `id` = ?;";
    const data = await queryDb(payoutrequestList, [Number(gid)]);
    const setResult =
      "INSERT INTO `satta_admin_result`(`gamesno`,`gameid`,`number`,`status`,satta_type) VALUES(?,?,?,?,?);";
    await queryDb(setResult, [
      Number(data?.[0]?.round_no || 0) + 1,
      1,
      Number(release_no),
      1,
      Number(gid),
    ])
      .then(() => {
        return res.status(200).json({
          msg: "Request Accepted Successfully",
          releaseNo: release_no,
        });
      })
      .catch((e) => {
        return res.status(500).json({
          msg: "Something went wrong.",
        });
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getINRPayinAdmin = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { username, start_date, end_date } = req.body;
    let q = "";
    let replace = [];
    q +=
      "SELECT u.`username`,u.`full_name`,u.`mobile`,`tr15_amt`,f.tr15_date,f.`Deposit_type`,f.`tr15_trans`,f.`tr15_status`,f.`success_date`,f.`usdt_type` FROM `tr15_fund_request` AS f LEFT JOIN `user` AS u ON f.`tr15_uid` = u.`id` WHERE f.usdt_type = 4 AND f.`type` = 1   ";
    if (username?.trim() && start_date?.trim() && end_date?.trim()) {
      q +=
        " AND  (u.`username` = ? OR u.mobile = ? OR f.`tr15_status` = ? OR f.`tr15_trans` = ?) AND  DATE(`tr15_date`) >= ? AND DATE(tr15_date) <= ? ";
      replace.push(
        String(username?.trim()),
        String(username?.trim()),
        String(username?.trim()),
        String(username?.trim()),
        moment(start_date?.trim())?.format("YYYY-MM-DD"),
        moment(end_date?.trim())?.format("YYYY-MM-DD")
      );
    } else if (username?.trim()) {
      q +=
        " AND f.`tr15_status` = 'Success' AND  (u.`username` = ? OR u.mobile = ? OR f.`tr15_status` = ? OR f.`tr15_trans` = ?) ";
      replace.push(
        String(username?.trim()),
        String(username?.trim()),
        String(username?.trim()),
        String(username?.trim())
      );
    } else {
      if (end_date?.trim() && start_date?.trim()) {
        q +=
          " AND f.`tr15_status` = 'Success' AND  DATE(`tr15_date`) >= ? AND DATE(tr15_date) <= ? ";
        replace.push(
          moment(start_date?.trim())?.format("YYYY-MM-DD"),
          moment(end_date?.trim())?.format("YYYY-MM-DD")
        );
      } else
        q +=
          " AND f.`tr15_status` = 'Success' AND  DATE(`tr15_date`) >= DATE(NOW()) AND DATE(tr15_date) <= DATE(NOW()) ";
    }
    q += " ORDER BY f.`tr15_id` DESC";
    const data = await queryDb(q, replace);
    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data || [],
      total: data?.reduce((a, b) => a + Number(b?.tr15_amt || 0), 0) || 0,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getINRPayOutAdmin = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { username, start_date, end_date } = req.body;
    let q = "";
    let replace = [];
    q +=
      "SELECT u.`username`,u.`full_name`,u.`mobile`,`tr15_amt`,f.`Deposit_type`,f.`tr15_trans`,f.`tr15_status`,f.`success_date`,f.`usdt_type` FROM `tr15_fund_request` AS f LEFT JOIN `user` AS u ON f.`tr15_uid` = u.`id` WHERE f.usdt_type = 4 AND `type` = 2  ";
    if (username) {
      q +=
        " AND  u.`username` = ? OR u.mobile = ? OR f.`tr15_status` = ? OR f.`tr15_trans` = ?";
      replace.push(
        String(username),
        String(username),
        String(username),
        String(username)
      );
    } else {
      if (end_date && start_date) {
        q += " AND  DATE(`tr15_date`) >= ? AND DATE(tr15_date) <= ?";
        replace.push(
          moment(start_date)?.format("YYYY-MM-DD"),
          moment(end_date)?.format("YYYY-MM-DD")
        );
      } else
        q +=
          " AND  DATE(`tr15_date`) >= DATE(NOW()) AND DATE(tr15_date) <= DATE(NOW())";
    }
    q += " ORDER BY f.`tr15_id` DESC";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Data Get Successfully.",
      data: data || [],
      total: data?.reduce((a, b) => a + Number(b?.tr15_amt || 0), 0) || 0,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.updateZPPVTKEY = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { payload } = req.body;
    const { pvt_key } = deCryptData(payload);
    const qu = "SELECT `status` FROM  `admin_setting` WHERE id = 27;";
    const is_active_for_update = await queryDb(qu, []);
    if (is_active_for_update?.[0]?.status !== 1)
      return res.status(200).json({
        msg: "You have alredy set.",
      });
    console.log("dsaf", pvt_key);
    const payloadd = {
      pvt: pvt_key,
    };
    try {
      token = jwt.sign(
        {
          data: payloadd,
          algorithm: "RS256",
        },
        process.env.JWT_SECRET
      );
    } catch (e) {
      console.log("Error in jwt token encript.");
    }
    let q = "UPDATE `admin_setting` SET `longtext` = ? WHERE `id` = 18;";
    await queryDb(q, [token]);
    let update_for_second =
      "UPDATE `admin_setting` SET `status` = 0 WHERE `id` = 27;";
    await queryDb(update_for_second, []);

    return res.status(200).json({
      msg: "Updated Successfully.",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};

exports.ApproveAllUsers = async (req, res) => {
  try {
    const quer = "UPDATE `user` SET `finger_id` = 'Approve';";
    await queryDb(quer, []);
    return res.status(200).json({
      msg: "Approve Successfully.",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.fundDebitedByAdmin = async (req, res) => {
  try {
    const u_req_user_id = req.userid;
    if (!u_req_user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { u_req_amount, user_id, wallet_type } = req.body; // wallet type ==> 1 for main wallet , 2 for winning wallet
    if (
      !Number(u_req_amount) ||
      !Number(u_req_user_id) ||
      !Number(wallet_type) ||
      !user_id
    )
      return res.status(201).json({
        msg: "Everything is required.",
      });
    let q = "";
    if (Number(wallet_type) === 1) {
      q +=
        "UPDATE `user` SET `wallet` = IFNULL(`wallet`, 0) - IFNULL(?, 0) WHERE id = ?;";
    } else if (Number(wallet_type) === 2) {
      q +=
        "UPDATE `user` SET `winning_wallet` =  IFNULL(`winning_wallet`, 0) - IFNULL(?, 0) WHERE id = ?;";
    }
    await queryDb(q, [Number(u_req_amount), user_id]);
    const qful =
      "INSERT INTO leser(`l01_user_id`,`l01_type`,`l01_transection_type`,`l01_amount`,`l01_status`) VALUES(?,?,?,?,?);";
    await queryDb(qful, [
      Number(user_id),
      "Debited Fund By Admin",
      "Fund Debited By Admin.",
      Number(u_req_amount),
      1,
    ]);
    return res.status(200).json({
      msg: "Data Update Successfully.",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.fundDebitedByAdminHistory = async (req, res) => {
  try {
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
    const { start_date, end_date, username } = req.body;
    let q =
      "SELECT u.`full_name`,u.`username`,u.`mobile`,u.`email`, ls.`l01_type`,ls.`l01_transection_type`,ls.`l01_amount`,ls.`l01_date` FROM leser AS ls LEFT JOIN `user` AS u ON ls.`l01_user_id` = u.id WHERE ls.`l01_type` = 'Debited Fund By Admin' ";
    let replace = [];
    if (username) {
      q += " AND u.`username` = ? ";
      replace.push(String(username));
    } else if (start_date && end_date) {
      q += "AND DATE(ls.`l01_date`) >= ? AND DATE(ls.`l01_date`) <= ? ";
      replace.push(moment(start_date)?.format("YYYY-MM-DD"));
      replace.push(moment(end_date)?.format("YYYY-MM-DD"));
    } else {
      q +=
        "AND DATE(ls.`l01_date`) >= DATE(NOW()) AND DATE(ls.`l01_date`) <= DATE(NOW()) ";
    }
    q += "ORDER BY ls.lo1_id DESC;";
    const data = await queryDb(q, replace);

    return res.status(200).json({
      msg: "Debited fund list get successfully.",
      data: data,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.updateUserName = async (req, res) => {
  try {
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
    const { u_user_id, u_user_name } = req.body;
    if (!u_user_id || !u_user_name) {
      return res.status(400).json({
        msg: `Please provide user name.`,
      });
    }
    await queryDb("UPDATE `user` SET full_name = ? WHERE id = ?;", [
      u_user_name,
      Number(u_user_id),
    ]);

    return res.status(200).json({
      msg: "User name updated successfully.",
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
