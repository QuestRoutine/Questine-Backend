import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class RankService {
  constructor(private readonly prisma: PrismaService) {}
  async getRank() {
    return await this.prisma.user_exp_ranking.findMany({
      orderBy: { rank: 'asc' },
      take: 100,
    });
  }
}
