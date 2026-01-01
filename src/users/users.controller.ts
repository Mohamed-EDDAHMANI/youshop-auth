import { Controller, BadRequestException, Res, Req } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ValidatedBody } from '../common/decorators/validated-body.decorator';

@Controller()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @MessagePattern('auth/register')
    async register(@ValidatedBody(CreateUserDto) dto: CreateUserDto) {
        return this.usersService.register(dto);
    }

    @MessagePattern('auth/login')
    async login(@ValidatedBody(LoginDto) dto: LoginDto) {
        return this.usersService.login(dto);
    }

    @MessagePattern('auth/logout')
    async logout(@Req() req, @Res() res) {
        return this.usersService.logout(req.user.id, res);
    }

    @MessagePattern('auth/refresh')
    async refresh(data: { body: { refreshToken: string } }) {
        return this.usersService.refresh(data.body.refreshToken);
    }
}