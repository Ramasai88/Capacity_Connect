import { NextRequest } from "next/server";
import { GET as listEmployees, POST as createEmployee } from "../app/api/employees/route";
import { GET as getEmployee, PATCH as updateEmployee, DELETE as deleteEmployee } from "../app/api/employees/[id]/route";

async function runManualApiVerification() {
  console.log("=== MANUAL EMPLOYEE API VERIFICATION ===");

  // 1. GET /api/employees
  const req1 = new NextRequest("http://localhost:3000/api/employees?limit=3");
  const res1 = await listEmployees(req1);
  const json1 = await res1.json();
  console.log("1. GET /api/employees -> Status:", res1.status, "| Success:", json1.success, "| Count:", json1.data?.length);

  // 2. GET /api/employees/emp-1
  const req2 = new NextRequest("http://localhost:3000/api/employees/emp-1");
  const res2 = await getEmployee(req2, { params: { id: "emp-1" } });
  const json2 = await res2.json();
  console.log("2. GET /api/employees/emp-1 -> Status:", res2.status, "| Employee:", json2.data?.name, "| Skill Gaps:", json2.data?.skillGaps?.length);

  // 3. POST /api/employees (Validation Failure)
  const req3 = new NextRequest("http://localhost:3000/api/employees", {
    method: "POST",
    body: JSON.stringify({ name: "A", email: "invalid-email" }),
  });
  const res3 = await createEmployee(req3);
  const json3 = await res3.json();
  console.log("3. POST /api/employees (Invalid) -> Status:", res3.status, "| Error Code:", json3.error?.code);

  // 4. POST /api/employees (Successful Creation)
  const uniqueCode = `EMP-${Date.now()}`;
  const req4 = new NextRequest("http://localhost:3000/api/employees", {
    method: "POST",
    body: JSON.stringify({
      name: "Manual Test Engineer",
      email: `manual.test.${Date.now()}@klu.edu`,
      employeeCode: uniqueCode,
      department: "Cloud Engineering",
      designationId: "desig-swe",
      status: "ACTIVE",
      competencies: [{ competencyId: "comp-python", currentLevel: 3 }],
    }),
  });
  const res4 = await createEmployee(req4);
  const json4 = await res4.json();
  console.log("4. POST /api/employees (Valid) -> Status:", res4.status, "| Created ID:", json4.data?.id);

  const createdId = json4.data?.id;

  if (createdId) {
    // 5. PATCH /api/employees/:id
    const req5 = new NextRequest(`http://localhost:3000/api/employees/${createdId}`, {
      method: "PATCH",
      body: JSON.stringify({
        department: "Site Reliability Engineering",
        competencies: [{ competencyId: "comp-python", currentLevel: 4 }],
      }),
    });
    const res5 = await updateEmployee(req5, { params: { id: createdId } });
    const json5 = await res5.json();
    console.log("5. PATCH /api/employees/:id -> Status:", res5.status, "| Updated Dept:", json5.data?.department);

    // 6. DELETE /api/employees/:id (Deactivate)
    const req6 = new NextRequest(`http://localhost:3000/api/employees/${createdId}`, {
      method: "DELETE",
    });
    const res6 = await deleteEmployee(req6, { params: { id: createdId } });
    const json6 = await res6.json();
    console.log("6. DELETE /api/employees/:id -> Status:", res6.status, "| Deactivated Status:", json6.data?.status);
  }

  // 7. GET /api/employees/non-existent
  const req7 = new NextRequest("http://localhost:3000/api/employees/non-existent-999");
  const res7 = await getEmployee(req7, { params: { id: "non-existent-999" } });
  const json7 = await res7.json();
  console.log("7. GET /api/employees/non-existent -> Status:", res7.status, "| Error Code:", json7.error?.code);

  console.log("=========================================");
}

runManualApiVerification();