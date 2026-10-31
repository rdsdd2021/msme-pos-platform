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
  };
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

  @ApiProperty()
  memberships!: Array<{
    tenantId: string;
    tenantName: string;
    role: string;
    status: string;
  }>;
}

