import {
  users,
  families,
  students,
  courses,
  enrollments,
  invoices,
  invoiceItems,
  type User,
  type UpsertUser,
  type Family,
  type InsertFamily,
  type Student,
  type InsertStudent,
  type StudentWithFamily,
  type Course,
  type InsertCourse,
  type Enrollment,
  type InsertEnrollment,
  type EnrollmentWithDetails,
  type Invoice,
  type InsertInvoice,
  type InvoiceWithDetails,
  type InvoiceItem,
  type InsertInvoiceItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, like, or, count } from "drizzle-orm";

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

  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;
  searchCourses(query: string): Promise<Course[]>;

  // Enrollment operations
  getEnrollments(): Promise<EnrollmentWithDetails[]>;
  getEnrollment(id: number): Promise<EnrollmentWithDetails | undefined>;
  getEnrollmentsByStudent(studentId: number): Promise<EnrollmentWithDetails[]>;
  getEnrollmentsByCourse(courseId: number): Promise<EnrollmentWithDetails[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<InsertEnrollment>): Promise<Enrollment>;
  deleteEnrollment(id: number): Promise<void>;

  // Invoice operations
  getInvoices(): Promise<InvoiceWithDetails[]>;
  getInvoice(id: number): Promise<InvoiceWithDetails | undefined>;
  getInvoicesByFamily(familyId: number): Promise<InvoiceWithDetails[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: number): Promise<void>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem>;
  deleteInvoiceItem(id: number): Promise<void>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalFamilies: number;
    activeStudents: number;
    availableCourses: number;
    pendingInvoices: number;
  }>;

  // Recent activity
  getRecentEnrollments(limit?: number): Promise<EnrollmentWithDetails[]>;
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
    return await db
      .select()
      .from(families)
      .orderBy(desc(families.createdAt));
  }

  async getFamily(id: number): Promise<Family | undefined> {
    const [family] = await db
      .select()
      .from(families)
      .where(eq(families.id, id));
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
      .set({ ...family, updatedAt: new Date() })
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
        or(
          like(families.name, `%${query}%`),
          like(families.primaryContact, `%${query}%`),
          like(families.email, `%${query}%`)
        )
      )
      .orderBy(desc(families.createdAt));
  }

  // Student operations
  async getStudents(): Promise<StudentWithFamily[]> {
    return await db
      .select()
      .from(students)
      .leftJoin(families, eq(students.familyId, families.id))
      .orderBy(desc(students.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.students,
          family: row.families!
        }))
      );
  }

  async getStudent(id: number): Promise<StudentWithFamily | undefined> {
    const [result] = await db
      .select()
      .from(students)
      .leftJoin(families, eq(students.familyId, families.id))
      .where(eq(students.id, id));

    if (!result) return undefined;

    return {
      ...result.students,
      family: result.families!
    };
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
      .set({ ...student, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  async searchStudents(query: string): Promise<StudentWithFamily[]> {
    return await db
      .select()
      .from(students)
      .leftJoin(families, eq(students.familyId, families.id))
      .where(
        or(
          like(students.firstName, `%${query}%`),
          like(students.lastName, `%${query}%`),
          like(families.name, `%${query}%`)
        )
      )
      .orderBy(desc(students.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.students,
          family: row.families!
        }))
      );
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .orderBy(desc(courses.createdAt));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, id));
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
      .set({ ...course, updatedAt: new Date() })
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
        or(
          like(courses.name, `%${query}%`),
          like(courses.instructor, `%${query}%`),
          like(courses.subject, `%${query}%`)
        )
      )
      .orderBy(desc(courses.createdAt));
  }

  // Enrollment operations
  async getEnrollments(): Promise<EnrollmentWithDetails[]> {
    return await db
      .select()
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(families, eq(students.familyId, families.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .orderBy(desc(enrollments.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.enrollments,
          student: {
            ...row.students!,
            family: row.families!
          },
          course: row.courses!
        }))
      );
  }

  async getEnrollment(id: number): Promise<EnrollmentWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(families, eq(students.familyId, families.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.id, id));

    if (!result) return undefined;

    return {
      ...result.enrollments,
      student: {
        ...result.students!,
        family: result.families!
      },
      course: result.courses!
    };
  }

  async getEnrollmentsByStudent(studentId: number): Promise<EnrollmentWithDetails[]> {
    return await db
      .select()
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(families, eq(students.familyId, families.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, studentId))
      .orderBy(desc(enrollments.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.enrollments,
          student: {
            ...row.students!,
            family: row.families!
          },
          course: row.courses!
        }))
      );
  }

  async getEnrollmentsByCourse(courseId: number): Promise<EnrollmentWithDetails[]> {
    return await db
      .select()
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(families, eq(students.familyId, families.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.courseId, courseId))
      .orderBy(desc(enrollments.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.enrollments,
          student: {
            ...row.students!,
            family: row.families!
          },
          course: row.courses!
        }))
      );
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db
      .insert(enrollments)
      .values(enrollment)
      .returning();
    return newEnrollment;
  }

  async updateEnrollment(id: number, enrollment: Partial<InsertEnrollment>): Promise<Enrollment> {
    const [updatedEnrollment] = await db
      .update(enrollments)
      .set({ ...enrollment, updatedAt: new Date() })
      .where(eq(enrollments.id, id))
      .returning();
    return updatedEnrollment;
  }

  async deleteEnrollment(id: number): Promise<void> {
    await db.delete(enrollments).where(eq(enrollments.id, id));
  }

  // Invoice operations
  async getInvoices(): Promise<InvoiceWithDetails[]> {
    const invoiceResults = await db
      .select()
      .from(invoices)
      .leftJoin(families, eq(invoices.familyId, families.id))
      .orderBy(desc(invoices.createdAt));

    const invoicesWithDetails: InvoiceWithDetails[] = [];

    for (const result of invoiceResults) {
      const items = await db
        .select()
        .from(invoiceItems)
        .leftJoin(courses, eq(invoiceItems.courseId, courses.id))
        .where(eq(invoiceItems.invoiceId, result.invoices.id));

      invoicesWithDetails.push({
        ...result.invoices,
        family: result.families!,
        items: items.map(item => ({
          ...item.invoice_items,
          course: item.courses || undefined
        }))
      });
    }

    return invoicesWithDetails;
  }

  async getInvoice(id: number): Promise<InvoiceWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(invoices)
      .leftJoin(families, eq(invoices.familyId, families.id))
      .where(eq(invoices.id, id));

    if (!result) return undefined;

    const items = await db
      .select()
      .from(invoiceItems)
      .leftJoin(courses, eq(invoiceItems.courseId, courses.id))
      .where(eq(invoiceItems.invoiceId, id));

    return {
      ...result.invoices,
      family: result.families!,
      items: items.map(item => ({
        ...item.invoice_items,
        course: item.courses || undefined
      }))
    };
  }

  async getInvoicesByFamily(familyId: number): Promise<InvoiceWithDetails[]> {
    const invoiceResults = await db
      .select()
      .from(invoices)
      .leftJoin(families, eq(invoices.familyId, families.id))
      .where(eq(invoices.familyId, familyId))
      .orderBy(desc(invoices.createdAt));

    const invoicesWithDetails: InvoiceWithDetails[] = [];

    for (const result of invoiceResults) {
      const items = await db
        .select()
        .from(invoiceItems)
        .leftJoin(courses, eq(invoiceItems.courseId, courses.id))
        .where(eq(invoiceItems.invoiceId, result.invoices.id));

      invoicesWithDetails.push({
        ...result.invoices,
        family: result.families!,
        items: items.map(item => ({
          ...item.invoice_items,
          course: item.courses || undefined
        }))
      });
    }

    return invoicesWithDetails;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [newItem] = await db
      .insert(invoiceItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
    const [updatedItem] = await db
      .update(invoiceItems)
      .set(item)
      .where(eq(invoiceItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInvoiceItem(id: number): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalFamilies: number;
    activeStudents: number;
    availableCourses: number;
    pendingInvoices: number;
  }> {
    const [familyCount] = await db
      .select({ count: count() })
      .from(families);

    const [studentCount] = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.active, true));

    const [courseCount] = await db
      .select({ count: count() })
      .from(courses)
      .where(eq(courses.active, true));

    const [invoiceCount] = await db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.status, "pending"));

    return {
      totalFamilies: familyCount.count,
      activeStudents: studentCount.count,
      availableCourses: courseCount.count,
      pendingInvoices: invoiceCount.count,
    };
  }

  // Recent activity
  async getRecentEnrollments(limit: number = 10): Promise<EnrollmentWithDetails[]> {
    return await db
      .select()
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(families, eq(students.familyId, families.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .orderBy(desc(enrollments.createdAt))
      .limit(limit)
      .then(rows => 
        rows.map(row => ({
          ...row.enrollments,
          student: {
            ...row.students!,
            family: row.families!
          },
          course: row.courses!
        }))
      );
  }
}

export const storage = new DatabaseStorage();
