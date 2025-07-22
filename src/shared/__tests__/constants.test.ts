import { HTTP_STATUS, ENVIRONMENTS } from '../constants';

describe('Constants', () => {
  it('should export HTTP status codes', () => {
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
  });

  it('should export environment constants', () => {
    expect(ENVIRONMENTS.DEVELOPMENT).toBe('development');
    expect(ENVIRONMENTS.PRODUCTION).toBe('production');
    expect(ENVIRONMENTS.TEST).toBe('test');
  });
});