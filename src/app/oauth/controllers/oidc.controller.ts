import {
  Controller,
  Get,
  Render,
  Req,
  Res,
} from "@nestjs/common";
import type { Response, Request } from "express";
import { PrismaService } from "../../prisma/prisma.service.js";
import { Issuer, generators } from 'openid-client';
@Controller("oidc")
export class OidcController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Render("oidc")
  async index(@Req() req: Request, @Res() res: Response) {
    const code_verifier = req.cookies.code_verifier;
    console.log('Retrieved code_verifier from cookie!', code_verifier);
    const googleIssuer = await Issuer.discover('https://accounts.google.com');
    console.log('Discovered issuer %s %O', googleIssuer.issuer, googleIssuer.metadata, code_verifier);

    const client = new googleIssuer.Client({
      client_id: '994014261189-c2us07d24s52v1dhrsl8fkja36rhbgif.apps.googleusercontent.com',
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: ['https://sram-auth-poc.pondersource.net/login-callback.html'],
      response_types: ['code'],
      // id_token_signed_response_alg (default "RS256")
      // token_endpoint_auth_method (default "client_secret_basic")
    }); // => Client

    const params = client.callbackParams(req);
    console.log(params);
    const tokenSet = await client.callback('https://sram-auth-poc.pondersource.net/login-callback.html', params, { code_verifier });
    console.log('received and validated tokens %j', tokenSet);
    console.log('validated ID Token claims %j', tokenSet.claims());
  }
}
