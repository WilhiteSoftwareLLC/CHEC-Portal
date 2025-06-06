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
      for (const familyData of families) {
        try {
          const validatedFamily = insertFamilySchema.parse(familyData);
          const family = await storage.createFamily(validatedFamily);
          results.push({ success: true, family });
        } catch (error) {
          results.push({ success: false, error: error.message, data: familyData });
        }
      }

      res.json({ 
        message: `Processed ${families.length} families`, 
        results,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
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
      for (const studentData of students) {
        try {
          const validatedStudent = insertStudentSchema.parse(studentData);
          const student = await storage.createStudent(validatedStudent);
          results.push({ success: true, student });
        } catch (error) {
          results.push({ success: false, error: error.message, data: studentData });
        }
      }

      res.json({ 
        message: `Processed ${students.length} students`, 
        results,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
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

      const results = [];
      for (const courseData of courses) {
        try {
          const validatedCourse = insertCourseSchema.parse(courseData);
          const course = await storage.createCourse(validatedCourse);
          results.push({ success: true, course });
        } catch (error) {
          results.push({ success: false, error: error.message, data: courseData });
        }
      }

      res.json({ 
        message: `Processed ${courses.length} courses`, 
        results,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
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

      const results = [];
      for (const classData of classes) {
        try {
          const validatedClass = insertClassSchema.parse(classData);
          const newClass = await storage.createClass(validatedClass);
          results.push({ success: true, class: newClass });
        } catch (error) {
          results.push({ success: false, error: error.message, data: classData });
        }
      }

      res.json({ 
        message: `Processed ${classes.length} classes`, 
        results,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
    } catch (error) {
      console.error("Error importing classes:", error);
      res.status(500).json({ message: "Failed to import classes" });
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