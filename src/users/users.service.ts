import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { TokenService } from '../auth/token.service';
import { User } from './entities/user.entity';
import { Role } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(
        private readonly config: ConfigService,
        private readonly tokenService: TokenService,
        private readonly prisma: PrismaService,
    ) { }

    async register(dto: CreateUserDto) {
        const existing = await this.findByEmail(dto.email);
        if (existing) throw new ConflictException('Email already in use');

        const passwordHash = await bcrypt.hash(dto.password, 10);
        const refreshToken = this.tokenService.generateRefreshToken({ sub: dto.email });

        // Convert dto.role (UserRole) to Prisma Role
        const prismaRole = dto.role as Role;
        // console.log('prismaRole:  '+ prismaRole);

        // Save user with passwordHash and refreshToken
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                fullName: dto.fullName,
                passwordHash,
                role: dto.role as Role,
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
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        const accessToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email });
        return {
            success: true,
            user: { id: user.id, email: user.email, name: user.fullName },
            accessToken,
            refreshToken: user.refreshToken,
        };
    }

    async refresh(refreshToken: string) {
        const user = await this.prisma.user.findFirst({ where: { refreshToken } });
        if (!user) throw new UnauthorizedException('Invalid refresh token');

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