import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantsService } from './tenants.service';
import {
  CreateTenantDto,
  CreateBranchDto,
  UpdateBranchDto,
  AddMemberDto,
  UpdateMemberDto,
} from './dto/tenant.dto';
import { TenantGuard } from './guards/tenant.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions, RequireTenantWide } from './guards/require-permissions.decorator';
import { Permission } from '@pos/shared-types';

@ApiTags('tenants')
@Controller({ path: 'tenants', version: '1' })
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business tenant' })
  async createTenant(@Request() req: { user: { userId: string } }, @Body() dto: CreateTenantDto) {
    return this.tenantsService.createTenant(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tenants where current user is an active member' })
  async getMyTenants(@Request() req: { user: { userId: string } }) {
    return this.tenantsService.getTenantsForUser(req.user.userId);
  }

  @Get(':tenantId')
  @UseGuards(TenantGuard, PermissionsGuard)
  @RequirePermissions(Permission.TENANT_READ)
  @ApiOperation({ summary: 'Get details for a specific tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  async getTenant(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.getTenantById(tenantId);
  }

  @Get(':tenantId/branches')
  @UseGuards(TenantGuard, PermissionsGuard)
  @RequirePermissions(Permission.TENANT_READ)
  @ApiOperation({ summary: 'List all branches for a tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  async getBranches(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.getBranches(tenantId);
  }

  @Post(':tenantId/branches')
  @UseGuards(TenantGuard, PermissionsGuard)
  @RequirePermissions(Permission.BRANCH_CREATE)
  @RequireTenantWide()
  @ApiOperation({ summary: 'Create a new branch for a tenant (Owner tenant-wide only)' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  async createBranch(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateBranchDto,
  ) {
    return this.tenantsService.createBranch(tenantId, req.user.userId, dto);
  }

  @Patch(':tenantId/branches/:branchId')
  @UseGuards(TenantGuard, PermissionsGuard)
  @RequirePermissions(Permission.BRANCH_UPDATE)
  @RequireTenantWide()
  @ApiOperation({ summary: 'Update branch configuration, address, or GSTIN' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'branchId', type: 'string', format: 'uuid' })
  async updateBranch(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateBranchDto,
  ) {
    return this.tenantsService.updateBranch(tenantId, req.user.userId, branchId, dto);
  }

  @Get(':tenantId/members')
  @UseGuards(TenantGuard, PermissionsGuard)
  @RequirePermissions(Permission.TENANT_MEMBERS_MANAGE)
  @RequireTenantWide()
  @ApiOperation({ summary: 'List employees and members of tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  async getMembers(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.getMembers(tenantId);
  }

  @Post(':tenantId/members')
  @UseGuards(TenantGuard, PermissionsGuard)
  @RequirePermissions(Permission.TENANT_MEMBERS_MANAGE)
  @RequireTenantWide()
  @ApiOperation({ summary: 'Add a new member with assigned role and branch scope' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  async addMember(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: AddMemberDto,
  ) {
    return this.tenantsService.addMember(tenantId, req.user.userId, dto);
  }

  @Patch(':tenantId/members/:memberId')
  @UseGuards(TenantGuard, PermissionsGuard)
  @RequirePermissions(Permission.TENANT_MEMBERS_MANAGE)
  @RequireTenantWide()
  @ApiOperation({ summary: 'Update a member role or assigned branch' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  async updateMember(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateMemberDto,
  ) {
    return this.tenantsService.updateMember(tenantId, req.user.userId, memberId, dto);
  }

  @Delete(':tenantId/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TenantGuard, PermissionsGuard)
  @RequirePermissions(Permission.TENANT_MEMBERS_MANAGE)
  @RequireTenantWide()
  @ApiOperation({ summary: 'Revoke and suspend member access' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  async revokeMember(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.tenantsService.revokeMember(tenantId, req.user.userId, memberId);
  }
}
