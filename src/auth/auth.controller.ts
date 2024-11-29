import {
  Controller,
  Request,
  Post,
  UseGuards,
  Get,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { LoginEventData } from 'src/models/event/login-event-data.dto';
import { RequestWithUser } from 'src/models/request/request-with-user.interface';
import { SignupEventData } from 'src/models/event/signup-event-data.dto';
import { CreateUserDto } from 'src/models/user/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(
    @Request() req: RequestWithUser,
    @Body() createUserDto: CreateUserDto,
  ) {
    const metadata: SignupEventData = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };
    return this.authService.register(req.body, metadata);
  }

  @Post('login')
  async login(@Request() req: RequestWithUser) {
    const metadata = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };
    return this.authService.generateTokens(req.body, metadata);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refreshToken(@Request() req: RequestWithUser) {
    const user = req.user; // Now we can use req.user directly
    const accessToken = await this.authService.getAccessToken(user);

    await this.authService['posthogService'].capture({
      distinctId: user['userId'].toString(),
      event: 'user.token_refresh',
      properties: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });

    return { access_token: accessToken };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Request() req: RequestWithUser) {
    // Guard handles the redirect
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Request() req: RequestWithUser) {
    const metadata: LoginEventData = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };
    return this.authService.handleGoogleAuth(req.user, metadata); // Now we can use req.user
  }
}
