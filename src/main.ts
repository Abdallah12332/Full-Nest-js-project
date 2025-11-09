import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { JwtService } from "@nestjs/jwt";
import * as fs from "fs";
import * as compression from "compression";
import { OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import * as express from "express";

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync(
      process.env.SSL_KEY_PATH || "./secrets/private-key.pem",
    ),
    cert: fs.readFileSync(
      process.env.SSL_CERT_PATH || "./secrets/certificate.pem",
    ),
  };

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
  });
  const configService = app.get(ConfigService);

  // Enable gzip compression
  app.use(compression.default({ level: 6 }));
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Cookie parser

  // Trust proxy (for HTTPS behind reverse proxy)
  app.set("trust proxy", 1);

  // Helmet security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'", "https://apis.google.com"],
          "style-src": ["'self'"],
          "img-src": ["'self'", "data:", "https:"],
          "connect-src": ["'self'", `${configService.get("CORS")}`],
          "font-src": ["'self'", "https://fonts.gstatic.com"],
          "frame-src": ["'none'", "https://accounts.google.com"],
          "frame-ancestors": ["'none'"],
        },
      },
    }),
  );

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const jwtService = app.get(JwtService);

  // Admin guard for Swagger
  app.use(
    "/api/docs",
    (
      req: { headers: { authorization?: string }; user?: any },
      res: {
        status: (code: number) => { json: (obj: { message: string }) => void };
      },
      next: () => void,
    ): void => {
      try {
        const auth = req.headers.authorization ?? "";
        if (!auth.startsWith("Bearer ")) {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }

        const token: string = auth.split(" ")[1];
        const payload: { role?: string } = jwtService.verify(token);

        if (payload.role !== "admin") {
          res.status(403).json({ message: "Admins only" });
          return;
        }

        req.user = payload;
        next();
      } catch {
        res.status(401).json({ message: "Invalid token" });
      }
    },
  );

  // Enable CORS
  app.enableCors({
    origin: configService.get("CORS"),
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  });

  // Load prebuilt Swagger document
  const swaggerDocument: OpenAPIObject = JSON.parse(
    fs.readFileSync("./swagger.json", "utf-8"),
  ) as OpenAPIObject;
  SwaggerModule.setup("api/docs", app, swaggerDocument);

  await app.listen(configService.get("PORT") ?? 8443);
  console.log(
    `Swagger docs available at https://localhost:${configService.get("PORT") ?? 8443}/api/docs`,
  );
}

bootstrap().catch((err) => {
  console.error("Error during bootstrap:", err);
  process.exit(1);
});
