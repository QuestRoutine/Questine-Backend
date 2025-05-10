import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AuthDto {
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, {
    message: '유효한 이메일 형식이 아닙니다.',
  })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(
    /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/,
    {
      message:
        '비밀번호는 최소 8자 이상, 하나 이상의 문자, 숫자 및 특수 문자를 포함해야 합니다.',
    },
  )
  password: string;
}
