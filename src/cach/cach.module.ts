import { Module } from "@nestjs/common";
import { CachService } from "./cach.service";

@Module({
  providers: [CachService],
  exports: [CachService],
})
export class CachModule {}
