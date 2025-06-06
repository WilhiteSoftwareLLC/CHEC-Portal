import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
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
  // Auth middleware
  await setupAuth(app);

  // Auth routes - temporarily disabled for testing
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Return a mock user for testing purposes
      const mockUser = {
        id: "test-user",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User"
      };
      res.json(mockUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.patch("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const studentData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(id, studentData);
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

  app.patch("/api/settings", async (req, res) => {
    try {
      const settingsData = insertSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
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
            fridayScience: studentRow.FridayScience || studentRow.fridayScience || null,
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
          // Map MS Access Course table columns to our schema
          const courseData = {
            courseName: courseRow.CourseName || courseRow.courseName || '',
            offeredFall: courseRow.OfferedFall !== undefined ? Boolean(courseRow.OfferedFall) : true,
            offeredSpring: courseRow.OfferedSpring !== undefined ? Boolean(courseRow.OfferedSpring) : true,
            hour: courseRow.Hour || courseRow.hour || 1,
            fee: courseRow.Fee ? String(courseRow.Fee) : null,
            bookRental: courseRow.BookRental ? String(courseRow.BookRental) : null,
            location: courseRow.Location || courseRow.location || null,
          };

          const course = await storage.createCourse(courseData);
          newCourses++;
          console.log(`New course created: ${courseData.courseName}, newCourses count: ${newCourses}`);
          results.push({ success: true, course, isNew: true });
        } catch (error) {
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

      const results = [];
      for (const gradeRow of grades) {
        try {
          // Map MS Access Grade table columns to our schema
          const gradeData = {
            gradeName: gradeRow.GradeName || gradeRow.gradeName || '',
            code: gradeRow.Code || gradeRow.code || 0,
          };

          const grade = await storage.createGrade(gradeData);
          results.push({ success: true, grade });
        } catch (error) {
          results.push({ success: false, error: (error as Error).message, data: gradeRow });
        }
      }

      res.json({ 
        message: `Processed ${grades.length} grades`, 
        results,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
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

      const results = [];
      for (const hourRow of hours) {
        try {
          // Map MS Access Hour table columns to our schema
          const hourData = {
            id: hourRow.id || hourRow.ID || 0,
            description: hourRow.Description || hourRow.description || '',
          };

          const hour = await storage.createHour(hourData);
          results.push({ success: true, hour });
        } catch (error) {
          results.push({ success: false, error: (error as Error).message, data: hourRow });
        }
      }

      res.json({ 
        message: `Processed ${hours.length} hours`, 
        results,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
    } catch (error) {
      console.error("Error importing hours:", error);
      res.status(500).json({ message: "Failed to import hours" });
    }
  });

  app.post("/api/import/settings", async (req, res) => {
    try {
      const settingsData = req.body;
      
      // Map MS Access Settings table columns to our schema
      const settings = {
        familyFee: settingsData.FamilyFee ? String(settingsData.FamilyFee) : null,
        backgroundFee: settingsData.BackgroundFee ? String(settingsData.BackgroundFee) : null,
        studentFee: settingsData.StudentFee ? String(settingsData.StudentFee) : null,
        schoolYear: settingsData.SchoolYear || settingsData.schoolYear || null,
      };

      const result = await storage.updateSettings(settings);
      res.json({ message: "Settings imported successfully", settings: result });
    } catch (error) {
      console.error("Error importing settings:", error);
      res.status(500).json({ message: "Failed to import settings" });
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

  const httpServer = createServer(app);
  return httpServer;
}