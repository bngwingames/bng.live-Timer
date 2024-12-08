const { ethers } = require("ethers");
const { deCryptData, queryDb } = require("../helper/adminHelper");
// const MMSDK = require("@metamask/sdk");
const jwt = require("jsonwebtoken");
require("dotenv").config();
exports.zpPayOut = async (req, res) => {
  const tokenABI = [
    // balanceOf function ABI
    "function balanceOf(address owner) view returns (uint256)",
    // transfer function ABI
    "function transfer(address to, uint256 amount) returns (bool)",
  ];
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });
    const { payload } = req.body;
    const decriptData = deCryptData(payload);
    const receiver_kay = decriptData?.receiver_kay;
    const inr_amount = decriptData?.inr_amount;
    if (!receiver_kay)
      return res.status(200).json({
        msg: "You have not connected your Metamask wallet.",
      });
    if (!receiver_kay || !inr_amount)
      return res.status(200).json({
        msg: "Everything is required.",
      });
    const check_withdrawal_condition =
      "CALL sp_withdrawal_conditions(?,?,?,@res_msg);";
    await queryDb(check_withdrawal_condition, [
      Number(user_id),
      Number(inr_amount || 0)?.toFixed(4),
      2,
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
      Date.now() + "" + user_id + "" + Math.floor(Number(inr_amount) % 100)
    );
    const get_pvt_key =
      "SELECT `longtext` AS pvt_key FROM `admin_setting` WHERE `id` = 18;";
    const key_data = await queryDb(get_pvt_key, []);
    if (!key_data?.[0]?.pvt_key)
      return res.status(200).json({
        msg: `Something went wront, Please Contact to Admin.`,
      });
    const decode = await jwt.verify(
      key_data?.[0]?.pvt_key,
      process.env.JWT_SECRET
    );
    const privateKey = decode?.data?.pvt || "";

    const get_zp_amount_key =
      "SELECT `longtext` AS get_zp_amnt FROM `admin_setting` WHERE `id` = 17;";
    const get_zp_amount_key_data = await queryDb(get_zp_amount_key, []);
    if (!get_zp_amount_key_data?.[0]?.get_zp_amnt)
      return res.status(200).json({
        msg: `Something went wront, Please Contact to Admin.`,
      });
    const get_zp_amount = get_zp_amount_key_data?.[0]?.get_zp_amnt || "";
    const get_contract_add_key =
      "SELECT `longtext` AS token_address FROM `admin_setting` WHERE `id` = 19;";
    const address_data = await queryDb(get_contract_add_key, []);
    if (!address_data?.[0]?.token_address)
      return res.status(200).json({
        msg: `Something went wront, Please Contact to Admin.`,
      });
    const tokenContractAddress = address_data?.[0]?.token_address || "";

    const replacement = [
      1,
      1,
      Number(user_id),
      receiver_kay,
      tr_id,
      JSON.stringify(decriptData || ""),
      Number(inr_amount),
      1,
      "",
      "",
      "",
      "",
      "",
    ];
    const req_for_check_with_cond =
      "CALL sp_for_withdrawal_request(?,?,?,?,?,?,?,?,?,?,?,?,?,@res_msg,@last_inserted_id);";
    await queryDb(req_for_check_with_cond, replacement);
    await queryDb("SELECT @res_msg,@last_inserted_id;", [])
      .then(async (result) => {
        if (result?.[0]?.["@res_msg"] === "OK") {
          const provider = new ethers.providers.JsonRpcProvider(
            "https://bsc-dataseed.binance.org/"
          );
          const wallet = new ethers.Wallet(privateKey, provider);
          const tokenContract = new ethers.Contract(
            tokenContractAddress,
            tokenABI,
            wallet
          );
          try {
            const tokenAmount = ethers.utils.parseUnits(
              String(Number(inr_amount) / Number(get_zp_amount)),
              18
            );

            const gasEstimate = await tokenContract.estimateGas.transfer(
              // Receiver address (your TrustWallet)
              receiver_kay,
              tokenAmount
            );
            const balance = await provider.getBalance(wallet.address);

            const gasPrice = await provider.getGasPrice();
            const gasCost = gasEstimate.mul(gasPrice);

            if (balance.lt(gasCost)) {
              return res.status(200).json({
                msg: "Insufficient BNB for gas fees, Please Contact to Admin.",
              });
            }

            // Call the transfer function to send the tokens
            const transactionResponse = await tokenContract.transfer(
              receiver_kay, // Your TrustWallet address
              tokenAmount
            );
            // Wait for transaction confirmation
            const receipt = await transactionResponse.wait();
            const response_receipt = {
              to: receipt?.to,
              from: receipt?.from,
              blockHash: receipt?.blockHash,
              transactionHash: receipt?.transactionHash,
              blockNumber: receipt?.blockNumber,
              confirmations: receipt?.confirmations,
              status: receipt?.status,
              type: receipt?.type,
            };
            if (receipt.status === 1) {
              const replacement = [
                2,
                1,
                Number(user_id),
                receiver_kay,
                tr_id,
                JSON.stringify(decriptData || ""),
                Number(inr_amount),
                Number(result?.[0]?.["@last_inserted_id"]),
                "", // user description
                transactionResponse.hash,
                ethers.utils.formatEther(balance),
                ethers.utils.formatEther(gasCost),
                JSON.stringify(response_receipt || ""),
              ];
              const req_for_check_with_cond =
                "CALL sp_for_withdrawal_request(?,?,?,?,?,?,?,?,?,?,?,?,?,@res_msg,@last_inserted_id);";
              await queryDb(req_for_check_with_cond, replacement);
              return res.status(200).json({
                msg: "Transaction Successfully Done.",
                transaction_status: "Success",
                transaction_hash: transactionResponse.hash,
              });
            } else {
              const replacement = [
                3,
                1,
                Number(user_id),
                receiver_kay,
                tr_id,
                JSON.stringify(decriptData || ""),
                Number(inr_amount),
                Number(result?.[0]?.["@last_inserted_id"]),
                "", // user description
                transactionResponse.hash,
                ethers.utils.formatEther(balance),
                ethers.utils.formatEther(gasCost),
                JSON.stringify(response_receipt || ""),
              ];
              const req_for_check_with_cond =
                "CALL sp_for_withdrawal_request(?,?,?,?,?,?,?,?,?,?,?,?,?,@res_msg,@last_inserted_id);";
              await queryDb(req_for_check_with_cond, replacement);
              return res.status(200).json({
                msg: "Transaction Successfully Done.",
                transaction_status: "Failed",
                transaction_hash: transactionResponse.hash,
              });
            }
          } catch (error) {
            const replacement = [
              3,
              1,
              Number(user_id),
              receiver_kay,
              tr_id,
              JSON.stringify(decriptData || ""),
              Number(inr_amount),
              Number(result?.[0]?.["@last_inserted_id"]),
              "", // user description
              transactionResponse.hash,
              ethers.utils.formatEther(balance),
              ethers.utils.formatEther(gasCost),
              JSON.stringify(response_receipt || ""),
            ];
            const req_for_check_with_cond =
              "CALL sp_for_withdrawal_request(?,?,?,?,?,?,?,?,?,?,?,?,?,@res_msg,@last_inserted_id);";
            await queryDb(req_for_check_with_cond, replacement);
            return res.status(200).json({
              msg: "Transaction Successfully Done.",
              transaction_status: "Failed",
              transaction_hash: transactionResponse.hash || "",
            });
            // return res.status(201).json({
            //   msg: "Withdrawal Transaction Failed",
            // });
          }
        } else {
          return res.status(200).json({
            msg: result?.[0]?.["@res_msg"],
          });
        }
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
exports.zpGetOwnerAddress = async (req, res) => {
  try {
    const user_id = req.userid;
    if (!user_id)
      return res.status(201)?.json({
        msg: "Token not found.",
      });

    const get_pvt_key =
      "SELECT (SELECT `longtext` FROM `admin_setting` WHERE `id` IN (20)) AS payin_token_address, (SELECT `longtext` FROM `admin_setting` WHERE `id` IN (17)) AS token_amnt;";
    const key_data = await queryDb(get_pvt_key, []);
    return res.status(200).json({
      data: key_data,
      msg: `Address Get Successfully.`,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      msg: "Something went wrong in the node API",
    });
  }
};

exports.ZPpayInRequest = async (req, res) => {
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  const { payload } = req.body;
  const decriptData = deCryptData(payload);
  const {
    req_amount,
    u_user_wallet_address,
    u_transaction_hash,
    u_trans_status,
    currentBNB,
    currentZP,
    gas_price,
    deposit_type,
  } = decriptData;
  if (
    !req_amount ||
    !userid ||
    !u_user_wallet_address ||
    !u_transaction_hash ||
    !u_trans_status ||
    !currentBNB ||
    !currentZP ||
    !gas_price ||
    !deposit_type
  )
    return res.status(201)?.json({
      msg: "Everything is required.",
    });

  try {
    const query =
      "CALL sp_manual_fund_request(?,?,?,?,?,?,?,?,?,?,?,@res_msg);";
    await queryDb(query, [
      1,
      Number(userid),
      Number(req_amount || 0),
      Number(deposit_type),
      u_user_wallet_address,
      u_transaction_hash,
      JSON.stringify(decriptData || ""),
      u_trans_status,
      currentBNB,
      currentZP,
      gas_price,
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

exports.ZPpayInRequest_Dummy_Entry = async (req, res) => {
  const userid = req.userid;
  if (!userid)
    return res.status(201)?.json({
      msg: "Token not found.",
    });
  const { payload } = req.body;
  const decriptData = deCryptData(payload);
  const {
    req_amount,
    u_user_wallet_address,
    u_transaction_hash,
    u_trans_status,
    currentBNB,
    currentZP,
    gas_price,
  } = decriptData;

  try {
    const query =
      "CALL sp_manual_fund_request(?,?,?,?,?,?,?,?,?,?,?,@res_msg);";
    await queryDb(query, [
      4,
      Number(userid),
      Number(req_amount || 0),
      1,
      u_user_wallet_address,
      u_transaction_hash,
      JSON.stringify(decriptData || ""),
      u_trans_status,
      currentBNB,
      currentZP,
      gas_price,
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
