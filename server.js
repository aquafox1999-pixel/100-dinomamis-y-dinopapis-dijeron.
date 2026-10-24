'use strict';

const path = require('path');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const QRCode = require('qrcode');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_URL = (process.env.PUBLIC_URL || '').trim().replace(/\/+$/, '');
const WIN_SCORE = 300;
const TOTAL_ROUNDS = 6;
const ANSWERS_PER_ROUND = 5;

const ROUNDS = [
  {
    "question": "Menciona algo que un papá primerizo teme hacer por primera vez con el bebé.",
    "answers": [
      {
        "text": "Bañarlo",
        "points": 40
      },
      {
        "text": "Cambiarle el pañal",
        "points": 30
      },
      {
        "text": "Cargarlo (sentir que lo rompe)",
        "points": 15
      },
      {
        "text": "Vestirlo o meterle la cabeza en la ropa",
        "points": 10
      },
      {
        "text": "Cortarle las uñas",
        "points": 5
      }
    ]
  },
  {
    "question": "Menciona algo que nunca debe faltar en una pañalera bien equipada.",
    "answers": [
      {
        "text": "Pañales",
        "points": 45
      },
      {
        "text": "Toallitas húmedas",
        "points": 30
      },
      {
        "text": "Muda de ropa limpia",
        "points": 12
      },
      {
        "text": "Biberón o fórmula",
        "points": 8
      },
      {
        "text": "Pomada para rozaduras",
        "points": 5
      }
    ]
  },
  {
    "question": "¿Qué es lo primero que hace un papá cuando el bebé empieza a llorar sin parar?",
    "answers": [
      {
        "text": "Afectuosamente pasárselo a la mamá",
        "points": 42
      },
      {
        "text": "Mecerlo o arrullarlo",
        "points": 28
      },
      {
        "text": "Revisar si el pañal está sucio",
        "points": 15
      },
      {
        "text": "Ofrecerle el chupón o biberón",
        "points": 10
      },
      {
        "text": "Cantarle o hacer ruidos raros",
        "points": 5
      }
    ]
  },
  {
    "question": "Menciona un antojo clásico durante el embarazo.",
    "answers": [
      {
        "text": "Helado",
        "points": 38
      },
      {
        "text": "Chocolates o dulces",
        "points": 26
      },
      {
        "text": "Fruta con chile y limón",
        "points": 18
      },
      {
        "text": "Papas fritas o comida salada",
        "points": 12
      },
      {
        "text": "Pizzas o hamburguesas a medianoche",
        "points": 6
      }
    ]
  },
  {
    "question": "¿Qué es lo que más le preocupa a una mamá al preparar la maleta para el hospital?",
    "answers": [
      {
        "text": "Olvidar la ropa del bebé para salir",
        "points": 35
      },
      {
        "text": "Olvidar los documentos o identificación",
        "points": 28
      },
      {
        "text": "No llevar suficiente ropa cómoda para ella",
        "points": 18
      },
      {
        "text": "Olvidar el cargador del celular",
        "points": 11
      },
      {
        "text": "No llevar suficientes pañales de recién nacido",
        "points": 8
      }
    ]
  },
  {
    "question": "Menciona una frase típica que dice una abuela consentidora cuando ve al bebé.",
    "answers": [
      {
        "text": "\"Tiene hambre, dale de comer\"",
        "points": 40
      },
      {
        "text": "\"Tráelo para acá, no me lo dejes llorar\"",
        "points": 25
      },
      {
        "text": "\"¡Se parece igualito a su papá/mamá!\"",
        "points": 17
      },
      {
        "text": "\"Tiene frío, tápalo bien\"",
        "points": 12
      },
      {
        "text": "\"Conmigo no hace berrinches\"",
        "points": 6
      }
    ]
  },
  {
    "question": "¿Qué objeto o juguete compra un papá emocionado antes de que nazca el bebé?",
    "answers": [
      {
        "text": "Pelota de su equipo de fútbol favorito",
        "points": 36
      },
      {
        "text": "Carrito de juguete o de control remoto",
        "points": 28
      },
      {
        "text": "Ropa o camiseta deportiva en miniatura",
        "points": 18
      },
      {
        "text": "Peluche gigante",
        "points": 12
      },
      {
        "text": "Videojuego \"para cuando crezca\"",
        "points": 6
      }
    ]
  },
  {
    "question": "Menciona un motivo común por el cual el bebé se despierta a las 3:00 a.m.",
    "answers": [
      {
        "text": "Tiene hambre",
        "points": 48
      },
      {
        "text": "Tiene el pañal mojado o sucio",
        "points": 27
      },
      {
        "text": "Tiene gases o cólicos",
        "points": 13
      },
      {
        "text": "Perdió el chupón",
        "points": 8
      },
      {
        "text": "Quiere sentir los brazos de mamá",
        "points": 4
      }
    ]
  },
  {
    "question": "Menciona una palabra corta que los padres sueñan que sea la primera en decir el bebé.",
    "answers": [
      {
        "text": "Mamá",
        "points": 45
      },
      {
        "text": "Papá",
        "points": 40
      },
      {
        "text": "Agua",
        "points": 7
      },
      {
        "text": "Teta / Leche",
        "points": 5
      },
      {
        "text": "Hola",
        "points": 3
      }
    ]
  },
  {
    "question": "Menciona un síntoma típico que sufre la mujer en el primer trimestre de embarazo.",
    "answers": [
      {
        "text": "Náuseas o mareos matutinos",
        "points": 45
      },
      {
        "text": "Mucho sueño y cansancio",
        "points": 30
      },
      {
        "text": "Cambios repentinos de humor",
        "points": 12
      },
      {
        "text": "Asco a ciertos olores o comidas",
        "points": 8
      },
      {
        "text": "Sensibilidad en el pecho",
        "points": 5
      }
    ]
  },
  {
    "question": "Menciona algo que los papás dejan de hacer durante los primeros meses del bebé.",
    "answers": [
      {
        "text": "Dormir ocho horas seguidas",
        "points": 50
      },
      {
        "text": "Salir de fiesta o a cenar con amigos",
        "points": 25
      },
      {
        "text": "Ver películas o series completas de un tirón",
        "points": 12
      },
      {
        "text": "Tener tiempo a solas en pareja",
        "points": 8
      },
      {
        "text": "Mantener la casa impecable",
        "points": 5
      }
    ]
  },
  {
    "question": "Menciona algo que un invitado siempre regala en un baby shower.",
    "answers": [
      {
        "text": "Mamelucos o mamelucos con gorrito",
        "points": 42
      },
      {
        "text": "Paquetes de pañales",
        "points": 28
      },
      {
        "text": "Cobijitas o mantas recibidoras",
        "points": 15
      },
      {
        "text": "Biberones o chupones",
        "points": 10
      },
      {
        "text": "Sets de baño (jabón; crema; esponja)",
        "points": 5
      }
    ]
  },
  {
    "question": "Menciona algo inesperado que sucede durante la primera sesión de fotos del bebé.",
    "answers": [
      {
        "text": "Se orina o defeca en el fotógrafo o en los padres",
        "points": 46
      },
      {
        "text": "Se queda profundamente dormido y no abre los ojos",
        "points": 24
      },
      {
        "text": "Empieza a llorar inconsolablemente",
        "points": 16
      },
      {
        "text": "Tiene un ataque de hipo o gases",
        "points": 9
      },
      {
        "text": "Se le sale la leche o escupe",
        "points": 5
      }
    ]
  },
  {
    "question": "¿Qué es lo primero que hace la mamá al escuchar que el bebé llora por el monitor?",
    "answers": [
      {
        "text": "Levantarse corriendo de la cama",
        "points": 44
      },
      {
        "text": "Revisar la cámara o pantalla del monitor",
        "points": 28
      },
      {
        "text": "Despertar o codear al papá",
        "points": 14
      },
      {
        "text": "Mirar la hora en el celular",
        "points": 9
      },
      {
        "text": "Tapar al bebé rápidamente",
        "points": 5
      }
    ]
  },
  {
    "question": "Menciona algo que una persona no embarazada le dice a una futura mamá y la molesta.",
    "answers": [
      {
        "text": "\"¿Segura que no son gemelos?\"",
        "points": 38
      },
      {
        "text": "\"Aprovéchate a dormir todo lo que puedas\"",
        "points": 27
      },
      {
        "text": "\"Te ves muy cansada / hinchada\"",
        "points": 16
      },
      {
        "text": "\"¿Aún no nace? Ya te tardaste\"",
        "points": 12
      },
      {
        "text": "\"Te va a doler muchísimo el parto\"",
        "points": 7
      }
    ]
  },
  {
    "question": "Menciona un lugar de la casa donde los padres terminan guardando juguetes del bebé.",
    "answers": [
      {
        "text": "En medio de la sala",
        "points": 42
      },
      {
        "text": "En el dormitorio de los padres",
        "points": 26
      },
      {
        "text": "En la cocina o comedor",
        "points": 16
      },
      {
        "text": "En el baño",
        "points": 10
      },
      {
        "text": "En los pasillos",
        "points": 6
      }
    ]
  },
  {
    "question": "Menciona algo que el papá hace mientras espera en la sala del hospital durante el parto.",
    "answers": [
      {
        "text": "Caminar de un lado a otro desesperado",
        "points": 40
      },
      {
        "text": "Mandar mensajes por WhatsApp a la familia",
        "points": 30
      },
      {
        "text": "Morderse las uñas o frotarse las manos",
        "points": 15
      },
      {
        "text": "Revisar el reloj cada dos minutos",
        "points": 10
      },
      {
        "text": "Intentar tomar un café para calmar los nervios",
        "points": 5
      }
    ]
  },
  {
    "question": "Menciona una de las formas en que los mamás y papás intentan dormir a un bebé difícil.",
    "answers": [
      {
        "text": "Pasearlo en brazos mientras caminan por la casa",
        "points": 42
      },
      {
        "text": "Ponerle ruido blanco o el sonido de la secadora",
        "points": 24
      },
      {
        "text": "Pasearlo en la carriola o en el coche",
        "points": 16
      },
      {
        "text": "Cantarle una cuna en susurro",
        "points": 11
      },
      {
        "text": "Darle palmitas suaves en la espalda",
        "points": 7
      }
    ]
  },
  {
    "question": "Menciona lo primero que hacen los tíos al conocer al nuevo sobrino.",
    "answers": [
      {
        "text": "Tomarle fotos o grabar videos para las redes",
        "points": 42
      },
      {
        "text": "Pedir cargarlo inmediatamente",
        "points": 28
      },
      {
        "text": "Decir a quién se parece más",
        "points": 15
      },
      {
        "text": "Llevarle un peluche o regalo especial",
        "points": 10
      },
      {
        "text": "Hacerle caras o voces chistosas",
        "points": 5
      }
    ]
  },
  {
    "question": "Menciona algo que cambia drásticamente en el auto familiar cuando llega un bebé.",
    "answers": [
      {
        "text": "Instalar la silla de seguridad (car seat) atrás",
        "points": 44
      },
      {
        "text": "El maletero pasa a estar ocupado por la carriola",
        "points": 28
      },
      {
        "text": "El reproductor de música cambia a canciones infantiles",
        "points": 14
      },
      {
        "text": "Aparecen sombrillas para sol en las ventanas",
        "points": 9
      },
      {
        "text": "Quedan migajas o biberones en los asientos",
        "points": 5
      }
    ]
  },
  {
    "question": "Menciona un método casero tradicional para adivinar el sexo del bebé.",
    "answers": [
      {
        "text": "La forma o altura de la pancita de la mamá",
        "points": 42
      },
      {
        "text": "La prueba de la cadena o anillo sobre la panza",
        "points": 26
      },
      {
        "text": "Si la mamá tiene antojos dulces o salados",
        "points": 16
      },
      {
        "text": "La intensidad de las náuseas matutinas",
        "points": 10
      },
      {
        "text": "La frecuencia cardíaca en el ultrasonido",
        "points": 6
      }
    ]
  },
  {
    "question": "Menciona qué es lo primero que compra una pareja cuando se entera del embarazo.",
    "answers": [
      {
        "text": "La primera ropita o zapatitos de bebé",
        "points": 44
      },
      {
        "text": "Prueba de embarazo para confirmar (o guardar de recuerdo)",
        "points": 26
      },
      {
        "text": "Vitaminas o ácido fólico",
        "points": 15
      },
      {
        "text": "Un diario o libro de recuerdos del bebé",
        "points": 9
      },
      {
        "text": "La cuna o carriola",
        "points": 6
      }
    ]
  },
  {
    "question": "Menciona un mito o remedio casero para curar el hipo de un recién nacido.",
    "answers": [
      {
        "text": "Ponerle un hilo o bolita de algodón mojado en la frente",
        "points": 45
      },
      {
        "text": "Darle un sorbo de leche o amamantarlo",
        "points": 28
      },
      {
        "text": "Soplarle suavemente en la cara",
        "points": 12
      },
      {
        "text": "Taparle la cabecita con un gorro",
        "points": 9
      },
      {
        "text": "Cargarle en posición vertical",
        "points": 6
      }
    ]
  },
  {
    "question": "Menciona algo que los papás hacen para saber si la leche del biberón está a la temperatura correcta.",
    "answers": [
      {
        "text": "Echarse unas gotas en la muñeca",
        "points": 52
      },
      {
        "text": "Probar un sorbo directamente del biberón",
        "points": 22
      },
      {
        "text": "Tocar el costado del biberón con la mano",
        "points": 14
      },
      {
        "text": "Echarse unas gotas en el dorso de la mano",
        "points": 8
      },
      {
        "text": "Soplar el tetina antes de dárselo",
        "points": 4
      }
    ]
  },
  {
    "question": "Menciona un detalle tierno que emociona mucho a las mamás durante un ultrasonido.",
    "answers": [
      {
        "text": "Escuchar los latidos del corazón por primera vez",
        "points": 48
      },
      {
        "text": "Ver cómo se mueve o patalea en pantalla",
        "points": 26
      },
      {
        "text": "Ver la carita en 4D o 5D",
        "points": 14
      },
      {
        "text": "Ver cómo se chupa el dedo pulgar",
        "points": 8
      },
      {
        "text": "Descubrir finalmente el sexo del bebé",
        "points": 4
      }
    ]
  },
  {
    "question": "Menciona algo que el papá olvida hacer en el momento exacto en que empiezan las contracciones.",
    "answers": [
      {
        "text": "Agarrar la maleta para el hospital",
        "points": 38
      },
      {
        "text": "Encontrar las llaves del coche o la casa",
        "points": 28
      },
      {
        "text": "Mantener la calma y respirar profundo",
        "points": 18
      },
      {
        "text": "Avisar a los abuelos o familiares cercanos",
        "points": 11
      },
      {
        "text": "Ponerle gasolina al auto",
        "points": 5
      }
    ]
  },
  {
    "question": "Menciona qué hace un abuelo consentidor cuando el bebé no quiere dormirse.",
    "answers": [
      {
        "text": "Pasearlo paseando por toda la casa cargado",
        "points": 38
      },
      {
        "text": "Cantarle canciones o contarle historias viejas",
        "points": 27
      },
      {
        "text": "Ponerlo a ver la televisión en el sillón",
        "points": 16
      },
      {
        "text": "Pasearlo en el carrito por el patio o calle",
        "points": 12
      },
      {
        "text": "Dejar que juegue un rato más",
        "points": 7
      }
    ]
  },
  {
    "question": "Menciona un superpoder que toda mamá parece desarrollar cuando nace su bebé.",
    "answers": [
      {
        "text": "Oído ultra sensible para escuchar llantos a distancia",
        "points": 42
      },
      {
        "text": "Capacidad de hacer todo con una sola mano",
        "points": 28
      },
      {
        "text": "Predecir exactamente qué le duele o qué quiere el bebé",
        "points": 15
      },
      {
        "text": "Funcionar todo el día con solo dos horas de sueño",
        "points": 10
      },
      {
        "text": "Reflejos ninja para evitar que el bebé se caiga",
        "points": 5
      }
    ]
  },
  {
    "question": "Menciona qué hace un papá cuando le toca bañar al bebé por primera vez solo.",
    "answers": [
      {
        "text": "Verificar la temperatura del agua diez veces",
        "points": 40
      },
      {
        "text": "Tener diez toallas listas alrededor de la tina",
        "points": 25
      },
      {
        "text": "Pedirle a la mamá que lo supervise desde la puerta",
        "points": 18
      },
      {
        "text": "Sostener al bebé con ambas manos como si fuera de cristal",
        "points": 12
      },
      {
        "text": "Poner música relajante para calmar sus propios nervios",
        "points": 5
      }
    ]
  },
  {
    "question": "Menciona un deseo o sueño profundo que los padres tienen para el futuro de su bebé.",
    "answers": [
      {
        "text": "Que sea muy feliz y saludable en la vida",
        "points": 48
      },
      {
        "text": "Que logre todos sus sueños profesionales",
        "points": 24
      },
      {
        "text": "Que sea una persona buena y de gran corazón",
        "points": 16
      },
      {
        "text": "Que encuentre buenos amigos y amor verdadero",
        "points": 8
      },
      {
        "text": "Que siempre mantenga una relación cercana con la familia",
        "points": 4
      }
    ]
  }
];

