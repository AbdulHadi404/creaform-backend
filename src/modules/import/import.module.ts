import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Module,
  Injectable,
  Inject,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { DB, type DrizzleDB } from '../../database/database.module';
import * as schema from '../../database/schema';

// ── Supported MIME types ──────────────────────────────────────────────────────
const ALLOWED_MIMES = new Set([
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream', // some browsers send xlsx as this
]);

// ── Service ───────────────────────────────────────────────────────────────────
@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async importFile(
    buffer: Buffer,
    filename: string,
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const errors: string[] = [];

    let rawRows: Record<string, string>[];

    if (ext === 'csv' || ext === 'txt') {
      rawRows = this.parseCSV(buffer.toString('utf-8'));
    } else if (ext === 'xlsx' || ext === 'xls' || ext === 'ods') {
      rawRows = this.parseXLSX(buffer);
    } else {
      throw new BadRequestException(`Unsupported file extension: .${ext}`);
    }

    if (!rawRows.length) {
      throw new BadRequestException(
        'File appears to be empty or has no data rows',
      );
    }

    // Auto-detect column mapping with fuzzy matching
    const headers = Object.keys(rawRows[0]);
    const mapping = this.buildMapping(headers);

    const values: schema.NewProspect[] = [];
    const skipped: number[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const co = mapping['co'] ? String(row[mapping['co']] ?? '').trim() : '';

      if (!co) {
        skipped.push(i + 2); // +2 for 1-based + header row
        errors.push(`Row ${i + 2}: missing Company Name — skipped`);
        continue;
      }

      const heat = this.normaliseHeat(
        mapping['heat'] ? String(row[mapping['heat']] ?? '') : '',
      );

      values.push({
        co,
        country: this.get(row, mapping, 'country') || 'US',
        sector: this.get(row, mapping, 'sector') || 'Industrial',
        heat,
        date: this.get(row, mapping, 'date') || undefined,
        emp: this.get(row, mapping, 'emp') || undefined,
        hq: this.get(row, mapping, 'hq') || undefined,
        signal: this.get(row, mapping, 'signal') || undefined,
        contact: this.get(row, mapping, 'contact') || undefined,
        title: this.get(row, mapping, 'title') || undefined,
        email: this.get(row, mapping, 'email') || undefined,
      });
    }

    if (!values.length) {
      return { imported: 0, skipped: skipped.length, errors };
    }

    // Batch insert in chunks of 500 to stay within Neon limits
    const CHUNK = 500;
    let imported = 0;
    for (let i = 0; i < values.length; i += CHUNK) {
      const chunk = values.slice(i, i + CHUNK);
      const inserted = await this.db
        .insert(schema.prospects)
        .values(chunk)
        .returning({ id: schema.prospects.id });
      imported += inserted.length;
    }

    this.logger.log(
      `Import complete: ${imported} inserted, ${skipped.length} skipped`,
    );
    return { imported, skipped: skipped.length, errors };
  }

  // ── Parsers ───────────────────────────────────────────────────────────────

  private parseCSV(text: string): Record<string, string>[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = this.splitCSVLine(lines[0]);
    return lines
      .slice(1)
      .map((line) => {
        const vals = this.splitCSVLine(line);
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = vals[i] ?? '';
        });
        return obj;
      })
      .filter((r) => Object.values(r).some((v) => v));
  }

  private splitCSVLine(line: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQ = false;
    for (const c of line) {
      if (c === '"') {
        inQ = !inQ;
      } else if (c === ',' && !inQ) {
        result.push(cur);
        cur = '';
      } else cur += c;
    }
    result.push(cur);
    return result.map((s) => s.replace(/^"|"$/g, '').trim());
  }

  private parseXLSX(buffer: Buffer): Record<string, string>[] {
    // Dynamic require so the import only loads when actually needed.
    // xlsx is a large package — we don't want it in the cold-start path.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const XLSX = require('xlsx') as typeof import('xlsx');
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
  }

  // ── Mapping helpers ───────────────────────────────────────────────────────

  private buildMapping(headers: string[]): Record<string, string> {
    const FIELD_KEYS: Record<string, string[]> = {
      co: ['co', 'company', 'companyname', 'name'],
      country: ['country'],
      sector: ['sector', 'industry', 'vertical'],
      heat: ['heat', 'signalheat', 'status'],
      date: ['date', 'signaldate'],
      emp: ['emp', 'employees', 'headcount', 'size'],
      hq: ['hq', 'location', 'headquarters', 'city'],
      signal: ['signal', 'intentsignal', 'notes', 'reason'],
      contact: ['contact', 'contactname', 'firstname'],
      title: ['title', 'jobtitle', 'role', 'position'],
      email: ['email', 'emailaddress'],
    };

    const mapping: Record<string, string> = {};
    for (const [field, aliases] of Object.entries(FIELD_KEYS)) {
      const match = headers.find((h) => {
        const norm = h.toLowerCase().replace(/[\s_\-.]/g, '');
        return aliases.some(
          (a) => norm === a || norm.includes(a) || a.includes(norm),
        );
      });
      if (match) mapping[field] = match;
    }
    return mapping;
  }

  private get(
    row: Record<string, string>,
    mapping: Record<string, string>,
    key: string,
  ): string {
    if (!mapping[key]) return '';
    return String(row[mapping[key]] ?? '').trim();
  }

  private normaliseHeat(raw: string): schema.ProspectRow['heat'] {
    const v = raw.trim();
    if (v === 'Hot' || v === 'Warm' || v === 'Cool') return v;
    return 'Warm';
  }
}

// ── Controller ─────────────────────────────────────────────────────────────────
@ApiTags('import')
@Controller('import')
export class ImportController {
  constructor(private readonly service: ImportService) {}

  @Post()
  @ApiOperation({ summary: 'Upload CSV or XLSX and bulk-import prospects' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE_MB ?? '20') * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        if (
          ALLOWED_MIMES.has(file.mimetype) ||
          file.originalname.match(/\.(csv|xlsx|xls|ods|txt)$/i)
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(`File type not allowed: ${file.mimetype}`),
            false,
          );
        }
      },
    }),
  )
  // Minimal type definition for the uploaded file that we access in this handler.
  // This avoids relying on the global `Express` namespace (which can be missing
  // depending on @types/express versioning).
  upload(
    @UploadedFile()
    file:
      | { buffer: Buffer; originalname: string; mimetype: string }
      | undefined,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.service.importFile(file.buffer, file.originalname);
  }
}

// ── Module ─────────────────────────────────────────────────────────────────────
@Module({
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
