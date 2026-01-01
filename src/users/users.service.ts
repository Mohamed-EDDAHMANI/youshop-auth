import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { TokenService } from '../auth/token.service';
import { User } from './entities/user.entity';
import { PrismaService } from '../prisma/prisma.service';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class UsersService {
    constructor(
        private readonly config: ConfigService,
        private readonly tokenService: TokenService,
        private readonly prisma: PrismaService,
    ) { }

    async register(dto: CreateUserDto) {

        const existing = await this.findByEmail(dto.email);
        if (existing) throw new RpcException({ status: 409, message: 'Email already in use' });

        const passwordHash = await bcrypt.hash(dto.password, 10);
        const refreshToken = this.tokenService.generateRefreshToken({ sub: dto.email });

        // Save user with passwordHash and refreshToken
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                fullName: dto.fullName,
                passwordHash,
                role: 'CLIENT',
                refreshToken,
            },
        });

        const accessToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email });
        return {
            success: true,
            user: { id: user.id, email: user.email, name: user.fullName },
            accessToken,
            refreshToken,
        };
    }

    async login(dto: LoginDto) {
        // Find user (replace with your user repo logic)
        const user: User | null = await this.findByEmail(dto.email);
        if (!user) throw new RpcException({ status: 409, message: 'User not found' });

        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) throw new RpcException({ status: 409, message: 'User not found' });

        const accessToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email });
        return {
            success: true,
            user: { id: user.id, email: user.email, name: user.fullName },
            accessToken,
            refreshToken: user.refreshToken,
        };
    }

    async logout(userId: string , res: any) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
        res.clearCookie('refreshToken');
        return { success: true };
    }

    async refresh(refreshToken: string) {
        const user = await this.prisma.user.findFirst({ where: { refreshToken } });
        if (!user) throw new RpcException({ status: 409, message: 'Invalid refresh token' });

        const accessToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email });
        return {
            accessToken,
            // refreshToken: newRefreshToken
        };
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        return user as User | null;
    }
}