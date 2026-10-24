# Controles del animador

- **INICIAR / F2:** prepara la ronda. Puedes revelar con 1-5 y asignar el control
  manualmente con DINOMAMIS (A) o DINOPAPIS (L).
- **X / espacio:** durante cara a cara solo suena el error; en juego agrega una
  equis; con tres equis, una X adicional cierra el robo a favor del equipo original.
- **1-5 durante robo:** el rival gana el banco, incluida la respuesta acertada.
- **1-5 despues del cierre:** muestra respuestas restantes sin modificar banco ni
  puntajes. Tambien funciona al terminar la partida.
- **Enter / SIGUIENTE RONDA:** avanza sin tener que revelar lo que falta.
- **Flecha arriba / RONDA ANTERIOR:** vuelve al tablero guardado de esa ronda.
- **DESHACER / VOLVER AL PROGRESO:** deshace la ultima accion de la ronda actual,
  incluidas revelaciones, X, seleccion del equipo, reinicios y entregas de puntos.
  Puedes pulsarlo varias veces. Los puntajes de otras rondas se conservan.
- **CHICHARRA:** reproduce un zumbido largo en ambas pantallas, sin cambiar puntos,
  equis ni el cronometro. Se genera con Web Audio; no requiere `buzzer.mp3`.

El progreso y el historial de cada ronda se conservan en memoria durante la
partida, incluso si recargas el navegador. REINICIAR JUEGO o reiniciar el servidor
comienza una partida nueva.

## Cronometro

Activa **CRONOMETRO ON / OFF** para usar los 10 segundos. Cada respuesta acertada o
X reinicia la cuenta mientras la ronda esta abierta. PAUSAR / REANUDAR y +5s / -5s
permiten controlarla manualmente. En cero se detiene sin marcar X ni dar puntos.
Al cerrar una ronda se pausa. Las revelaciones finales no lo reinician.

Al navegar o deshacer, el tiempo se restaura pausado con los segundos guardados;
pulsa REANUDAR si quieres seguir. El servidor controla la cuenta y la transmite a
ambas pantallas. Una pantalla que se reconecta recibe el tiempo actual.

Para habilitar los sonidos, toca una vez cada pantalla. En invitados, deja
**Sonido: ON**. Esto incluye la chicharra y los sonidos habituales.

## Comprobaciones

`npm test` comprueba puntuacion, revelaciones finales, robo, historial por ronda,
deshacer, cronometro y subidas autenticadas con proxy HTTPS. Las pruebas de subida
usan archivos temporales y no modifican las tarjetas del evento.

La configuracion de Railway y de las subidas esta en `TARJETAS.md`.
