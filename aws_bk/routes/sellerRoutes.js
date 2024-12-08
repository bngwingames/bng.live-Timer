const express = require("express");
const { customerRegistration } = require("../controller/sellerController");

const router = express.Router();

router.post("/cust-registration",customerRegistration)
module.exports = router;
