const { randomStrAlphabetNumeric, queryDb } = require("../helper/adminHelper");

exports.customerRegistration = async (req, res) => {
  const { mobile, email, f_name, l_name, pass, confirmpass } = req.body;
  if (!mobile || !email || !f_name || !pass || !confirmpass)
    return res.status(201).json({
      msg: `Everything is required`,
    });
  if (pass !== confirmpass)
    return res.status(201).json({
      msg: `Password and confirm password doesn't match.`,
    });
  try {
    let str = randomStrAlphabetNumeric(8);
    let randomId = "FEGIS" + str;
    const login_rep = [randomId, mobile, email, pass];
    const login_q =
      "INSERT INTO `login_credentials`(`lo_cust_id`,`lo_user_mobile`,`lo_user_email`,`lo_userpass`) VALUES(?,?,?,?);";

    await queryDb(login_q, login_rep);
    const last_id = await queryDb(`SELECT LAST_INSERT_ID() AS last_in_id;`, []);
    const q =
      "INSERT INTO `customer_details`(`c_lo_id`,`c_first_name`,`c_last_name`,`c_mobile`,`c_email`) VALUES(?,?,?,?,?);";
    const signup_replacement = [
      last_id?.[0]?.last_in_id,
      f_name || "",
      l_name || "",
      mobile,
      email,
    ];
    await queryDb(q, signup_replacement);
    return res.status(200).json({
      msg: newresult?.[0]?.["@result_msg"],
    });
  } catch (e) {
    return res.status(500).json({
      msg: `Something went wrong api calling`,
    });
  }
};
