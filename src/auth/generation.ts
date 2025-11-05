import { randomInt } from "crypto";

export function generation(): { num: string; expiresAt: Date } {
  const n = randomInt(0, 1_000_000);
  const num = n.toString().padStart(6, "0");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // بعد 15 دقيقة
  return { num, expiresAt };
}
