import { Controller, Get, UseGuards } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { User } from 'src/common/user.decorator';
import { users } from 'generated/prisma';
import { AuthGuard } from '@nestjs/passport';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get('/avg')
  getAllCharacters() {
    return this.charactersService.getUsersAverageLevel();
  }
  @Get('/me')
  @UseGuards(AuthGuard())
  getCharacterById(@User() user: users) {
    return this.charactersService.getCharacterByUserAndName(user.user_id);
  }
}
