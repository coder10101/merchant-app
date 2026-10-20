import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewDecision } from '../../common/enums/domain.enums';

export class ReviewDecisionDto {
  @ApiProperty({ enum: ReviewDecision, example: ReviewDecision.APPROVE })
  @IsEnum(ReviewDecision)
  @IsNotEmpty()
  decision: ReviewDecision;

  @ApiPropertyOptional({ example: 'All KYB documents verified successfully' })
  @IsString()
  @IsOptional()
  notes?: string;
}
