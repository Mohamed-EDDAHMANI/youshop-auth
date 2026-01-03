import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    this.logger.error(`Error caught: ${JSON.stringify(exception)}`);
    
    // If it's a ServiceError, convert to JSON before wrapping
    if (exception?.toJSON) {
      const errorResponse = exception.toJSON();
      this.logger.error(`Error caught: ${JSON.stringify(errorResponse)}`);
      throw errorResponse; // Throw the plain object, not wrapped in RpcException
    }
    
    throw new RpcException(exception);
  }
}
