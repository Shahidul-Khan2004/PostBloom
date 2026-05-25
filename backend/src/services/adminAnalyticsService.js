import * as adminAnalyticsRepo from "../repositories/adminAnalyticsRepository.js";

const VALID_ROLES = ["writer", "designer", "reviewer"];

export async function getSpecialistMetrics({ role } = {}) {
  if (role && !VALID_ROLES.includes(role)) {
    return [];
  }
  return adminAnalyticsRepo.listSpecialistMetrics({ role });
}