function multiplierFor(round) {
  if (round === 3) return 2;
  if (round === 6) return 3;
  return 1;
}

function buildDeck(offset) {
  const deck = [];
  for (let index = 0; index < TOTAL_ROUNDS; index += 1) {
    deck.push((offset + index) % ROUNDS.length);
  }
  return deck;
}

function initialGame(offset) {
  return {
    phase: 'faceoff', round: 1, scores: { left: 0, right: 0 },
    control: null, faceoffWinner: null, strikes: 0,
    revealed: Array(ANSWERS_PER_ROUND).fill(false),
    bankAnswers: Array(ANSWERS_PER_ROUND).fill(false),
    scored: Array(TOTAL_ROUNDS + 1).fill(false),
    awards: {}, progress: {}, undoByRound: {},
    winner: null, reviewing: false, event: null,
    timerEnabled: false, timer: { remainingMs: 10000, deadline: null, running: false },
    deck: buildDeck(offset || 0)
  };
}

let deckOffset = 0;
let game = initialGame(deckOffset);
let eventId = 0;

function fire(kind, extra) {
  game.event = Object.assign({ id: ++eventId, kind: kind }, extra || {});
}

function notice(text) { fire('notice', { text: text }); }

function roundData(round) { return ROUNDS[game.deck[(round || game.round) - 1]]; }

