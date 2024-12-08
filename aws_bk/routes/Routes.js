const express = require("express");
const {
  chnagePassWord,
  getGameHistory,
  getMyHistory,
  placeBetTrx,
  loginPage,
  myHistoryWingo,
  placeBetWingo,
  gameHistoryWingo,
  getBalance,
  getLevels,
  getDepositlHistory,
  addUSDTAddress,
  uddtAddressHistory,
  getWithdrawlHistory,
  getLevelIncome,
  getStatus,
  getSubOrdinateData,
  getAllCommission,
  transfer_Amount_to_mainWallet_from_WorkingWallet,
  get_transfer_history_working_to_main_wallet,
  getDailySalaryIncome,
  getWeeklySalaryIncome,
  getTopWinners,
  getSelfDepositBonus,
  getSponsorIncome,
  needToBet,
  getCashBack,
  getTotalBetAndIncomeYesterday,
  getMyHistoryTemp,
  ticketRaised,
  getTicketRaisedHistory,
  signupUser,
  getUserNameByUserId,
  getAttendanceBonus,
  clameBonus,
  getInvitationBonus,
  getVipBonus,
  getDailySalary,
  getDepositBonus,
  forGetPassword,
  veryFyOTP,
  updatePassword,
  payInRequest,
  payOutRequest,
  getDepositHistoryUSDT,
  getWithdrawalHistoryUSDT,
  getAdminQrAddress,
  getProfileData,
  getDepositHistoryINR,
  getWihdrawalHistoryINR,
  addBankAddress,
  userBankDetails,
  hideStatusOfDepositPopup,
  userGetLevelData,
  getGiftCardList,
  clameGiftCard,
  getGiftBonusList,
  sendRegistrationOTP,
  verifyRegistrationOTP,
  getTeamRechargeBonus,
  p2pFundTransfer,
  getFundTransferHistory,
  getZPDepositlHistory,
  getZPWithdrawallHistory,
  getCompanyPromoterBonusList,
  getGameHistoryTC,
  getWelcomeBonusListUser,
} = require("../controller");
const {
  payOutRequestList,
  inrPayOutApproveByAdmin,
  getWelcomeBonusList,
  getDepositBonusList,
  getSelfDepositBonusList,
  getROIBonusList,
  getDailySalaySalaryList,
  getbetIncomeList,
  getLevelIncomeList,
  payOutRequestListSuccess,
  payOutRequestListFailed,
  payOutRequestListPendingFromGateway,
  inrPayOutRejectedByAdmin,
  userList,
  updateUserStatus,
  setWingoResultByAdmin,
  fundAddByAdmin,
  getAviatorReport,
  getWingoReport,
  getTRXReport,
  getFundTransferHistoryReport,
  changePermission,
  dayBookReport,
  dasbboardAPI,
  changeUserPassword,
  getDownlineTeam,
  getUplineTeam,
  userAviatorBetStatusBarChart,
  userWingoBetStatusBarChart,
  userTRXBetStatusBarChart,
  userBusinessStatusBarChart,
  userRegistrationStatusBarChart,
  set_IncomeAmountFunction,
  get_Coupon_list_admin,
  add_Coupon_list_admin,
  update_status_Coupon_admin,
  approveForOtherBrowser,
  set_ZPFunction,
  getZPTokenPayinAdmin,
  getZPTokenPayOutAdmin,
  getGiftBonusListAdmin,
  getWeeklyRecoveryBonusListAdmin,
  getVIPBonusListAdmin,
  getTeamReferralFirstListAdmin,
  getCashBackBonusListAdmin,
  getP2PListAdmin,
  set_GameStatus,
  addCouponToUserByAdminDirectly,
  makeCompanyPromotorbyAdmin,
  getCompanyPromotorbyAdmin,
  changePromotorStatus,
  setRouletteResultByAdmin,
  seSatttaResultByAdmin,
  getCompanyPromoterBonusListAdmin,
  getCompanyPromoterBonusListAdminActive,
  getINRPayinAdmin,
  updateZPPVTKEY,
  getINRPayOutAdmin,
  ApproveAllUsers,
  fundDebitedByAdmin,
  fundDebitedByAdminHistory,
  updateUserName,
} = require("../controller/adminpanelapi");
const {
  getPaymentGateway,
  getCallBack,
  withdrawlRequest,
  withdrawlCallBack,
  update_member_withdrawal_gatway,
} = require("../controller/payment_gateway");
const {
  authCheck,
  authCheckAdmin,
  authCheckSuperAdmin,
  authCheckDummyUser,
  authCheckSupportAgent,
} = require("../middleware");
const {
  zpPayOut,
  zpGetOwnerAddress,
  ZPpayInRequest,
  ZPpayInRequest_Dummy_Entry,
} = require("../controller/ZpGateway");
const {
  betPlacedRoulette,
  getMyHistoryRoulette,
  getRouletteGameHistory,
  betPlacedSatta,
  getSattaGameHistoryLastFour,
  getSattaGameHistory,
  getSattaMyHistory,
  getStatusSattaMatka,
} = require("../controller/satta-matka-roulette-controller");
const {
  inrPayinRequest,
  inrCallBack,
  getBackToUserScreen,
  inrPayOutRequest,
  manuallyApprovePayinByAdmin,
} = require("../controller/INRGateway");
const {
  betPlacedAviator,
  cashOutFunction,
  getGameHistoryAviator,
  getLederData,
  getWalletByUserId,
  getMyHistoryByID,
  getTopRecordsAviator,
} = require("../gameTimeController/aviator_Start_function");
const router = express.Router();
// aviator game
router.post("/apply-bet-aviator-first", betPlacedAviator);
router.post("/cash-out-aviator-last", cashOutFunction);
router.get("/get-game-history", getGameHistoryAviator);
router.get("/get-ledger-data", getLederData);
router.post("/get-wallet-amount-by-id", getWalletByUserId);
router.post("/my-history-by-user-id", getMyHistoryByID);
router.get("/get-top-users", getTopRecordsAviator);
////////// trx ///////////////////
router.get("/trx-auto-genrated-result", authCheck, getGameHistory);
router.get("/trx-auto-genrated-result-tc", getGameHistoryTC);
router.get("/trx-getColourBets", authCheck, getMyHistory);
router.get("/trx-getColourBets-temp", authCheck, getMyHistoryTemp);
router.post("/trx-bet", authCheck, placeBetTrx);

