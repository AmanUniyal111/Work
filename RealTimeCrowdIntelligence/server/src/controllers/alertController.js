import { Alert } from '../models/Alert.js';

export async function listAlerts(req, res, next) {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(100);
    res.json({ alerts });
  } catch (error) {
    next(error);
  }
}

export async function updateAlertStatus(req, res, next) {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!alert) return res.status(404).json({ message: 'Alert not found.' });

    res.json({ alert });
  } catch (error) {
    next(error);
  }
}
