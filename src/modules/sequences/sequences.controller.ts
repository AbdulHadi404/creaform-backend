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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SequencesService } from './sequences.service';
import { EnrollSequenceDto, UpdateStepDto } from './sequences.dto';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { SEQUENCE_TEMPLATE } from './sequence-template';

@ApiTags('sequences')
@Controller('prospects/:prospectId/contacts/:contactId/sequence')
export class SequencesController {
  constructor(private readonly service: SequencesService) {}

  @Get('template')
  @ApiOperation({ summary: 'Return the 14-step sequence template definition' })
  getTemplate() {
    return SEQUENCE_TEMPLATE;
  }

  @Get()
  @ApiOperation({ summary: 'Get the sequence for a specific prospect+contact' })
  findOne(
    @Param('prospectId', ParsePositiveIntPipe) prospectId: number,
    @Param('contactId', ParsePositiveIntPipe) contactId: number,
  ) {
    return this.service.findOne(prospectId, contactId);
  }

  @Post('enroll')
  @ApiOperation({ summary: 'Enroll a contact in the sequence (creates it)' })
  @HttpCode(HttpStatus.CREATED)
  enroll(
    @Param('prospectId', ParsePositiveIntPipe) prospectId: number,
    @Param('contactId', ParsePositiveIntPipe) contactId: number,
    @Body() dto: EnrollSequenceDto,
  ) {
    return this.service.enroll(prospectId, contactId, dto);
  }

  @Patch('step')
  @ApiOperation({ summary: 'Log / update a single step in the sequence' })
  updateStep(
    @Param('prospectId', ParsePositiveIntPipe) prospectId: number,
    @Param('contactId', ParsePositiveIntPipe) contactId: number,
    @Body() dto: UpdateStepDto,
  ) {
    return this.service.updateStep(prospectId, contactId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a sequence' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('prospectId', ParsePositiveIntPipe) prospectId: number,
    @Param('contactId', ParsePositiveIntPipe) contactId: number,
  ) {
    return this.service.remove(prospectId, contactId);
  }
}
