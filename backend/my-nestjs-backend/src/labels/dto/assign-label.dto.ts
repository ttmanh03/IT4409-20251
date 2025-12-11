import { IsNumber, IsNotEmpty } from 'class-validator';

export class AssignLabelDto {
  @IsNumber()
  @IsNotEmpty()
  labelId: number;
}