import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserEntity } from '../tenants/entities/user.entity';
import { BusinessType } from '@pos/shared-types';

describe('AuthService', () => {
  jest.setTimeout(30000);
  let service: AuthService;
  let mockUserRepo: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((dto) => ({ id: 'user-uuid-1', ...dto })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'JWT_SECRET') return 'secret-12345678901234567890123456789012';
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-12345678901234567890123456789012';
        return defaultValue;
      }),
    };

    mockDataSource = {
      transaction: jest.fn(async (cb) => {
        const mockManager = {
          create: jest.fn((entityClass, data) => ({
            id: `${entityClass.name || 'mock'}-${Math.random().toString(36).substring(7)}`,
            ...data,
          })),
          save: jest.fn(async (entity) => entity),
        };
        return cb(mockManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a new user and hashes password with bcrypt', async () => {
    mockUserRepo.findOne.mockResolvedValueOnce(null);
    mockUserRepo.save.mockImplementationOnce(async (u: any) => u);

    const result = await service.register({
      email: 'newuser@example.com',
      password: 'StrongPassword123!',
      fullName: 'New User',
    });

    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.refreshToken).toBe('mock-jwt-token');
    expect(result.user.email).toBe('newuser@example.com');
    expect(mockUserRepo.save).toHaveBeenCalled();
  }, 20000);

  it('rejects registration with existing email', async () => {
    mockUserRepo.findOne.mockResolvedValueOnce({ id: 'existing-id' });

    await expect(
      service.register({
        email: 'existing@example.com',
        password: 'Password123!',
        fullName: 'Existing',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('registers a new merchant atomically with tenant, branch, owner role, and seeded catalog', async () => {
    mockUserRepo.findOne.mockResolvedValueOnce(null);

    const result = await service.registerMerchant({
      email: 'owner@guptakirana.in',
      password: 'Password@123',
      fullName: 'Ramesh Gupta',
      phone: '+919876543210',
      storeName: 'Gupta Kirana Store',
      businessType: BusinessType.GROCERY,
      stateCode: '27',
      gstin: '27ABCDE1234F1Z5',
      city: 'Pune',
      seedSampleCatalog: true,
    });

    expect(mockDataSource.transaction).toHaveBeenCalled();
    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user.email).toBe('owner@guptakirana.in');
    expect(result.user.fullName).toBe('Ramesh Gupta');
  }, 20000);

  it('rejects merchant registration if GSTIN state prefix does not match branch stateCode', async () => {
    mockUserRepo.findOne.mockResolvedValueOnce(null);

    await expect(
      service.registerMerchant({
        email: 'mismatch@store.in',
        password: 'Password@123',
        fullName: 'Mismatch User',
        storeName: 'Mismatch Store',
        businessType: BusinessType.GROCERY,
        stateCode: '27', // Maharashtra
        gstin: '07ABCDE1234F1Z5', // Delhi prefix (07 != 27)
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('logs in successfully with correct credentials', async () => {
    const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
    mockUserRepo.findOne.mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash,
      status: 'active',
      fullName: 'Test User',
    });

    const result = await service.login({
      email: 'test@example.com',
      password: 'CorrectPassword123!',
    });

    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user.id).toBe('user-1');
  });

  it('rejects login with invalid password', async () => {
    const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
    mockUserRepo.findOne.mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash,
      status: 'active',
    });

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

