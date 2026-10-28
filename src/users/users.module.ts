import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthConfigModule } from '../auth/auth-config.module';
import { BaseServiceModule } from '../commons/service/base-service.module';
import { PasswordService } from './password.service';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), BaseServiceModule, AuthConfigModule],
  providers: [UsersService, PasswordService],
  controllers: [UsersController],
  exports: [UsersService, PasswordService],
})
export class UsersModule {}
