import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { type Observable, Subject } from 'rxjs';
import { type SessionRevokeReason } from './schemas/session.schema';

export interface SessionsRevokedEvent {
  userId: string;
  sessionIds: string[];
  reason: SessionRevokeReason;
}

/**
 * Bus en proceso de eventos de sesión. Lo publica SessionsService y lo consume el gateway de
 * Socket.IO, sin que AuthModule tenga que depender de GatewaysModule.
 */
@Injectable()
export class SessionEvents implements OnModuleDestroy {
  private readonly revokedSubject = new Subject<SessionsRevokedEvent>();

  readonly revoked$: Observable<SessionsRevokedEvent> = this.revokedSubject.asObservable();

  emitRevoked(event: SessionsRevokedEvent): void {
    if (event.sessionIds.length > 0) this.revokedSubject.next(event);
  }

  onModuleDestroy(): void {
    this.revokedSubject.complete();
  }
}
