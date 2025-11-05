import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Log } from "../entities/Log.entity";
import { Repository } from "typeorm";
@Injectable()
export class LogService {
  constructor(
    @InjectRepository(Log) private readonly logRepo: Repository<Log>,
  ) {}
  async log(message: string, context?: string) {
    await this.logRepo.save({ level: "info", message, context });
  }
  async error(message: string, trace?: string, context?: string) {
    await this.logRepo.save({
      level: "error",
      message: `${message} ${trace || ""}`,
      context,
    });
  }
  async warn(message: string, context?: string) {
    await this.logRepo.save({ level: "warn", message, context });
  }
  async getlog(take: number, skip: number) {
    return await this.logRepo.find({
      take,
      skip,
      order: { timestamp: "DESC" },
    });
  }
}
