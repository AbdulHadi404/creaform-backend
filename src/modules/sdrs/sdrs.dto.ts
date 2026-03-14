// ── DTOs ─────────────────────────────────────────────────────────────────────
import {
  IsString, IsNotEmpty, MaxLength, Matches,
} from "class-validator";
import { ApiProperty, PartialType } from "@nestjs/swagger";

export class CreateSdrDto {
  @ApiProperty({ example: "Alex Morgan" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: "#6366f1", description: "Hex colour" })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: "color must be a valid hex colour, e.g. #6366f1" })
  color!: string;
}

export class UpdateSdrDto extends PartialType(CreateSdrDto) {}
