import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, CreateBranchDto } from './dto/tenant.dto';
import { TenantGuard } from './guards/tenant.guard';

@ApiTags('tenants')
@Controller({ path: 'tenants', version: '1' })
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business tenant' })
  async createTenant(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateTenantDto,
  ) {
    return this.tenantsService.createTenant(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tenants where current user is an active member' })
  async getMyTenants(@Request() req: { user: { userId: string } }) {
    return this.tenantsService.getTenantsForUser(req.user.userId);
  }

  @Get(':tenantId')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get details for a specific tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  async getTenant(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.getTenantById(tenantId);
  }

  @Get(':tenantId/branches')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'List all branches for a tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  async getBranches(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.getBranches(tenantId);
  }

  @Post(':tenantId/branches')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Create a new branch for a tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  async createBranch(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateBranchDto,
  ) {
    return this.tenantsService.createBranch(tenantId, req.user.userId, dto);
  }
}

