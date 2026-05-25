import * as authService from "../../services/authService.js";

export async function register(req, res) {
  const body = req.validated?.body ?? req.body;
  const result = await authService.register(body);
  res.status(201).json({ data: { user: result.user, token: result.token } });
}

export async function login(req, res) {
  const body = req.validated?.body ?? req.body;
  const result = await authService.login(body);
  res.status(200).json({ data: { user: result.user, token: result.token } });
}

export async function me(req, res) {
  const user = await authService.getMe(req.actorUserId);
  res.status(200).json({ data: user });
}
