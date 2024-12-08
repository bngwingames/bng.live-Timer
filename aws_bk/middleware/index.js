const jwt = require("jsonwebtoken");
const sequelize = require("../config/seq.config");
require("dotenv").config();
exports.authCheck = async (req, res, next) => {
  try {
    const authHeader = req?.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ msg: "Authorization header missing or invalid" });
    }
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return res.status(201)?.json({
        msg: "Missing Token.",
      });
    }
    const query_for_check_user_auth = "SELECT id FROM user WHERE token = ?;";
    // Await the query to resolve the promise and destructure the result
    const [data] = await sequelize.query(query_for_check_user_auth, {
      replacements: [token],
    });
    if (data?.length <= 0) {
      return res.status(201)?.json({
        msg: "Invalid Token.",
      });
    }

    try {
      const decode = await jwt.verify(token, process.env.JWT_SECRET);
      if (
        !(
          decode?.data?.user_type === "User" ||
          decode?.data?.user_type === "Admin" ||
          decode?.data?.user_type === "Super Admin" ||
          decode?.data?.user_type === "Dummy User" ||
          decode?.data?.user_type === "Support Agent"
        )
      )
        return res
          .status(200)
          .json({ msg: "Route Available for User, Admin, Super Admin" });
      req.userid = decode?.data?.userid;
      req.userType = decode?.data?.user_type;
    } catch (e) {
      res.status(500).json({ msg: "Error in Token, refresh your page." });
    }
    next();
  } catch (e) {
    console.log(e);
    console.log("Error in cookies");
    res.status(500).json({ msg: "Server Error" });
  }
};
exports.authCheckDummyUser = async (req, res, next) => {
  try {
    const authHeader = req?.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ msg: "Authorization header missing or invalid" });
    }
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return res.status(201)?.json({
        msg: "Missing Token.",
      });
    }
    const query_for_check_user_auth = "SELECT id FROM user WHERE token = ?;";
    // Await the query to resolve the promise and destructure the result
    const [data] = await sequelize.query(query_for_check_user_auth, {
      replacements: [token],
    });

    if (data?.length <= 0) {
      return res.status(201)?.json({
        msg: "Invalid Token.",
      });
    }

    try {
      const decode = await jwt.verify(token, process.env.JWT_SECRET);
      if (decode?.data?.user_type === "Dummy User")
        return res
          .status(200)
          .json({ msg: "Route Available for User, Admin, Super Admin" });
      req.userid = decode?.data?.userid;
      req.userType = decode?.data?.user_type;
    } catch (e) {
      res.status(500).json({ msg: "Error in Token, refresh your page." });
    }
    next();
  } catch (e) {
    console.log(e);
    console.log("Error in cookies");
    res.status(500).json({ msg: "Server Error" });
  }
};
exports.authCheckAdmin = async (req, res, next) => {
  try {
    const authHeader = req?.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ msg: "Authorization header missing or invalid" });
    }
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return res.status(201)?.json({
        msg: "Missing Token.",
      });
    }
    const query_for_check_user_auth = "SELECT id FROM user WHERE token = ?;";
    // Await the query to resolve the promise and destructure the result
    const [data] = await sequelize.query(query_for_check_user_auth, {
      replacements: [token],
    });

    if (data?.length <= 0) {
      return res.status(201)?.json({
        msg: "Invalid Token.",
      });
    }

    try {
      const decode = await jwt.verify(token, process.env.JWT_SECRET);
      if (
        !(
          decode?.data?.user_type === "Admin" ||
          decode?.data?.user_type === "Super Admin"
        )
      )
        return res
          .status(200)
          .json({ msg: "Route Available for admin and super Admin" });
      req.userid = decode?.data?.userid;
      req.userType = decode?.data?.user_type;
    } catch (e) {
      res.status(500).json({ msg: "Error in Token, refresh your page." });
    }
    next();
  } catch (e) {
    console.log(e);
    console.log("Error in cookies");
    res.status(500).json({ msg: "Server Error" });
  }
};
exports.authCheckSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req?.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ msg: "Authorization header missing or invalid" });
    }
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return res.status(201)?.json({
        msg: "Missing Token.",
      });
    }
    const query_for_check_user_auth = "SELECT id FROM user WHERE token = ?;";
    // Await the query to resolve the promise and destructure the result
    const [data] = await sequelize.query(query_for_check_user_auth, {
      replacements: [token],
    });

    if (data?.length <= 0) {
      return res.status(201)?.json({
        msg: "Invalid Token.",
      });
    }

    try {
      const decode = await jwt.verify(token, process.env.JWT_SECRET);
      if (!(decode?.data?.user_type === "Super Admin"))
        return res
          .status(200)
          .json({ msg: "Route Available for Super Admin only" });
      req.userid = decode?.data?.userid;
      req.userType = decode?.data?.user_type;
    } catch (e) {
      res.status(500).json({ msg: "Error in Token, refresh your page." });
    }
    next();
  } catch (e) {
    console.log(e);
    console.log("Error in cookies");
    res.status(500).json({ msg: "Server Error" });
  }
};
exports.authCheckSupportAgent = async (req, res, next) => {
  try {
    const authHeader = req?.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ msg: "Authorization header missing or invalid" });
    }
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return res.status(201)?.json({
        msg: "Missing Token.",
      });
    }
    const query_for_check_user_auth = "SELECT id FROM user WHERE token = ?;";
    // Await the query to resolve the promise and destructure the result
    const [data] = await sequelize.query(query_for_check_user_auth, {
      replacements: [token],
    });

    if (data?.length <= 0) {
      return res.status(201)?.json({
        msg: "Invalid Token.",
      });
    }

    try {
      const decode = await jwt.verify(token, process.env.JWT_SECRET);
      if (decode?.data?.user_type === "Support Agent")
        return res
          .status(200)
          .json({ msg: "Route Available for Valid Users." });
      req.userid = decode?.data?.userid;
      req.userType = decode?.data?.user_type;
    } catch (e) {
      res.status(500).json({ msg: "Error in Token, refresh your page." });
    }
    next();
  } catch (e) {
    console.log(e);
    console.log("Error in cookies");
    res.status(500).json({ msg: "Server Error" });
  }
};
