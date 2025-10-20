import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const supabase = this.databaseService.getClient();
      
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginDto.email,
        password: loginDto.password,
      });

      if (error || !data.user) {
        this.logger.error('Authentication failed:', error?.message);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Create JWT payload
      const payload: JwtPayload = {
        sub: data.user.id,
        email: data.user.email!,
        role: data.user.user_metadata?.role || 'user',
      };

      // Generate tokens
      const access_token = this.jwtService.sign(payload);
      const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

      return {
        access_token,
        refresh_token,
        expires_in: this.configService.get<number>('jwt.expiresIn') || 3600,
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: payload.role,
        },
      };
    } catch (error) {
      this.logger.error('Login error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      // Validate user still exists
      const user = await this.validateUser(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const access_token = this.jwtService.sign(newPayload);
      const refresh_token = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      return {
        access_token,
        refresh_token,
        expires_in: this.configService.get<number>('jwt.expiresIn') || 3600,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error('Token refresh error:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string): Promise<any> {
    try {
      const supabase = this.databaseService.getAdminClient();
      
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      
      if (error || !data.user) {
        this.logger.error('User validation failed:', error?.message);
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user',
      };
    } catch (error) {
      this.logger.error('User validation error:', error);
      return null;
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      const supabase = this.databaseService.getAdminClient();
      await supabase.auth.admin.signOut(userId);
      this.logger.log(`User ${userId} logged out successfully`);
    } catch (error) {
      this.logger.error('Logout error:', error);
      // Don't throw error for logout failures
    }
  }
}