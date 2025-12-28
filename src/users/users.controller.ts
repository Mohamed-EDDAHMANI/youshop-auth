import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @MessagePattern('auth/register')
    async register(data: { body: CreateUserDto }) {
        return this.usersService.register(data.body);
    }

    @MessagePattern('auth/login')
    async login(data: { body: LoginDto }) {
        return this.usersService.login(data.body);
    }

    @MessagePattern('auth/refresh')
    async refresh(data: { body: { refreshToken: string } }) {
        return this.usersService.refresh(data.body.refreshToken);
    }
}