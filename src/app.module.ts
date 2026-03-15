import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProspectsModule } from './modules/prospects/prospects.module';
import { SdrsModule } from './modules/sdrs/sdrs.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { NotesModule } from './modules/notes/notes.module';
import { SequencesModule } from './modules/sequences/sequences.module';
import { ImportModule } from './modules/import/import.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: '.env',
    }),
    DatabaseModule,
    ProspectsModule,
    SdrsModule,
    ContactsModule,
    NotesModule,
    SequencesModule,
    ImportModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
