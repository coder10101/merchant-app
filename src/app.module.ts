import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ApplicationsModule } from './applications/applications.module';
import { RiskModule } from './risk/risk.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule, ApplicationsModule, RiskModule, AuditModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