function bank() {
  return roundData().answers.reduce(function (total, answer, index) {
    return total + (game.bankAnswers[index] ? answer.points : 0);
  }, 0) * multiplierFor(game.round);
}

function isScored() { return Boolean(game.scored[game.round]); }

function timerRemaining(now) {
  return game.timer.running ? Math.max(0, game.timer.deadline - (now || Date.now())) : game.timer.remainingMs;
}

function timerState() {
  const remaining = timerRemaining();
  return { enabled: game.timerEnabled, editable: !isScored() && !['roundEnd', 'gameOver'].includes(game.phase), running: game.timer.running && remaining > 0,
    remainingMs: remaining, seconds: Math.ceil(remaining / 1000) };
}

function pauseTimer() {
  game.timer.remainingMs = timerRemaining();
  game.timer.deadline = null;
  game.timer.running = false;
}

function resetTimer() {
  if (!game.timerEnabled || isScored() || !['faceoff', 'playing', 'steal'].includes(game.phase)) return;
  game.timer = { remainingMs: 10000, deadline: Date.now() + 10000, running: true };
}

function captureRound() {
  return {
    phase: game.phase, control: game.control, faceoffWinner: game.faceoffWinner,
    strikes: game.strikes, revealed: game.revealed.slice(), bankAnswers: game.bankAnswers.slice(),
    scored: isScored(), award: game.awards[game.round] ? Object.assign({}, game.awards[game.round]) : null,
    winner: game.winner, reviewing: game.reviewing,
    timer: { remainingMs: timerRemaining(), running: false, deadline: null }
  };
}

