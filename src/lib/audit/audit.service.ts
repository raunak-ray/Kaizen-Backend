import { logger } from "@config/logger";
import { AUDIT_EVENTS, type AuditEvent } from "./audit.types";

/**
 * Extension point: today this just logs. When background workers exist,
 * swap the implementation assigned to `auditService` (e.g. one that
 * publishes to a BullMQ queue for Redis-backed processing or email
 * notifications) — callers depend only on this interface, so no call sites
 * need to change.
 */
export interface AuditLogger {
  log(event: AuditEvent): void;
}

class PinoAuditLogger implements AuditLogger {
  log({ event, userId, ip, metadata }: AuditEvent): void {
    const { name, level } = AUDIT_EVENTS[event];
    logger[level]({ audit: true, event: name, userId, ip, ...metadata }, name);
  }
}

export const auditService: AuditLogger = new PinoAuditLogger();
