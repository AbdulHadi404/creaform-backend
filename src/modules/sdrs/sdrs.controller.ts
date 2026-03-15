import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SdrsService } from './sdrs.service';
import { CreateSdrDto, UpdateSdrDto } from './sdrs.dto';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SetAssignmentDto {
  @ApiProperty({ nullable: true, description: 'null to unassign' })
  @IsOptional()
  @IsNumber()
  sdrId!: number | null;
}

@ApiTags('sdrs')
@Controller('sdrs')
export class SdrsController {
  constructor(private readonly service: SdrsService) {}

  @Get()
  @ApiOperation({ summary: 'List all SDRs' })
  findAll() {
    return this.service.findAll();
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Get all prospect→SDR assignments as a map' })
  getAllAssignments() {
    return this.service.getAllAssignments();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one SDR' })
  findOne(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an SDR' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSdrDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an SDR' })
  update(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Body() dto: UpdateSdrDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an SDR (removes all their assignments)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Patch('assignments/:prospectId')
  @ApiOperation({ summary: 'Set or remove the SDR assignment for a prospect' })
  @ApiResponse({ status: 200, description: 'Assignment updated' })
  setAssignment(
    @Param('prospectId', ParsePositiveIntPipe) prospectId: number,
    @Body() dto: SetAssignmentDto,
  ) {
    return this.service.setAssignment(prospectId, dto.sdrId);
  }
}
