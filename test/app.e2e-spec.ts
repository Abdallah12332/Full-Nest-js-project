import { AppService } from "../src/app.service";
import { Test, TestingModule } from "@nestjs/testing";

describe("AppService.getHello", () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });
  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
