const Coinpayments = require("coinpayments");
const { queryDb } = require("../helper/adminHelper");
const moment = require("moment");
const credentials = {
  
};
exports.getPaymentGateway = async (req, res) => {
  const { amount, userid } = req.body;
  const transactonNo = Date.now();
  if (!amount || !userid)
    return res.status(201).json({
      msg: "Everything is required",
    });
  if (Number(amount) <= 0)
    return res.status(201).json({
      msg: "Amount should be grater than 0$",
    });

  const num_amount = Number(amount);
  if (typeof num_amount !== "number")
    return res.status(201).json({
      msg: "Amount should be in number data type",
    });
  try {
    const client = new Coinpayments(credentials);

    const CoinpaymentsCreateTransactionOpts = {
      currency1: "USDT.BEP20",
      currency2: "USDT.BEP20",
      amount: Number(num_amount),
      buyer_email: "suretradefx24@gmail.com",
      address: "", // Optional, for some currencies
      buyer_name: "Arun Kumar", // Optional
      item_name: "", // Optional
      item_number: "", // Optional
      invoice: transactonNo,
      custom: "", // Optional
      ipn_url: "", // Optional
      success_url: "https://funxplora.com/",
      cancel_url: "https://funxplora.com/",
    };

    const response = await client.createTransaction(
      CoinpaymentsCreateTransactionOpts
    );

    const params = [
      Number(userid),
      "USDT.BEP20",
      Number(num_amount),
      `${transactonNo}`,
      JSON.stringify({
        txtamount: Number(num_amount),
        coin: "USDT.BEP20",
      }),
      JSON.stringify(response),
      `${response?.address}`,
      `${response?.status_url}`,
      `${response?.qrcode_url}`,
    ];
    await saveDataIntoTable(params);
    res.status(200).json({
      data: response,
    });
  } catch (e) {
    console.log(e);
    const params = [
      Number(userid),
      "USDT.BEP20",
      Number(num_amount),
      `${transactonNo}`,
      JSON.stringify({
        txtamount: Number(num_amount),
        coin: "USDT.BEP20",
      }),
      JSON.stringify(e),
      "",
      "",
      "",
    ];
    await saveDataIntoTable(params);
    res.status(400).json({
      error: "Something went wrong",
    });
  }
};

async function saveDataIntoTable(params) {
  try {
    const query = `INSERT INTO m05_fund_gateway(user_id,to_coin,amt,order_id,request,response,address,status_url,qrcode_url)
        VALUES(
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
        );`;
    const response_Gateway_data = await queryDb(query, params)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        console.log(
          "Something went in insert data in table at the usdt gateway"
        );
      });
  } catch (e) {
    console.log(e);
  }
}

exports.getCallBack = async (req, res) => {
  try {
    const response = req.body;
    const invoice = response?.invoice;
    const status = response?.status_text;
    const success_amount = response?.amount1;
    console.log(response, "this is response get by the call back api");
    const str = "Complete";
    if (status?.toUpperCase() === str?.toUpperCase()) {
      /// data set into m05_fund_gateway
      const query = `UPDATE  m05_fund_gateway SET callback = ?,success_date = ?,success_amount = ?,status = ? WHERE  order_id = ?;`;
      await queryDb(query, [
        JSON.stringify(response),
        `${moment(Date.now())?.format("YYYY-MM-DD HH:mm:ss")}`,
        Number(success_amount),
        "success",
        String(invoice),
      ])
        .then((result) => {})
        .catch((e) => {
          console.log("Error in callback inserting");
        });

      // get user id from the m05_fund_gateway table ;
      const get_user_id = `SELECT user_id FROM m05_fund_gateway WHERE order_id = ?;`;
      await queryDb(get_user_id, [String(invoice)])
        .then(async (result) => {
          if (result?.length <= 0) return;
          const user_id = result?.[0]?.user_id;
          //////////////// insert in leser ////////////////////
          const query_for_inserting_in_leser = `CALL sp_coin_payment_update_leser_payin(?,?,?);`;
          const leser_params = [
            Number(user_id),
            Number(success_amount || 0)?.toFixed(4),
            String(invoice),
          ];
          await queryDb(query_for_inserting_in_leser, leser_params)
            .then((result) => {})
            .catch((e) => {
              console.log("Error in inserting in leser transaction.");
            });
        })
        .catch((e) => {
          console.log("Error in finding userid from the fund_gateway table.");
        });
      // data add into leser
    } else {
      const query = `UPDATE m05_fund_gateway 
        SET callback = ?, success_date = ?, status = ? 
        WHERE order_id = ?;`;
      try {
        const result = await queryDb(query, [
          JSON.stringify({ response }),
          moment().format("YYYY-MM-DD HH:mm:ss"),
          "failed",
          String(invoice),
        ]);
        console.log("Update successful:", result);
      } catch (e) {
        console.error("Error in callback inserting:", e);
      }
    }
    res.status(200).json({
      msg: "We get response now.",
    });
  } catch (e) {
    console.log(e);
  }
};

