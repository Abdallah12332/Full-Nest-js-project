import { Injectable, NestMiddleware } from "@nestjs/common";
import * as csurf from "csurf";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly csrfProtection = csurf.default({
    cookie: {
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    },
    value: (req: Request): string =>
      (req.headers["x-csrf-token"] as string) ||
      (req.body as Record<string, string>)["_csrf"] ||
      "",
  });

  use(req: Request, res: Response, next: NextFunction) {
    this.csrfProtection(req, res, next);
  }
}
