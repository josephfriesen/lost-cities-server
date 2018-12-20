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

module.exports = {
  getAllCards,
  constructRandomizedDeckInstances,
  getPlayerHand,
}
