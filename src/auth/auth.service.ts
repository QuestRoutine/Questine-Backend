import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { users } from 'generated/prisma';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async signup(authDto: AuthDto) {
    const { email, password } = authDto;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const user = await this.prisma.users.create({
        data: {
          email,
          password: hashedPassword,
          login_type: 'email',
          nickname: '모험가' + uuidv4().split('-').join(''),
        },
      });

      const tokens = await this.getTokens({ email: user.email });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('이미 존재하는 이메일입니다.');
      } else {
        throw new InternalServerErrorException(
          '회원가입 중 오류가 발생했습니다.',
        );
      }
    }
  }

  private async getTokens(payload: { email: string }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_TOKEN'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION_TIME'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_TOKEN'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION_TIME'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async signin(authDto: AuthDto) {
    const { email, password } = authDto;

    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    const isPasswordValid = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    const { accessToken, refreshToken } = await this.getTokens({ email });
    await this.updatedRefreshToken(user.user_id, refreshToken);
    await this.prisma.users.update({
      where: {
        user_id: user.user_id,
      },
      data: {
        updated_at: new Date(),
      },
    });

    return { accessToken, refreshToken };
  }

  private async updatedRefreshToken(userId: number, refreshToken: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    try {
      await this.prisma.users.update({
        where: { user_id: userId },
        data: { refresh_token: hashedRefreshToken },
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        '회원가입 중 오류가 발생했습니다.',
      );
    }
  }

  async refresh(user: users) {
    const { email } = user;
    const { accessToken, refreshToken } = await this.getTokens({ email });

    if (!user.refresh_token) {
      throw new ForbiddenException('유효하지 않은 토큰입니다.');
    }
    await this.updatedRefreshToken(user.user_id, user.refresh_token);
    return { accessToken, refreshToken };
  }

  async logout(user: users) {
    try {
      await this.prisma.users.update({
        where: { user_id: user.user_id },
        data: {
          refresh_token: null,
        },
      });
      return { message: '로그아웃 완료' };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('서버 에러');
    }
  }

  async getMe(user: users) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refresh_token, password, login_type, push_token, ...userData } =
      user;
    return userData;
  }
  async deleteAccount(user: users) {
    try {
      await this.prisma.users.delete({
        where: { user_id: user.user_id },
      });
      return { message: '계정 삭제 완료' };
    } catch (error) {
      console.log(error);
      throw new BadRequestException('탈퇴가 불가능합니다.');
    }
  }
}
