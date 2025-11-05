// scripts/generate-swagger.ts
import { writeFileSync } from "fs";
import { AppModule } from "../src/app.module";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function generateSwagger() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle("Portfolio API")
    .setDescription("API documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  writeFileSync("./swagger.json", JSON.stringify(document, null, 2));
  await app.close();
  console.log("Swagger JSON generated!");
}

generateSwagger().catch((err) => {
  console.error(`Error ducring generateSwagger ${err}`);
});