exports.withdrawlRequest = async (req, res) => {
  const { m_u_id, m_w_amount, withdrawal_add, select_wallet } = req.body;
  let m_w_trans_id = Date.now();

  if (!m_u_id || !m_w_amount || !withdrawal_add || !select_wallet)
    return res.status(200).json({
      msg: `Everything is required`,
    });

  const num_userid = Number(m_u_id);

  if (typeof num_userid !== "number")
    return res.status(200).json({
      msg: `User id should be in number`,
    });

  let amount_in_inr = 92;
  const query_for_get_doller_rate =
    "SELECT `longtext` FROM admin_setting WHERE id = 13;";
  amount_in_inr = await queryDb(query_for_get_doller_rate)
    .then((result) => {
      return result?.[0]?.longtext || 92;
    })
    .catch((e) => {
      console.log("Error in fetching amount in dollar.");
    });

  if (
    Number(Number(m_w_amount) / Number(amount_in_inr || 92))?.toFixed(4) > 10 &&
    Number(Number(m_w_amount) / Number(amount_in_inr || 92))?.toFixed(4) < 500
  )
    return res.status(200).json({
      msg: `Amount should be grater or equal 10 and less than 501.`,
    });

  const query_for_check_withdrawal_condition =
    "CALL sp_for_withdrawl_request(?,?,?,@result_msg); SELECT @result_msg;";
  const parameter = [
    Number(num_userid),
    Number(m_w_amount)?.toFixed(4),
    String(select_wallet || "Working Wallet"),
  ];

  const responseOf = await queryDb(
    query_for_check_withdrawal_condition,
    parameter
  )
    .then((result) => {
      return result;
    })
    .catch((e) => {
      return res.status(500).json({
        msg: "Something went wrong.",
      });
    });

  if (responseOf?.[1]?.[0]?.["@result_msg"] !== "1")
    return res.status(200).json({
      error: "200",
      msg: responseOf?.[1]?.[0]?.["@result_msg"],
    });
  try {
    const query = `INSERT INTO tr12_withdrawal(m_u_id,m_w_amount_inr,w_wallet_type,m_w_amount,m_w_admin,m_w_tdscharges,withdrawal_add,m_w_trans_id) VALUES(?,?,?,?,?,?,?,?);`;
    await queryDb(query, [    
      Number(num_userid),
      Number(m_w_amount),
      String(select_wallet || "Working Wallet")==="Working Wallet" ? 2 : 1,
      Number(Number(m_w_amount) / Number(amount_in_inr || 92))?.toFixed(4),
      0,
      0,
      String(withdrawal_add),
      String(m_w_trans_id),
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
          msg: "`Record save successfully`",
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

// should be approve from admin panel
exports.update_member_withdrawal_gatway = async (req, res) => {
  let res_to_send = "";
  let status_code = 200;

  try {
    const { id } = req.query;
    if (!id) {
      return res.status(201).json({
        msg: "Please provide id.",
      });
    }

    const client = new Coinpayments(credentials);

    const query_for_tr12_withdrawal = `SELECT * FROM tr12_withdrawal WHERE w_id = ?;`;
    await queryDb(query_for_tr12_withdrawal, [id])
      .then(async (result) => {
        if (result?.length > 0) {
          if (result?.[0]?.m_w_status === "Pending") {
            const param = [
              result?.[0]?.m_u_id,
              result?.[0]?.m_w_amount,
              "USDT.BEP20",
              id,
              result?.[0]?.withdrawal_add,
            ];

            let last_inserted_id = "";
            const query_for_insert_data_in_gateway_withdraw = `INSERT INTO gateway_withdraw(user_id, amount, coin, withdrwal_id, coin_address) VALUES (?, ?, ?, ?, ?);`;

            try {
              const result = await queryDb(
                query_for_insert_data_in_gateway_withdraw,
                param
              );
              last_inserted_id = result.insertId; // Access the insertId directly
            } catch (e) {
              console.log("Error in inserting data into gateway_withdraw:", e);
            }
            // currency: "USDT.BEP20",
            const CoinpaymentsCreateMassWithdrawalElement = {
              amount: result?.[0]?.m_w_amount,
              currency: "USDT.BEP20",
              address: result?.[0]?.withdrawal_add,
              ipn_url: "https://api.funxplora.com/api/v1/withdrawlCallBack",
              add_tx_fee: 1,
              auto_confirm1: "1",
            };
            const response_of_mass_req = await client.createMassWithdrawal([
              CoinpaymentsCreateMassWithdrawalElement,
            ]);
            if (response_of_mass_req?.wd1?.error !== "ok") {
              const query_for_update_gateway_withdraw = `UPDATE gateway_withdraw SET status = ?,api_response = ? WHERE id =?;`;
              const par = [
                "error",
                JSON.stringify(response_of_mass_req || ""),
                last_inserted_id,
              ];
              await queryDb(query_for_update_gateway_withdraw, par);
              res_to_send = JSON.stringify(response_of_mass_req);
              status_code = 201;
            } else {
              const query_for_update_tr12_withdrawal = `UPDATE tr12_withdrawal SET m_w_crypto_status = ?, m_w_status = ? WHERE w_id = ?;`;
              const parameter = [3, 2, Number(id)];
              await queryDb(query_for_update_tr12_withdrawal, parameter)
                ?.then((result) => {})
                .catch((e) => {
                  console.log(e, "eeeeeeeeeeeeeeee");
                });

              // sleep for 1 second
              await new Promise((resolve) => setTimeout(resolve, 1000));
              const CoinpaymentsGetWithdrawalInfoOpts = {
                id: response_of_mass_req?.wd1?.id,
              };
              const response = await client.getWithdrawalInfo(
                CoinpaymentsGetWithdrawalInfoOpts
              );

              const query_for_update_gateway_withdraw = `UPDATE gateway_withdraw SET api_response = ?, trans_id = ?, info_response = ?, last_status_update = ? WHERE id = ?;`;
              const parameters = [
                JSON.stringify(response_of_mass_req || ""),
                response_of_mass_req?.wd1?.id,
                JSON.stringify(response || ""),
                moment(Date.now())?.format("YYYY-MM-DD HH:mm:ss"),
                last_inserted_id,
              ];
              await queryDb(query_for_update_gateway_withdraw, parameters);
              res_to_send = JSON.stringify(response || "");
              status_code = 200;
            }
          }
        }
      })
      .catch((e) => {
        console.log("Error in get all from tr12_withdraw", e);
      });
    return res.status(200).json({
      status: status_code,
      msg:
        res_to_send ||
        "Request Added in Coinpayment it will take 1-2 hour to update your wallet.",
    });
  } catch (e) {
    console.log("Error in massWithdrawilRequest");
  }
};

exports.withdrawlCallBack = async (req, res) => {
  try {
    const { id } = req.body;
    // const id = "CWIH7EYZI2I5I4JHYNE88VUPWS"

    const client = new Coinpayments(credentials);

    const CoinpaymentsGetWithdrawalInfoOpts = {
      id: id,
    };
    const response = await client.getWithdrawalInfo(
      CoinpaymentsGetWithdrawalInfoOpts
    );
    const query_for_update_gateway_withdraw = `UPDATE gateway_withdraw SET info_response = ?, last_status_update = ?,status = ? WHERE trans_id = ?;`;
    const params = [
      JSON.stringify(response), // info_response
      moment(Date.now())?.format("YYYY-MM-DD HH:mm:ss"), //last_status_update
      response?.status_text, // status
      id,
    ];
    const get_withdrawl_id = await queryDb(
      query_for_update_gateway_withdraw,
      params
    )
      ?.then((result) => {
        return result;
      })
      .catch((e) => {
        console.log("error in update table gateway_withdraw");
      });

    if (response?.status_text === "Complete") {
      const getIfExistRecord = `SELECT * FROM gateway_withdraw WHERE trans_id = ?;`;
      await queryDb(getIfExistRecord, [id]).then(async (result) => {
        if (result?.length > 0) {
          const param = [
            2,
            2,
            moment(Date.now())?.format("YYYY-MM-DD HH:mm:ss"),
            result?.[0]?.withdrwal_id,
          ];
          const update_tr12_withdrawal = `UPDATE tr12_withdrawal SET m_w_crypto_status = ?, m_w_status = ?, success_date = ? WHERE w_id = ?; `;
          await queryDb(update_tr12_withdrawal, param)
            .then((result) => {})
            .catch((e) => {});
        }
      });
    } else {
      const getIfExistRecord = `SELECT * FROM gateway_withdraw WHERE trans_id = ?;`;
      await queryDb(getIfExistRecord, [id]).then(async (result) => {
        if (result?.length > 0) {
          const param = [1, 1, result?.[0]?.withdrwal_id];
          const update_tr12_withdrawal = `UPDATE tr12_withdrawal SET m_w_crypto_status = ?, m_w_status = ?, success_date = ? WHERE w_id = ?; `;
          await queryDb(update_tr12_withdrawal, param)
            .then((result) => {})
            .catch((e) => {});
        }
      });
    }

    res.status(200).json({
      msg: "Everything is correct",
    });
  } catch (e) {
    res.status(500).json({
      msg: "Something went wrong in withdrawl call back.",
    });
    console.log("Error in withdrawl callback", e);
  }
};
