import { connectDatabase, closeDatabase } from '../../infrastructure/database/connection';

describe('Database Configuration', () => {
  afterAll(async () => {
    await closeDatabase();
  });

  it('should export database connection function', () => {
    expect(typeof connectDatabase).toBe('function');
  });

  it('should export database close function', () => {
    expect(typeof closeDatabase).toBe('function');
  });
});