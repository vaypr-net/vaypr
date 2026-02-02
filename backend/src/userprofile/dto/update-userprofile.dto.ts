import { PartialType } from '@nestjs/swagger';
import { CreateUserprofileDto } from './create-userprofile.dto';

export class UpdateUserprofileDto extends PartialType(CreateUserprofileDto) {}
