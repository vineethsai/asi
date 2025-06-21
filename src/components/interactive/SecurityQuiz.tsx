import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Brain, 
  Shield, 
  Trophy,
  RefreshCw,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  aisvsReference: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
}

interface QuizResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    category: 'Input Validation',
    question: 'Which of the following is the MOST effective defense against prompt injection attacks?',
    options: [
      'Simply filtering out suspicious keywords',
      'Using a multi-layered approach with input validation, instruction hierarchy, and output filtering',
      'Relying only on the AI model\'s built-in safety features',
      'Implementing basic rate limiting'
    ],
    correctAnswer: 1,
    explanation: 'Prompt injection requires a comprehensive defense strategy. A multi-layered approach combining input validation, strict instruction hierarchy, and output filtering provides the most robust protection against sophisticated injection attempts.',
    aisvsReference: 'C2.1 - Prompt-Injection Defense',
    difficulty: 'intermediate',
    points: 15
  },
  {
    id: 'q2',
    category: 'Training Data Security',
    question: 'What is the primary risk of using unvetted third-party datasets for AI training?',
    options: [
      'Increased training time',
      'Higher computational costs',
      'Data poisoning and embedded biases',
      'Reduced model accuracy'
    ],
    correctAnswer: 2,
    explanation: 'Unvetted third-party datasets can contain malicious data designed to poison the model or introduce harmful biases. This can compromise the model\'s integrity and lead to biased or manipulated outputs.',
    aisvsReference: 'C1.8 - Supply Chain Security',
    difficulty: 'beginner',
    points: 10
  },
  {
    id: 'q3',
    category: 'Model Security',
    question: 'Which technique is most effective for detecting adversarial examples in production?',
    options: [
      'Statistical anomaly detection on input embeddings',
      'Simple keyword filtering',
      'Rate limiting requests',
      'User authentication'
    ],
    correctAnswer: 0,
    explanation: 'Statistical anomaly detection on input embeddings can identify inputs that deviate significantly from normal patterns, which is often characteristic of adversarial examples designed to fool the model.',
    aisvsReference: 'C2.2 - Adversarial-Example Resistance',
    difficulty: 'advanced',
    points: 20
  },
  {
    id: 'q4',
    category: 'Data Governance',
    question: 'According to AISVS standards, what should be maintained for significant training datasets?',
    options: [
      'Only the final processed data',
      'Basic file metadata',
      'Data cards or datasheets documenting characteristics, composition, and collection processes',
      'Simple backup copies'
    ],
    correctAnswer: 2,
    explanation: 'AISVS requires maintaining comprehensive "data cards" or "datasheets for datasets" that document characteristics, motivations, composition, collection processes, preprocessing steps, and recommended uses.',
    aisvsReference: 'C1.1 - Training Data Provenance',
    difficulty: 'intermediate',
    points: 15
  },
  {
    id: 'q5',
    category: 'Access Control',
    question: 'What is the minimum security requirement for API endpoints serving AI models?',
    options: [
      'No security needed for internal APIs',
      'Basic password protection',
      'Authentication, authorization, rate limiting, and input validation',
      'Only HTTPS encryption'
    ],
    correctAnswer: 2,
    explanation: 'AI model APIs require comprehensive security including authentication to verify identity, authorization to control access, rate limiting to prevent abuse, and input validation to prevent attacks.',
    aisvsReference: 'C2.3 - Schema, Type & Length Validation',
    difficulty: 'beginner',
    points: 10
  },
  {
    id: 'q6',
    category: 'Monitoring',
    question: 'How frequently should AI model behavior be monitored for drift and anomalies in production?',
    options: [
      'Once per month',
      'Weekly during business hours',
      'Continuously in real-time',
      'Only when users report issues'
    ],
    correctAnswer: 2,
    explanation: 'AI models should be monitored continuously in real-time to detect drift, anomalies, or security issues as they occur. Delayed detection can lead to prolonged exposure to threats.',
    aisvsReference: 'C3.3 - Model Monitoring',
    difficulty: 'intermediate',
    points: 15
  },
  {
    id: 'q7',
    category: 'Privacy',
    question: 'What is the best practice for handling user data deletion requests in AI systems?',
    options: [
      'Simply delete the original data files',
      'Ignore requests for technical reasons',
      'Purge primary and derived data, assess model impact, and retrain if necessary',
      'Mark data as deleted but keep it for model performance'
    ],
    correctAnswer: 2,
    explanation: 'Proper data deletion requires purging both primary and derived data, assessing the impact on affected models, and retraining or recalibrating models if necessary to maintain compliance and model integrity.',
    aisvsReference: 'C1.7 - User Data Deletion & Consent Enforcement',
    difficulty: 'advanced',
    points: 20
  },
  {
    id: 'q8',
    category: 'Content Filtering',
    question: 'What should happen when an AI model generates policy-violating content?',
    options: [
      'Log the incident and return the content with a warning',
      'Return a standardized refusal and prevent propagation to downstream systems',
      'Automatically retrain the model',
      'Ignore the violation if it\'s minor'
    ],
    correctAnswer: 1,
    explanation: 'Policy-violating content should trigger standardized refusals or safe completions and must not propagate to downstream systems. This prevents harmful content from reaching users while maintaining system integrity.',
    aisvsReference: 'C2.4 - Content & Policy Screening',
    difficulty: 'beginner',
    points: 10
  }
];

