import {
  IsString, IsNotEmpty, IsOptional, MaxLength, IsIn,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";

const DEPT_OPTIONS = [
  "Engineering", "R&D", "Operations", "Procurement", "Quality",
  "Program Management", "Business Development", "C-Suite", "Manufacturing", "Other",
];

export class CreateContactDto {
  @ApiProperty({ example: "Sarah Chen" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: "VP of Engineering" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ enum: DEPT_OPTIONS })
  @IsOptional()
  @IsIn(DEPT_OPTIONS)
  dept?: string;

  @ApiPropertyOptional({ example: "https://linkedin.com/in/sarahchen" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedin?: string;

  @ApiPropertyOptional({ example: "sarah.chen@company.com" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: "+1 555 000 0000" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContactDto extends PartialType(CreateContactDto) {}
