const { default: axios } = require("axios");
const { queryDb } = require("../helper/adminHelper");
const schedule = require("node-cron");
const moment = require("moment");
let indian_pay_urls = "https://indianpay.co.in/admin/paynow";
exports.inrPayinRequest = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { u_req_amount, u_gateway_type } = req.body; // 2 for indian pay
    if (!u_gateway_type)
      return res.status(201).json({
        msg: "Select Gateway Type.",
      });
    if (!Number(u_req_amount) || Number(u_req_amount) <= 100)
      return res.status(201).json({
        msg: "Amount should be grater than 100Rs.",
      });
    const user_data = await queryDb(
      "SELECT mobile,email,wallet,full_name FROM user WHERE id = ? LIMIT 1;",
      [Number(user_id)]
    );
    const tr_id = String(
      Date.now() + "" + user_id + "" + Math.floor(Number(u_req_amount) % 100)
    );
    const jBody = {
      merchantid: "INDIANPAY10032",
      orderid: tr_id,
      amount: u_req_amount,
      name: user_data?.[0]?.full_name || "Name Not Found",
      email: user_data?.[0]?.email || "emailnotfound@gmail.com",
      mobile: user_data?.[0]?.mobile || "1234567890",
      remark: "Zupeeter Gaming",
      type: "2",
      redirect_url: `https://bet.zupeeter.com/api/v1/inr-payin-request-inr-call-back?order_id=${tr_id}`,
    };
    const result = await axios.post(indian_pay_urls, jBody);

    const save_data =
      "INSERT INTO `tr15_fund_request`(`tr15_uid`,`tr15_amt`,`Deposit_type`,`tr15_trans`,`tr15_request`,`tr15_status`,`type`,`tr15_url`,gateway_type,tr15_response,usdt_type) VALUES(?,?,?,?,?,?,?,?,?,?,?);";
    await queryDb(save_data, [
      Number(user_id),
      Number(u_req_amount || 0),
      "INR Payin",
      tr_id,
      JSON.stringify(req.body || ""),
      1,
      1,
      JSON.stringify(indian_pay_urls || ""),
      2,
      JSON.stringify(result?.data || ""),
      "INR",
    ]);
    return res.status(200).json({
      msg: "PayIn Successfully",
      data: result?.data,
      order_id: tr_id,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.inrCallBack = async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id)
      return res.status(201).json({
        msg: "Order Id not found.",
      });
    const find_tr_data = `https://indianpay.co.in/admin/payinstatus?order_id=${order_id}`;
    const response = await axios.get(find_tr_data);
    const quer = "CALL INR_CALLBACK_RESPONSE(?,?,?);";
    if (response && response?.data && response?.data?.status === "success") {
      await queryDb(quer, [
        "Success",
        String(order_id),
        JSON.stringify(response?.data || ""),
      ]);
    }
    //  else if (
    //   response &&
    //   response?.data &&
    //   response?.data?.status !== "Success"
    // ) {
    //   await queryDb(quer, [
    //     "Failed",
    //     String(order_id),
    //     JSON.stringify(response?.data || ""),
    //   ]);
    // }
    return res.status(200).json({
      msg: "Call back successfully.",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.getBackToUserScreen = async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id)
      return res.status(201).json({
        msg: "Order Id not found.",
      });
    const find_tr_data =
      "SELECT `tr15_status` FROM `tr15_fund_request` WHERE `tr15_trans` = ? LIMIT 1;";

    const data = await queryDb(find_tr_data, [String(order_id)]);
    return res.status(200).json({
      msg: "Call back successfully.",
      data: data?.[0],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
exports.inrPayOutRequest = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { bank_id, u_req_amount } = req.body;

    if (!Number(bank_id))
      return res.status(201).json({
        msg: "Bank Not Found.",
      });

    const check_withdrawal_condition =
      "CALL sp_withdrawal_conditions(?,?,?,@res_msg);";

    await queryDb(check_withdrawal_condition, [
      Number(user_id),
      Number(u_req_amount || 0)?.toFixed(4),
      1,
    ]);
    let res_msg = "";
    await queryDb("SELECT @res_msg;", [])
      .then((result) => {
        res_msg = result?.[0]?.["@res_msg"];
      })
      .catch((e) => {
        return res.status(201).json({
          error: "200",
          msg: "Contact to admin.",
        });
      });
    if (res_msg !== "1") {
      return res.status(201).json({
        error: "200",
        msg: res_msg,
      });
    }
    const tr_id = String(
      Date.now() + "" + user_id + "" + Math.floor(Number(u_req_amount) % 100)
    );
    const save_data =
      "INSERT INTO `tr15_fund_request`(`tr15_uid`,`bank_id`,`tr15_amt`,`Deposit_type`,`tr15_trans`,`tr15_request`,`tr15_status`,`type`,`gateway_type`,`usdt_type`) VALUES(?,?,?,?,?,?,?,?,?,?);";
    await queryDb(save_data, [
      Number(user_id),
      Number(bank_id),
      Number(u_req_amount),
      "INR Payout",
      tr_id,
      JSON.stringify(req.body || ""),
      1,
      2,
      2,
      4,
    ]);
    await queryDb(
      `UPDATE user SET winning_wallet = IFNULL(winning_wallet,0) - ?, total_my_withdr_till_yest = IFNULL(total_my_withdr_till_yest,0) + ? WHERE id = ?;`,
      [Number(u_req_amount || 0), Number(u_req_amount || 0), Number(user_id)]
    );
    const last_id = await queryDb(`SELECT LAST_INSERT_ID() AS last_in_id;`, []);
    inrPayOutApproveByAdmin(last_id?.[0]?.last_in_id);
    res.status(200).json({
      msg: "Request accepted Successfully",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};
const inrPayOutApproveByAdmin = async (t_id) => {
  try {
    const tableData = await queryDb(
      "SELECT u.`username`,u.id AS userid ,u.`full_name`,u.email, u.`mobile`,b.`account`,b.`bank_name`,b.`ifsc`,t.tr15_trans, t.`tr15_amt`,t.`tr15_date`,t.`tr15_status` FROM `tr15_fund_request` AS t LEFT JOIN `user` AS u ON t.`tr15_uid` = u.`id` LEFT JOIN `bank` AS b ON b.`id` = t.`bank_id` WHERE t.`type` = 2 AND `tr15_status` = 1 AND tr15_id = ?;",
      [Number(t_id)]
    );

    if (!tableData || tableData?.length === 0) return;

    const sendBody = {
      merchant_id: "INDIANPAY10032",
      merchant_token: "UKMISAn2KzUUE0ZLtAd1CdCOT25eNIfN",
      account_no: tableData?.[0]?.account,
      ifsccode: tableData?.[0]?.ifsc,
      amount: Math.floor(Number(tableData?.[0]?.tr15_amt)),
      bankname: tableData?.[0]?.bank_name,
      remark: "Zupeeter Gaming",
      orderid: tableData?.[0]?.tr15_trans,
      name: tableData?.[0]?.full_name,
      contact: tableData?.[0]?.mobile,
      email: tableData?.[0]?.email,
    };
    const reqbody = {
      salt: Buffer.from(JSON.stringify(sendBody)).toString("base64"),
    };
    console.log(sendBody, reqbody);
    const result = await axios.post(
      "https://indianpay.co.in/admin/single_transaction",
      reqbody
    );
    // if (result?.data?.status === 200) {
    //   const save_data =
    //     "UPDATE `tr15_fund_request` SET admin_approval = 1,approval_date = NOW(), `tr15_status` = 2,success_date = NOW(),tr15_response = ?,callback_response = ? WHERE `tr15_id` = ? AND `tr15_trans` = ? AND `tr15_status` = 1;";
    //   await queryDb(save_data, [
    //     JSON.stringify(result?.data || ""),
    //     JSON.stringify(result?.data || ""),
    //     Number(t_id),
    //     String(tableData?.[0]?.tr15_trans),
    //   ]);
    // } else
    if (result?.data?.status === 400) {
      const save_data =
        "UPDATE `tr15_fund_request` SET admin_approval = 1,approval_date = NOW(),`tr15_status` = 3,success_date = NOW(),tr15_response = ? WHERE `tr15_id` = ? AND `tr15_trans` = ? AND `tr15_status` = 1;";
      await queryDb(save_data, [
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
        Number(tableData?.[0]?.tr15_amt || 0),
      ]);
      const callback_user =
        "UPDATE `user` SET `winning_wallet` = IFNULL(`winning_wallet`,0) + ?, total_my_withdr_till_yest = IFNULL(total_my_withdr_till_yest,0) - ?  WHERE `id` = ?;";
      await queryDb(callback_user, [
        Number(tableData?.[0]?.tr15_amt || 0),
        Number(tableData?.[0]?.tr15_amt || 0),
        Number(tableData?.[0]?.userid),
      ]);
    } else {
      const save_data =
        "UPDATE `tr15_fund_request` SET admin_approval = 1,approval_date = NOW(),`tr15_status` = 4,tr15_response = ? WHERE `tr15_id` = ? AND `tr15_trans` = ? AND `tr15_status` = 1;";
      await queryDb(save_data, [
        JSON.stringify(result?.data || ""),
        Number(t_id),
        String(tableData?.[0]?.tr15_trans),
      ]);
    }
    return;
  } catch (e) {
    return;
  }
};
exports.generatedTimeEveryAfterEveryOneMinbyCrown = () => {
  schedule.schedule("*/5 * * * *", function () {
    INRWITHDRAWALCALLBACK();
  });
};
const INRWITHDRAWALCALLBACK = async () => {
  try {
    const get_all_pending_record =
      "SELECT * FROM `tr15_fund_request` WHERE `admin_approval` = 1 AND `tr15_status` = 4;";
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
    const result = await axios.get(
      `https://indianpay.co.in/admin/merchantpayouthistory?merchantid=INDIANPAY10032&token=UKMISAn2KzUUE0ZLtAd1CdCOT25eNIfN&orderid=${tableData?.tr15_trans}&limit=1000`
    );
    if (result?.data?.msg?.status === "1") {
      const save_data =
        "UPDATE `tr15_fund_request` SET admin_approval = 1,`tr15_status` = 2,success_date = NOW(),callback_response = ? WHERE `tr15_id` = ? AND `tr15_trans` = ? AND `tr15_status` = 4;";
      await queryDb(save_data, [
        JSON.stringify(result?.data || ""),
        Number(tableData?.tr15_id),
        String(tableData?.tr15_trans),
      ]);
    } else if (result?.data?.msg?.status === "3") {
      const save_data =
        "UPDATE `tr15_fund_request` SET admin_approval = 1,`tr15_status` = 3,success_date = NOW(),callback_response=? WHERE `tr15_id` = ? AND `tr15_trans` = ? AND `tr15_status` = 4;";
      await queryDb(save_data, [
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
        Number(tableData?.tr15_amt || 0),
      ]);
      const callback_user =
        "UPDATE `user` SET `winning_wallet` = IFNULL(`winning_wallet`,0) + ?,total_my_withdr_till_yest = IFNULL(total_my_withdr_till_yest,0) - ? WHERE `id` = ?;";
      await queryDb(callback_user, [
        Number(tableData?.tr15_amt || 0),
        Number(tableData?.tr15_amt || 0),
        Number(tableData?.userid),
      ]);
    } else {
      const save_data =
        "UPDATE `tr15_fund_request` SET admin_approval = 1,`tr15_status` = 4,callback_response = ? WHERE `tr15_id` = ? AND `tr15_trans` = ? AND `tr15_status` = 4;";
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
exports.manuallyApprovePayinByAdmin = async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id)
      return res.status(201).json({
        msg: "Order Id not found.",
      });
    const quer = "CALL INR_CALLBACK_RESPONSE(?,?,?);";
    const response = {
      order_id: order_id,
      description: "Manual Approval By Admin",
    };
    await queryDb(quer, [
      "Success",
      String(order_id),
      JSON.stringify(response || ""),
    ]);
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
