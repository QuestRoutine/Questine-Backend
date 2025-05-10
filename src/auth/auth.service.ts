import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

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
    const { accessToken, refreshToken } = await this.getTokens({ email });

    try {
      const user = await this.prisma.users.findUnique({
        where: { email },
      });

      // 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!user || !isPasswordValid) {
        throw new UnauthorizedException(
          '이메일 또는 비밀번호가 잘못되었습니다.',
        );
      }
      return { accessToken, refreshToken };
    } catch (error) {
      throw new InternalServerErrorException('서버 오류 발생');
    }
  }
}
