import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsObject,
  ValidateNested,
  IsEmail,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessType } from '../../common/enums/domain.enums';

class AddressDto {
  @ApiProperty({ example: '123 Market St' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'San Francisco' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'CA' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '94105' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ example: 'USA' })
  @IsString()
  @IsNotEmpty()
  country: string;
}

class OwnerInfoDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1-555-0199' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ type: AddressDto })
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}

class RequestedProcessingInfoDto {
  @ApiProperty({
    example: 50000,
    description: 'Estimated monthly processing volume in USD',
  })
  @IsNumber()
  @Min(100)
  estimatedMonthlyVolume: number;

  @ApiProperty({ example: 120, description: 'Average ticket size in USD' })
  @IsNumber()
  @Min(1)
  averageTicketSize: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;
}

export class CreateApplicationDto {
  @ApiProperty({ example: 'Acme Coffee LLC' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ example: 'Acme Coffee Roasters LLC' })
  @IsString()
  @IsNotEmpty()
  legalBusinessName: string;

  @ApiProperty({ enum: BusinessType, example: BusinessType.LLC })
  @IsEnum(BusinessType)
  businessType: BusinessType;

  @ApiProperty({ example: '12-3456789', description: 'Business Tax ID (EIN)' })
  @IsString()
  @IsNotEmpty()
  taxId: string;

  @ApiProperty({ type: OwnerInfoDto })
  @IsObject()
  @ValidateNested()
  @Type(() => OwnerInfoDto)
  ownerInfo: OwnerInfoDto;

  @ApiProperty({ type: RequestedProcessingInfoDto })
  @IsObject()
  @ValidateNested()
  @Type(() => RequestedProcessingInfoDto)
  requestedProcessingInfo: RequestedProcessingInfoDto;
}
