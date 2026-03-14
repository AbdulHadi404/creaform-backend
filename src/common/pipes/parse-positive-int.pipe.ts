import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new BadRequestException(`ID must be a positive integer, got: ${value}`);
    }
    return parsed;
  }
}
