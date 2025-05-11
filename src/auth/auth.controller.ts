import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { User } from 'src/common/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { users } from 'generated/prisma';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  signup(@Body(ValidationPipe) authDto: AuthDto) {
    return this.authService.signup(authDto);
  }

  @Post('/signin')
  signin(@Body(ValidationPipe) authDto: AuthDto) {
    return this.authService.signin(authDto);
  }

  @Get('/refresh')
  @UseGuards(AuthGuard())
  refresh(@User() user: users) {
    return this.authService.refresh(user);
  }

  @Post('/logout')
  @UseGuards(AuthGuard())
  logout(@User() user: users) {
    return this.authService.logout(user);
  }

  @Delete('/me')
  @UseGuards(AuthGuard())
  deleteAccount(@User() user: users) {
    return this.authService.deleteAccount(user);
  }
}
