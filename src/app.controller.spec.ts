import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ThrottlerGuard } from "@nestjs/throttler";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: "THROTTLER:MODULE_OPTIONS",
          useValue: {},
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    appController = app.get<AppController>(AppController);
  });

  describe("root", () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toEqual(
        expect.objectContaining({
          success: true,
          message: "Welcome to the API",
          data: "wait, you should not be here",
        }),
      );
    });
  });
});
