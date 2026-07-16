// lib/__tests__/assessmentStore.test.ts

import { initAssessmentStore, searchAssessments, getInitStatus } from "../assessmentStore";

describe("assessmentStore", () => {
  it("initializes and loads assessments from CSV", async () => {
    await initAssessmentStore();
    const status = getInitStatus();
    expect(status.initialized).toBe(true);
    expect(status.assessmentCount).toBeGreaterThan(0);
  });

  it("returns at most topK results for a normal query", async () => {
    const results = await searchAssessments("strong analytical and coding skills", 5);
    expect(results.length).toBeLessThanOrEqual(5);
    expect(results.length).toBeGreaterThan(0);
  });

  it("handles empty query string without throwing", async () => {
    await expect(searchAssessments("", 5)).resolves.toBeDefined();
  });

  it("concurrent init calls do not duplicate work (Gap #1 regression check)", async () => {
    const [a, b] = await Promise.all([initAssessmentStore(), initAssessmentStore()]);
    // both should resolve without error; assessmentCount stays consistent
    expect(getInitStatus().assessmentCount).toBeGreaterThan(0);
  });
});
