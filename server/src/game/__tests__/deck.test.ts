import { Deck } from "../deck";

describe("Deck", () => {
  it("should create a deck with 52 cards", () => {
    const deck = new Deck();
    expect(deck.remaining()).toBe(52);
  });

  it("should draw a card", () => {
    const deck = new Deck();
    const card = deck.draw();
    expect(card).toBeDefined();
    expect(deck.remaining()).toBe(51);
  });

  it("should draw multiple cards", () => {
    const deck = new Deck();
    const cards = deck.drawMultiple(5);
    expect(cards.length).toBe(5);
    expect(deck.remaining()).toBe(47);
  });

  it("should throw error when deck is empty", () => {
    const deck = new Deck();
    for (let i = 0; i < 52; i++) deck.draw();
    expect(() => deck.draw()).toThrow(/deck is empty/i);
  });

  it("should reset deck", () => {
    const deck = new Deck();
    deck.drawMultiple(10);
    expect(deck.remaining()).toBe(42);
    deck.reset();
    expect(deck.remaining()).toBe(52);
  });
});
