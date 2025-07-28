import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin users table for credential-based authentication
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").notNull().default("admin"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Parent users table to link families with authentication
export const parentUsers = pgTable("parent_users", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  username: varchar("username").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  email: varchar("email").unique().notNull(),
  role: varchar("role").notNull().default("parent"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Settings table - key-value pairs for better extensibility
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: varchar("value"),
  description: varchar("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grade table - maps grade names to codes (including negative codes for preschool)
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  gradeName: varchar("grade_name", { length: 50 }).notNull(),
  code: integer("code").notNull(),
});

// Hour table - names of class periods (1st, 2nd, 3rd, etc.)
export const hours = pgTable("hours", {
  id: serial("id").primaryKey(),
  description: varchar("description", { length: 50 }).notNull(),
});

// Family table - matches your existing structure
export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  father: varchar("father", { length: 255 }),
  mother: varchar("mother", { length: 255 }),
  parentCell: varchar("parent_cell", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  zip: varchar("zip", { length: 10 }),
  homePhone: varchar("home_phone", { length: 20 }),
  parentCell2: varchar("parent_cell2", { length: 20 }),
  secondEmail: varchar("second_email", { length: 255 }),
  workPhone: varchar("work_phone", { length: 20 }),
  church: varchar("church", { length: 255 }),
  pastorName: varchar("pastor_name", { length: 255 }),
  pastorPhone: varchar("pastor_phone", { length: 20 }),
  active: boolean("active").default(true),
});

// Former Families table - families no longer part of CHEC Portal
export const formerFamilies = pgTable("former_families", {
  id: serial("id").primaryKey(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  father: varchar("father", { length: 255 }),
  mother: varchar("mother", { length: 255 }),
  parentCell: varchar("parent_cell", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  zip: varchar("zip", { length: 10 }),
  homePhone: varchar("home_phone", { length: 20 }),
  parentCell2: varchar("parent_cell2", { length: 20 }),
  field1: varchar("field1", { length: 255 }),
  workPhone: varchar("work_phone", { length: 20 }),
  church: varchar("church", { length: 255 }),
  pastorName: varchar("pastor_name", { length: 255 }),
  pastorPhone: varchar("pastor_phone", { length: 20 }),
});

// Class table - for elementary students (6th grade and younger)
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  className: varchar("class_name", { length: 255 }).notNull(),
  startCode: integer("start_code"),
  endCode: integer("end_code"),
});

// Course table - for secondary students (7th grade and older)
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  courseName: varchar("course_name", { length: 255 }).notNull(),
  fromGrade: integer("from_grade"),
  toGrade: integer("to_grade"),
  offeredFall: boolean("offered_fall").default(true),
  offeredSpring: boolean("offered_spring").default(true),
  hour: integer("hour"),
  fee: decimal("fee", { precision: 10, scale: 2 }),
  bookRental: decimal("book_rental", { precision: 10, scale: 2 }),
  location: varchar("location", { length: 255 }),
});

// Student table with denormalized schedule - matches your existing structure
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  birthdate: timestamp("birthdate"),
  gradYear: varchar("grad_year", { length: 10 }),
  comment1: text("comment1"),
  mathHour: varchar("math_hour", { length: 255 }),
  firstHour: varchar("first_hour", { length: 255 }),
  secondHour: varchar("second_hour", { length: 255 }),
  thirdHour: varchar("third_hour", { length: 255 }),
  thirdHour2: varchar("third_hour_2", { length: 255 }),
  fourthHour: varchar("fourth_hour", { length: 255 }),
  fifthHourFall: varchar("fifth_hour_fall", { length: 255 }),
  fifthHourSpring: varchar("fifth_hour_spring", { length: 255 }),
  fifthHour2: varchar("fifth_hour_2", { length: 255 }),
  inactive: boolean("inactive").default(false),
  registeredOn: timestamp("registered_on"),
});

// Relations
export const familiesRelations = relations(families, ({ many }) => ({
  students: many(students),
}));

export const studentsRelations = relations(students, ({ one }) => ({
  family: one(families, {
    fields: [students.familyId],
    references: [families.id],
  }),
}));

export const coursesRelations = relations(courses, ({ one }) => ({
  hour: one(hours, {
    fields: [courses.hour],
    references: [hours.id],
  }),
  fromGradeRef: one(grades, {
    fields: [courses.fromGrade],
    references: [grades.code],
  }),
  toGradeRef: one(grades, {
    fields: [courses.toGrade],
    references: [grades.code],
  }),
}));

export const classesRelations = relations(classes, ({ one, one: startGrade, one: endGrade }) => ({
  startGrade: one(grades, {
    fields: [classes.startCode],
    references: [grades.code],
  }),
  endGrade: one(grades, {
    fields: [classes.endCode],
    references: [grades.code],
  }),
}));

// Insert schemas
export const insertFamilySchema = createInsertSchema(families).omit({
  id: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
});

export const insertHourSchema = createInsertSchema(hours).omit({
  id: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

export type ParentUser = typeof parentUsers.$inferSelect;
export type InsertParentUser = typeof parentUsers.$inferInsert;

export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type Family = typeof families.$inferSelect;

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof grades.$inferSelect;

export type InsertHour = z.infer<typeof insertHourSchema>;
export type Hour = typeof hours.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type FormerFamily = typeof formerFamilies.$inferSelect;

// Extended types with relations
export type StudentWithFamily = Student & {
  family: Family;
};
