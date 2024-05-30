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

export class TicketBody {
  @IsString()
  clientId: string;
  @IsString()
  clientSecret: string;
  @IsString()
  ticket: string;
}

@Controller("ticket")
export class TicketController {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  @Post()
  async post(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: TicketBody,
  ) {
    res.status(HttpStatus.OK);
    res.send({ done: true });
  }
}