export const SecurityQuiz: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [difficulty, setDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const filteredQuestions = difficulty === 'all' 
    ? quizQuestions 
    : quizQuestions.filter(q => q.difficulty === difficulty);

  const currentQ = filteredQuestions[currentQuestion];

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestion]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    const timeSpent = Date.now() - questionStartTime;
    const isCorrect = selectedAnswer === currentQ.correctAnswer;

    const result: QuizResult = {
      questionId: currentQ.id,
      selectedAnswer,
      isCorrect,
      timeSpent
    };

    setResults(prev => [...prev, result]);

    if (!showExplanation) {
      setShowExplanation(true);
      return;
    }

    if (currentQuestion < filteredQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setResults([]);
    setQuizComplete(false);
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
  };

  const calculateScore = () => {
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const totalPoints = results.reduce((sum, result) => {
      const question = filteredQuestions.find(q => q.id === result.questionId);
      return sum + (result.isCorrect ? (question?.points || 0) : 0);
    }, 0);
    const maxPoints = filteredQuestions.reduce((sum, q) => sum + q.points, 0);
    
    return {
      correctAnswers,
      totalQuestions: filteredQuestions.length,
      percentage: Math.round((correctAnswers / filteredQuestions.length) * 100),
      points: totalPoints,
      maxPoints,
      grade: totalPoints >= maxPoints * 0.9 ? 'Expert' :
             totalPoints >= maxPoints * 0.8 ? 'Advanced' :
             totalPoints >= maxPoints * 0.7 ? 'Proficient' :
             totalPoints >= maxPoints * 0.6 ? 'Competent' : 'Needs Improvement'
    };
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100 dark:bg-green-950/30';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100 dark:bg-blue-950/30';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100 dark:bg-orange-950/30';
    return 'text-red-600 bg-red-100 dark:bg-red-950/30';
  };

  if (quizComplete) {
    const score = calculateScore();
    const totalTime = Math.round((Date.now() - startTime) / 1000);

    return (
      <div className="space-y-6">
        <Card className="success-card">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {score.correctAnswers}/{score.totalQuestions}
                </div>
                <div className="text-sm text-muted-foreground">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 ${
                  score.percentage >= 80 ? 'text-green-600' : 
                  score.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {score.percentage}%
                </div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {score.points}/{score.maxPoints}
                </div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-muted-foreground">Time</div>
              </div>
            </div>

            <div className="text-center">
              <Badge className={`text-lg px-4 py-2 ${getScoreColor(score.percentage)}`}>
                {score.grade}
              </Badge>
            </div>

            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
              <Brain className="h-4 w-4" />
              <AlertDescription>
                <strong>Your AI Security Knowledge Level: {score.grade}</strong>
                <br />
                {score.percentage >= 90 && "Excellent! You have expert-level knowledge of AI security practices."}
                {score.percentage >= 80 && score.percentage < 90 && "Great job! You have advanced understanding of AI security concepts."}
                {score.percentage >= 70 && score.percentage < 80 && "Good work! You have proficient knowledge with room for improvement."}
                {score.percentage >= 60 && score.percentage < 70 && "You have competent basic knowledge. Consider reviewing AISVS documentation."}
                {score.percentage < 60 && "Consider studying the OWASP AISVS framework to improve your AI security knowledge."}
              </AlertDescription>
            </Alert>

            <div className="flex justify-center gap-4">
              <Button onClick={resetQuiz} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
              <Button className="btn-primary">
                <BookOpen className="h-4 w-4 mr-2" />
                Study AISVS Guide
              </Button>
            </div>

            {/* Detailed Results */}
            <div className="space-y-3">
              <h3 className="font-semibold">Question Review</h3>
              {results.map((result, index) => {
                const question = filteredQuestions.find(q => q.id === result.questionId);
                if (!question) return null;

                return (
                  <Card key={result.questionId} className={`border-l-4 ${
                    result.isCorrect 
                      ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' 
                      : 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-medium">Question {index + 1}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {question.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {question.question}
                      </p>
                      {!result.isCorrect && (
                        <div className="mt-2 text-sm">
                          <span className="text-red-600">Your answer: </span>
                          {question.options[result.selectedAnswer]}
                          <br />
                          <span className="text-green-600">Correct answer: </span>
                          {question.options[question.correctAnswer]}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">AI Security Knowledge Quiz</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Test your understanding of AI security best practices based on the OWASP AISVS framework. 
          Each question includes detailed explanations to help you learn.
        </p>
      </div>

      {/* Difficulty Selector */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Difficulty Level:</span>
            <div className="flex gap-2">
              {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <Button
                  key={level}
                  variant={difficulty === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDifficulty(level)}
                  className="capitalize"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestion + 1} of {filteredQuestions.length}
            </span>
            <Badge variant="outline" className="text-xs">
              {currentQ.category}
            </Badge>
          </div>
          <Progress 
            value={((currentQuestion + 1) / filteredQuestions.length) * 100} 
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Question */}
      <Card className="security-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{currentQ.question}</CardTitle>
            <div className="flex gap-2">
              <Badge className={
                currentQ.difficulty === 'advanced' ? 'bg-red-100 text-red-800 dark:bg-red-950/30' :
                currentQ.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30' :
                'bg-green-100 text-green-800 dark:bg-green-950/30'
              }>
                {currentQ.difficulty}
              </Badge>
              <Badge variant="outline">
                {currentQ.points} pts
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <div
                key={index}
                className={`quiz-option ${
                  selectedAnswer === index ? 'selected' : ''
                } ${
                  showExplanation && index === currentQ.correctAnswer ? 'correct' : ''
                } ${
                  showExplanation && selectedAnswer === index && index !== currentQ.correctAnswer ? 'incorrect' : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>{option}</span>
                  {showExplanation && index === currentQ.correctAnswer && (
                    <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                  )}
                  {showExplanation && selectedAnswer === index && index !== currentQ.correctAnswer && (
                    <XCircle className="h-5 w-5 text-red-600 ml-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {showExplanation && (
            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Explanation:</strong>
                <br />
                {currentQ.explanation}
                <br />
                <br />
                <strong>AISVS Reference:</strong> {currentQ.aisvsReference}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={resetQuiz}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart
            </Button>
            
            <Button 
              onClick={handleNextQuestion}
              disabled={selectedAnswer === null}
              className="btn-primary"
            >
              {!showExplanation ? (
                <>Check Answer</>
              ) : currentQuestion < filteredQuestions.length - 1 ? (
                <>Next Question <ArrowRight className="h-4 w-4 ml-2" /></>
              ) : (
                <>Finish Quiz <Trophy className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 