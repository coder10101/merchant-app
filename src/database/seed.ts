import dataSource from './data-source';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from '../common/enums/domain.enums';

async function runSeed() {
  console.log('Seeding initial platform users...');

  // Initialize the existing data-source
  await dataSource.initialize();
  const userRepository = dataSource.getRepository(User);

  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const seedUsers = [
    {
      email: 'admin@platform.test',
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      passwordHash,
    },
    {
      email: 'reviewer@platform.test',
      fullName: 'Risk Reviewer',
      role: UserRole.REVIEWER,
      passwordHash,
    },
    {
      email: 'sales1@platform.test',
      fullName: 'Aditi Sales',
      role: UserRole.SALES,
      passwordHash,
    },
    {
      email: 'sales2@platform.test',
      fullName: 'Alisha Sales',
      role: UserRole.SALES,
      passwordHash,
    },
  ];

  for (const userData of seedUsers) {
    const existing = await userRepository.findOne({
      where: { email: userData.email },
    });

    if (!existing) {
      await userRepository.save(userRepository.create(userData));
      console.log(`Created user: ${userData.email} (${userData.role})`);
    } else {
      console.log(`User already exists: ${userData.email}`);
    }
  }

  await dataSource.destroy();
  console.log('Seeding completed successfully!');
}

runSeed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
