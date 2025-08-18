import {
  users,
  adminUsers,
  parentUsers,
  families,
  students,
  courses,
  classes,
  grades,
  hours,
  settings,
  payments,
  billAdjustments,
  type User,
  type UpsertUser,
  type AdminUser,
  type InsertAdminUser,
  type ParentUser,
  type InsertParentUser,
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
  type Payment,
  type InsertPayment,
  type BillAdjustment,
  type InsertBillAdjustment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, count, sql, and, isNull, not, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Admin user operations
  getAdminUsers(): Promise<AdminUser[]>;
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: number, user: Partial<InsertAdminUser>): Promise<AdminUser>;
  deleteAdminUser(id: number): Promise<void>;

  // Parent user operations
  getParentUsers(): Promise<ParentUser[]>;
  getParentUser(id: number): Promise<ParentUser | undefined>;
  getParentUserByUsername(username: string): Promise<ParentUser | undefined>;
  getParentUserByEmail(email: string): Promise<ParentUser | undefined>;
  getParentUsersByFamily(familyId: number): Promise<ParentUser[]>;
  createParentUser(user: InsertParentUser): Promise<ParentUser>;
  updateParentUser(id: number, user: Partial<InsertParentUser>): Promise<ParentUser>;
  deleteParentUser(id: number): Promise<void>;

  // Family operations
  getFamilies(): Promise<Family[]>;
  getFamily(id: number): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  updateFamily(id: number, family: Partial<InsertFamily>): Promise<Family>;
  deleteFamily(id: number): Promise<void>;
  searchFamilies(query: string): Promise<Family[]>;
  upsertFamily(family: InsertFamily): Promise<{ family: Family; isNew: boolean }>;
  markAllFamiliesInactive(): Promise<void>;
  markFamiliesInactiveExcept(familyIds: number[]): Promise<void>;

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
  deleteAllCourses(): Promise<void>;
  searchCourses(query: string): Promise<Course[]>;
  getCoursesByHour(hour: number): Promise<Course[]>;

  // Class operations (for 6th grade and younger)
  getClasses(): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class>;
  deleteClass(id: number): Promise<void>;
  deleteAllClasses(): Promise<void>;

  // Grade operations
  getGrades(): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, grade: Partial<InsertGrade>): Promise<Grade>;
  deleteGrade(id: number): Promise<void>;
  deleteAllGrades(): Promise<void>;

  // Hour operations
  getHours(): Promise<Hour[]>;
  createHour(hour: InsertHour): Promise<Hour>;
  deleteAllHours(): Promise<void>;

  // Settings operations
  getSettings(): Promise<Record<string, string>>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string, description?: string): Promise<Settings>;
  deleteSetting(key: string): Promise<void>;
  deleteAllSettings(): Promise<void>;
  initializeDefaultSettings(): Promise<void>;

  // Payment operations
  getPayments(): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByFamily(familyId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: number): Promise<void>;
  deleteAllPayments(): Promise<void>;

  // Bill adjustment operations
  getBillAdjustments(): Promise<BillAdjustment[]>;
  getBillAdjustment(id: number): Promise<BillAdjustment | undefined>;
  getBillAdjustmentsByFamily(familyId: number): Promise<BillAdjustment[]>;
  createBillAdjustment(adjustment: InsertBillAdjustment): Promise<BillAdjustment>;
  updateBillAdjustment(id: number, adjustment: Partial<InsertBillAdjustment>): Promise<BillAdjustment>;
  deleteBillAdjustment(id: number): Promise<void>;
  deleteAllBillAdjustments(): Promise<void>;

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

  // Admin user operations
  async getAdminUsers(): Promise<AdminUser[]> {
    return db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt));
  }

  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return user;
  }

  async createAdminUser(userData: InsertAdminUser): Promise<AdminUser> {
    const [user] = await db.insert(adminUsers).values(userData).returning();
    return user;
  }

  async updateAdminUser(id: number, userData: Partial<InsertAdminUser>): Promise<AdminUser> {
    const [user] = await db
      .update(adminUsers)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    return user;
  }

  async deleteAdminUser(id: number): Promise<void> {
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
  }

  // Parent user operations
  async getParentUsers(): Promise<ParentUser[]> {
    return db.select().from(parentUsers).orderBy(desc(parentUsers.createdAt));
  }

  async getParentUser(id: number): Promise<ParentUser | undefined> {
    const [user] = await db.select().from(parentUsers).where(eq(parentUsers.id, id));
    return user;
  }

  async getParentUserByUsername(username: string): Promise<ParentUser | undefined> {
    const [user] = await db.select().from(parentUsers).where(eq(parentUsers.username, username));
    return user;
  }

  async getParentUserByEmail(email: string): Promise<ParentUser | undefined> {
    const [user] = await db.select().from(parentUsers).where(eq(parentUsers.email, email));
    return user;
  }

  async getParentUsersByFamily(familyId: number): Promise<ParentUser[]> {
    return db.select().from(parentUsers).where(eq(parentUsers.familyId, familyId));
  }

  async createParentUser(userData: InsertParentUser): Promise<ParentUser> {
    const [user] = await db.insert(parentUsers).values(userData).returning();
    return user;
  }

  async updateParentUser(id: number, userData: Partial<InsertParentUser>): Promise<ParentUser> {
    const [user] = await db
      .update(parentUsers)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(parentUsers.id, id))
      .returning();
    return user;
  }

  async deleteParentUser(id: number): Promise<void> {
    await db.delete(parentUsers).where(eq(parentUsers.id, id));
  }

  // Family operations
  async getFamilies(): Promise<Family[]> {
    return db.select().from(families).orderBy(families.lastName);
  }

  async getFamily(id: number): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family;
  }

  async createFamily(family: InsertFamily): Promise<Family> {
    // Remove id from family data to let database auto-generate it
    const { id, ...familyData } = family as any;
    console.log(familyData);
    const [newFamily] = await db
      .insert(families)
      .values(familyData)
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
    return db
      .select()
      .from(families)
      .where(
        sql`LOWER(${families.lastName}) LIKE LOWER(${'%' + query + '%'}) OR 
            LOWER(${families.father}) LIKE LOWER(${'%' + query + '%'}) OR
            LOWER(${families.mother}) LIKE LOWER(${'%' + query + '%'})`
      )
      .orderBy(families.lastName);
  }

  async upsertFamily(familyWithId: InsertFamily & { id: number }): Promise<{ family: Family; isNew: boolean }> {
    // Check if family exists (inactive families count as existing)
    const existingFamily = await db
      .select()
      .from(families)
      .where(eq(families.id, familyWithId.id))
      .limit(1);

    const isNew = existingFamily.length === 0;
    const { id, ...familyData } = familyWithId;

    if (isNew) {
      // Insert new family
      const [newFamily] = await db
        .insert(families)
        .values({ ...familyData, id })
        .returning();
      return { family: newFamily, isNew: true };
    } else {
      // Update existing family
      const [updatedFamily] = await db
        .update(families)
        .set(familyData)
        .where(eq(families.id, id))
        .returning();
      return { family: updatedFamily, isNew: false };
    }
  }

  async markAllFamiliesInactive(): Promise<void> {
    await db.update(families).set({ active: false });
  }

  async markFamiliesInactiveExcept(familyIds: number[]): Promise<void> {
    if (familyIds.length === 0) {
      await db.update(families).set({ active: false });
    } else {
      // Get all families that are not in the imported list
      const allFamilies = await db.select({ id: families.id }).from(families);
      const familiesToDeactivate = allFamilies
        .filter(family => !familyIds.includes(family.id))
        .map(family => family.id);
      
      // Update each family to inactive
      for (const familyId of familiesToDeactivate) {
        await db
          .update(families)
          .set({ active: false })
          .where(eq(families.id, familyId));
      }
    }
  }

  async resetFamiliesSequence(): Promise<void> {
    // Reset the sequence to the maximum ID + 1
    await db.execute(sql`SELECT setval('families_id_seq', COALESCE((SELECT MAX(id) FROM families), 0) + 1, false)`);
  }

  async getInactiveFamiliesCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(families)
      .where(eq(families.active, false));
    return result[0]?.count || 0;
  }

  // Student operations
  async getStudents(): Promise<StudentWithFamily[]> {
    return db
      .select({
        id: students.id,
        familyId: students.familyId,
        lastName: students.lastName,
        firstName: students.firstName,
        birthdate: students.birthdate,
        gradYear: students.gradYear,
        comment1: students.comment1,
        scheduleNotes: students.scheduleNotes,
        mathHour: students.mathHour,
        firstHour: students.firstHour,
        secondHour: students.secondHour,
        thirdHour: students.thirdHour,
        thirdHour2: students.thirdHour2,
        fourthHour: students.fourthHour,
        fifthHourFall: students.fifthHourFall,
        fifthHourSpring: students.fifthHourSpring,
        fifthHour2: students.fifthHour2,
        inactive: students.inactive,
        registeredOn: students.registeredOn,
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
        scheduleNotes: students.scheduleNotes,
        mathHour: students.mathHour,
        firstHour: students.firstHour,
        secondHour: students.secondHour,
        thirdHour: students.thirdHour,
        thirdHour2: students.thirdHour2,
        fourthHour: students.fourthHour,
        fifthHourFall: students.fifthHourFall,
        fifthHourSpring: students.fifthHourSpring,
        fifthHour2: students.fifthHour2,
        inactive: students.inactive,
        registeredOn: students.registeredOn,
        family: families,
      })
      .from(students)
      .innerJoin(families, eq(students.familyId, families.id))
      .where(eq(students.id, id));
    return student;
  }

  async getStudentsByFamily(familyId: number): Promise<Student[]> {
    return db
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
    return db
      .select({
        id: students.id,
        familyId: students.familyId,
        lastName: students.lastName,
        firstName: students.firstName,
        birthdate: students.birthdate,
        gradYear: students.gradYear,
        comment1: students.comment1,
        scheduleNotes: students.scheduleNotes,
        mathHour: students.mathHour,
        firstHour: students.firstHour,
        secondHour: students.secondHour,
        thirdHour: students.thirdHour,
        thirdHour2: students.thirdHour2,
        fourthHour: students.fourthHour,
        fifthHourFall: students.fifthHourFall,
        fifthHourSpring: students.fifthHourSpring,
        fifthHour2: students.fifthHour2,
        inactive: students.inactive,
        registeredOn: students.registeredOn,
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
    return db.select().from(courses).orderBy(courses.courseName);
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

  async deleteAllCourses(): Promise<void> {
    await db.delete(courses);
  }

  async searchCourses(query: string): Promise<Course[]> {
    return db
      .select()
      .from(courses)
      .where(
        sql`LOWER(${courses.courseName}) LIKE LOWER(${'%' + query + '%'}) OR 
            LOWER(${courses.location}) LIKE LOWER(${'%' + query + '%'})`
      )
      .orderBy(courses.courseName);
  }

  async getCoursesByHour(hour: number): Promise<Course[]> {
    return db
      .select()
      .from(courses)
      .where(eq(courses.hour, hour))
      .orderBy(courses.courseName);
  }

  // Class operations
  async getClasses(): Promise<Class[]> {
    return db.select().from(classes).orderBy(classes.className);
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

  async deleteAllClasses(): Promise<void> {
    await db.delete(classes);
  }

  // Grade operations
  async getGrades(): Promise<Grade[]> {
    return db.select().from(grades).orderBy(grades.code);
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const [newGrade] = await db
      .insert(grades)
      .values(grade)
      .returning();
    return newGrade;
  }

  async updateGrade(id: number, grade: Partial<InsertGrade>): Promise<Grade> {
    const [updatedGrade] = await db
      .update(grades)
      .set(grade)
      .where(eq(grades.id, id))
      .returning();
    return updatedGrade;
  }

  async deleteGrade(id: number): Promise<void> {
    await db.delete(grades).where(eq(grades.id, id));
  }

  async deleteAllGrades(): Promise<void> {
    await db.delete(grades);
  }

  // Hour operations
  async getHours(): Promise<Hour[]> {
    return db.select().from(hours).orderBy(hours.id);
  }

  async createHour(hour: InsertHour): Promise<Hour> {
    const [newHour] = await db
      .insert(hours)
      .values(hour)
      .returning();
    return newHour;
  }

  async deleteAllHours(): Promise<void> {
    await db.delete(hours);
  }

  // Settings operations
  async getSettings(): Promise<Record<string, string>> {
    const settingsRows = await db.select().from(settings);
    const result: Record<string, string> = {};
    for (const row of settingsRows) {
      if (row.key && row.value) {
        result[row.key] = row.value;
      }
    }
    return result;
  }

  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    return setting?.value || null;
  }

  async setSetting(key: string, value: string, description?: string): Promise<Settings> {
    // Try to update existing setting first
    const [updatedSetting] = await db
      .update(settings)
      .set({ 
        value, 
        description: description || null,
        updatedAt: new Date()
      })
      .where(eq(settings.key, key))
      .returning();
    
    // If no rows were updated, insert a new record
    if (!updatedSetting) {
      const [newSetting] = await db
        .insert(settings)
        .values({ key, value, description: description || null })
        .returning();
      return newSetting;
    }
    
    return updatedSetting;
  }

  async deleteSetting(key: string): Promise<void> {
    await db.delete(settings).where(eq(settings.key, key));
  }

  async deleteAllSettings(): Promise<void> {
    await db.delete(settings);
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

  // Initialize default settings on system startup
  async initializeDefaultSettings(): Promise<void> {
    const defaultSettings = [
      { key: 'BackgroundFee', value: '0', description: 'Background check fee amount' },
      { key: 'SchoolYear', value: new Date().getFullYear().toString(), description: 'Current school year' },
      { key: 'StudentFee', value: '0', description: 'Per-student fee amount' },
      { key: 'FamilyFee', value: '0', description: 'Per-family fee amount' },
    ];

    for (const setting of defaultSettings) {
      try {
        // Check if setting already exists
        const existing = await this.getSetting(setting.key);
        if (existing === null) {
          // Only create if it doesn't exist
          await this.setSetting(setting.key, setting.value, setting.description);
        }
      } catch (error) {
        console.error(`Failed to initialize setting ${setting.key}:`, error);
      }
    }
  }

  // Payment operations
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.paymentDate));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentsByFamily(familyId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.familyId, familyId))
      .orderBy(desc(payments.paymentDate));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  async deletePayment(id: number): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  async deleteAllPayments(): Promise<void> {
    await db.delete(payments);
  }

  // Bill adjustment operations
  async getBillAdjustments(): Promise<BillAdjustment[]> {
    return await db.select().from(billAdjustments).orderBy(desc(billAdjustments.adjustmentDate));
  }

  async getBillAdjustment(id: number): Promise<BillAdjustment | undefined> {
    const [adjustment] = await db.select().from(billAdjustments).where(eq(billAdjustments.id, id));
    return adjustment;
  }

  async getBillAdjustmentsByFamily(familyId: number): Promise<BillAdjustment[]> {
    return await db
      .select()
      .from(billAdjustments)
      .where(eq(billAdjustments.familyId, familyId))
      .orderBy(desc(billAdjustments.adjustmentDate));
  }

  async createBillAdjustment(adjustment: InsertBillAdjustment): Promise<BillAdjustment> {
    const [created] = await db.insert(billAdjustments).values(adjustment).returning();
    return created;
  }

  async updateBillAdjustment(id: number, adjustment: Partial<InsertBillAdjustment>): Promise<BillAdjustment> {
    const [updated] = await db
      .update(billAdjustments)
      .set({ ...adjustment, updatedAt: new Date() })
      .where(eq(billAdjustments.id, id))
      .returning();
    return updated;
  }

  async deleteBillAdjustment(id: number): Promise<void> {
    await db.delete(billAdjustments).where(eq(billAdjustments.id, id));
  }

  async deleteAllBillAdjustments(): Promise<void> {
    await db.delete(billAdjustments);
  }

  // Find family ID by hash - checks all active families
  async findFamilyByHash(hash: string): Promise<number | null> {
    try {
      console.log(`[findFamilyByHash] Starting search for hash: "${hash}"`);
      
      if (!hash || hash.length !== 8) {
        console.log(`[findFamilyByHash] Invalid hash format: "${hash}", length: ${hash?.length}`);
        return null;
      }

      // Get all active family IDs
      console.log(`[findFamilyByHash] Fetching all families...`);
      const families = await this.getFamilies();
      console.log(`[findFamilyByHash] Found ${families.length} total families`);
      
      const activeFamilyIds = families
        .filter(family => family.active !== false)
        .map(family => family.id);
      console.log(`[findFamilyByHash] Active family IDs: [${activeFamilyIds.join(', ')}]`);

      // Generate hash for each active family ID until we find a match
      const crypto = await import('crypto');
      console.log(`[findFamilyByHash] Starting hash generation for each family...`);
      
      for (const familyId of activeFamilyIds) {
        const familyHash = crypto.createHash('sha256')
          .update(familyId.toString())
          .digest('hex')
          .substring(0, 8);
          
        console.log(`[findFamilyByHash] Family ID ${familyId} → hash "${familyHash}"`);
        
        if (familyHash === hash) {
          console.log(`[findFamilyByHash] ✅ MATCH FOUND! Family ID ${familyId} matches hash "${hash}"`);
          return familyId;
        }
      }
      
      console.log(`[findFamilyByHash] ❌ No match found for hash "${hash}"`);
      return null;
    } catch (error) {
      console.error("[findFamilyByHash] Error occurred:", error);
      return null;
    }
  }

  // Get all data needed for a family's invoice in a single efficient query set
  async getFamilyInvoiceData(familyId: number) {
    try {
      // Fetch all data in parallel for efficiency
      const [
        family,
        familyStudents,
        allCourses,
        allGrades,
        allHours,
        allSettings,
        familyPayments,
        familyBillAdjustments,
      ] = await Promise.all([
        db.select().from(families).where(eq(families.id, familyId)).then(rows => rows[0] || null),
        db.select().from(students).where(and(eq(students.familyId, familyId), not(eq(students.inactive, true)))),
        db.select().from(courses),
        db.select().from(grades),
        db.select().from(hours),
        db.select().from(settings),
        db.select().from(payments).where(eq(payments.familyId, familyId)),
        db.select().from(billAdjustments).where(eq(billAdjustments.familyId, familyId)),
      ]);

      if (!family) {
        return null;
      }

      // Convert settings array to object format expected by invoice calculations
      const settingsObject = allSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      return {
        family,
        students: familyStudents,
        courses: allCourses,
        grades: allGrades,
        hours: allHours,
        settings: settingsObject,
        payments: familyPayments,
        billAdjustments: familyBillAdjustments,
      };
    } catch (error) {
      console.error("Error fetching family invoice data:", error);
      throw error;
    }
  }

  // Get all data needed for a family's schedules in a single efficient query set
  async getFamilyScheduleData(familyId: number) {
    try {
      // Fetch all data in parallel for efficiency
      const [
        family,
        familyStudents,
        allCourses,
        allGrades,
        allHours,
        allSettings,
      ] = await Promise.all([
        db.select().from(families).where(eq(families.id, familyId)).then(rows => rows[0] || null),
        db.select().from(students).where(and(eq(students.familyId, familyId), not(eq(students.inactive, true)))),
        db.select().from(courses),
        db.select().from(grades),
        db.select().from(hours),
        db.select().from(settings),
      ]);

      if (!family) {
        return null;
      }

      // Convert settings array to object format
      const settingsObject = allSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      return {
        family,
        students: familyStudents,
        courses: allCourses,
        grades: allGrades,
        hours: allHours,
        settings: settingsObject,
      };
    } catch (error) {
      console.error("Error fetching family schedule data:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