function saveCurrentRound() { game.progress[game.round] = captureRound(); }

function checkpoint() {
  const history = game.undoByRound[game.round] || (game.undoByRound[game.round] = []);
  history.push(captureRound());
  if (history.length > 100) history.shift();
}

function recalculateScores() {
  game.scores = { left: 0, right: 0 };
  Object.values(game.awards).forEach(function (award) { game.scores[award.side] += award.points; });
}

function restoreRound(snapshot) {
  game.phase = snapshot.phase;
  game.control = snapshot.control;
  game.faceoffWinner = snapshot.faceoffWinner;
  game.strikes = snapshot.strikes;
  game.revealed = snapshot.revealed.slice();
  game.bankAnswers = snapshot.bankAnswers.slice();
  game.scored[game.round] = snapshot.scored;
  if (snapshot.award) game.awards[game.round] = Object.assign({}, snapshot.award);
  else delete game.awards[game.round];
  game.winner = snapshot.winner;
  game.reviewing = snapshot.reviewing;
  game.timer = Object.assign({}, snapshot.timer);
  recalculateScores();
}

function awardTo(side) {
  if (!side || isScored()) return 0;
  const points = bank();
  game.awards[game.round] = { side: side, points: points };
  game.scored[game.round] = true;
  recalculateScores();
  return points;
}

