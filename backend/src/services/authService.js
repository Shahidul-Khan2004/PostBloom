import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import BackendError from "../lib/BackendError.js";
import { env } from "../config/env.js";
import * as userRepo from "../repositories/userRepository.js";

export async function register({ email, password, displayName }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepo.create({ email, passwordHash, displayName });
  const token = signToken(user);
  return { user, token };
}

export async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw new BackendError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  const row = await userRepo.findByEmailWithHash(email);
  const valid = await bcrypt.compare(password, row.passwordHash);
  if (!valid) {
    throw new BackendError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  const token = signToken(user);
  return { user, token };
}

export async function getMe(userId) {
  const user = await userRepo.findById(userId);
  if (!user) throw new BackendError(404, "NOT_FOUND", "User not found");
  return user;
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}
