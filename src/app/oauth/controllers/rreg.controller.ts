import {
  Controller,
  Post,
  Req,
  Res,
  HttpStatus,
  Body,
} from "@nestjs/common";
import type { Response, Request } from "express";
import { PrismaService } from "../../prisma/prisma.service.js";
import { IsString } from "class-validator";
import { randomUUID, randomBytes } from 'crypto';

export class RregBody {
  @IsString()
  name: string;
}

@Controller("rreg")
export class RregController {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  @Post()
  async post(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: RregBody,
  ) {
    const scopeId = randomUUID();
    console.log('Registering resource', body, scopeId);
    const scope = await this.prisma.oAuthScope.upsert({
      where: { id: scopeId },
      update: {},
      create: {
        id: scopeId,
        name: body.name,
      },
    }); 
    res.status(HttpStatus.OK);
    res.send(scopeId);
  }
}
