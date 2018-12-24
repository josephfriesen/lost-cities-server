const { getAllCards } = require('./Query');
const { testHand, testTableau } = require('../models/hands');

// sortCardsByColorAndValue will take an array of card objects as argument and return an array of those same cards sorted first by color, then by expeditionValue (investment cards first)
function sortCardsByColorAndValue(arr) {
  const colorSort = ["RED", "GREEN", "WHITE", "BLUE", "YELLOW"];
  arr.sort(function(a,b) {
    if (colorSort.indexOf(a.color) < colorSort.indexOf(b.color)) { return -1 }
    else if (colorSort.indexOf(a.color) > colorSort.indexOf(b.color)) { return 1 }

    if (a.cardType == "INVESTMENT") { return -1 }
    else if (b.cardType == "INVESTMENT") { return 1 }

    if (a.expeditionValue < b.expeditionValue) { return -1 }
    else { return 1 }
  })
  return arr;
}

// dealFullHand will take an array of (shuffled) cards and will return an eight card array of the first eight cards in the deck. **This will mutate the original deck**.
function dealCards(deck, n) {
  return deck.splice(0,n);
}

// INPUTS: arr - an array of CardInstances
// OUTPUT: output - an array of objects of type { connnect: { id: ID } } where the ID is the card ID we want to associate with a particular card stack
function getCardIdsFromConstructedInstances(arr) {
  let output = [];
  for (let i = 0; i < arr.length; i++) {
    output.push({id: arr[i].card.connect.id});
  }
  return output;
}

// INPUT: arr - an array of card objects (either a player tableau or a discard pile)
// OUTPUT: arr - an array of 5 arrays of card objects, each sub-array consisting of all cards in argument array of a given color
function sortCardsIntoColorPiles(arr) {
  const colors = [
    {color: "RED", index: 0},
    {color: "GREEN", index: 1},
    {color: "WHITE", index: 2},
    {color: "BLUE", index: 3},
    {color: "YELLOW", index: 4}
  ]
  let output = [ [], [], [], [], [] ];
  arr.forEach(card => {
    colors.forEach(color => {
      if (card.color == color.color) {
        output[color.index].push(card);
      }
    })
  })
  return output;
}

// INPUT: An array of card objects consisting of a single color (a single expedition played to a tableau) - [Card]
// OUTPUT: The score value of that expedition - int
function getColorScore(cards) {
  if (cards.length == 0) {
    return 0;
  }
  else {
    let sum = 0;
    let cost = -20;
    let multiplier = 1;
    cards.forEach(card => {
      if (card.cardType == "INVESTMENT") { multiplier = multiplier + 1; }
      else { sum = sum + card.expeditionValue; }
    })
    let score = (sum + cost) * multiplier;
    if (cards.length >= 8) { score = score + 20; }
    return score;
  }
}

// INPUT: arr - a tableau of cards [[Card]]
// OUTPUT: the score value of that entire tableau - int
function getRoundScore(arr) {
  let score = 0;
  const hand = sortCardsIntoColorPiles(arr);
  hand.forEach(pile => {
    score = score + getColorScore(pile);
  })
  return score;
}

console.log(getRoundScore(testTableau));

module.exports = {
  sortCardsByColorAndValue,
  dealCards,
  getCardIdsFromConstructedInstances,
  sortCardsIntoColorPiles,
  getColorScore,
  getRoundScore,
}
