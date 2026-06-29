import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 100 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  chips: integer("chips").default(10000),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: varchar("id", { length: 20 }).primaryKey(),
  hostId: integer("host_id").references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  maxPlayers: integer("max_players").default(6),
  buyin: integer("buyin").default(1000),
  blindSmall: integer('blind_small').default(5), 
  blindBig: integer('blind_big').default(10),       
  status: varchar("status", { length: 20 }).default("waiting"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameHistory = pgTable("game_history", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 20 }).references(() => rooms.id),
  playerId: integer("player_id").references(() => users.id),
  handNumber: integer("hand_number"),
  result: varchar("result", { length: 20 }),
  chipDelta: integer("chip_delta"),
  finalPot: integer("final_pot"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const activeSessions = pgTable("active_sessions", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 20 }).references(() => rooms.id),
  userId: integer("user_id").references(() => users.id),
  currentChips: integer("current_chips"),
  seatNumber: integer("seat_number"),
  joinedAt: timestamp("joined_at").defaultNow(),
});