function checkWin(extra) {
  const left = game.scores.left, right = game.scores.right;
  if (left < WIN_SCORE && right < WIN_SCORE) return false;
  game.winner = left === right ? 'tie' : left > right ? 'left' : 'right';
  game.phase = 'gameOver';
  pauseTimer();
  fire('win', Object.assign({ side: game.winner }, extra || {}));
  return true;
}

function endGame() {
  const left = game.scores.left, right = game.scores.right;
  game.winner = left === right ? 'tie' : left > right ? 'left' : 'right';
  game.phase = 'gameOver';
  pauseTimer();
  fire('win', { side: game.winner });
}

function resetRoundBoard() {
  game.revealed = Array(ANSWERS_PER_ROUND).fill(false);
  game.bankAnswers = Array(ANSWERS_PER_ROUND).fill(false);
  game.strikes = 0;
  game.control = null;
  game.faceoffWinner = null;
  game.winner = null;
  game.reviewing = false;
  game.timer = { remainingMs: 10000, deadline: null, running: false };
}

function startRound(round) {
  pauseTimer();
  saveCurrentRound();
  game.round = round;
  if (game.progress[round]) restoreRound(game.progress[round]);
  else { resetRoundBoard(); game.phase = 'faceoff'; }
}

function actionUndo() {
  const history = game.undoByRound[game.round];
  if (!history || !history.length) return notice('No hay cambios para deshacer en esta ronda.');
  restoreRound(history.pop());
  fire('restored', { round: game.round });
}

