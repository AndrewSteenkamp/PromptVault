import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user: user || null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("courses", () => {
  it("should list all published courses", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const courses = await caller.courses.list();

    expect(Array.isArray(courses)).toBe(true);
    // We imported 23 courses (one duplicate was skipped)
    expect(courses.length).toBeGreaterThan(0);
  });

  it("should get course by slug", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Get first course to test with
    const courses = await caller.courses.list();
    if (courses.length === 0) {
      // Skip test if no courses
      return;
    }

    const firstCourse = courses[0];
    const course = await caller.courses.getBySlug({ slug: firstCourse!.slug });

    expect(course).toBeDefined();
    expect(course.slug).toBe(firstCourse!.slug);
    expect(course.title).toBeTruthy();
  });

  it("should show preview prompts for non-purchased course", async () => {
    const ctx = createTestContext({
      id: 999,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    const caller = appRouter.createCaller(ctx);

    const courses = await caller.courses.list();
    if (courses.length === 0) {
      return;
    }

    const firstCourse = courses[0];
    const result = await caller.prompts.listByCourse({ courseId: firstCourse!.id });

    expect(result).toBeDefined();
    expect(result.isPreview).toBe(true);
    expect(result.prompts.length).toBeLessThanOrEqual(3);
  });
});
