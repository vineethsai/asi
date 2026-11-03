import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Quiz } from "@/components/quiz/Quiz";
import { useProgressStore } from "@/lib/progress";
import type { QuizQuestion } from "@/data/quizzes";

const quizComplete = vi.fn();
vi.mock("@/lib/analytics", () => ({
  trackPageEvents: { quizComplete: (...args: unknown[]) => quizComplete(...args) },
}));
const confetti = vi.fn();
vi.mock("canvas-confetti", () => ({ default: (...args: unknown[]) => confetti(...args) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const q = (n: number, answerIndex: number): QuizQuestion => ({
  id: `test:${n}`,
  kind: "threat-kc",
  prompt: `Question number ${n}?`,
  choices: ["Alpha", "Bravo", "Charlie", "Delta"],
  answerIndex,
  explanation: `Because of reason ${n}.`,
  link: { href: "/threats/t1", label: `Open T${n}` },
});

const QUESTIONS = [q(1, 0), q(2, 1), q(3, 2), q(4, 3), q(5, 0)];

function renderQuiz(onComplete = vi.fn()) {
  render(
    <MemoryRouter>
      <Quiz quizId="test-quiz" title="Test quiz" questions={QUESTIONS} onComplete={onComplete} />
    </MemoryRouter>,
  );
  return onComplete;
}

describe("<Quiz>", () => {
  beforeEach(() => {
    act(() => useProgressStore.getState().reset());
    quizComplete.mockClear();
    confetti.mockClear();
  });

  it("answers with number keys, shows feedback and records a passing score", async () => {
    const onComplete = renderQuiz();
    const group = screen.getByRole("group", { name: "Test quiz" });
    expect(screen.getByText("Question 1 of 5")).toBeInTheDocument();

    // Q1: correct with "1".
    fireEvent.keyDown(group, { key: "1" });
    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(screen.getByText("Because of reason 1.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open T1/ })).toHaveAttribute("href", "/threats/t1");
    fireEvent.keyDown(group, { key: "ArrowRight" });

    // Q2–Q4 correct, Q5 wrong → 4/5 = 80 % → pass.
    for (const key of ["2", "3", "4", "2"]) {
      fireEvent.keyDown(screen.getByRole("group", { name: "Test quiz" }), { key });
      const next = screen.getByRole("button", { name: /Next question|See results/ });
      fireEvent.click(next);
    }

    expect(screen.getByText(/4 of 5 correct/)).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ score: 4, total: 5, passed: true, firstPass: true }),
    );
    expect(useProgressStore.getState().quizzes["test-quiz"]).toMatchObject({ score: 4, total: 5 });
    expect(quizComplete).toHaveBeenCalledWith(80, "test-quiz");
    await vi.dynamicImportSettled();
  });

  it("marks a wrong answer and keeps the best score on a worse retake", () => {
    act(() => useProgressStore.getState().recordQuiz("test-quiz", 5, 5));
    const onComplete = renderQuiz();
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole("button", { name: /Delta/ }));
      if (i === 0) expect(screen.getByText("Not quite.")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /Next question|See results/ }));
    }
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ score: 1, passed: false, firstPass: false }),
    );
    expect(useProgressStore.getState().quizzes["test-quiz"]).toMatchObject({ score: 5 });
    expect(confetti).not.toHaveBeenCalled();
  });

  it("moves focus between choices with arrow keys", () => {
    renderQuiz();
    const options = screen
      .getAllByRole("button")
      .filter((b) => /Alpha|Bravo|Charlie|Delta/.test(b.textContent ?? ""));
    options[0].focus();
    fireEvent.keyDown(options[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(options[1]);
    fireEvent.keyDown(options[1], { key: "ArrowUp" });
    fireEvent.keyDown(options[0], { key: "ArrowUp" });
    expect(document.activeElement).toBe(options[3]);
  });
});
