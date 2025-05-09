import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.users.findMany();
    return users;
  }

  async findOne(id: number) {
    console.log(id);
    const users = await this.prisma.users.findUnique({
      where: {
        userId: id,
      },
    });
    if (!users) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return users;
  }
}
