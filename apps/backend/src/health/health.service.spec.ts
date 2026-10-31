import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthStatus } from './dto/health-response.dto';
import { DataSource } from 'typeorm';

describe('HealthService', () => {
  let service: HealthService;

  const mockDataSource = {
    query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check()', () => {
    it('should return ok status', () => {
      const result = service.check();
      expect(result.status).toBe(HealthStatus.OK);
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include a valid ISO timestamp', () => {
      const result = service.check();
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  describe('readiness()', () => {
    it('should return ok with database check when DB is up', async () => {
      mockDataSource.query.mockResolvedValueOnce([{ '?column?': 1 }]);
      const result = await service.readiness();
      expect(result.status).toBe(HealthStatus.OK);
      expect(result.checks?.['database']).toBe('ok');
    });

    it('should throw ServiceUnavailableException when DB is down', async () => {
      mockDataSource.query.mockRejectedValueOnce(new Error('DB down'));
      await expect(service.readiness()).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