function actionFaceoff(side) {
  if (game.phase !== 'faceoff' || isScored()) return;
  checkpoint();
  game.faceoffWinner = side;
  game.control = side;
  game.phase = 'playing';
  fire('faceoff', { side: side });
  if (game.revealed.every(Boolean)) closeRound(side, 'bank');
}

function closeRound(side, kind, extra) {
  const points = awardTo(side);
  pauseTimer();
  fire(kind, Object.assign({ side: side, points: points }, extra || {}));
  const outcome = Object.assign({}, extra || {}, { stealResolved: kind === 'steal' || kind === 'steal-failed' });
  if (!checkWin(outcome)) game.phase = 'roundEnd';
}

function actionReveal(index) {
  if (!Number.isInteger(index) || index < 0 || index >= ANSWERS_PER_ROUND || game.revealed[index]) return;
  checkpoint();
  game.revealed[index] = true;
  if (isScored() || game.phase === 'roundEnd' || game.phase === 'gameOver') {
    game.reviewing = true;
    fire('reveal-final', { index: index });
    return; // La revelacion de cortesia no cambia el banco ni la puntuacion.
  }
  game.bankAnswers[index] = true;
  resetTimer();
  if (game.phase === 'steal') {
    closeRound(game.control === 'left' ? 'right' : 'left', 'steal', { sound: 'correct' });
    return;
  }
  fire('reveal', { index: index });
  if (game.phase === 'playing' && game.revealed.every(Boolean)) closeRound(game.control, 'bank');
}

