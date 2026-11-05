import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HealthStatus } from './dto/health-response.dto';
import { DataSource } from 'typeorm';

describe('HealthController', () => {
  let controller: HealthController;

  const mockDataSource = {
    query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService, { provide: DataSource, useValue: mockDataSource }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check()', () => {
    it('should return health status ok', () => {
      const result = controller.check();
      expect(result.status).toBe(HealthStatus.OK);
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ready()', () => {
    it('should return readiness with database check ok', async () => {
      const result = await controller.ready();
      expect(result.status).toBe(HealthStatus.OK);
      expect(result.checks?.['database']).toBe('ok');
    });

    it('should throw ServiceUnavailableException when database is down', async () => {
      mockDataSource.query.mockRejectedValueOnce(new Error('Connection refused'));
      await expect(controller.ready()).rejects.toThrow();
    });
  });
});
