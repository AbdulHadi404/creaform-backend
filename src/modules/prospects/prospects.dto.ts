import {
  IsString, IsNotEmpty, IsOptional, IsIn, MaxLength, IsNumber, Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";

export type Heat = "Hot" | "Warm" | "Cool";
const HEATS: Heat[] = ["Hot", "Warm", "Cool"];

export class CreateProspectDto {
  @ApiProperty({ example: "Joby Aviation" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  co!: string;

  @ApiPropertyOptional({ example: "US" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  country?: string;

  @ApiPropertyOptional({ example: "Aerospace" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sector?: string;

  @ApiPropertyOptional({ enum: ["Hot", "Warm", "Cool"] })
  @IsOptional()
  @IsIn(HEATS)
  heat?: Heat;

  @ApiPropertyOptional({ example: "Mar 2026" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  date?: string;

  @ApiPropertyOptional({ example: "1,200" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emp?: string;

  @ApiPropertyOptional({ example: "Santa Cruz, CA" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  hq?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;
}

export class UpdateProspectDto extends PartialType(CreateProspectDto) {}

export class ProspectQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ["Hot", "Warm", "Cool", "All"] })
  @IsOptional()
  @IsString()
  heat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ enum: ["US", "Canada", "All"] })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sdrId?: string;

  @ApiPropertyOptional({ enum: ["All", "1-50", "51-200", "201-500", "501-1000", "1001-5000", "5001+"] })
  @IsOptional()
  @IsString()
  empRange?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  perPage?: number = 20;
}

export class BulkAssignDto {
  @ApiProperty({ type: [Number] })
  @IsNumber({}, { each: true })
  prospectIds!: number[];

  @ApiPropertyOptional({ description: "null to unassign" })
  @IsOptional()
  @IsNumber()
  sdrId?: number | null;
}
