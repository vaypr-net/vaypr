import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class CompanyFooter {
  @Prop()
  companyName: string;

  @Prop()
  officePhone: string;

  @Prop()
  address: string;

  @Prop()
  websiteEmail: string;
}
