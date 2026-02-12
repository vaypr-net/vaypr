import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `Vayper v1.0.2 - Invoice Software | Deployed: ${new Date().toISOString().split('T')[0]}`;
  }
}
