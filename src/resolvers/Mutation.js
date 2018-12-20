const { getAllCards, constructRandomizedDeckInstances } = require('./Query');
const { sortCardsByColorAndValue, dealCards, getCardIdsFromConstructedInstances } = require('./GameFunctions');
const { players } = require('../models/players');

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
  // ARGS:
  // gameId
  // player: Int equal to 1 or 2
  // currentRound:
  // cardToPlay
  // OUTPUT: context.db.mutation.updateRound(input, info)
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
        player2Tableau { id color cardType expeditionValue }
        player2Hand { id color cardType expeditionValue }
        player2Tableau { id color cardType expeditionValue }
      }
    }`)
  });
  let round = roundQuery[0].rounds[0];
  let hand;
  let handKey;
  let tableau;
  let tableauKey;
  if (player == 1) {
    hand = round.player1Hand;
    handKey = "player1Hand";
    tableau = round.player1Tableau;
    tableauKey = "player1Tableau";
  } else {
    hand = round.player2Hand;
    handKey = "player2Hand";
    tableau = round.player2Tableau;
    tableauKey = "player2Tableau";
  }
  hand.filter(card => {return (card.id !== args.cardToPlay)})
  console.log("After filtering, the hand is now: ", hand);
  return null;
}

module.exports = {
  newPlayer,
  newGame,
  generateRoundInput,
  playACardToTableau,
}
