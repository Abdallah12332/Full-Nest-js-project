import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";

@Injectable()
export class CachService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async set(key: string, value: any) {
    await this.cache.set(key, value);
  }

  async get<T>(key: string): Promise<T | null> {
    return (await this.cache.get(key)) as T;
  }

  async del(key: string) {
    await this.cache.del(key);
  }
}
