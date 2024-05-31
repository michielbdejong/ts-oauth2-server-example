import {
  Controller,
  Get,
  Render,
  Req,
  Res,
} from "@nestjs/common";
import type { Response, Request } from "express";

import { AuthorizationServerService } from "../services/authorization_server.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { MyCustomJwtService } from "../services/custom_jwt_service.js";

export class ResultBody {
  accept: string;
}

@Controller("result")
export class ResultController {
  constructor(
    private readonly jwt: MyCustomJwtService,
    private readonly oauth: AuthorizationServerService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  @Render("result")
  async index(@Req() req: Request, @Res() res: Response) {
    return {
      accept: req.cookies.accept,
    };
  }
}
