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

export class RegisterBody {
  @IsString()
  name: string;
}

@Controller("register")
export class RegisterController {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  @Post()
  async post(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: RegisterBody,
  ) {
    const clientId = randomUUID();
    const clientSecret = randomBytes(64).toString('hex');
    console.log('Registering client', body);
    await this.prisma.oAuthClient.upsert({
      where: { id: clientId },
      update: {},
      create: {
        id: clientId,
        name: body.name,
        secret: clientSecret,
        allowedGrants: ["authorization_code", "client_credentials", "refresh_token"],
        redirectUris: [],
      },
    });
    res.status(HttpStatus.OK);
    res.send({ clientId, clientSecret });
  }
}
