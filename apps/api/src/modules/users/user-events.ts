import { Injectable } from '@nestjs/common';
import { type Observable, Subject } from 'rxjs';

/** Cambió algún dato público del usuario que se copia en otros documentos (autor de posts). */
export interface ProfileChangedEvent {
  userId: string;
}

/**
 * Eventos del dominio de usuarios. Otros módulos se suscriben (p. ej. posts, para actualizar
 * la copia del autor) sin que UsersModule dependa de ellos.
 */
@Injectable()
export class UserEvents {
  private readonly profileChangedSubject = new Subject<ProfileChangedEvent>();

  get profileChanged$(): Observable<ProfileChangedEvent> {
    return this.profileChangedSubject.asObservable();
  }

  profileChanged(userId: string): void {
    this.profileChangedSubject.next({ userId });
  }
}
