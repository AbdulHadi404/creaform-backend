import {
  IsString, IsNotEmpty, IsOptional, IsIn, IsNumber, Min, Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const STEP_STATUSES = ["pending", "skipped", "done", "scheduled"] as const;

export class EnrollSequenceDto {
  @ApiPropertyOptional({ example: "Alex Morgan" })
  @IsOptional()
  @IsString()
  enrolledBy?: string;
}

export class UpdateStepDto {
  @ApiProperty({ example: 3, description: "0-based step index (0–13)" })
  @IsNumber()
  @Min(0)
  @Max(13)
  stepIndex!: number;

  @ApiProperty({ enum: STEP_STATUSES })
  @IsIn(STEP_STATUSES)
  status!: typeof STEP_STATUSES[number];

  @ApiPropertyOptional({ example: "Spoke – Meeting Booked ✅" })
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logNote?: string;
}