////////   wingo api ///////////////////
router.get("/getbet-game-results", authCheck, myHistoryWingo); /// my history
router.get("/colour_result", authCheck, gameHistoryWingo); /// game history
router.post("/bet", authCheck, placeBetWingo); /// game history
router.get(
  "/get-total-betA-ad-income-yesterday",
  authCheck,
  getTotalBetAndIncomeYesterday
); /// game history

///////////////////// general api's ////////////////
router.get("/userwallet", authCheck, getBalance);
router.get("/get-top-winners", authCheck, getTopWinners);
router.post("/user_login", loginPage);
router.post("/signup", signupUser);
router.get("/get-sponsor-name", getUserNameByUserId);
router.post("/change-password", authCheck, chnagePassWord);
router.get("/get-level", authCheck, getLevels);
router.post("/payment", authCheck, getPaymentGateway);
router.post("/call-back", authCheck, getCallBack);
router.get("/coin-payment-deposit-history", authCheck, getDepositlHistory);
router.get("/coin-payment-withdrawl-history", authCheck, getWithdrawlHistory);
router.post("/withdrawl-request", authCheck, withdrawlRequest);
router.post("/add-usdt-address", authCheck, addUSDTAddress);
router.get("/usdt-address-record", authCheck, uddtAddressHistory);
router.post("/withdrawlCallBack", authCheck, withdrawlCallBack);
router.get("/approve-by-admin", authCheck, update_member_withdrawal_gatway);
router.get("/level-income", authCheck, getLevelIncome);
router.get("/self-deposit-bonus", authCheck, getSelfDepositBonus);
router.get("/sponsor-income", authCheck, getSponsorIncome);
router.get("/need-to-bet", authCheck, needToBet);
router.get("/daily-salary-icome", authCheck, getDailySalaryIncome);
router.get("/weekly-salary-icome", authCheck, getWeeklySalaryIncome);
router.get("/get-status", authCheck, getStatus);
router.post("/get-subordinate-data-funx", authCheck, getSubOrdinateData);
router.post("/get-commisssion-data-funx", authCheck, getAllCommission);
router.post(
  "/transfer-amount-from-working-wallet-to-main-wallet",
  authCheck,
  transfer_Amount_to_mainWallet_from_WorkingWallet
);
router.get(
  "/transfer-history-from-working-wallet-to-main-wallet",
  authCheck,
  get_transfer_history_working_to_main_wallet
);
router.get("/getCashBack-report", authCheck, getCashBack);
router.post("/ticket-raised", authCheck, ticketRaised);
router.get("/ticket-raised-history", authCheck, getTicketRaisedHistory);
router.get("/attendance-bonus", authCheck, getAttendanceBonus);
router.get("/company-promoter-bonus", authCheck, getCompanyPromoterBonusList);
router.get("/clame-bonus", authCheck, clameBonus);
router.get("/inivitation-bonus", authCheck, getInvitationBonus);
router.get("/team-recharge-bonus", authCheck, getTeamRechargeBonus);
router.get("/vip-bonus", authCheck, getVipBonus);
router.get("/daily-salary-income", authCheck, getDailySalary);
router.get("/get-deposit-bonus-income", authCheck, getDepositBonus);
router.post("/forget-password-send-otp", forGetPassword);
router.post("/forget-password-veryfy-otp", veryFyOTP);
router.post("/forget-password-change-pass", updatePassword);
router.post("/payin-request", authCheck, payInRequest);
router.post("/payout-request", authCheck, payOutRequest);
router.get("/deposit-history-usdt", authCheck, getDepositHistoryUSDT);
router.get("/withdrawal-history-usdt", authCheck, getWithdrawalHistoryUSDT);
router.get("/admin-qr-address", authCheck, getAdminQrAddress);
router.get("/profileapi", authCheck, getProfileData);
router.get("/deposit-history-inr", authCheck, getDepositHistoryINR);
router.get("/withdrawal-history-inr", authCheck, getWihdrawalHistoryINR);
router.post("/bank-add", authCheck, addBankAddress);
router.get("/user-bank-details", authCheck, userBankDetails);
router.get("/get_level_general_data", authCheck, userGetLevelData);
router.post("/hideStatusOfDepositPopup", authCheck, hideStatusOfDepositPopup);
router.get("/get-gift-card-list", authCheck, getGiftCardList);
router.post("/claim-gift-card", authCheck, clameGiftCard);
router.get("/gift-bonus-list", authCheck, getGiftBonusList);
router.get("/welcome-bonus-list", authCheck, getWelcomeBonusListUser);
router.post("/registration-send-otp", authCheck, sendRegistrationOTP);
router.post("/registration-veryfy-otp", authCheck, verifyRegistrationOTP);
router.post("/p-to-p-fund_transfer", authCheck, p2pFundTransfer);
router.get("/p-to-p-fund_transfer-history", authCheck, getFundTransferHistory);
router.get("/zp-deposit-history", authCheck, getZPDepositlHistory);
router.get("/zp-withdrawal-history", authCheck, getZPWithdrawallHistory);

