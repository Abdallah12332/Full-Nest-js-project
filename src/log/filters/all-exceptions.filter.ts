import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { LogService } from "../log.service";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly dbLogger: LogService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : String(exception);

    // Try to persist the error to DB, but don't let logging failures
    // prevent returning a response to the client.
    try {
      await this.dbLogger.error(
        `${request.method} ${request.url} | ${message}`,
        exception instanceof Error ? exception.stack : undefined,
        "GlobalException",
      );
    } catch (logErr) {
      // Logging should never crash the exception flow. Fallback to console.
      // Keep this minimal to avoid leaking sensitive info in production logs.

      console.error("Failed to write error log to DB:", logErr);
    }

    // Always attempt to send a response. Guard against response errors too.
    try {
      response.status(status).json({
        statusCode: status,
        message:
          exception instanceof HttpException
            ? exception.getResponse()
            : "internal server error",
      });
    } catch (resErr) {
      // If even sending response fails, log to console so the process won't
      // silently drop the request (helps debugging "Empty reply from server").

      console.error("Failed to send error response:", resErr);
    }
  }
}
