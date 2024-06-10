import {
  Body,
  Controller,
  Get,
  Post,
  Render,
  Req,
  Res,
} from "@nestjs/common";
import type { Response, Request } from "express";
@Controller("wayg")
export class WaygController {
  @Get()
  @Render("wayg")
  async index(@Req() req: Request, @Res() res: Response) {
    const query = `?wayg=research-drive-poc`;
    return {
      query,
    }
  }
}
