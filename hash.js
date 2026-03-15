const bcrypt = require("bcryptjs");

async function run() {
  const hash1 = await bcrypt.hash("123456", 10);
  const hash2 = await bcrypt.hash("000000", 10);

  console.log("123456 ->", hash1);
  console.log("000000 ->", hash2);
}

run();