function actionStrike() {
  if (!['faceoff', 'playing', 'steal'].includes(game.phase) || isScored()) return;
  checkpoint();
  resetTimer();
  if (game.phase === 'faceoff') { fire('faceoff-error'); return; }
  if (game.phase === 'steal') { closeRound(game.control, 'steal-failed', { sound: 'error' }); return; }
  game.strikes = Math.min(3, game.strikes + 1);
  if (game.strikes === 3) {
    game.phase = 'steal';
    fire('steal-ready', { side: game.control });
  } else fire('strike', { count: game.strikes });
}

function actionUnstrike() {
  if (!['playing', 'steal'].includes(game.phase) || isScored() || game.strikes === 0) return;
  checkpoint();
  game.strikes -= 1;
  game.phase = 'playing';
  fire('strike-undone', { count: game.strikes });
}

function actionSteal() { notice('Resuelve el robo con una respuesta (1-5) o con X si falla.'); }

function actionNext() {
  if (game.phase === 'gameOver') return notice('Partida terminada. Puedes revisar respuestas o volver a rondas anteriores.');
  if (!isScored()) {
    checkpoint();
    if (game.control) {
      closeRound(game.control, 'bank');
      if (game.phase === 'gameOver') return;
    } else {
      game.scored[game.round] = true;
      game.phase = 'roundEnd';
      pauseTimer();
    }
  }
  if (game.round >= TOTAL_ROUNDS) { endGame(); return; }
  startRound(game.round + 1);
  fire('round', { round: game.round });
}

function actionPrev() {
  if (game.round <= 1) return notice('Ya estas en la primera ronda.');
  startRound(game.round - 1);
  fire('round', { round: game.round });
}

function actionRestart() {
  if (isScored() || game.phase === 'gameOver') return notice('Ronda cerrada: usa DESHACER para corregirla.');
  checkpoint();
  resetRoundBoard();
  game.phase = 'faceoff';
  fire('round', { round: game.round });
}

function actionReset() {
  const timerEnabled = game.timerEnabled;
  deckOffset = (deckOffset + TOTAL_ROUNDS) % ROUNDS.length;
  game = initialGame(deckOffset);
  game.timerEnabled = timerEnabled;
  fire('reset');
}

function actionTimer(type, payload) {
  if (type === 'timer-toggle') {
    if (typeof payload.enabled !== 'boolean') return;
    game.timerEnabled = payload.enabled;
    pauseTimer();
    game.timer.remainingMs = 10000;
    return;
  }
  if (!game.timerEnabled || isScored() || ['roundEnd', 'gameOver'].includes(game.phase)) return;
  if (type === 'timer-pause') pauseTimer();
  if (type === 'timer-resume' && !game.timer.running && game.timer.remainingMs > 0) {
    game.timer.deadline = Date.now() + game.timer.remainingMs;
    game.timer.running = true;
  }
  if (type === 'timer-adjust' && [5, -5].includes(payload.seconds)) {
    game.timer.remainingMs = Math.max(0, Math.min(600000, timerRemaining() + payload.seconds * 1000));
    if (game.timer.running) game.timer.deadline = Date.now() + game.timer.remainingMs;
    if (game.timer.remainingMs === 0) pauseTimer();
  }
}

function stateFor(role) {
  const data = roundData();
  return {
    phase: game.phase, round: game.round, totalRounds: TOTAL_ROUNDS,
    multiplier: multiplierFor(game.round), scores: Object.assign({}, game.scores),
    control: game.control, faceoffWinner: game.faceoffWinner, strikes: game.strikes,
    winner: game.winner, reviewing: game.reviewing, scored: isScored(), bank: bank(),
    canUndo: Boolean((game.undoByRound[game.round] || []).length),
    awarded: game.awards[game.round] || null, timer: timerState(), winScore: WIN_SCORE,
    question: data.question,
    answers: data.answers.map(function (answer, index) {
      const visible = role === 'admin' || game.revealed[index];
      return { revealed: game.revealed[index], text: visible ? answer.text : null, points: visible ? answer.points : null };
    }),
    event: game.event
  };
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 20000
});

