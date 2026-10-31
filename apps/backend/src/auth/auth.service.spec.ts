import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserEntity } from '../tenants/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepo: any;
  let mockJwtService: any;
  let mockConfigService: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
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
  });

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
