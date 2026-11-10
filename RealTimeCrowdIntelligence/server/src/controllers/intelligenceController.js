import { getLatestIntelligence, recomputeOperationalIntelligence } from '../services/intelligenceService.js';

export async function intelligenceOverview(req, res, next) {
  try {
    res.json({ intelligence: await getLatestIntelligence() });
  } catch (error) {
    next(error);
  }
}

export async function refreshIntelligence(req, res, next) {
  try {
    res.json({ intelligence: await recomputeOperationalIntelligence() });
  } catch (error) {
    next(error);
  }
}
