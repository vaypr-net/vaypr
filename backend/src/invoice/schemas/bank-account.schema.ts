import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class BankAccount {
  @Prop()
  bankName: string;

  @Prop()
  accountName: string;

  @Prop()
  iban: string;
}
