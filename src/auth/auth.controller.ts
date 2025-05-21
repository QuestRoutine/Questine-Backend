import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  UseGuards,
  Delete,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { User } from 'src/common/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { users } from 'generated/prisma';
import { EditMeDto } from './dto/editMe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 회원가입
  @Post('/signup')
  signup(@Body(ValidationPipe) authDto: AuthDto) {
    return this.authService.signup(authDto);
  }

  // 로그인
  @Post('/signin')
  signin(@Body(ValidationPipe) authDto: AuthDto) {
    return this.authService.signin(authDto);
  }

  // 리프레시 토큰 요청
  @Get('/refresh')
  @UseGuards(AuthGuard())
  refresh(@User() user: users) {
    return this.authService.refresh(user);
  }

  // 로그아웃
  @Post('/logout')
  @UseGuards(AuthGuard())
  logout(@User() user: users) {
    return this.authService.logout(user);
  }

  // 프로필
  @Get('/me')
  @UseGuards(AuthGuard())
  getMe(@User() user: users) {
    return this.authService.getMe(user);
  }

  // 프로필 편집 (닉네임 변경)
  @Patch('/me')
  @UseGuards(AuthGuard())
  editMe(@User() user: users, @Body(ValidationPipe) editMeDto: EditMeDto) {
    return this.authService.editMe(user, editMeDto);
  }

  // 계정 탈퇴
  @Delete('/me')
  @UseGuards(AuthGuard())
  deleteAccount(@User() user: users) {
    return this.authService.deleteAccount(user);
  }
}
