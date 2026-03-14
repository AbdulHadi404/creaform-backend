import { Module } from "@nestjs/common";
import { SdrsController } from "./sdrs.controller";
import { SdrsService } from "./sdrs.service";

@Module({
  controllers: [SdrsController],
  providers:   [SdrsService],
  exports:     [SdrsService],
})
export class SdrsModule {}
