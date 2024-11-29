import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getPing() {
    return { status: 'OK', time: new Date().toISOString() };
  }
}
