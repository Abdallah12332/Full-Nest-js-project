import { Test, TestingModule } from "@nestjs/testing";
import { CachService } from "./cach.service";
import { CacheModule } from "@nestjs/cache-manager";

describe("CachService", () => {
  let service: CachService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [CachService],
    }).compile();

    service = module.get<CachService>(CachService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
