import { PartialType } from '@nestjs/swagger';
import { CreateReceiptDto } from './create-reciept.dto';

export class UpdateReceiptDto extends PartialType(CreateReceiptDto) {}
