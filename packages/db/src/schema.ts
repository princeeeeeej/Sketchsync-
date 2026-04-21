
import { relations } from "drizzle-orm";
import { integer, json, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email:     varchar("email", { length: 255 }).notNull().unique(),
  password:  text("password").notNull(),
  name:      text("name").notNull(),
  photo:     text("photo").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const rooms = pgTable("rooms",{
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  adminId: text("admin_id").notNull().references(() => users.id),
})

export const roomMembers = pgTable("room_members", {
  id:       serial("id").primaryKey(),
  roomId:   integer("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }), // ← integer
  userId:   text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
})

export const canvasSnapshots = pgTable("canvas_snapshots", {
  id:        serial("id").primaryKey(),
  roomId:    integer("room_id").notNull().unique().references(() => rooms.id, { onDelete: "cascade" }), // ← integer + unique
  data:      json("data").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const usersRelations = relations(users, ({many}) => ({
  rooms: many(rooms),
  roomMembers: many(roomMembers)
}))

export const roomsRelations = relations(rooms, ({one, many}) => ({
  admin: one(users, { fields: [rooms.adminId], references: [users.id]}),
  members: many(roomMembers),
  snapshots: many(canvasSnapshots)
}))

export const roomMembersRelations= relations(roomMembers, ({one}) => ({
  room: one(rooms, {fields: [roomMembers.roomId], references: [rooms.id]}),
  user: one(users, {fields: [roomMembers.userId], references: [users.id]})
}))

export const canvasSnapshotsRelations = relations(canvasSnapshots, ({one}) => ({
  room: one(rooms, {fields: [canvasSnapshots.roomId], references: [rooms.id]})
}))