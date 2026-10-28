import { All, Body, Controller, HttpCode, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HesabeService } from './hesabe.service';

@Controller('billing/hesabe')
export class HesabeController {
  constructor(private readonly hesabe: HesabeService) {}
  @Post('webhook')
  @HttpCode(200)
  webhook(@Body() body: any) { return this.hesabe.webhook(body); }

  // Both GET and form POST returns are used by hosted payment methods.
  @All('return/:reference')
  async returned(@Param('reference') reference: string, @Res() response: Response) {
    return response.redirect(303, await this.hesabe.callback(reference, false));
  }
  @All('cancel/:reference')
  async cancelled(@Param('reference') reference: string, @Res() response: Response) {
    return response.redirect(303, await this.hesabe.callback(reference, true));
  }
}
