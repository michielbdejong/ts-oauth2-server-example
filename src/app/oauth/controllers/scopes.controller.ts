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
    const scopeRequested = req.query.resource;
    return {
      csrfToken: req.csrfToken(),
      scopes: await this.prisma.oAuthScope.findUnique({
        where: {
          id: scopeRequested as string
        }
      }),
    };
  }

  @Post()
  async post(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: ScopesBody,
  ) {
    const clientId = req.cookies.client_id as string;
    const ticket = req.cookies.ticket as string;
    const scopes = body.accept.split(" ");
    console.log("Updating ticket", clientId, ticket, scopes);
    updateTicket(clientId, ticket, scopes);
    console.log('updating ticket, now redirecting to result controller');
    res.status(HttpStatus.FOUND).redirect(`/api/result`);
  }
}
