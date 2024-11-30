import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RequestWithUser } from './models/request/request-with-user.interface';
import { JwtToken } from './models/request/jwt-token.interface';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getPing() {
    return this.appService.getPing();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: RequestWithUser) {
    return await this.appService.getUserProfile((req.user as JwtToken).username);
  }
}
