import { NextRequest } from "next/server";
import { GET as listDesignations, POST as createDesignation } from "../app/api/designations/route";
import { GET as getDesignation, PATCH as updateDesignation, DELETE as deleteDesignation } from "../app/api/designations/[id]/route";
import { prisma } from "../lib/db/prisma";

async function runManualDesignationApiVerification() {
  console.log("=== MANUAL DESIGNATION API VERIFICATION ===");

  // 1. GET /api/designations
  const req1 = new NextRequest("http://localhost:3000/api/designations?limit=2");
  const res1 = await listDesignations(req1);
  const json1 = await res1.json();
  console.log("1. GET /api/designations -> Status:", res1.status, "| Success:", json1.success, "| Count:", json1.data?.length);

  // 2. GET /api/designations/desig-swe
  const req2 = new NextRequest("http://localhost:3000/api/designations/desig-swe");
  const res2 = await getDesignation(req2, { params: { id: "desig-swe" } });
  const json2 = await res2.json();
  console.log("2. GET /api/designations/desig-swe -> Status:", res2.status, "| Title:", json2.data?.title, "| Requirements Count:", json2.data?.requirements?.length);

  // 3. POST /api/designations (Validation Failure: Duplicate Competencies)
  const req3 = new NextRequest("http://localhost:3000/api/designations", {
    method: "POST",
    body: JSON.stringify({
      title: "QA Engineer",
      code: "QA",
      competencyRequirements: [
        { competencyId: "comp-python", requiredLevel: 3 },
        { competencyId: "comp-python", requiredLevel: 4 },
      ],
    }),
  });
  const res3 = await createDesignation(req3);
  const json3 = await res3.json();
  console.log("3. POST /api/designations (Duplicate Competencies) -> Status:", res3.status, "| Error Code:", json3.error?.code);

  // 4. POST /api/designations (Successful Creation with requirements)
  const uniqueCode = `DES-MANUAL-${Date.now()}`;
  const req4 = new NextRequest("http://localhost:3000/api/designations", {
    method: "POST",
    body: JSON.stringify({
      title: "Cloud Infrastructure Specialist",
      code: uniqueCode,
      department: "Cloud Operations",
      description: "Manages multi-region cloud architecture and observability.",
      competencyRequirements: [
        { competencyId: "comp-python", requiredLevel: 4 },
        { competencyId: "comp-sql", requiredLevel: 3 },
      ],
    }),
  });
  const res4 = await createDesignation(req4);
  const json4 = await res4.json();
  console.log("4. POST /api/designations (Valid) -> Status:", res4.status, "| Created ID:", json4.data?.id, "| Requirements:", json4.data?.requirements?.length);

  const createdId = json4.data?.id;

  if (createdId) {
    // 5. PATCH /api/designations/:id (Replace Requirements)
    const req5 = new NextRequest(`http://localhost:3000/api/designations/${createdId}`, {
      method: "PATCH",
      body: JSON.stringify({
        department: "Global Cloud Engineering",
        competencyRequirements: [
          { competencyId: "comp-python", requiredLevel: 5 },
          { competencyId: "comp-leadership", requiredLevel: 3 },
        ],
      }),
    });
    const res5 = await updateDesignation(req5, { params: { id: createdId } });
    const json5 = await res5.json();
    console.log("5. PATCH /api/designations/:id -> Status:", res5.status, "| Updated Dept:", json5.data?.department, "| New Reqs:", json5.data?.requirements?.length);

    // 6. DELETE /api/designations/:id (Unassigned Designation Deletion)
    const req6 = new NextRequest(`http://localhost:3000/api/designations/${createdId}`, {
      method: "DELETE",
    });
    const res6 = await deleteDesignation(req6, { params: { id: createdId } });
    const json6 = await res6.json();
    console.log("6. DELETE /api/designations/:id (Unassigned) -> Status:", res6.status, "| Message:", json6.message);
  }

  // 7. DELETE /api/designations/desig-swe (Blocked: In Use)
  const req7 = new NextRequest("http://localhost:3000/api/designations/desig-swe", {
    method: "DELETE",
  });
  const res7 = await deleteDesignation(req7, { params: { id: "desig-swe" } });
  const json7 = await res7.json();
  console.log("7. DELETE /api/designations/desig-swe (In Use) -> Status:", res7.status, "| Error Code:", json7.error?.code, "| Block Reason:", json7.error?.message);

  // 8. GET /api/designations/non-existent
  const req8 = new NextRequest("http://localhost:3000/api/designations/non-existent-desig");
  const res8 = await getDesignation(req8, { params: { id: "non-existent-desig" } });
  const json8 = await res8.json();
  console.log("8. GET /api/designations/non-existent -> Status:", res8.status, "| Error Code:", json8.error?.code);

  console.log("============================================");
  await prisma.$disconnect();
}

runManualDesignationApiVerification();
