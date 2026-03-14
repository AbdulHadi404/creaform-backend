import { IsString, IsNumber, IsOptional, IsIn, validateSync } from "class-validator";
import { plainToInstance } from "class-transformer";

class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsNumber()
  @IsOptional()
  PORT: number = 3001;

  @IsIn(["development", "production", "test"])
  @IsOptional()
  NODE_ENV: string = "development";

  @IsString()
  @IsOptional()
  FRONTEND_URL: string = "http://localhost:5173";

  @IsNumber()
  @IsOptional()
  MAX_FILE_SIZE_MB: number = 20;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }
  return validated;
}
