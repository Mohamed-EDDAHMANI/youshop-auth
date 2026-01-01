import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RpcException } from '@nestjs/microservices';

export const ValidatedBody = (DtoClass: new () => any) =>
  createParamDecorator(
    async (_: unknown, context: ExecutionContext) => {
      const data = context.switchToRpc().getData();

      if (!data?.body) {
        throw new RpcException('Body is missing');
      }

      const dto = plainToInstance(DtoClass, data.body);

      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = errors
          .map(e => e.constraints ? Object.values(e.constraints) : [])
          .flat();

        throw new RpcException({
          status: 400,
          message: messages.join('#'),
        });
      }

      return dto;
    },
  )();
