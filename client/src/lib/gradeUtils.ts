import type { Grade } from "@shared/schema";

export interface SortableGrade {
  display: string;    // "9th", "10th", "K", etc.
  sortOrder: number;  // The numeric code for proper sorting
}

export function getCurrentGradeCode(
  gradYear: string | number | null | undefined,
  settings: any
): number | null {
  if (!gradYear || !settings) return null;
  
  const schoolYear = parseInt((settings as any).SchoolYear || "2024");
  const graduationYear = parseInt(String(gradYear));
  const gradeCode = schoolYear - graduationYear + 13;
  
  return gradeCode;
}

export function getCurrentGradeString(
  gradYear: string | number | null | undefined,
  settings: any,
  grades: Grade[]
): string {
  if (!grades) return "Unknown";
  
  const gradeCode = getCurrentGradeCode(gradYear, settings);
  if (gradeCode === null) return "Unknown";
  
  const grade = grades.find((g: Grade) => g.code === gradeCode);
  return grade ? grade.gradeName : `Grade ${gradeCode}`;
}

export function getCurrentSortableGrade(
  gradYear: string | number | null | undefined,
  settings: any,
  grades: Grade[]
): SortableGrade {
  if (!grades) return { display: "Unknown", sortOrder: 999 };
  
  const gradeCode = getCurrentGradeCode(gradYear, settings);
  if (gradeCode === null) return { display: "Unknown", sortOrder: 999 };
  
  const grade = grades.find((g: Grade) => g.code === gradeCode);
  return {
    display: grade ? grade.gradeName : `Grade ${gradeCode}`,
    sortOrder: gradeCode
  };
}
