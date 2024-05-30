import {
  Controller,
  Get,
  Render,
  Req,
  Res,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import type { Response, Request } from "express";
import { PrismaService } from "../../prisma/prisma.service.js";
import { Issuer, generators } from 'openid-client';
import { MyCustomJwtService } from "../services/custom_jwt_service.js";

import { User } from "@prisma/client";
import { DateDuration } from "@jmondi/date-duration";

@Controller("oidc")
export class OidcController {
  constructor(
    private readonly jwt: MyCustomJwtService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
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
    const userinfo = await client.userinfo(tokenSet.access_token);
    console.log('userinfo %j', userinfo);
    const email = tokenSet.claims().email;
    if (tokenSet.claims().email_verified === true) {
      let user: User;

      try {
        user = await this.prisma.user.findFirstOrThrow({
          where: {
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
        });
      } catch (e) {
        throw new UnauthorizedException(null, { cause: e });
      }

      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIP: req.ip,
        },
      });

      const expiresAt = new DateDuration("30d");

      const token = await this.jwt.sign({
        userId: user.id,
        email: user.email,

        iat: Math.floor(Date.now() / 1000),
        exp: expiresAt.endTimeSeconds,
      });

      res.cookie("jid", token, {
        secure: true,
        httpOnly: true,
        sameSite: "strict",
        expires: expiresAt.endDate,
      });

      res.status(HttpStatus.FOUND).redirect(`/`);
    }
  }
}
