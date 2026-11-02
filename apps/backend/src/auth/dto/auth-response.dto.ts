import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  user!: {
    id: string;
    email: string;
    fullName: string;
    isSuperAdmin?: boolean;
  };
}

export class MembershipSummaryDto {
  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  tenantName!: string;

  @ApiProperty({ nullable: true })
  branchId!: string | null;

  @ApiProperty()
  role!: string;

  @ApiProperty({ type: [String] })
  roles!: string[];

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: [String] })
  permissions!: string[];

  @ApiProperty()
  isOwner!: boolean;
}

export class UserProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty({ default: false })
  isSuperAdmin!: boolean;

  @ApiProperty({ type: [MembershipSummaryDto] })
  memberships!: MembershipSummaryDto[];
}
