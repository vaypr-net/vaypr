import { ApiProperty } from '@nestjs/swagger';

export class SessionDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  userAgent: string;

  @ApiProperty()
  ipAddress: string;

  @ApiProperty()
  sessionToken: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  revoked: boolean;

  @ApiProperty({ required: false })
  revokedAt?: Date;
}
