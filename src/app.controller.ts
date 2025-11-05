import { Controller, Get, UseGuards } from "@nestjs/common";
import { AppService } from "./app.service";
import { ThrottlerGuard } from "@nestjs/throttler";
import { ApiResponse } from "./common/dto/response.dto";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @UseGuards(ThrottlerGuard)
  @Get()
  getHello(): ApiResponse<string> {
    const message = this.appService.getHello();
    return ApiResponse.success("Welcome to the API", message);
  }
}
