import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "./JwtPayload";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configservice: ConfigService) {
    const secret = configservice.get<string>("JWT_SECRET");
    if (!secret) throw new Error("JWT_SECRET is not defined in enviroment");

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer: "Protofolio",
    });
  }

  validate(payload: JwtPayload) {
    return { sub: payload.sub, username: payload.username, role: payload.role };
  }
}
