import { EditMeDto } from './dto/edit-me';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
      include: { profile: true },
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
    // 프로필(profile) 생성
    if (!user.profile) {
      await this.prisma.profile.create({
        data: {
          user_id: user.user_id,
        },
      });
    }

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
    const profile = await this.prisma.profile.findUnique({
      where: { user_id: user.user_id },
    });
    if (!profile) {
      throw new NotFoundException('프로필이 존재하지 않습니다.');
    }

    const totalCompletedTasks = await this.prisma.todos.count({
      where: {
        user_id: user.user_id,
        completed: true,
      },
    });

    const { nickname } = user;
    return {
      ...profile,
      nickname,
      statistics: {
        totalCompletedTasks,
      },
    };
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

  async editMe(user: users, editMeDto: EditMeDto) {
    const { nickname } = editMeDto;

    try {
      return await this.prisma.$transaction(async (prisma) => {
        const profile = await prisma.users.findUnique({
          where: {
            user_id: user.user_id,
          },
        });

        if (!profile) {
          throw new NotFoundException('존재하지 않는 프로필입니다.');
        }

        // 닉네임 중복 확인
        const existingUserWithNickname = await prisma.users.findFirst({
          where: {
            nickname: nickname,
            user_id: {
              not: user.user_id,
            },
          },
        });

        if (existingUserWithNickname) {
          throw new ConflictException('이미 사용 중인 닉네임입니다.');
        }
        // 닉네임 변경 시, 캐릭터 이름도 변경
        await prisma.characters.updateMany({
          where: {
            user_id: user.user_id,
          },
          data: {
            character_name: nickname,
          },
        });

        const updatedProfile = await prisma.users.update({
          where: {
            user_id: user.user_id,
          },
          data: {
            nickname,
          },
        });

        return updatedProfile;
      });
    } catch (error) {
      console.log(error);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        '프로필 편집 중 에러가 발생했습니다.',
      );
    }
  }
}
