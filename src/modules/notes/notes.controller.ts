import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './notes.dto';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';

@ApiTags('notes')
@Controller('prospects/:prospectId/notes')
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'List all notes for a prospect' })
  findAll(@Param('prospectId', ParsePositiveIntPipe) prospectId: number) {
    return this.service.findByProspect(prospectId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a note to a prospect' })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('prospectId', ParsePositiveIntPipe) prospectId: number,
    @Body() dto: CreateNoteDto,
  ) {
    return this.service.create(prospectId, dto);
  }

  @Delete(':noteId')
  @ApiOperation({ summary: 'Delete a note' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('prospectId', ParsePositiveIntPipe) prospectId: number,
    @Param('noteId', ParsePositiveIntPipe) noteId: number,
  ) {
    return this.service.remove(prospectId, noteId);
  }
}
