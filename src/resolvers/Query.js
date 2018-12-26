function getAllCards(parent, args, context, info) {
  return context.db.query.cards()
}

async function constructRandomizedDeckInstances(parent, args, context, info) {
  // permuted all cards, creates an array of CardInstances, ready to be fed to a drawDeck create mutation
  let deck = await context.db.query.cards();
  const len = deck.length;
  let output = [];
  let limit;
  let rand;
  for (let i = 0; i < len; i++) {
    limit = len - i;
    rand = Math.floor(Math.random() * limit);
    const card = deck[rand];
    const instance = {
      orderIndex: i,
      card: { connect: { id: card.id }}
    }
    output.push(instance);
  }
  return output;
}

function getPlayerHand(parent, args, context, info) {
  let hand;
  if (args.player == 1) { hand = "player1Hand" }
  else { hand = "player2Hand" }
  return context.db.query.rounds({
    where: {
      id: args.id
    }
  }, info)
}

async function getCurrentRound(parent, args, context, info) {
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
        roundNumInGame
        player1Score
        player1Hand { id color cardType expeditionValue }
        player1Tableau { id color cardType expeditionValue }
        player2Score
        player2Hand { id color cardType expeditionValue }
        player2Tableau { id color cardType expeditionValue }
        discardPile { orderIndex card { id color cardType expeditionValue } }
      }
    }`)
  });
  return roundQuery[0].rounds[0];
}

module.exports = {
  getAllCards,
  constructRandomizedDeckInstances,
  getPlayerHand,
  getCurrentRound,
}
