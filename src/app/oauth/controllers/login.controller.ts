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
import { User } from "@prisma/client";
import { Issuer, generators } from 'openid-client';
import { DateDuration } from "@jmondi/date-duration";
import { IsEmail, IsString } from "class-validator";

import { AuthorizationServerService } from "../services/authorization_server.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { verifyPasswordOrThrow } from "../../../lib/password.js";
import { MyCustomJwtService } from "../services/custom_jwt_service.js";

export class LoginBody {
  @IsEmail()
  email: string;
  @IsString()
  password: string;
}

@Controller("login")
export class LoginController {
  constructor(
    private readonly jwt: MyCustomJwtService,
    private readonly oauth: AuthorizationServerService,
    private readonly prisma: PrismaService,
  ) {}

  private async generateGoogleOAuthUrl(code_verifier: string): Promise<string> {
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

    const code_challenge = generators.codeChallenge(code_verifier);

    return client.authorizationUrl({
      scope: 'openid email profile',
      resource: 'https://sram-auth-poc.pondersource.net',
      code_challenge,
      code_challenge_method: 'S256',
    });
  }

  private async generateSramOAuthUrl(code_verifier: string): Promise<string> {
    const sramIssuer = await Issuer.discover('https://proxy.sram.surf.nl/');
    console.log('Discovered issuer %s %O', sramIssuer.issuer, sramIssuer.metadata, code_verifier);

    const client = new sramIssuer.Client({
      client_id: 'APP-CD00A924-E614-4588-8607-EF7D4D55EAAB',
      client_secret: process.env.SRAM_CLIENT_SECRET,
      redirect_uris: ['https://sram-auth-poc.pondersource.net/login-callback.html'],
      response_types: ['code'],
      // id_token_signed_response_alg (default "RS256")
      // token_endpoint_auth_method (default "client_secret_basic")
    }); // => Client

    const code_challenge = generators.codeChallenge(code_verifier);

    return client.authorizationUrl({ 
      scope: 'openid email profile',
      // scope: `openid profile email ` +
      //   `eduperson_assurance eduperson_entitlement eduperson_orcid eduperson_principal_name eduperson_scoped_affiliation ` +
      //   `voperson_external_affiliation voperson_external_id voperson_id ` +
      //   `aarc ssh_public_key orcid uid`,
      resource: 'https://sram-auth-poc.pondersource.net',
      code_challenge,
      code_challenge_method: 'S256',
    });
  }

  @Get()
  @Render("login")
  async index(@Req() req: Request, @Res() res: Response) {
    await this.oauth.validateAuthorizationRequest(requestFromExpress(req));
    const code_verifier = generators.codeVerifier();
    console.log('generated code_verifier', code_verifier);
    console.log("Getting Google OIDC URL");
    const googleOAuthUrl = await this.generateGoogleOAuthUrl(code_verifier);
    console.log("Getting SRAM OIDC URL");
    const sramOAuthUrl = await this.generateSramOAuthUrl(code_verifier);
    console.log("Done getting OIDC URLs");
    console.log('storing code_verifier in cookie!', code_verifier);
    const expiresAt = new DateDuration("1h");
    res.cookie("code_verifier", code_verifier, {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
      expires: expiresAt.endDate,
    });

    return {
      csrfToken: req.csrfToken(),
      loginFormAction: "#",
      forgotPasswordLink: "#",
      googleOAuthUrl,
      sramOAuthUrl,
    };
  }

  @Post()
  async post(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: LoginBody,
  ) {
    await this.oauth.validateAuthorizationRequest(req);

    const { email, password } = body;
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
      await verifyPasswordOrThrow(password, user.passwordHash);
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

    // const query = querystring.stringify(req.query as any);
    // await this.loginService.loginAndRedirect(user, req.ip, res, query);
    const [_, query] = req.url.split("?");
    res.status(HttpStatus.FOUND).redirect(`/api/oauth2/authorize?${query}`);
  }
}
