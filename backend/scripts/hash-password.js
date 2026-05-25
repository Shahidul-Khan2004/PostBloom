import bcrypt from "bcrypt";

const password = process.argv[2] ?? "Demo1234!";
console.log(bcrypt.hashSync(password, 10));
