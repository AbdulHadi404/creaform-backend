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
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto } from './contacts.dto';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';

@ApiTags('contacts')
@Controller('prospects/:prospectId/contacts')
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List all contacts for a prospect' })
  findAll(@Param('prospectId', ParsePositiveIntPipe) prospectId: number) {
    return this.service.findByProspect(prospectId);
  }

  @Get(':contactId')
  @ApiOperation({ summary: 'Get one contact' })
  findOne(
    @Param('prospectId', ParsePositiveIntPipe) prospectId: number,
    @Param('contactId', ParsePositiveIntPipe) contactId: number,
  ) {
    return this.service.findOne(prospectId, contactId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a contact to a prospect' })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('prospectId', ParsePositiveIntPipe) prospectId: number,
    @Body() dto: CreateContactDto,
  ) {
    return this.service.create(prospectId, dto);
  }

  @Patch(':contactId')
  @ApiOperation({ summary: 'Update a contact' })
  update(
    @Param('prospectId', ParsePositiveIntPipe) prospectId: number,
    @Param('contactId', ParsePositiveIntPipe) contactId: number,
    @Body() dto: UpdateContactDto,
  ) {
    return this.service.update(prospectId, contactId, dto);
  }

  @Delete(':contactId')
  @ApiOperation({ summary: 'Delete a contact (also removes their sequence)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('prospectId', ParsePositiveIntPipe) prospectId: number,
    @Param('contactId', ParsePositiveIntPipe) contactId: number,
  ) {
    return this.service.remove(prospectId, contactId);
  }
}
