import {
  users,
  families,
  students,
  courses,
  classes,
  grades,
  hours,
  settings,
  type User,
  type UpsertUser,
  type Family,
  type InsertFamily,
  type Student,
  type InsertStudent,
  type StudentWithFamily,
  type Course,
  type InsertCourse,
  type Class,
  type InsertClass,
  type Grade,
  type InsertGrade,
  type Hour,
  type InsertHour,
  type Settings,
  type InsertSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, count, sql, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Family operations
  getFamilies(): Promise<Family[]>;
  getFamily(id: number): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  updateFamily(id: number, family: Partial<InsertFamily>): Promise<Family>;
  deleteFamily(id: number): Promise<void>;
  searchFamilies(query: string): Promise<Family[]>;

  // Student operations
  getStudents(): Promise<StudentWithFamily[]>;
  getStudent(id: number): Promise<StudentWithFamily | undefined>;
  getStudentsByFamily(familyId: number): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: number): Promise<void>;
  searchStudents(query: string): Promise<StudentWithFamily[]>;

  // Course operations (for 7th grade and older)
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;
  searchCourses(query: string): Promise<Course[]>;

  // Class operations (for 6th grade and younger)
  getClasses(): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class>;
  deleteClass(id: number): Promise<void>;

  // Grade operations
  getGrades(): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;

  // Hour operations
  getHours(): Promise<Hour[]>;
  createHour(hour: InsertHour): Promise<Hour>;

  // Settings operations
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalFamilies: number;
    totalStudents: number;
    totalCourses: number;
    totalClasses: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Family operations
  async getFamilies(): Promise<Family[]> {
    return await db.select().from(families).orderBy(families.lastName);
  }

  async getFamily(id: number): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family;
  }

  async createFamily(family: InsertFamily): Promise<Family> {
    const [newFamily] = await db
      .insert(families)
      .values(family)
      .returning();
    return newFamily;
  }

  async updateFamily(id: number, family: Partial<InsertFamily>): Promise<Family> {
    const [updatedFamily] = await db
      .update(families)
      .set(family)
      .where(eq(families.id, id))
      .returning();
    return updatedFamily;
  }

  async deleteFamily(id: number): Promise<void> {
    await db.delete(families).where(eq(families.id, id));
  }

  async searchFamilies(query: string): Promise<Family[]> {
    return await db
      .select()
      .from(families)
      .where(
        sql`LOWER(${families.lastName}) LIKE LOWER(${'%' + query + '%'}) OR 
            LOWER(${families.father}) LIKE LOWER(${'%' + query + '%'}) OR
            LOWER(${families.mother}) LIKE LOWER(${'%' + query + '%'})`
      )
      .orderBy(families.lastName);
  }

  // Student operations
  async getStudents(): Promise<StudentWithFamily[]> {
    return await db
      .select({
        id: students.id,
        familyId: students.familyId,
        lastName: students.lastName,
        firstName: students.firstName,
        birthdate: students.birthdate,
        gradYear: students.gradYear,
        comment1: students.comment1,
        mathHour: students.mathHour,
        firstHour: students.firstHour,
        secondHour: students.secondHour,
        thirdHour: students.thirdHour,
        fourthHour: students.fourthHour,
        fifthHourFall: students.fifthHourFall,
        fifthHourSpring: students.fifthHourSpring,
        fridayScience: students.fridayScience,
        family: families,
      })
      .from(students)
      .innerJoin(families, eq(students.familyId, families.id))
      .orderBy(students.lastName, students.firstName);
  }

  async getStudent(id: number): Promise<StudentWithFamily | undefined> {
    const [student] = await db
      .select({
        id: students.id,
        familyId: students.familyId,
        lastName: students.lastName,
        firstName: students.firstName,
        birthdate: students.birthdate,
        gradYear: students.gradYear,
        comment1: students.comment1,
        mathHour: students.mathHour,
        firstHour: students.firstHour,
        secondHour: students.secondHour,
        thirdHour: students.thirdHour,
        fourthHour: students.fourthHour,
        fifthHourFall: students.fifthHourFall,
        fifthHourSpring: students.fifthHourSpring,
        fridayScience: students.fridayScience,
        family: families,
      })
      .from(students)
      .innerJoin(families, eq(students.familyId, families.id))
      .where(eq(students.id, id));
    return student;
  }

  async getStudentsByFamily(familyId: number): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(eq(students.familyId, familyId))
      .orderBy(students.firstName);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db
      .insert(students)
      .values(student)
      .returning();
    return newStudent;
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student> {
    const [updatedStudent] = await db
      .update(students)
      .set(student)
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  async searchStudents(query: string): Promise<StudentWithFamily[]> {
    return await db
      .select({
        id: students.id,
        familyId: students.familyId,
        lastName: students.lastName,
        firstName: students.firstName,
        birthdate: students.birthdate,
        gradYear: students.gradYear,
        comment1: students.comment1,
        mathHour: students.mathHour,
        firstHour: students.firstHour,
        secondHour: students.secondHour,
        thirdHour: students.thirdHour,
        fourthHour: students.fourthHour,
        fifthHourFall: students.fifthHourFall,
        fifthHourSpring: students.fifthHourSpring,
        fridayScience: students.fridayScience,
        family: families,
      })
      .from(students)
      .innerJoin(families, eq(students.familyId, families.id))
      .where(
        sql`LOWER(${students.firstName}) LIKE LOWER(${'%' + query + '%'}) OR 
            LOWER(${students.lastName}) LIKE LOWER(${'%' + query + '%'})`
      )
      .orderBy(students.lastName, students.firstName);
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(courses.courseName);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db
      .insert(courses)
      .values(course)
      .returning();
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course> {
    const [updatedCourse] = await db
      .update(courses)
      .set(course)
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async searchCourses(query: string): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(
        sql`LOWER(${courses.courseName}) LIKE LOWER(${'%' + query + '%'}) OR 
            LOWER(${courses.location}) LIKE LOWER(${'%' + query + '%'})`
      )
      .orderBy(courses.courseName);
  }

  // Class operations
  async getClasses(): Promise<Class[]> {
    return await db.select().from(classes).orderBy(classes.className);
  }

  async getClass(id: number): Promise<Class | undefined> {
    const [classData] = await db.select().from(classes).where(eq(classes.id, id));
    return classData;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [newClass] = await db
      .insert(classes)
      .values(classData)
      .returning();
    return newClass;
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class> {
    const [updatedClass] = await db
      .update(classes)
      .set(classData)
      .where(eq(classes.id, id))
      .returning();
    return updatedClass;
  }

  async deleteClass(id: number): Promise<void> {
    await db.delete(classes).where(eq(classes.id, id));
  }

  // Grade operations
  async getGrades(): Promise<Grade[]> {
    return await db.select().from(grades).orderBy(grades.code);
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const [newGrade] = await db
      .insert(grades)
      .values(grade)
      .returning();
    return newGrade;
  }

  // Hour operations
  async getHours(): Promise<Hour[]> {
    return await db.select().from(hours).orderBy(hours.id);
  }

  async createHour(hour: InsertHour): Promise<Hour> {
    const [newHour] = await db
      .insert(hours)
      .values(hour)
      .returning();
    return newHour;
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    const [settings_data] = await db.select().from(settings).limit(1);
    return settings_data;
  }

  async updateSettings(settingsData: Partial<InsertSettings>): Promise<Settings> {
    // Try to update first
    const [updatedSettings] = await db
      .update(settings)
      .set(settingsData)
      .returning();
    
    // If no rows were updated, insert a new record
    if (!updatedSettings) {
      const [newSettings] = await db
        .insert(settings)
        .values(settingsData as InsertSettings)
        .returning();
      return newSettings;
    }
    
    return updatedSettings;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalFamilies: number;
    totalStudents: number;
    totalCourses: number;
    totalClasses: number;
  }> {
    const [familyCount] = await db
      .select({ count: count() })
      .from(families);

    const [studentCount] = await db
      .select({ count: count() })
      .from(students);

    const [courseCount] = await db
      .select({ count: count() })
      .from(courses);

    const [classCount] = await db
      .select({ count: count() })
      .from(classes);

    return {
      totalFamilies: familyCount.count,
      totalStudents: studentCount.count,
      totalCourses: courseCount.count,
      totalClasses: classCount.count,
    };
  }
}

export const storage = new DatabaseStorage();