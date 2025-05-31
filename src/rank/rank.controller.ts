import { Controller, Get, UseGuards } from '@nestjs/common';
import { RankService } from './rank.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('rank')
export class RankController {
  constructor(private readonly rankService: RankService) {}
  @Get('/')
  @UseGuards(AuthGuard())
  getRank() {
    return this.rankService.getRank();
  }
}
