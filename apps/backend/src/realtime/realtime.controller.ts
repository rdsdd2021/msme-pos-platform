import {
  Controller,
  Sse,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { RealtimeEventsService, RealtimeEvent } from './realtime-events.service';
import { TenantGuard } from '../tenants/guards/tenant.guard';

export interface SseMessageEvent {
  data: RealtimeEvent;
}

@ApiTags('realtime')
@Controller({ path: 'tenants/:tenantId/events', version: '1' })
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth('access-token')
@ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeEventsService) {}

  @Sse()
  @ApiOperation({
    summary: 'Server-Sent Events (SSE) live event stream for the authenticated tenant',
  })
  streamEvents(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ): Observable<SseMessageEvent> {
    return this.realtimeService.getTenantEventStream(tenantId);
  }
}

