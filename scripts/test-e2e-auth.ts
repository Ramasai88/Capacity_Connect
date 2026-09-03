function extractCookieHeader(setCookieHeaders: string[] | string): string {
  const cookies: string[] = [];
  const rawList = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];

  for (const raw of rawList) {
    // Each raw Set-Cookie header starts with `name=value; ...`
    const parts = raw.split(";")[0].trim();
    if (parts && parts.includes("=")) {
      cookies.push(parts);
    }
  }

  return cookies.join("; ");
}

async function testFullLoginFlow(baseUrl: string, email: string, pass: string, roleName: string) {
  console.log(`\n======================================================`);
  console.log(`TESTING LOGIN FLOW FOR ${roleName}: ${email}`);
  console.log(`======================================================`);

  // Step 1: Fetch CSRF Token
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  
  // Extract CSRF cookie
  const csrfSetCookie = (csrfRes.headers as any).getSetCookie 
    ? (csrfRes.headers as any).getSetCookie() 
    : [csrfRes.headers.get("set-cookie") || ""];
  
  const csrfCookieHeader = extractCookieHeader(csrfSetCookie);
  console.log(`1. CSRF Token obtained: ${csrfToken ? "✅" : "❌"}`);

  // Step 2: Submit Credentials to NextAuth
  const formData = new URLSearchParams();
  formData.append("email", email);
  formData.append("password", pass);
  formData.append("csrfToken", csrfToken);
  formData.append("json", "true");

  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookieHeader,
    },
    body: formData.toString(),
  });

  console.log(`2. Login POST Status: ${loginRes.status} (${loginRes.status === 200 ? "✅ OK" : "❌ FAILED"})`);
  const loginJson = await loginRes.json();
  console.log(`   Response JSON:`, loginJson);

  // Extract Session Cookie
  const loginSetCookie = (loginRes.headers as any).getSetCookie 
    ? (loginRes.headers as any).getSetCookie() 
    : [loginRes.headers.get("set-cookie") || ""];
  
  const sessionCookieHeader = extractCookieHeader(loginSetCookie);
  console.log(`   Session Token Cookie received: ${sessionCookieHeader.includes("next-auth.session-token") ? "✅ YES" : "❌ NO"}`);

  // Step 3: Fetch Protected Session
  const combinedCookies = [csrfCookieHeader, sessionCookieHeader].filter(Boolean).join("; ");
  const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      "Cookie": combinedCookies,
    },
  });

  const session = await sessionRes.json();
  console.log(`3. Session API Output:`, JSON.stringify(session, null, 2));

  if (session && session.user && session.user.role) {
    console.log(`✅ RESULT: User successfully authenticated as ${session.user.role} (${session.user.name})`);
  } else {
    console.log(`❌ RESULT: Session was empty or missing user role!`);
  }
}

async function runAll() {
  const port = 3001;
  const baseUrl = `http://localhost:${port}`;

  console.log(`\nTesting against Next.js instance on ${baseUrl}`);

  await testFullLoginFlow(baseUrl, "admin@capacityconnect.demo", "Admin@123", "ADMIN");
  await testFullLoginFlow(baseUrl, "sarah.jenkins@capacityconnect.demo", "Manager@123", "MANAGER");
  await testFullLoginFlow(baseUrl, "ravi.kumar@capacityconnect.demo", "Employee@123", "EMPLOYEE");
}

runAll().catch(console.error);
