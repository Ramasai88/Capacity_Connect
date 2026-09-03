import { describe, it, expect } from "vitest";
import { loginSchema, signupSchema } from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = loginSchema.safeParse({
      email: "admin@klu.edu",
      password: "Admin@123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "Admin@123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "admin@klu.edu",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing email", () => {
    const result = loginSchema.safeParse({
      password: "Admin@123",
    });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  const validSignupData = {
    name: "John Doe",
    email: "john.doe@example.com",
    password: "Password123",
    confirmPassword: "Password123",
  };

  it("accepts valid registration input", () => {
    const result = signupSchema.safeParse(validSignupData);
    expect(result.success).toBe(true);
  });

  it("rejects empty or whitespace-only name", () => {
    const result = signupSchema.safeParse({
      ...validSignupData,
      name: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = signupSchema.safeParse({
      ...validSignupData,
      name: "J",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = signupSchema.safeParse({
      ...validSignupData,
      email: "invalid-email-address",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      ...validSignupData,
      password: "Pass1",
      confirmPassword: "Pass1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched password and confirmPassword", () => {
    const result = signupSchema.safeParse({
      ...validSignupData,
      password: "Password123",
      confirmPassword: "DifferentPassword456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("confirmPassword"));
      expect(issue?.message).toBe("Passwords do not match");
    }
  });

  it("rejects missing confirmPassword", () => {
    const result = signupSchema.safeParse({
      name: "John Doe",
      email: "john.doe@example.com",
      password: "Password123",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });
});

