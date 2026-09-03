import { NextRequest } from "next/server";
import { GET as listCourses, POST as createCourse } from "../app/api/courses/route";
import { POST as enrollCourse } from "../app/api/courses/[id]/enroll/route";
import { POST as completeModule } from "../app/api/courses/[id]/modules/[moduleId]/complete/route";
import { GET as listReassessments } from "../app/api/reassessments/route";
import { POST as reviewReassessment } from "../app/api/reassessments/[id]/review/route";
import { GET as listSkillGaps } from "../app/api/skill-gaps/route";
import { GET as getSkillGapSummary } from "../app/api/skill-gaps/summary/route";
import { GET as getReportSummary } from "../app/api/reports/summary/route";
import { GET as getOrg, PATCH as updateOrg } from "../app/api/organization/route";
import { prisma } from "../lib/db/prisma";

async function verifyAllRemainingEndpoints() {
  console.log("=== COMPREHENSIVE BACKEND API VERIFICATION ===");

  // 1. Course API
  const reqCourses = new NextRequest("http://localhost:3000/api/courses?limit=3");
  const resCourses = await listCourses(reqCourses);
  const jsonCourses = await resCourses.json();
  console.log("1. GET /api/courses -> Status:", resCourses.status, "| Count:", jsonCourses.data?.length);

  // 2. Organization API
  const reqOrg = new NextRequest("http://localhost:3000/api/organization");
  const resOrg = await getOrg(reqOrg);
  const jsonOrg = await resOrg.json();
  console.log("2. GET /api/organization -> Status:", resOrg.status, "| Name:", jsonOrg.data?.name);

  // 3. Skill Gap API
  const reqGaps = new NextRequest("http://localhost:3000/api/skill-gaps");
  const resGaps = await listSkillGaps(reqGaps);
  const jsonGaps = await resGaps.json();
  console.log("3. GET /api/skill-gaps -> Status:", resGaps.status, "| Employees with gaps:", jsonGaps.data?.length);

  const reqSummary = new NextRequest("http://localhost:3000/api/skill-gaps/summary");
  const resSummary = await getSkillGapSummary(reqSummary);
  const jsonSummary = await resSummary.json();
  console.log("4. GET /api/skill-gaps/summary -> Status:", resSummary.status, "| Total Employees:", jsonSummary.data?.totalEmployees, "| Total Gaps:", jsonSummary.data?.totalGapsIdentified);

  // 5. Reports Summary API
  const reqReport = new NextRequest("http://localhost:3000/api/reports/summary");
  const resReport = await getReportSummary(reqReport);
  const jsonReport = await resReport.json();
  console.log("5. GET /api/reports/summary -> Status:", resReport.status, "| Readiness %:", jsonReport.data?.metrics?.overallReadinessPercent, "%");

  // 6. Reassessments API
  const reqReassess = new NextRequest("http://localhost:3000/api/reassessments");
  const resReassess = await listReassessments(reqReassess);
  const jsonReassess = await resReassess.json();
  console.log("6. GET /api/reassessments -> Status:", resReassess.status, "| Pending Count:", jsonReassess.data?.length);

  console.log("===============================================");
  await prisma.$disconnect();
}

verifyAllRemainingEndpoints();
