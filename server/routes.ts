import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { authenticateCredentials, requireAuth, requireAdmin, requireParentOrAdmin, requireFamilyAccess, type AuthUser } from "./auth";

// Extend session data interface
declare module 'express-session' {
  interface SessionData {
    authUser?: AuthUser;
  }
}
import {
  insertFamilySchema,
  insertStudentSchema,
  insertCourseSchema,
  insertClassSchema,
  insertGradeSchema,
  insertHourSchema,
  insertSettingsSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware for credential-based auth
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,//process.env.NODE_ENV === 'production', // Set to false for local development
      //httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    name: 'sessionId', // Explicit session name
  }));

  // Auth middleware for session management
  app.use((req, res, next) => {
    if (req.session && req.session.authUser) {
      req.authUser = req.session.authUser as AuthUser;
    }
    next();
  });

  // Authentication routes
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await authenticateCredentials(username, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.authUser = user;
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          familyId: user.familyId
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (req.authUser) {
      res.json(req.authUser);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // Legacy auth route compatibility
  app.get('/api/auth/user', async (req: any, res) => {
    if (req.authUser) {
      res.json(req.authUser);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Family routes
  app.get("/api/families", async (req, res) => {
    try {
      const families = await storage.getFamilies();
      res.json(families);
    } catch (error) {
      console.error("Error fetching families:", error);
      res.status(500).json({ message: "Failed to fetch families" });
    }
  });

  app.get("/api/families/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const families = await storage.searchFamilies(query);
      res.json(families);
    } catch (error) {
      console.error("Error searching families:", error);
      res.status(500).json({ message: "Failed to search families" });
    }
  });

  app.get("/api/families/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const family = await storage.getFamily(id);
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      res.json(family);
    } catch (error) {
      console.error("Error fetching family:", error);
      res.status(500).json({ message: "Failed to fetch family" });
    }
  });

  app.post("/api/families", async (req, res) => {
    try {
      const familyData = insertFamilySchema.parse(req.body);
      const family = await storage.createFamily(familyData);
      res.status(201).json(family);
    } catch (error) {
      console.error("Error creating family:", error);
      res.status(500).json({ message: "Failed to create family" });
    }
  });

  app.patch("/api/families/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const familyData = insertFamilySchema.partial().parse(req.body);
      const family = await storage.updateFamily(id, familyData);
      res.json(family);
    } catch (error) {
      console.error("Error updating family:", error);
      res.status(500).json({ message: "Failed to update family" });
    }
  });

  app.delete("/api/families/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFamily(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting family:", error);
      res.status(500).json({ message: "Failed to delete family" });
    }
  });

  // Student routes
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const students = await storage.searchStudents(query);
      res.json(students);
    } catch (error) {
      console.error("Error searching students:", error);
      res.status(500).json({ message: "Failed to search students" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudent(id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.get("/api/families/:familyId/students", async (req, res) => {
    try {
      const familyId = parseInt(req.params.familyId);
      const students = await storage.getStudentsByFamily(familyId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students by family:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const studentData = { ...req.body };
      
      // Convert birthdate string to Date object if provided, treating as local date
      if (studentData.birthdate && typeof studentData.birthdate === 'string') {
        // Parse as local date to avoid timezone issues
        const dateParts = studentData.birthdate.split('-');
        if (dateParts.length === 3) {
          // Create date at noon to avoid timezone shifting issues
          studentData.birthdate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0);
        } else {
          studentData.birthdate = new Date(studentData.birthdate);
        }
      }
      
      const validatedData = insertStudentSchema.parse(studentData);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.patch("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const studentData = { ...req.body };
      
      // Convert birthdate string to Date object if provided, treating as local date
      if (studentData.birthdate && typeof studentData.birthdate === 'string') {
        // Parse as local date to avoid timezone issues
        const dateParts = studentData.birthdate.split('-');
        if (dateParts.length === 3) {
          // Create date at noon to avoid timezone shifting issues
          studentData.birthdate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0);
        } else {
          studentData.birthdate = new Date(studentData.birthdate);
        }
      }
      
      // Convert registeredOn string to Date object if provided, treating as local date
      if (studentData.registeredOn && typeof studentData.registeredOn === 'string') {
        // Parse as local date to avoid timezone issues
        const dateParts = studentData.registeredOn.split('-');
        if (dateParts.length === 3) {
          // Create date at noon to avoid timezone shifting issues
          studentData.registeredOn = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0);
        } else {
          studentData.registeredOn = new Date(studentData.registeredOn);
        }
      }
      
      const validatedData = insertStudentSchema.partial().parse(studentData);
      const student = await storage.updateStudent(id, validatedData);
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteStudent(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  app.post("/api/students/bulk-schedule-update", async (req, res) => {
    try {
      const { updates } = req.body;
      if (!Array.isArray(updates)) {
        return res.status(400).json({ message: "Expected array of updates" });
      }

      for (const update of updates) {
        const { studentId, hour, courseName } = update;
        const updateData = { [hour]: courseName === "none" ? null : courseName };
        await storage.updateStudent(studentId, updateData);
      }

      res.json({ message: "Schedules updated successfully" });
    } catch (error) {
      console.error("Error updating student schedules:", error);
      res.status(500).json({ message: "Failed to update schedules" });
    }
  });

  app.patch("/api/students/:id/schedule", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get current student data to check if this is their first registration
      const currentStudent = await storage.getStudent(id);
      if (!currentStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Only update the fields that are actually provided in the request
      const updateData: any = {};
      
      // Only include schedule fields that are explicitly provided
      const scheduleFields = ['mathHour', 'firstHour', 'secondHour', 'thirdHour', 'thirdHour2', 'fourthHour', 'fifthHourFall', 'fifthHourSpring', 'fifthHour2'];
      
      for (const field of scheduleFields) {
        if (req.body.hasOwnProperty(field)) {
          updateData[field] = req.body[field] || null;
        }
      }
      
      // Only set registeredOn if this is the first time they're registering for any course
      // (i.e., they currently have no courses and are now adding at least one)
      const currentHasCourses = currentStudent.mathHour || currentStudent.firstHour || 
                               currentStudent.secondHour || currentStudent.thirdHour || 
                               currentStudent.fourthHour || currentStudent.fifthHourFall || 
                               currentStudent.fifthHourSpring;
      
      const willHaveCourses = Object.values(updateData).some(course => course !== null) || currentHasCourses;
      
      if (!currentStudent.registeredOn && !currentHasCourses && willHaveCourses) {
        updateData.registeredOn = new Date();
      }

      const student = await storage.updateStudent(id, updateData);
      res.json(student);
    } catch (error) {
      console.error("Error updating student schedule:", error);
      res.status(500).json({ message: "Failed to update student schedule" });
    }
  });

  // Course routes (for 7th grade and older)
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const courses = await storage.searchCourses(query);
      res.json(courses);
    } catch (error) {
      console.error("Error searching courses:", error);
      res.status(500).json({ message: "Failed to search courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.patch("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const courseData = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(id, courseData);
      res.json(course);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCourse(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Class routes (for 6th grade and younger)
  app.get("/api/classes", async (req, res) => {
    try {
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.get("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const classData = await storage.getClass(id);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json(classData);
    } catch (error) {
      console.error("Error fetching class:", error);
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });

  app.post("/api/classes", async (req, res) => {
    try {
      const classData = insertClassSchema.parse(req.body);
      const newClass = await storage.createClass(classData);
      res.status(201).json(newClass);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  app.patch("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const classData = insertClassSchema.partial().parse(req.body);
      const updatedClass = await storage.updateClass(id, classData);
      res.json(updatedClass);
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(500).json({ message: "Failed to update class" });
    }
  });

  app.delete("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClass(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ message: "Failed to delete class" });
    }
  });

  // Grade routes
  app.get("/api/grades", async (req, res) => {
    try {
      const grades = await storage.getGrades();
      res.json(grades);
    } catch (error) {
      console.error("Error fetching grades:", error);
      res.status(500).json({ message: "Failed to fetch grades" });
    }
  });

  app.post("/api/grades", async (req, res) => {
    try {
      const gradeData = insertGradeSchema.parse(req.body);
      const grade = await storage.createGrade(gradeData);
      res.status(201).json(grade);
    } catch (error) {
      console.error("Error creating grade:", error);
      res.status(500).json({ message: "Failed to create grade" });
    }
  });

  app.patch("/api/grades/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const gradeData = insertGradeSchema.partial().parse(req.body);
      const grade = await storage.updateGrade(id, gradeData);
      res.json(grade);
    } catch (error) {
      console.error("Error updating grade:", error);
      res.status(500).json({ message: "Failed to update grade" });
    }
  });

  app.delete("/api/grades/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGrade(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting grade:", error);
      res.status(500).json({ message: "Failed to delete grade" });
    }
  });

  // Hour routes
  app.get("/api/hours", async (req, res) => {
    try {
      const hours = await storage.getHours();
      res.json(hours);
    } catch (error) {
      console.error("Error fetching hours:", error);
      res.status(500).json({ message: "Failed to fetch hours" });
    }
  });

  app.post("/api/hours", async (req, res) => {
    try {
      const hourData = insertHourSchema.parse(req.body);
      const hour = await storage.createHour(hourData);
      res.status(201).json(hour);
    } catch (error) {
      console.error("Error creating hour:", error);
      res.status(500).json({ message: "Failed to create hour" });
    }
  });

  // Admin User routes
  app.get("/api/admin-users", requireAdmin, async (req, res) => {
    try {
      const adminUsers = await storage.getAdminUsers();
      res.json(adminUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch admin users" });
    }
  });

  app.post("/api/admin-users", requireAdmin, async (req, res) => {
    try {
      const { username, email, firstName, lastName, password, role, active } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      const { hashPassword } = await import('./auth');
      const passwordHash = await hashPassword(password);

      const adminUser = await storage.createAdminUser({
        username,
        email,
        firstName,
        lastName,
        passwordHash,
        role: role || 'admin',
        active: active !== undefined ? active : true
      });

      res.status(201).json(adminUser);
    } catch (error) {
      console.error("Error creating admin user:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  app.patch("/api/admin-users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = { ...req.body };
      
      // Hash password if it's being updated
      if (updates.password) {
        const { hashPassword } = await import('./auth');
        updates.passwordHash = await hashPassword(updates.password);
        delete updates.password;
      }
      
      const adminUser = await storage.updateAdminUser(id, updates);
      res.json(adminUser);
    } catch (error) {
      console.error("Error updating admin user:", error);
      res.status(500).json({ message: "Failed to update admin user" });
    }
  });

  app.delete("/api/admin-users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAdminUser(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting admin user:", error);
      res.status(500).json({ message: "Failed to delete admin user" });
    }
  });

  // Parent User routes
  app.get("/api/parent-users", requireAdmin, async (req, res) => {
    try {
      const parentUsers = await storage.getParentUsers();
      res.json(parentUsers);
    } catch (error) {
      console.error("Error fetching parent users:", error);
      res.status(500).json({ message: "Failed to fetch parent users" });
    }
  });

  app.post("/api/parent-users", requireAdmin, async (req, res) => {
    try {
      const { username, email, password, familyId, active } = req.body;
      
      if (!username || !email || !password || !familyId) {
        return res.status(400).json({ message: "Username, email, password, and familyId are required" });
      }

      const { hashPassword } = await import('./auth');
      const passwordHash = await hashPassword(password);

      const parentUser = await storage.createParentUser({
        username,
        email,
        passwordHash,
        familyId: parseInt(familyId),
        role: 'parent',
        active: active !== undefined ? active : true
      });

      res.status(201).json(parentUser);
    } catch (error) {
      console.error("Error creating parent user:", error);
      res.status(500).json({ message: "Failed to create parent user" });
    }
  });

  app.patch("/api/parent-users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = { ...req.body };
      
      // Hash password if it's being updated
      if (updates.password) {
        const { hashPassword } = await import('./auth');
        updates.passwordHash = await hashPassword(updates.password);
        delete updates.password;
      }
      
      const parentUser = await storage.updateParentUser(id, updates);
      res.json(parentUser);
    } catch (error) {
      console.error("Error updating parent user:", error);
      res.status(500).json({ message: "Failed to update parent user" });
    }
  });

  app.delete("/api/parent-users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteParentUser(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting parent user:", error);
      res.status(500).json({ message: "Failed to delete parent user" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });



  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Invoices routes - returns placeholder data for now
  app.get("/api/invoices", async (req, res) => {
    try {
      // Return empty array since invoices are generated on demand
      res.json([]);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // CSV Import routes
  app.post("/api/import/families", async (req, res) => {
    try {
      const families = req.body;
      if (!Array.isArray(families)) {
        return res.status(400).json({ message: "Expected array of families" });
      }

      const results = [];
      let newFamilies = 0;
      let modifiedFamilies = 0;
      const importedFamilyIds = new Set<number>();

      // First pass: Check which families are new vs existing, and process them
      for (const familyRow of families) {
        try {
          // Map MS Access Family table columns to our schema
          const familyData = {
            id: parseInt(familyRow.FamilyID || familyRow.familyID || familyRow.id),
            lastName: familyRow.LastName || familyRow.lastName || '',
            father: familyRow.Father || familyRow.father || null,
            mother: familyRow.Mother || familyRow.mother || null,
            parentCell: familyRow.ParentCell || familyRow.parentCell || null,
            email: familyRow.Email || familyRow.email || null,
            address: familyRow.Address || familyRow.address || null,
            city: familyRow.City || familyRow.city || null,
            zip: familyRow.Zip ? String(familyRow.Zip) : null,
            homePhone: familyRow.HomePhone || familyRow.homePhone || null,
            parentCell2: familyRow.ParentCell2 || familyRow.parentCell2 || null,
            secondEmail: familyRow.SecondEmail || familyRow.secondEmail || null,
            workPhone: familyRow.WorkPhone || familyRow.workPhone || null,
            church: familyRow.Church || familyRow.church || null,
            pastorName: familyRow.PastorName || familyRow.pastorName || null,
            pastorPhone: familyRow.PastorPhone || familyRow.pastorPhone || null,
            active: true, // Mark families in import file as active
          };

          importedFamilyIds.add(familyData.id);
          
          // Check if family exists before inserting/updating
          const existingFamily = await storage.getFamily(familyData.id);
          const isNew = !existingFamily;

          if (isNew) {
            const family = await storage.createFamily(familyData);
            newFamilies++;
            console.log(`New family created: ID ${familyData.id}, newFamilies count: ${newFamilies}`);
            results.push({ success: true, family, isNew: true });
          } else {
            const family = await storage.updateFamily(familyData.id, familyData);
            modifiedFamilies++;
            console.log(`Family updated: ID ${familyData.id}, modifiedFamilies count: ${modifiedFamilies}`);
            results.push({ success: true, family, isNew: false });
          }
        } catch (error) {
          results.push({ success: false, error: (error as Error).message, data: familyRow });
        }
      }

      // Mark families not in import as inactive
      await storage.markFamiliesInactiveExcept(Array.from(importedFamilyIds));

      // Reset the families sequence to prevent duplicate key errors
      await storage.resetFamiliesSequence();

      // Count inactive families after processing
      const inactiveFamilies = await storage.getInactiveFamiliesCount();

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`Final counts - New: ${newFamilies}, Modified: ${modifiedFamilies}, Inactive: ${inactiveFamilies}`);

      res.json({ 
        message: `Processed ${families.length} families`, 
        results,
        successful,
        failed,
        newFamilies,
        modifiedFamilies,
        inactiveFamilies
      });
    } catch (error) {
      console.error("Error importing families:", error);
      res.status(500).json({ message: "Failed to import families" });
    }
  });

  app.post("/api/import/students", async (req, res) => {
    try {
      const students = req.body;
      if (!Array.isArray(students)) {
        return res.status(400).json({ message: "Expected array of students" });
      }

      const results = [];
      let newStudents = 0;
      let modifiedStudents = 0;

      for (const studentRow of students) {
        try {
          // Map MS Access Student table columns to our schema
          const studentData = {
            familyId: parseInt(studentRow.FamilyID || studentRow.familyId || 1),
            lastName: studentRow.LastName || studentRow.lastName || '',
            firstName: studentRow.FirstName || studentRow.firstName || '',
            birthdate: studentRow.Birthdate ? new Date(studentRow.Birthdate) : null,
            gradYear: studentRow.GradYear ? String(studentRow.GradYear) : null,
            comment1: studentRow.Comment1 || studentRow.comment1 || null,
            // Store the denormalized schedule from MS Access
            mathHour: studentRow.MathHour || studentRow.mathHour || null,
            firstHour: studentRow['1stHour'] || studentRow.firstHour || null,
            secondHour: studentRow['2ndHour'] || studentRow.secondHour || null,
            thirdHour: studentRow['3rdHour'] || studentRow.thirdHour || null,
            fourthHour: studentRow['4thHour'] || studentRow.fourthHour || null,
            fifthHourFall: studentRow['5thHourFall'] || studentRow.fifthHourFall || null,
            fifthHourSpring: studentRow['5thHourSpring'] || studentRow.fifthHourSpring || null,
          };

          // Check if student exists using FamilyID + FirstName combination
          const existingStudents = await storage.getStudentsByFamily(studentData.familyId);
          const existingStudent = existingStudents.find(s => s.firstName === studentData.firstName);
          const isNew = !existingStudent;

          if (isNew) {
            const student = await storage.createStudent(studentData);
            newStudents++;
            console.log(`New student created: ${studentData.firstName} (Family ${studentData.familyId}), newStudents count: ${newStudents}`);
            results.push({ success: true, student, isNew: true });
          } else {
            const student = await storage.updateStudent(existingStudent.id, studentData);
            modifiedStudents++;
            console.log(`Student updated: ${studentData.firstName} (Family ${studentData.familyId}), modifiedStudents count: ${modifiedStudents}`);
            results.push({ success: true, student, isNew: false });
          }
        } catch (error) {
          results.push({ success: false, error: (error as Error).message, data: studentRow });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`Final student counts - New: ${newStudents}, Modified: ${modifiedStudents}`);

      res.json({ 
        message: `Processed ${students.length} students`, 
        results,
        successful,
        failed,
        newStudents,
        modifiedStudents
      });
    } catch (error) {
      console.error("Error importing students:", error);
      res.status(500).json({ message: "Failed to import students" });
    }
  });

  app.post("/api/import/courses", async (req, res) => {
    try {
      const courses = req.body;
      if (!Array.isArray(courses)) {
        return res.status(400).json({ message: "Expected array of courses" });
      }

      // First, delete all existing courses (fresh start each year)
      console.log("Deleting all existing courses before import...");
      await storage.deleteAllCourses();

      const results = [];
      let newCourses = 0;

      for (const courseRow of courses) {
        try {
          // Helper function to parse currency values
          const parseCurrency = (value: any): string | null => {
            if (!value || value === '') return null;
            const cleanValue = String(value).replace(/[$,]/g, '');
            const parsed = parseFloat(cleanValue);
            return isNaN(parsed) ? null : parsed.toFixed(2);
          };

          // Helper function to parse boolean values
          const parseBoolean = (value: any): boolean => {
            if (typeof value === 'boolean') return value;
            if (typeof value === 'string') {
              return value.toLowerCase() === 'true' || value === '1';
            }
            return Boolean(value);
          };

          // Map MS Access Course table columns to our schema
          const courseData = {
            courseName: courseRow.CourseName || courseRow.courseName || '',
            offeredFall: courseRow.OfferedFall !== undefined ? parseBoolean(courseRow.OfferedFall) : true,
            offeredSpring: courseRow.OfferedSpring !== undefined ? parseBoolean(courseRow.OfferedSpring) : true,
            hour: courseRow.Hour !== undefined ? parseInt(courseRow.Hour) || 0 : 0,
            fee: parseCurrency(courseRow.Fee),
            bookRental: parseCurrency(courseRow.BookRental),
            location: courseRow.Location || courseRow.location || null,
            fromGrade: null, // Will be assigned later based on course assignments
            toGrade: null, // Will be assigned later based on course assignments
          };

          // Validate using the schema before creating
          const validatedCourseData = insertCourseSchema.parse(courseData);
          
          const course = await storage.createCourse(validatedCourseData);
          newCourses++;
          console.log(`New course created: ${courseData.courseName}, newCourses count: ${newCourses}`);
          results.push({ success: true, course, isNew: true });
        } catch (error) {
          console.error(`Failed to create course ${courseRow.CourseName || 'unknown'}:`, error);
          results.push({ success: false, error: (error as Error).message, data: courseRow });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`Final course counts - New: ${newCourses}, Deleted all previous courses`);

      res.json({ 
        message: `Processed ${courses.length} courses`, 
        results,
        successful,
        failed,
        newCourses,
        deletedPrevious: true
      });
    } catch (error) {
      console.error("Error importing courses:", error);
      res.status(500).json({ message: "Failed to import courses" });
    }
  });

  app.post("/api/import/classes", async (req, res) => {
    try {
      const classes = req.body;
      if (!Array.isArray(classes)) {
        return res.status(400).json({ message: "Expected array of classes" });
      }

      // First, delete all existing classes (fresh start each year)
      console.log("Deleting all existing classes before import...");
      await storage.deleteAllClasses();

      const results = [];
      let newClasses = 0;

      for (const classRow of classes) {
        try {
          // Map MS Access Class table columns to our schema
          const classData = {
            className: classRow.ClassName || classRow.className || '',
            startCode: classRow.StartCode || classRow.startCode || 0,
            endCode: classRow.EndCode || classRow.endCode || 0,
          };

          const newClass = await storage.createClass(classData);
          newClasses++;
          console.log(`New class created: ${classData.className}, newClasses count: ${newClasses}`);
          results.push({ success: true, class: newClass, isNew: true });
        } catch (error) {
          results.push({ success: false, error: (error as Error).message, data: classRow });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`Final class counts - New: ${newClasses}, Deleted all previous classes`);

      res.json({ 
        message: `Processed ${classes.length} classes`, 
        results,
        successful,
        failed,
        newClasses,
        deletedPrevious: true
      });
    } catch (error) {
      console.error("Error importing classes:", error);
      res.status(500).json({ message: "Failed to import classes" });
    }
  });

  // Import routes for remaining tables
  app.post("/api/import/grades", async (req, res) => {
    try {
      const grades = req.body;
      if (!Array.isArray(grades)) {
        return res.status(400).json({ message: "Expected array of grades" });
      }

      // First, delete all existing grades (fresh start each year)
      console.log("Deleting all existing grades before import...");
      await storage.deleteAllGrades();

      const results = [];
      let newGrades = 0;

      for (const gradeRow of grades) {
        try {
          // Map MS Access Grade table columns to our schema
          const gradeData = {
            gradeName: gradeRow.GradeName || gradeRow.gradeName || '',
            code: gradeRow.Code || gradeRow.code || 0,
          };

          const grade = await storage.createGrade(gradeData);
          newGrades++;
          console.log(`New grade created: ${gradeData.gradeName}, newGrades count: ${newGrades}`);
          results.push({ success: true, grade, isNew: true });
        } catch (error) {
          results.push({ success: false, error: (error as Error).message, data: gradeRow });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`Final grade counts - New: ${newGrades}, Deleted all previous grades`);

      res.json({ 
        message: `Processed ${grades.length} grades`, 
        results,
        successful,
        failed,
        newGrades,
        deletedPrevious: true
      });
    } catch (error) {
      console.error("Error importing grades:", error);
      res.status(500).json({ message: "Failed to import grades" });
    }
  });

  app.post("/api/import/hours", async (req, res) => {
    try {
      const hours = req.body;
      if (!Array.isArray(hours)) {
        return res.status(400).json({ message: "Expected array of hours" });
      }

      // First, delete all existing hours (fresh start each year)
      console.log("Deleting all existing hours before import...");
      await storage.deleteAllHours();

      const results = [];
      let newHours = 0;

      for (const hourRow of hours) {
        try {
          // Map MS Access Hour table columns to our schema
          const hourData = {
            id: hourRow.id || hourRow.ID || 0,
            description: hourRow.Description || hourRow.description || '',
          };

          const hour = await storage.createHour(hourData);
          newHours++;
          console.log(`New hour created: ${hourData.description}, newHours count: ${newHours}`);
          results.push({ success: true, hour, isNew: true });
        } catch (error) {
          results.push({ success: false, error: (error as Error).message, data: hourRow });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`Final hour counts - New: ${newHours}, Deleted all previous hours`);

      res.json({ 
        message: `Processed ${hours.length} hours`, 
        results,
        successful,
        failed,
        newHours,
        deletedPrevious: true
      });
    } catch (error) {
      console.error("Error importing hours:", error);
      res.status(500).json({ message: "Failed to import hours" });
    }
  });

  // Settings API routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const value = await storage.getSetting(key);
      if (value === null) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json({ key, value });
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "Value is required" });
      }

      const result = await storage.setSetting(key, value, description);
      res.json({ message: "Setting updated successfully", setting: result });
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.delete("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      await storage.deleteSetting(key);
      res.json({ message: "Setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // Get courses by hour for dropdown selection
  app.get("/api/courses/by-hour/:hour", async (req, res) => {
    try {
      const hour = parseInt(req.params.hour);
      const courses = await storage.getCoursesByHour(hour);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses by hour:", error);
      res.status(500).json({ message: "Failed to fetch courses by hour" });
    }
  });

  // Reset all course selections for all students
  app.post("/api/students/reset-course-selections", requireAdmin, async (req, res) => {
    try {
      const students = await storage.getStudents();
      
      for (const student of students) {
        await storage.updateStudent(student.id, {
          mathHour: null,
          firstHour: null,
          secondHour: null,
          thirdHour: null,
          fourthHour: null,
          fifthHourFall: null,
          fifthHourSpring: null,
          registeredOn: null,
        });
      }

      res.json({ 
        message: "All course selections have been reset",
        studentsUpdated: students.length
      });
    } catch (error) {
      console.error("Error resetting course selections:", error);
      res.status(500).json({ message: "Failed to reset course selections" });
    }
  });

  // Store for active jobs
  const activeJobs = new Map<string, {
    process?: any;
    output: string;
    completed: boolean;
    success: boolean;
    error?: string;
    clients: Set<any>;
  }>();

  // Development routes (admin only) - Claude-based implementation
  app.post("/api/develop/execute", requireAdmin, async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Generate unique job ID
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Initialize job state
      activeJobs.set(jobId, {
        output: '',
        completed: false,
        success: false,
        clients: new Set()
      });

      // Return immediately with job ID
      res.json({ jobId, message: "Job started" });

      // Start the Claude-based development process asynchronously
      setImmediate(async () => {
        const job = activeJobs.get(jobId)!;
        
        try {
          // Import the Claude development service
          const { executeClaude } = await import('./claude-development');
          await executeClaude(prompt, job, broadcastToClients);

          const { execSync, spawn } = await import('child_process');
          
          // Build context first
          try {
            execSync("./build_context.sh", { cwd: '/home/jeff/CHEC-Portal' });
            job.output += "Context built successfully\n";
            broadcastToClients(job, { type: 'output', data: job.output });
          } catch (error) {
            job.output += `Context build failed: ${error}\n`;
            broadcastToClients(job, { type: 'output', data: job.output });
          }

          // Set working directory to project root
          const workingDir = '/home/jeff/CHEC-Portal';
          
          // Construct aider command
          const aiderArgs = [
            '--model', 'sonnet',
            '--load', 'context',
            '--message', `"${prompt}"`
          ];
          console.log(aiderArgs);

          const aiderProcess = spawn('aider', aiderArgs, {
            cwd: workingDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
          });

          job.process = aiderProcess;

          // Stream stdout
          aiderProcess.stdout.on('data', (data) => {
            const chunk = data.toString();
            job.output += chunk;
            broadcastToClients(job, { type: 'output', data: chunk });
          });

          // Stream stderr
          aiderProcess.stderr.on('data', (data) => {
            const chunk = data.toString();
            job.output += chunk;
            broadcastToClients(job, { type: 'output', data: chunk });
          });

          // Handle process completion
          aiderProcess.on('close', (code) => {
            console.log("Aider on close: " + code);
            job.completed = true;
            job.success = code === 0;
            
            const finalMessage = job.success 
              ? '\n✅ Command completed successfully' 
              : '\n❌ Command failed';
            
            job.output += finalMessage;
            
            broadcastToClients(job, { 
              type: 'complete', 
              data: finalMessage,
              success: job.success 
            });

            // Clean up after 5 minutes
            setTimeout(() => {
              activeJobs.delete(jobId);
            }, 5 * 60 * 1000);
          });

          aiderProcess.on('error', (error) => {
            console.log("Aider on error: " + error);
            job.completed = true;
            job.success = false;
            job.error = error.message;
            
            const errorMessage = `\n❌ Process error: ${error.message}`;
            job.output += errorMessage;
            
            broadcastToClients(job, { 
              type: 'complete', 
              data: errorMessage,
              success: false,
              error: error.message 
            });
          });

        } catch (error) {
          console.error("Error executing aider:", error);
          job.completed = true;
          job.success = false;
          job.error = (error as Error).message;
          
          const errorMessage = `\n❌ Execution error: ${(error as Error).message}`;
          job.output += errorMessage;
          
          broadcastToClients(job, { 
            type: 'complete', 
            data: errorMessage,
            success: false,
            error: (error as Error).message 
          });
        }
      });

    } catch (error) {
      console.error("Error in develop/execute:", error);
      res.status(500).json({ error: "Failed to start Claude development process" });
    }
  });

  // SSE endpoint for streaming job output
  app.get("/api/develop/stream/:jobId", requireAdmin, (req, res) => {
    const { jobId } = req.params;
    const job = activeJobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Add client to job's client set
    job.clients.add(res);

    // Send existing output if any
    if (job.output) {
      res.write(`data: ${JSON.stringify({ type: 'output', data: job.output })}\n\n`);
    }

    // Send completion status if already completed
    if (job.completed) {
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        success: job.success,
        error: job.error 
      })}\n\n`);
    }

    // Handle client disconnect
    req.on('close', () => {
      job.clients.delete(res);
    });
  });

  // Helper function to broadcast to all clients of a job
  function broadcastToClients(job: any, message: any) {
    const data = `data: ${JSON.stringify(message)}\n\n`;
    job.clients.forEach((client: any) => {
      try {
        client.write(data);
      } catch (error) {
        // Remove dead clients
        job.clients.delete(client);
      }
    });
  }

  // Get job status
  app.get("/api/develop/status/:jobId", requireAdmin, (req, res) => {
    const { jobId } = req.params;
    const job = activeJobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({
      jobId,
      completed: job.completed,
      success: job.success,
      error: job.error,
      output: job.output
    });
  });

  app.post("/api/develop/deploy", requireAdmin, async (req, res) => {
    try {
      // Import child_process
      const { spawn } = await import('child_process');
      
      // Set working directory to project root
      const workingDir = '/home/jeff/CHEC-Portal';
      
      let buildOutput = '';
      let deployOutput = '';
      let buildSuccess = false;

      try {
        // Step 1: Run npm run build
        const buildProcess = spawn('npm', ['run', 'build'], {
          cwd: workingDir,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true
        });

        // Collect build output
        buildProcess.stdout.on('data', (data) => {
          buildOutput += data.toString();
        });

        buildProcess.stderr.on('data', (data) => {
          buildOutput += data.toString();
        });

        // Wait for build to complete
        const buildCode = await new Promise((resolve, reject) => {
          buildProcess.on('close', (code) => {
            resolve(code);
          });

          buildProcess.on('error', (error) => {
            buildOutput += `\nBuild process error: ${error.message}`;
            reject(error);
          });
        });

        buildSuccess = buildCode === 0;

        if (!buildSuccess) {
          return res.json({
            success: false,
            buildOutput,
            error: 'Build failed - deployment aborted'
          });
        }

        // Step 2: Run PM2 restart if build succeeded
        const deployProcess = spawn('pm2', ['restart', 'CHEC-Portal'], {
          cwd: workingDir,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true
        });

        // Collect deploy output
        deployProcess.stdout.on('data', (data) => {
          deployOutput += data.toString();
        });

        deployProcess.stderr.on('data', (data) => {
          deployOutput += data.toString();
        });

        // Wait for deployment to complete
        const deployCode = await new Promise((resolve, reject) => {
          deployProcess.on('close', (code) => {
            resolve(code);
          });

          deployProcess.on('error', (error) => {
            deployOutput += `\nDeploy process error: ${error.message}`;
            reject(error);
          });
        });

        const deploySuccess = deployCode === 0;

        res.json({
          success: deploySuccess,
          buildOutput,
          deployOutput,
          error: deploySuccess ? undefined : 'Deployment failed'
        });

      } catch (error) {
        console.error("Error during deployment:", error);
        res.json({
          success: false,
          buildOutput,
          deployOutput,
          error: (error as Error).message
        });
      }

    } catch (error) {
      console.error("Error in develop/deploy:", error);
      res.status(500).json({ error: "Failed to deploy application" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
