import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { TokenService } from '../auth/token.service';
import { User } from './entities/user.entity';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from './dto/enums/user-role.enum';
import { ServiceError } from '../common/exceptions';
import { Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(
        private readonly config: ConfigService,
        private readonly tokenService: TokenService,
        private readonly prisma: PrismaService,
    ) { }

    async register(dto: CreateUserDto) {
        try {
            if (!dto.email || !dto.password || !dto.fullName) {
                return new ServiceError('VALIDATION_ERROR', 'Missing required fields', 400, 'auth-service', { fields: ['email', 'password', 'fullName'] });
            }

            const existing = await this.findByEmail(dto.email);
            if (existing) {
                return new ServiceError('CONFLICT', 'Email already in use', 409, 'auth-service', { field: 'email' });
            }

            const passwordHash = await bcrypt.hash(dto.password, 10);
            const refreshToken = this.tokenService.generateRefreshToken({ sub: dto.email });
            const role = dto.role as UserRole || 'CLIENT';

            const user = await this.prisma.user.create({
                data: { email: dto.email, fullName: dto.fullName, passwordHash, role, refreshToken },
            });

            const accessToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email, role: user.role });
            return {
                success: true,
                user: { id: user.id, email: user.email, name: user.fullName, role: user.role },
                accessToken,
                refreshToken,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return new ServiceError('INTERNAL_SERVER_ERROR', error?.message || 'Failed to register user', 500, 'auth-service');
        }
    }

    async login(dto: LoginDto) {
        try {
            if (!dto.email || !dto.password) {
                return new ServiceError('VALIDATION_ERROR', 'Missing required fields', 400, 'auth-service', { fields: ['email', 'password'] });
            }

            const user: User | null = await this.findByEmail(dto.email);
            if (!user) {
                return new ServiceError('NOT_FOUND', 'User not found', 404, 'auth-service');
            }

            const valid = await bcrypt.compare(dto.password, user.passwordHash);
            if (!valid) {
                return new ServiceError('UNAUTHORIZED', 'Invalid credentials', 401, 'auth-service');
            }

            const accessToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email, role: user.role });
            this.logger.debug(`-----------------------------------------------------`);
            this.logger.debug(`Generated access token for user ${JSON.stringify(user)}: ${accessToken}`);
            return {
                success: true,
                user: { id: user.id, email: user.email, name: user.fullName, role: user.role },
                accessToken,
                refreshToken: user.refreshToken,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return new ServiceError('INTERNAL_SERVER_ERROR', error?.message || 'Failed to login', 500, 'auth-service');
        }
    }

    async logout(userId: string, res: any) {
        try {
            if (!userId) {
                return new ServiceError('VALIDATION_ERROR', 'User ID is required', 400, 'auth-service');
            }

            await this.prisma.user.update({
                where: { id: userId },
                data: { refreshToken: null },
            });
            res.clearCookie('refreshToken');
            return {
                success: true,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return new ServiceError('INTERNAL_SERVER_ERROR', error?.message || 'Failed to logout', 500, 'auth-service');
        }
    }

    async refresh(refreshToken: string) {
        try {
            if (!refreshToken) {
                return new ServiceError('VALIDATION_ERROR', 'Refresh token is required', 400, 'auth-service');
            }

            const user = await this.prisma.user.findFirst({ where: { refreshToken } });
            if (!user) {
                return new ServiceError('NOT_FOUND', 'Invalid refresh token', 404, 'auth-service');
            }

            const accessToken = this.tokenService.generateAccessToken({ sub: user.id, email: user.email, role: user.role });
            return {
                success: true,
                accessToken,
                refreshToken: user.refreshToken,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return new ServiceError('INTERNAL_SERVER_ERROR', error?.message || 'Failed to refresh token', 500, 'auth-service');
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        try {
            const user = await this.prisma.user.findUnique({ where: { email } });
            return user as User | null;
        } catch (error) {
            return null;
        }
    }
}
