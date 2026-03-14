import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ProspectsService } from "./prospects.service";
import { ParsePositiveIntPipe } from "@/common/pipes/parse-positive-int.pipe";
import {
  CreateProspectDto,
  UpdateProspectDto,
  ProspectQueryDto,
  BulkAssignDto,
} from "./prospects.dto";

@ApiTags("prospects")
@Controller("prospects")
export class ProspectsController {
  constructor(private readonly service: ProspectsService) {}

  @Get()
  @ApiOperation({ summary: "List prospects with filtering and pagination" })
  findAll(@Query() query: ProspectQueryDto) {
    return this.service.findAll(query);
  }

  @Get("stats")
  @ApiOperation({ summary: "Dashboard stats — totals, hot count, by-sector/heat breakdown" })
  getStats() {
    return this.service.getStats();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single prospect" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParsePositiveIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a single prospect" })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProspectDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a prospect" })
  update(
    @Param("id", ParsePositiveIntPipe) id: number,
    @Body() dto: UpdateProspectDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a prospect and all related data" })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParsePositiveIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post("bulk-assign")
  @ApiOperation({ summary: "Bulk assign / unassign SDR to multiple prospects" })
  bulkAssign(@Body() dto: BulkAssignDto) {
    return this.service.bulkAssign(dto);
  }
}
