import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LinkOrder {
  id: string;
  order: number;
}

export class ReorderSocialLinksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkOrder)
  links: LinkOrder[];
}
