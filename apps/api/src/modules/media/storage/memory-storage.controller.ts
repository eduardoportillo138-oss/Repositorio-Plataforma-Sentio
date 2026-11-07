import {
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  PayloadTooLargeException,
  Put,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { AVATAR_MAX_BYTES } from '@sentio/core';
import { type Request, type Response } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { MEMORY_STORAGE_ROUTE, MemoryStorage } from './memory.storage';
import { OBJECT_STORAGE, type ObjectStorage } from './object-storage';

/** Lee el cuerpo crudo de la request con un límite de tamaño. */
async function readBody(req: Request, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    total += chunk.length;
    if (total > limit) throw new PayloadTooLargeException();
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Emula los endpoints de S3 cuando STORAGE_DRIVER=memory (pruebas y desarrollo sin Docker):
 * PUT con URL firmada y GET público de las variantes. Con S3 responde 404.
 */
@Public()
@Controller(MEMORY_STORAGE_ROUTE)
export class MemoryStorageController {
  constructor(@Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage) {}

  private memory(): MemoryStorage {
    if (!(this.storage instanceof MemoryStorage)) throw new NotFoundException();
    return this.storage;
  }

  @Put('upload/:key')
  @HttpCode(200)
  async upload(
    @Param('key') key: string,
    @Query('exp') exp: string,
    @Query('ct') contentType: string,
    @Query('sig') sig: string,
    @Req() req: Request,
  ): Promise<{ ok: true }> {
    const storage = this.memory();
    if (!storage.verifyUpload(key, contentType ?? '', Number(exp), sig ?? '')) {
      throw new UnauthorizedException('Firma inválida o vencida.');
    }
    if (req.headers['content-type'] !== contentType) {
      throw new UnsupportedMediaTypeException('El Content-Type no coincide con el firmado.');
    }
    // Margen sobre el máximo: el tamaño exacto se valida al confirmar, igual que con S3.
    const body = await readBody(req, AVATAR_MAX_BYTES * 2);
    await storage.put(key, body, contentType);
    return { ok: true };
  }

  @Get('public/:key')
  download(@Param('key') key: string, @Res() res: Response): void {
    const storage = this.memory();
    const obj = storage.isPublicKey(key) ? storage.read(key) : null;
    if (!obj) throw new NotFoundException();
    res.setHeader('Content-Type', obj.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.send(obj.body);
  }
}
