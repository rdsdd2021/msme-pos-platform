import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Response,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { Response as ExpressResponse, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { AuthGuard } from '@nestjs/passport';

function extractCookie(req: ExpressRequest, name: string): string | undefined {
  if (req.cookies && req.cookies[name]) {
    return req.cookies[name];
  }
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) {
    return undefined;
  }
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token from body or secure cookie' })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Body() dto: Partial<RefreshTokenDto>,
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<AuthResponseDto> {
    const token =
      dto.refreshToken ||
      extractCookie(req, 'refresh_token') ||
      req.headers?.['x-refresh-token'];

    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Refresh token is required');
    }

    const result = await this.authService.refresh({ refreshToken: token });
    this.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout, revoke refresh token and clear session cookie' })
  async logout(
    @Request() req: { user: { userId: string } },
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<void> {
    await this.authService.logout(req.user.userId);
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
    });
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile, memberships and effective permissions' })
  @ApiOkResponse({ type: UserProfileDto })
  async me(@Request() req: { user: { userId: string } }): Promise<UserProfileDto> {
    return this.authService.getProfile(req.user.userId);
  }

  private setRefreshTokenCookie(res: ExpressResponse, refreshToken: string): void {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
