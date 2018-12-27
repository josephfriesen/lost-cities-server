const { getAllCards, constructRandomizedDeckInstances, getCurrentRound } = require('./Query');
const { sortCardsByColorAndValue, dealCards, getCardIdsFromConstructedInstances, getColorScore, getRoundScore, shuffle } = require('./GameFunctions');
const { players } = require('../models/players');

// This function will query the database to get all sixty cards, and create an array of sixth cardInstance objects in random order. Their createdAt timestamp will determine the order of the draw deck.
// ARGS: round ID
// 1) query DB to get all cards
// 2) create array of card instances in random order
// 3) call DB createCardInstances mutation
// 4) update round ID with cardInstances array
async function createCardInstances(parent, args, context, info) {
  let deck = await context.db.query.cards();
  deck = shuffle(deck);
  const instances = deck.map(card => {
    return { card: { connect: { id: card.id } } }
  });
  const roundUpdateInput = {
    cards: { create: instances }
  };
  return context.db.mutation.updateRound({
    data: roundUpdateInput,
    where: { id: args.roundId }
  }, info)
}

function newPlayer(parent, args, context, info) {
  return context.db.mutation.createPlayer({
    data: { ...args }
  }, info)
}

async function generateRoundInput(parent, args, context, info) {
  const deck = await constructRandomizedDeckInstances(parent, args, context, info);
  const player1Hand = getCardIdsFromConstructedInstances(dealCards(deck, 8));
  const player2Hand = getCardIdsFromConstructedInstances(dealCards(deck, 8));
  const roundCreateInput = {
    drawDeck: { create: deck },
    player1Hand: { connect: player1Hand },
    player2Hand: { connect: player2Hand },
    player1Tableau: [],
    player2Tableau: [],
    discardPile: [],
    player1Score: 0,
    player2Score: 0,
  };
  return roundCreateInput;
}

async function newGame(parent, args, context, info) {
  const rounds = [];
  for (let i = 1; i <= args.roundsNum; i++) {
    let round = await generateRoundInput(parent, args, context, info);
    round.roundNumInGame = i;
    if (i == 1) {
      round.currentPlayer = 1;
    }
    rounds.push(round);
  }
  const input = {
    data: {
      roundsNum: args.roundsNum,
      player1Score: 0,
      player2Score: 0,
      currentRound: 1,
      gameInProgress: true,
      player1: { connect: { id: args.player1 } },
      player2: { connect: { id: args.player2 } },
      rounds: { create: rounds }
    }
  }
  return context.db.mutation.createGame(input, info);
}

async function playACardToTableau(parent, args, context, info) {
  let player;
  let roundNum;
  const roundQuery = await context.db.query.games({ where: { id: args.gameId } },
  `{
    currentPlayer
    currentRound
  }`).then(response => {
    player = response[0].currentPlayer;
    roundNum = response[0].currentRound;
    return context.db.query.games({ where: { id: args.gameId } },
    `{
      rounds(where: { roundNumInGame: ${roundNum} }) {
        id
        player1Hand { id color cardType expeditionValue }
        player1Tableau { id color cardType expeditionValue }
        player2Hand { id color cardType expeditionValue }
        player2Tableau { id color cardType expeditionValue }
      }
    }`)
  });
  let round = roundQuery[0].rounds[0];
  const cardUpdate = [ { id: args.cardId } ];
  const handUpdate = { disconnect: cardUpdate };
  const tableauUpdate = { connect: cardUpdate };
  let roundUpdateInput;

  if (player == 1) {
    round.player1Hand.forEach(testCard => {
      if (testCard.id == args.cardId) {
        round.player1Tableau.push(testCard);
      }
    })
    const newPlayer1Score = getRoundScore(round.player1Tableau);
    updateRoundInput = {
      player1Score: newPlayer1Score,
      player1Hand: handUpdate,
      player1Tableau: tableauUpdate
    }
  } else {
    round.player2Hand.forEach(testCard => {
      if (testCard.id == args.cardId) {
        round.player2Tableau.push(testCard)
      }
    })
    const newPlayer2Score = getRoundScore(round.player2Tableau);
    updateRoundInput = {
      player2Score: newPlayer2Score,
      player2Hand: handUpdate,
      player2Tableau: tableauUpdate
    }
  }

  return context.db.mutation.updateRound({
    data: updateRoundInput,
    where: { id: round.id }
  }, info);
}

async function discardACard(parent, args, context, info) {
  let player;
  let roundNum;
  const roundQuery = await context.db.query.games({ where: { id: args.gameId } },
  `{
    currentPlayer
    currentRound
  }`).then(response => {
    player = response[0].currentPlayer;
    roundNum = response[0].currentRound;
    return context.db.query.games({ where: { id: args.gameId } },
    `{
      rounds(where: { roundNumInGame: ${roundNum} }) {
        id
        player1Hand { id color cardType expeditionValue }
        player2Hand { id color cardType expeditionValue }
        discardPile { orderIndex card { id color cardType expeditionValue } }
      }
    }`)
  });
  let round = roundQuery[0].rounds[0];
  const index = round.discardPile.length;
  const discardUpdate = { create: [ { orderIndex: index, card: { connect: { id: args.cardId } } } ] };
  const handUpdate = { disconnect: { id: cardId } }
  let updateRoundInput;
  if (player == 1) {
    updateRoundInput = {
      player1Hand: handUpdate,
      discardPile: discardUpdate
    }
  } else {
    updateRoundInput = {
      player2Hand: handUpdate,
      discardPile: discardUpdate
    }
  }
  return context.db.mutation.updateRound({
    data: updateRoundInput,
    where: { id: round.id }
  }, info);
}

module.exports = {
  createCardInstances,
  newPlayer,
  generateRoundInput,
  newGame,
  playACardToTableau,
  discardACard,
}
