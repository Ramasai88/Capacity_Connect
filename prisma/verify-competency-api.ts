import { NextRequest } from "next/server";
import { GET as listCompetencies, POST as createCompetency } from "../app/api/competencies/route";
import { GET as getCompetency, PATCH as updateCompetency, DELETE as deleteCompetency } from "../app/api/competencies/[id]/route";
import { prisma } from "../lib/db/prisma";

async function runManualCompetencyApiVerification() {
  console.log("=== MANUAL COMPETENCY API VERIFICATION ===");

  // 1. GET /api/competencies
  const req1 = new NextRequest("http://localhost:3000/api/competencies?limit=3");
  const res1 = await listCompetencies(req1);
  const json1 = await res1.json();
  console.log("1. GET /api/competencies -> Status:", res1.status, "| Success:", json1.success, "| Count:", json1.data?.length);

  // 2. GET /api/competencies/comp-python
  const req2 = new NextRequest("http://localhost:3000/api/competencies/comp-python");
  const res2 = await getCompetency(req2, { params: { id: "comp-python" } });
  const json2 = await res2.json();
  console.log("2. GET /api/competencies/comp-python -> Status:", res2.status, "| Competency:", json2.data?.name, "| Levels Count:", json2.data?.levels?.length);

  // 3. POST /api/competencies (Validation Failure)
  const req3 = new NextRequest("http://localhost:3000/api/competencies", {
    method: "POST",
    body: JSON.stringify({ name: "A", code: "INVALID CODE WITH SPACES" }),
  });
  const res3 = await createCompetency(req3);
  const json3 = await res3.json();
  console.log("3. POST /api/competencies (Invalid) -> Status:", res3.status, "| Error Code:", json3.error?.code);

  // 4. POST /api/competencies (Successful Creation with 5-level rubric)
  const uniqueCode = `COMP-MANUAL-${Date.now()}`;
  const req4 = new NextRequest("http://localhost:3000/api/competencies", {
    method: "POST",
    body: JSON.stringify({
      name: "Autonomous Agent Engineering",
      code: uniqueCode,
      category: "Artificial Intelligence",
      description: "Developing autonomous tool-calling LLM agents and multi-agent workflows.",
    }),
  });
  const res4 = await createCompetency(req4);
  const json4 = await res4.json();
  console.log("4. POST /api/competencies (Valid) -> Status:", res4.status, "| Created ID:", json4.data?.id, "| Levels Provisioned:", json4.data?.levels?.length);

  const createdId = json4.data?.id;

  if (createdId) {
    // 5. PATCH /api/competencies/:id
    const req5 = new NextRequest(`http://localhost:3000/api/competencies/${createdId}`, {
      method: "PATCH",
      body: JSON.stringify({
        description: "Updated description for autonomous agents.",
      }),
    });
    const res5 = await updateCompetency(req5, { params: { id: createdId } });
    const json5 = await res5.json();
    console.log("5. PATCH /api/competencies/:id -> Status:", res5.status, "| Updated Description:", json5.data?.description);

    // 6. DELETE /api/competencies/:id (Unused Competency Deletion)
    const req6 = new NextRequest(`http://localhost:3000/api/competencies/${createdId}`, {
      method: "DELETE",
    });
    const res6 = await deleteCompetency(req6, { params: { id: createdId } });
    const json6 = await res6.json();
    console.log("6. DELETE /api/competencies/:id (Unused) -> Status:", res6.status, "| Message:", json6.message);
  }

  // 7. DELETE /api/competencies/comp-python (Blocked by Dependencies)
  const req7 = new NextRequest("http://localhost:3000/api/competencies/comp-python", {
    method: "DELETE",
  });
  const res7 = await deleteCompetency(req7, { params: { id: "comp-python" } });
  const json7 = await res7.json();
  console.log("7. DELETE /api/competencies/comp-python (In Use) -> Status:", res7.status, "| Error Code:", json7.error?.code, "| Block Reason:", json7.error?.message);

  // 8. GET /api/competencies/non-existent
  const req8 = new NextRequest("http://localhost:3000/api/competencies/non-existent-comp");
  const res8 = await getCompetency(req8, { params: { id: "non-existent-comp" } });
  const json8 = await res8.json();
  console.log("8. GET /api/competencies/non-existent -> Status:", res8.status, "| Error Code:", json8.error?.code);

  console.log("==========================================");
  await prisma.$disconnect();
}

runManualCompetencyApiVerification();