/////////////////
////////// admin panel api's
router.post("/user-list", authCheckAdmin, userList);
router.post("/add-admin-coupon-list", authCheckAdmin, add_Coupon_list_admin);
router.post("/inr-payout-request-list", authCheckAdmin, payOutRequestList);
router.post(
  "/inr-payout-request-list-success",
  authCheckAdmin,
  payOutRequestListSuccess
);
router.post(
  "/inr-payout-request-list-failed",
  authCheckAdmin,
  payOutRequestListFailed
);
router.post(
  "/inr-payout-request-list-pending-from-gateway",
  authCheckAdmin,
  payOutRequestListPendingFromGateway
);
router.get(
  "/inr-payout-request-approval",
  authCheckAdmin,
  inrPayOutApproveByAdmin
);
router.get(
  "/inr-payout-request-rejection",
  authCheckAdmin,
  inrPayOutRejectedByAdmin
);
router.get(
  "/inr-payout-request-approval",
  authCheckAdmin,
  inrPayOutApproveByAdmin
);
router.post("/tget-wlcm-bonus-admin-data", authCheckAdmin, getWelcomeBonusList);
router.post(
  "/tget-slf-dpst-bonus-admin-data",
  authCheckAdmin,
  getSelfDepositBonusList
);
router.post("/tget-dpst-bonus-admin-data", authCheckAdmin, getDepositBonusList);
router.post("/tget-roi-bonus-admin-data", authCheckAdmin, getROIBonusList);
router.post(
  "/tget-weekly-recovery-admin-data",
  authCheckAdmin,
  getWeeklyRecoveryBonusListAdmin
);
router.post(
  "/tget-daily-salary-bonus-admin-data",
  authCheckAdmin,
  getDailySalaySalaryList
);
router.post(
  "/tget-bet-income-bonus-admin-data",
  authCheckAdmin,
  getbetIncomeList
);
router.post(
  "/tget-level-income-bonus-admin-data",
  authCheckAdmin,
  getLevelIncomeList
);
router.get("/update-user-status", authCheckAdmin, updateUserStatus);
router.post("/update-wingo-result", authCheckAdmin, setWingoResultByAdmin);
router.post("/add-fund-to-user", authCheckAdmin, fundAddByAdmin);
router.get("/get-aviator-report", authCheckAdmin, getAviatorReport);
router.post("/get-trx-report", authCheckAdmin, getTRXReport);
router.post("/get-wingo-report", authCheckAdmin, getWingoReport);
router.get(
  "/fund-transfer-history",
  authCheckAdmin,
  getFundTransferHistoryReport
);
router.post("/change-user-permisson", authCheckSuperAdmin, changePermission);
router.post("/day-book-report", authCheckAdmin, dayBookReport);
router.get("/dashboard-api", authCheckAdmin, dasbboardAPI);
router.post("/change-user-password", authCheckAdmin, changeUserPassword);
router.get("/get-downline-team", authCheckAdmin, getDownlineTeam);
router.get("/get-up-team", authCheckAdmin, getUplineTeam);
router.post("/zp-token-payin-admin", authCheckAdmin, getZPTokenPayinAdmin);
router.post("/zp-token-payout-admin", authCheckAdmin, getZPTokenPayOutAdmin);
router.post("/gift-bonus-list-admin", authCheckAdmin, getGiftBonusListAdmin);
router.post("/vip-bonus-list-admin", authCheckAdmin, getVIPBonusListAdmin);
router.post(
  "/company-promoter-bonus-list-admin",
  authCheckAdmin,
  getCompanyPromoterBonusListAdmin
);
router.get(
  "/company-promoter-bonus-list-admin-active",
  authCheckAdmin,
  getCompanyPromoterBonusListAdminActive
);
router.post(
  "/cash-back-bonus-list-admin",
  authCheckAdmin,
  getCashBackBonusListAdmin
);
router.post("/p-2-p-list-admin", authCheckAdmin, getP2PListAdmin);
// chart api's
router.get(
  "/user-aviator-status-area-chart",
  authCheckAdmin,
  userAviatorBetStatusBarChart
);
router.get(
  "/user-wingo-status-area-chart",
  authCheckAdmin,
  userWingoBetStatusBarChart
);
router.get(
  "/user-trx-status-area-chart",
  authCheckAdmin,
  userTRXBetStatusBarChart
);
router.get(
  "/user-business-status-bar-chart",
  authCheckAdmin,
  userBusinessStatusBarChart
);
router.get(
  "/user-registration-status-bar-chart",
  authCheckAdmin,
  userRegistrationStatusBarChart
);
router.post("/set-income-amount", authCheckAdmin, set_IncomeAmountFunction);
router.get("/get-admin-coupon-list", authCheckAdmin, get_Coupon_list_admin);
router.get(
  "/update-admin-coupon-list",
  authCheckAdmin,
  update_status_Coupon_admin
);
router.get(
  "/other-browser-approval-by-admin",
  authCheckAdmin,
  approveForOtherBrowser
);
router.post(
  "/add-coupon-to-user-by-admin",
  authCheckAdmin,
  addCouponToUserByAdminDirectly
);
router.post(
  "/makeCompanyPromotorbyAdmin",
  authCheckAdmin,
  makeCompanyPromotorbyAdmin
);
router.get(
  "/getCompanyPromotorbyAdmin",
  authCheckAdmin,
  getCompanyPromotorbyAdmin
);
router.get("/changePromotorStatus", authCheckAdmin, changePromotorStatus);
router.post("/set-zp-amount", authCheckAdmin, set_ZPFunction);
router.get("/set-game-status", authCheckAdmin, set_GameStatus);
router.post(
  "/getTeamReferralFirstListAdmin",
  authCheckAdmin,
  getTeamReferralFirstListAdmin
);
router.post(
  "/zp-user-payout",
  authCheckSupportAgent,
  authCheckDummyUser,
  authCheck,
  zpPayOut
);
router.get(
  "/zp-payin-ownr-address",
  authCheckDummyUser,
  authCheck,
  zpGetOwnerAddress
);
router.post("/zp-payin-request", authCheckDummyUser, authCheck, ZPpayInRequest);
router.post(
  "/zp-payin-request_dummy_entry",
  authCheckDummyUser,
  authCheck,
  ZPpayInRequest_Dummy_Entry
);

