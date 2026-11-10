import { connectDatabase } from './config/db.js';
import { Alert } from './models/Alert.js';
import { Report } from './models/Report.js';
import { User } from './models/User.js';

const sampleReports = [
  ['Station concourse congestion', 'Heavy crowd buildup near the ticket gates.', 'crowd', 'high', 'Central Station', 28.6139, 77.209, 8],
  ['Slow traffic near east gate', 'Vehicle queue blocking pedestrian movement.', 'traffic', 'medium', 'East Gate', 28.62, 77.22, 6],
  ['Medical assistance requested', 'Person fainted near platform access.', 'medical', 'critical', 'Platform 3', 28.608, 77.205, 7],
  ['Broken barricade', 'Temporary barricade is leaning into pedestrian lane.', 'infrastructure', 'medium', 'North Entry', 28.617, 77.212, 5],
  ['Rainwater pooling', 'Water accumulation around exit steps.', 'weather', 'low', 'Exit B', 28.611, 77.215, 4],
  ['Crowd surge at main stage', 'Sudden movement after event announcement.', 'crowd', 'critical', 'Main Stage', 28.616, 77.21, 9]
];

async function seed() {
  await connectDatabase();
  await Promise.all([User.deleteMany({}), Report.deleteMany({}), Alert.deleteMany({})]);

  const admin = await User.create({
    name: 'Admin Operator',
    email: 'admin@crowdintel.local',
    password: 'Admin123!',
    role: 'admin'
  });

  const user = await User.create({
    name: 'Field Reporter',
    email: 'user@crowdintel.local',
    password: 'User123!',
    role: 'user'
  });

  await Report.insertMany(
    sampleReports.map(([title, description, category, severity, address, latitude, longitude, densityScore], index) => ({
      title,
      description,
      category,
      severity,
      address,
      densityScore,
      createdBy: index % 2 ? user._id : admin._id,
      createdAt: new Date(Date.now() - index * 90 * 60 * 1000),
      updatedAt: new Date(Date.now() - index * 90 * 60 * 1000),
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    }))
  );

  console.log('Seeded demo users and reports.');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
