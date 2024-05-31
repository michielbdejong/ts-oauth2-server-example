import {
  Controller,
  Get,
  Req,
  Res,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import { type Response, type Request, query } from "express";
import { PrismaService } from "../../prisma/prisma.service.js";
import { Issuer, generators } from 'openid-client';
import { MyCustomJwtService } from "../services/custom_jwt_service.js";

import { User } from "@prisma/client";
import { DateDuration } from "@jmondi/date-duration";

const GOOGLE=false;

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
    const issuer = await Issuer.discover(GOOGLE ? 'https://accounts.google.com' : 'https://proxy.sram.surf.nl');
    console.log('Discovered issuer %s %O', issuer.issuer, issuer.metadata, code_verifier);

    const client = new issuer.Client(GOOGLE ? {
      client_id: '994014261189-c2us07d24s52v1dhrsl8fkja36rhbgif.apps.googleusercontent.com',
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: ['https://sram-auth-poc.pondersource.net/login-callback.html'],
      response_types: ['code'],
    } : {
      client_id: 'APP-CD00A924-E614-4588-8607-EF7D4D55EAAB',
      client_secret: process.env.SRAM_CLIENT_SECRET,
      redirect_uris: ['https://sram-auth-poc.pondersource.net/login-callback.html'],
      response_types: ['code'],
    });

    const params = client.callbackParams(req);
    console.log(params);
    const tokenSet = await client.callback('https://sram-auth-poc.pondersource.net/login-callback.html', params, { code_verifier });
    console.log('received and validated tokens %j', tokenSet);
    console.log('validated ID Token claims %j', tokenSet.claims());
    const userinfo = await client.userinfo(tokenSet.access_token);
    console.log('userinfo %j', userinfo);
    // const email = tokenSet.claims().email;
    const email = userinfo.email;
    console.log('looking up email in db', email);
    // if (tokenSet.claims().email_verified === true) {
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
      console.log('error looking up email in db', e.message);
      throw new UnauthorizedException(null, { cause: e });
    }
    console.log('setting user login status in db', user.id);
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

    console.log('setting jwt in cookie', token);
    res.cookie("jid", token, {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
      expires: expiresAt.endDate,
    });

    const state = req.query.state;
    console.log('state coming back from SRAM', state);
    let queryStr = '';
    if (typeof state === 'string') {
      const [clientId, ticket] = state.split(':');
      queryStr = `client_id=${encodeURIComponent(clientId)}&ticket=${encodeURIComponent(ticket)}`;
    }
    res.status(302).redirect(`/api/front?${queryStr}`);
  }
}
