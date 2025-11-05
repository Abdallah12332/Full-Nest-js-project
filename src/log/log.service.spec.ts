import { Test, TestingModule } from "@nestjs/testing";
import { LogService } from "./log.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Log } from "../entities/Log.entity";

describe("LogService", () => {
  let service: LogService;
  let logRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogService,
        {
          provide: getRepositoryToken(Log),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LogService>(LogService);
    logRepo = module.get(getRepositoryToken(Log));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("log()", () => {
    it("should save info log", async () => {
      logRepo.save.mockResolvedValue({});
      await service.log("Test message", "TestContext");
      expect(logRepo.save).toHaveBeenCalledWith({
        level: "info",
        message: "Test message",
        context: "TestContext",
      });
    });
  });

  describe("error()", () => {
    it("should save error log with trace", async () => {
      logRepo.save.mockResolvedValue({});
      await service.error("Error occurred", "trace123", "ErrorContext");
      expect(logRepo.save).toHaveBeenCalledWith({
        level: "error",
        message: "Error occurred trace123",
        context: "ErrorContext",
      });
    });

    it("should save error log without trace", async () => {
      logRepo.save.mockResolvedValue({});
      await service.error("Error only");
      expect(logRepo.save).toHaveBeenCalledWith({
        level: "error",
        message: "Error only ",
        context: undefined,
      });
    });
  });

  describe("warn()", () => {
    it("should save warning log", async () => {
      logRepo.save.mockResolvedValue({});
      await service.warn("Warning message", "WarnContext");
      expect(logRepo.save).toHaveBeenCalledWith({
        level: "warn",
        message: "Warning message",
        context: "WarnContext",
      });
    });
  });

  describe("getlog()", () => {
    it("should return logs from repo", async () => {
      const mockLogs = [{ id: 1, message: "test" }];
      logRepo.find.mockResolvedValue(mockLogs);

      const result = await service.getlog(10, 0);
      expect(logRepo.find).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        order: { timestamp: "DESC" },
      });
      expect(result).toBe(mockLogs);
    });
  });
});
