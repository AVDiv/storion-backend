import {
  Controller,
  Request,
  Post,
  UseGuards,
  Get,
  Body,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { LoginEventData } from 'src/models/event/login-event-data.dto';
import { RequestWithUser } from 'src/models/request/request-with-user.interface';
import { SignupEventData } from 'src/models/event/signup-event-data.dto';
import { CreateUserDto } from 'src/models/user/create-user.dto';
import { LoginJwtUserDto } from 'src/models/user/login-jwt-user.dto';
import { LoginGoogleUserDto } from 'src/models/user/login-google-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('signup')
  @HttpCode(201)
  async signup(
    @Request() req: RequestWithUser,
    @Body() createUserDto: CreateUserDto,
  ) {
    const metadata: SignupEventData = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };
    return this.authService.register(createUserDto, metadata);
  }

  @Post('login')
  async login(
    @Request() req: RequestWithUser,
    @Body() loginUserDto: LoginJwtUserDto,
  ) {
    const metadata: LoginEventData = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };
    return this.authService.validateJwtUser(loginUserDto, metadata);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refreshToken(@Request() req: RequestWithUser) {
    const user = req.user;
    const accessToken = await this.authService.getAccessToken(user);

    return { access_token: accessToken };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Request() req: RequestWithUser) { }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Request() req: RequestWithUser) {
    const metadata: LoginEventData = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };
    return this.authService.handleGoogleAuth(req.user as LoginGoogleUserDto, metadata); // Now we can use req.user
  }
}
