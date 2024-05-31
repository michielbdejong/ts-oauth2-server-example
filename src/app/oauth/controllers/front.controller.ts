import type { Request, Response } from "express";
import { Controller, Get, Req, Res } from "@nestjs/common";
import {
  handleExpressError,
  handleExpressResponse,
  requestFromExpress,
} from "@jmondi/oauth2-server/express";

import { AuthorizationServerService } from "../services/authorization_server.service.js";

@Controller("front")
export class FrontController {
  constructor(private readonly oauth: AuthorizationServerService) { }

  @Get()
  async get(@Req() req: Request, @Res() res: Response) {
    const request = requestFromExpress(req);

    const user = req.user;
    const [_, params] = req.url.split("?");

    try {

      // Redirect the user to login if they are not logged in yet.
      if (!user) {
        res.status(302).redirect(`/api/login?${params}`);
        return;
      }

      // Redirect the user to scopes if they have not reviewed the client's authorization request yet.
      // TODO: add ticket support to scopes endpoint
      if (typeof req.cookies.accept !== "string") {
        res.status(302).redirect(`/api/scopes?${params}`);
        return;
      }

      // Redirect the user to the result page, where this flow will end.
      res.status(302).redirect(`/api/result?${params}`);
    } catch (e) {
      handleExpressError(e, res);
    }
  }
}
