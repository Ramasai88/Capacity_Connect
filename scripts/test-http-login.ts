async function testLoginHttp(baseUrl: string, email: string, pass: string) {
  console.log(`\nTesting HTTP login on ${baseUrl} for ${email}...`);

  // Step 1: Get CSRF token
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, { signal: AbortSignal.timeout(4000) });
  if (!csrfRes.ok) {
    console.log(`Failed to get CSRF token on ${baseUrl}: status ${csrfRes.status}`);
    return;
  }
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const setCookie = csrfRes.headers.get("set-cookie") || "";
  console.log(`Got CSRF Token: ${csrfToken ? "YES" : "NO"}`);
  console.log(`CSRF Set-Cookie:`, setCookie);

  // Step 2: POST to callback/credentials
  const formData = new URLSearchParams();
  formData.append("email", email);
  formData.append("password", pass);
  formData.append("csrfToken", csrfToken);
  formData.append("json", "true");

  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": setCookie,
    },
    body: formData.toString(),
    redirect: "manual",
    signal: AbortSignal.timeout(4000),
  });

  console.log(`Login response status: ${loginRes.status}`);
  const loginSetCookie = loginRes.headers.get("set-cookie") || "";
  console.log(`Set-Cookie header received: ${loginSetCookie ? "YES" : "NO"}`);
  if (loginSetCookie) {
    console.log(`Login Set-Cookie:`, loginSetCookie);
  }
  
  if (loginRes.headers.get("location")) {
    console.log(`Redirect Location: ${loginRes.headers.get("location")}`);
  }

  const text = await loginRes.text();
  try {
    const json = JSON.parse(text);
    console.log(`Response JSON:`, json);
  } catch {
    console.log(`Response Text (first 200 chars):`, text.substring(0, 200));
  }

  // Step 3: Check session
  const combinedCookies = [setCookie, loginSetCookie].filter(Boolean).join("; ");
  const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      "Cookie": combinedCookies,
    },
    signal: AbortSignal.timeout(4000),
  });
  const sessionData = await sessionRes.json();
  console.log(`Session output:`, JSON.stringify(sessionData, null, 2));
}

async function main() {
  console.log(`\n##################################################`);
  console.log(`CHECKING ACTIVE DEV SERVER ON PORT 3001`);
  console.log(`##################################################`);
  await testLoginHttp(`http://localhost:3001`, "admin@capacityconnect.demo", "Admin@123");
  await testLoginHttp(`http://localhost:3001`, "sarah.jenkins@capacityconnect.demo", "Manager@123");
  await testLoginHttp(`http://localhost:3001`, "ravi.kumar@capacityconnect.demo", "Employee@123");
}

main().catch(console.error);
