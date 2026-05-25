import request from "supertest";
import { getTestApp } from "./app.js";

const ROLE_EMAIL = {
  owner: "owner@demo.postbloom",
  reviewer: "reviewer@demo.postbloom",
  writer: "writer@demo.postbloom",
  designer: "designer@demo.postbloom",
};

const PASSWORD = "Demo1234!";

export async function loginAs(role) {
  const email = ROLE_EMAIL[role] ?? role;
  const res = await request(getTestApp())
    .post("/api/v1/auth/login")
    .send({ email, password: PASSWORD });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}
