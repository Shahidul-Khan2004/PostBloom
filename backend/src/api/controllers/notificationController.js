import * as notificationRepo from "../../repositories/notificationRepository.js";

export async function list(req, res) {
  const unreadOnly = req.query.unread === "true";
  const data = await notificationRepo.listForUser(req.actorUserId, { unreadOnly });
  res.status(200).json({ data });
}

export async function markRead(req, res) {
  const { id } = req.params;
  await notificationRepo.markRead(id, req.actorUserId);
  res.status(200).json({ data: { ok: true } });
}
