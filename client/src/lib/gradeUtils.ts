import type { Grade } from "@shared/schema";

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
