import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignReviewerDto {
  @ApiProperty({
    example: 'd5f253ee-644a-47f8-add4-12865ddef42d',
    description: 'Reviewer user UUID',
  })
  @IsUUID()
  @IsNotEmpty()
  reviewerId: string;
}