///////////////// extra game ///////////////////////

// roulette game
router.post("/betPlacedRoulette", authCheck, betPlacedRoulette);
router.get("/getMyHistory-roulette", authCheck, getMyHistoryRoulette);
router.get("/getRouletteGameHistory", authCheck, getRouletteGameHistory);
router.post(
  "/update-roulette-result",
  authCheckAdmin,
  setRouletteResultByAdmin
);

// // satta game
router.post("/betPlacedSatta", authCheck, betPlacedSatta);
router.get(
  "/getSattaGameHistoryLastFour",
  authCheck,
  getSattaGameHistoryLastFour
);
router.post("/getSattaGameHistory", authCheck, getSattaGameHistory);
router.get("/getSattaMyHistory", authCheck, getSattaMyHistory);
router.get("/getStatusSattaMatka", authCheck, getStatusSattaMatka);
router.get("/getTopWinners", authCheck, getTopWinners);
router.post(
  "/update-satta-matka-result",
  authCheckAdmin,
  seSatttaResultByAdmin
);

// gateway related api's
router.post(
  "/inr-payin-request",
  authCheckDummyUser,
  authCheck,
  inrPayinRequest
);
router.get("/inr-payin-request-inr-call-back", inrCallBack);
router.get(
  "/inr-payin-request-inr-call-back-user-screen",
  authCheck,
  getBackToUserScreen
);

router.post("/gt-inr-fund-request-list", authCheckAdmin, getINRPayinAdmin);
router.post("/gt-inr-payout-request-list", authCheckAdmin, getINRPayOutAdmin);
router.post(
  "/aasdfjasfasjfhkjahfkjhaskdaf-ajdfhafjkljhf-ajsfhkahkljdasfhkl",
  authCheckSuperAdmin,
  updateZPPVTKEY
);
router.post(
  "/inr-payout-request",
  authCheckSupportAgent,
  authCheckDummyUser,
  authCheck,
  inrPayOutRequest
);
router.get("/approve-all-users", authCheckAdmin, ApproveAllUsers);

router.get(
  "/manual-approval-payin-by-admin",
  authCheckAdmin,
  manuallyApprovePayinByAdmin
);
router.post("/fund-debited-by-admin", authCheckAdmin, fundDebitedByAdmin);
router.post(
  "/fund-debited-by-admin-history",
  authCheckAdmin,
  fundDebitedByAdminHistory
);

// new api's
router.post("/update-user-name", authCheckAdmin, updateUserName);

///////////////////////
module.exports = router;
