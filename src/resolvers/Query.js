function getAllCards(parent, args, context, info) {
  return context.db.query.cards()
}

async function getPlayerHand(parent, args, context, info) {
  if (args.currentPlayer == 1) {
    player = "inPlayer1Hand";
  } else {
    player = "inPlayer2Hand";
  }
  const query = await context.db.query.rounds({
    where: {id: args.roundId},
  }, `{
    cards(where: {${player}: true}) {
      id
      updatedAt
      ${player}
      card {
        id
        color
        cardType
        expeditionValue
      }
    }
  }`);
  // console.log(query);
  return query[0].cards;
}

async function getCurrentRoundIdFromGame(parent, args, context, info) {
  const output = await context.db.query.game({where: { id: args.gameId }}, `{
    id
    currentRound
    rounds {
      id
      roundNumInGame
    }
  }`);
  let id;
  output.rounds.forEach(round => {
    if (output.currentRound == round.roundNumInGame) {
      console.log("HIT. RoundNumInGame: ", round.roundNumInGame);
      id = round.id;
    }
  })
  return id;
}

async function getRound(parent, args, context, info) {
  // ARGS: roundId
  const output = await context.db.query.rounds({where: { id: args.roundId }}, info);
  return output[0];
}

module.exports = {
  getAllCards,
  getPlayerHand,
  getCurrentRoundIdFromGame,
  getRound,
}