require('./cards')(app, io);

function publicBase(req) {
  if (PUBLIC_URL) return PUBLIC_URL;
  return req.protocol + '://' + req.get('host');
}

function broadcast() {
  io.to('admins').emit('state', stateFor('admin'));
  io.to('viewers').emit('state', stateFor('viewer'));
}

const timerInterval = setInterval(function () {
  if (!game.timerEnabled || !game.timer.running) return;
  if (timerRemaining() === 0) pauseTimer();
  io.emit('timer', timerState());
}, 250);
timerInterval.unref();
server.on('close', function () { clearInterval(timerInterval); });

function viewerCount() {
  const room = io.sockets.adapter.rooms.get('viewers');
  return room ? room.size : 0;
}

function emitPresence() {
  io.to('admins').emit('presence', { viewers: viewerCount() });
}

io.on('connection', function (socket) {
  socket.data.isAdmin = false;
  socket.join('viewers');
  socket.emit('state', stateFor('viewer'));
  emitPresence();

  socket.on('setAdmin', function () {
    socket.data.isAdmin = true;
    socket.leave('viewers');
    socket.join('admins');
    socket.emit('admin:ok');
    socket.emit('state', stateFor('admin'));
    emitPresence();
  });

  socket.on('action', function (payload) {
    if (!socket.data.isAdmin) return;
    const type = payload && payload.type;
    const side = payload && payload.side === 'right' ? 'right' : 'left';
    const index = payload && Number.isInteger(payload.index) ? payload.index : -1;

    switch (type) {
      case 'undo':
        actionUndo();
        break;
      case 'buzzer':
        fire('buzzer');
        break;
      case 'timer-toggle':
      case 'timer-pause':
      case 'timer-resume':
      case 'timer-adjust':
        actionTimer(type, payload);
        break;
      case 'reveal':
        actionReveal(index);
        break;
      case 'strike':
        actionStrike();
        break;
      case 'next':
        actionNext();
        break;
      case 'prev':
        actionPrev();
        break;
      case 'steal':
        actionSteal(side);
        break;
      case 'restart':
        actionRestart();
        break;
      case 'faceoff':
        actionFaceoff(side);
        break;
      case 'reset':
        actionReset();
        break;
      case 'unstrike':
        actionUnstrike();
        break;
      default:
        return;
    }
    saveCurrentRound();
    broadcast();
  });

  socket.on('disconnect', function () {
    emitPresence();
  });
});

app.get('/', function (req, res) {
  if (req.query.upload === 'true' || req.query.upload === '1') {
    return res.redirect('/upload');
  }
  const wantsAdmin = req.query.admin === 'true' || req.query.admin === '1';
  res.sendFile(path.join(__dirname, 'public', wantsAdmin ? 'index.html' : 'viewer.html'));
});

app.get('/admin', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/viewer', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

app.get('/healthz', function (req, res) {
  res.json({ ok: true, round: game.round, phase: game.phase });
});

app.get('/api/config', function (req, res) {
  const base = publicBase(req);
  res.set('Cache-Control', 'no-store');
  res.json({
    viewerUrl: base + '/',
    adminUrl: base + '/?admin=true'
  });
});

app.get('/api/qr.png', async function (req, res) {
  try {
    const base = publicBase(req);
    const target = req.query.target === 'admin' ? base + '/?admin=true' : base + '/';
    const buffer = await QRCode.toBuffer(target, {
      type: 'png',
      width: 640,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#081326', light: '#ffffff' }
    });
    res.type('png').set('Cache-Control', 'no-store').send(buffer);
  } catch (error) {
    res.status(500).end();
  }
});

app.use(express.static(path.join(__dirname, 'public'), { index: false, extensions: ['html'] }));

server.listen(PORT, '0.0.0.0', function () {
  console.log('Servidor listo en el puerto ' + PORT);
});
