import type { Request, Response } from "express";
import { Controller, Get, Req, Res } from "@nestjs/common";
import {
  handleExpressError,
  handleExpressResponse,
  requestFromExpress,
} from "@jmondi/oauth2-server/express";

import { AuthorizationServerService } from "../services/authorization_server.service.js";
import { DateDuration } from "@jmondi/date-duration";

@Controller("front")
export class FrontController {
  constructor(private readonly oauth: AuthorizationServerService) { }

  @Get()
  async get(@Req() req: Request, @Res() res: Response) {
    const request = requestFromExpress(req);

    const user = req.user;
    const expiresAt = new DateDuration("1d");
    const clientId = req.cookies.client_id || req.query.client_id;
    const ticket = req.cookies.ticket || req.query.ticket;
    res.cookie("client_id", clientId, {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
      expires: expiresAt.endDate,
    });
    res.cookie("ticket", ticket, {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
      expires: expiresAt.endDate,
    });

    try {

      // Redirect the user to login if they are not logged in yet.
      if (!user) {
        res.status(302).redirect(`/api/login`);
        return;
      }

      if (!req.query.resource) {
        res.status(302).redirect(`https://research-drive-poc.pondersource.net/index.php/apps/tokenbaseddav`);
        return;
      }

      // Redirect the user to scopes if they have not reviewed the client's authorization request yet.
      // TODO: add ticket support to scopes endpoint
      if (typeof req.cookies.accept !== "string") {
        res.status(302).redirect(`/api/scopes`);
        return;
      }

      // Redirect the user to the result page, where this flow will end.
      res.status(302).redirect(`/api/result`);
    } catch (e) {
      handleExpressError(e, res);
    }
  }
}
