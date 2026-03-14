import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateNoteDto {
  @ApiProperty({ example: "Mentioned FEA turnaround pain on LinkedIn" })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiPropertyOptional({ example: "Alex Morgan", default: "AE" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  author?: string;
}
