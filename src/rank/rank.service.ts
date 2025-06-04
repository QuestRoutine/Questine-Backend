import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { getLevelImageUrl } from 'src/utils/getLevelImageUrl';

@Injectable()
export class RankService {
  constructor(private readonly prisma: PrismaService) {}
  async getRank() {
    const rankings = await this.prisma.ranking.findMany({
      orderBy: [
        { level: 'desc' },
        { total_exp: 'desc' },
        { calculated_at: 'asc' },
      ],
      take: 30,
    });
    const result = await Promise.all(
      rankings.map(async (rank) => {
        const character = await this.prisma.characters.findUnique({
          where: { user_id: rank.user_id },
        });
        // 레벨별 이미지 URL
        const image_url = character
          ? getLevelImageUrl(character.level)
          : getLevelImageUrl(1);
        return {
          ...rank,
          image_url,
        };
      }),
    );

    return result;
  }
}
