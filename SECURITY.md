# Política de seguridad

## Reportar una vulnerabilidad

Si encuentras una vulnerabilidad en Sentio, **no abras un issue ni un pull request público**.
Escríbenos a **eduardoportillo138@gmail.com** con el asunto `[SEGURIDAD] <resumen breve>` e incluye:

- Descripción del problema y su impacto (qué datos o acciones quedan expuestos).
- Pasos para reproducirlo (petición GraphQL, evento de Socket.IO, versión de la app, etc.).
- Cualquier prueba de concepto, registro o captura que ayude a confirmarlo.

No incluyas datos personales reales de otros usuarios. Si los necesitas para demostrar el
problema, descríbelos sin copiarlos.

## Qué puedes esperar

| Plazo           | Compromiso                                  |
| --------------- | ------------------------------------------- |
| 3 días hábiles  | Confirmación de recepción.                  |
| 10 días hábiles | Evaluación inicial y severidad estimada.    |
| Según severidad | Corrección, y aviso cuando esté desplegada. |

Te pedimos que no divulgues la vulnerabilidad hasta que esté corregida o hayan pasado 90 días
desde el reporte, lo que ocurra primero. Si el problema afecta datos personales, lo tratamos
además conforme a la LFPDPPP y al Aviso de Privacidad.

## Alcance

- API (`apps/api`): GraphQL, Socket.IO, autenticación y sesiones, permisos de grupos.
- Clientes web (`apps/web`) y móvil (`apps/mobile`).
- Paquetes compartidos (`packages/*`).

Quedan fuera del alcance los ataques de denegación de servicio por volumen, la ingeniería
social y los problemas en servicios de terceros que no dependan de nuestra configuración.

## Versiones con soporte

El proyecto aún no tiene versiones publicadas: solo se da soporte a la rama `main`.
