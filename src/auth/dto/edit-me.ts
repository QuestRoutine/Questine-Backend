import { IsString, Length } from 'class-validator';

export class EditMeDto {
  @IsString()
  @Length(2, 15, {
    message: '닉네임은 2글자 이상 15글자 이하로 입력해주세요.',
  })
  nickname: string;
}
