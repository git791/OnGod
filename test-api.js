const fetch = require("node-fetch");
async function main() {
  const url = "https://internal-server.bento.fun/bento/user/parent-markets/create";
  const body = {
    parentQuestion: "Test Claim",
    category: "Football",
    startTime: new Date(Date.now() + 6 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 86400000).toISOString(),
    privacyAccess: "private",
    collateralMode: "credits",
    markets: [
      {
        question: "Test Claim",
        type: "prediction",
        category: "Football",
        privacyAccess: "private",
        collateralMode: "credits"
      }
    ]
  };
  
  // Note: we need a JWT for this, which we don't have unless we login
  // I will just mock a login first to get a JWT
  
  // Login
  const ethUtil = require("ethereumjs-util");
  const address = "0x" + require("crypto").randomBytes(20).toString("hex");
  // We need a real signature, this is too complex for a fast script without viem.
}
main();
