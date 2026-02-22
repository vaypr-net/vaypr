import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum PublicQuoteResponseAction {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  MODIFICATION_REQUESTED = 'modification_requested',
}

export class PublicQuoteResponseDto {
  @IsEnum(PublicQuoteResponseAction)
  action: PublicQuoteResponseAction;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}

