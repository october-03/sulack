import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HealthResponseDto, HelloResponseDto } from './app.dto';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get welcome message' })
  @ApiOkResponse({ type: HelloResponseDto })
  getHello() {
    return HelloResponseDto.from(this.appService.getHello());
  }

  @Get('health')
  @ApiOperation({ summary: 'Check API health status' })
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth() {
    return HealthResponseDto.from(this.appService.getHealth());
  }
}
