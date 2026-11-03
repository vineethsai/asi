import { Suspense, lazy, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

// Loaded on demand so the quiz generator and its datasets stay out of the Home chunk.
const ChallengeQuiz = lazy(() => import("./ChallengeQuiz"));

/** Home "Agentic Security Challenge": a button that mounts the lazy quiz in place (P4-02). */
export function ChallengeSection() {
  const [started, setStarted] = useState(false);
  return (
    <section className="py-12 lg:py-16" aria-labelledby="challenge-title">
      <div className="container px-4 md:px-6">
        <div className="rounded-xl border bg-muted/20 p-4 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Trophy className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 id="challenge-title" className="text-xl font-semibold tracking-tight">
                  Agentic Security Challenge
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Questions drawn from every dataset on the site, with a new set each day. Your best
                  score is saved in this browser.
                </p>
              </div>
            </div>
            {!started && (
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <Button onClick={() => setStarted(true)}>
                  Start the challenge <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Button>
                <Link
                  to="/learn#challenge"
                  className="link-underline text-sm text-muted-foreground hover:text-foreground"
                >
                  or take it on the learning page
                </Link>
              </div>
            )}
          </div>
          {started && (
            <div className="mt-5">
              <Suspense
                fallback={
                  <div className="space-y-3" role="status" aria-label="Loading the challenge">
                    <div className="skeleton h-6 w-2/3" />
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="skeleton h-11 w-full" />
                    ))}
                  </div>
                }
              >
                <ChallengeQuiz />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ChallengeSection;
