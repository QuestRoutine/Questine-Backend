import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}
  async getAllCharacters() {
    try {
      const characters = await this.prisma.characters.findMany({
        orderBy: {
          created_at: 'desc',
        },
      });
      return {
        success: true,
        message: '모든 캐릭터를 조회했습니다.',
        data: characters,
      };
    } catch (error) {
      return {
        success: false,
        message: '캐릭터 조회 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }
  async getCharacterById(user_id: number, character_name: string) {
    try {
      const character = await this.prisma.characters.findUnique({
        where: {
          user_id,
          character_name,
        },
      });
      if (!character) {
        return {
          success: false,
          message: '해당 캐릭터를 찾을 수 없습니다.',
          data: null,
        };
      }
      return {
        success: true,
        message: '캐릭터를 조회했습니다.',
        data: character,
      };
    } catch (error) {
      return {
        success: false,
        message: '캐릭터 조회 중 오류가 발생했습니다.',
        error: error.message,
        data: null,
      };
    }
  }

  async getCharacterByUserAndName(user_id: number) {
    try {
      const character = await this.prisma.characters.findFirst({
        where: {
          user_id,
        },
      });
      if (!character) {
        return {
          message: '해당 캐릭터를 찾을 수 없습니다.',
          data: null,
        };
      }
      const levelRequirement = await this.prisma.level_requirements.findUnique({
        where: { level: character.level },
      });
      return {
        message: '캐릭터를 조회했습니다.',
        data: {
          ...character,
          // 캐릭터의 레벨에 해당하는 레벨 요구사항 조회
          nextLevelExp: levelRequirement ? levelRequirement.required_exp : 0, // 다음 레벨의 경험치 요구량
          // 남은 경험치 표시
          remaining_exp: levelRequirement
            ? levelRequirement.required_exp - character.exp
            : 0,
        },
      };
    } catch (error) {
      return {
        message: '캐릭터 조회 중 오류가 발생했습니다.',
        error: error.message,
        data: null,
      };
    }
  }
}
