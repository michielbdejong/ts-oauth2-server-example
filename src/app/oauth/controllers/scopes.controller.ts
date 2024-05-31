import {
  Body,
  Controller,
  Get,
  Post,
  Render,
  Req,
  Res,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import type { Response, Request } from "express";
import { requestFromExpress } from "@jmondi/oauth2-server/express";

import { AuthorizationServerService } from "../services/authorization_server.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { MyCustomJwtService } from "../services/custom_jwt_service.js";
import { DateDuration } from "@jmondi/date-duration";
import { updateTicket } from "../services/tickets.service.js";

export class ScopesBody {
  accept: string;
}

@Controller("scopes")
export class ScopesController {
  constructor(
    private readonly jwt: MyCustomJwtService,
    private readonly oauth: AuthorizationServerService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Render("scopes")
  async index(@Req() req: Request, @Res() res: Response) {
    // await this.oauth.validateAuthorizationRequest(requestFromExpress(req));

    return {
      csrfToken: req.csrfToken(),
      scopes: await this.prisma.oAuthScope.findMany(),
    };
  }

  @Post()
  async post(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: ScopesBody,
  ) {
    const clientId = req.query.client_id as string;
    const ticket = req.query.ticket as string;
    const scopes = body.accept.split(" ");
    console.log("Updating ticket", clientId, ticket, scopes);
    updateTicket(clientId, ticket, scopes);

    const [_, query] = req.url.split("?");
    res.status(HttpStatus.FOUND).redirect(`/api/front?${query}`);
  }
}
