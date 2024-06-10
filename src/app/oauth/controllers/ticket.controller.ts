import {
  Controller,
  Post,
  Req,
  Res,
  HttpStatus,
  Body,
  UnauthorizedException,
} from "@nestjs/common";
import type { Response, Request } from "express";
import { PrismaService } from "../../prisma/prisma.service.js";
import { IsString } from "class-validator";
import { randomUUID, randomBytes } from 'crypto';
import { OAuthClient } from "@prisma/client";
import { checkTicket } from "../services/tickets.service.js";

// this is basically like a Client Password flow
// https://datatracker.ietf.org/doc/html/rfc6749#section-2.3.1
// should see if the dynamic client registration followed by
// this server-side ticket request is secure.
// to be discussed! WIP!
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
    console.log('Registering ticket', body);
    let client: OAuthClient;
    try {
      client = await this.prisma.oAuthClient.findFirstOrThrow({
        where: {
          id: {
            equals: body.clientId,
          },
          // FIXME:
          // secret: {
          //   equals: body.clientSecret,
          // },
        },
      });
    } catch (e) {
      throw new UnauthorizedException(null, { cause: e });
    }
    const done = checkTicket(client.id, body.ticket);
    res.status(HttpStatus.OK);
    res.send({ done });
  }
}
