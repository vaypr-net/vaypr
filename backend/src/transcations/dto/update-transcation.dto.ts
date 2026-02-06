import { PartialType } from '@nestjs/swagger';
import { CreateTranscationDto } from './create-transcation.dto';

export class UpdateTranscationDto extends PartialType(CreateTranscationDto) {}
