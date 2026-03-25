import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Sparkles, ArrowLeft, CheckCircle2, Award, Lightbulb, Copy, ChevronRight, ChevronLeft, HelpCircle } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function LessonDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);
  
  const lessonId = parseInt(id || "0");
  
  // Reset step and quiz state when lesson changes
  useEffect(() => {
    setCurrentStep(0);
    setSelectedAnswer(null);
    setQuizAnswered(false);
    setQuizCorrect(false);
  }, [lessonId]);
  
  const { data: lesson, isLoading: lessonLoading } = trpc.lessons.getById.useQuery(
    { id: lessonId },
    { enabled: !!lessonId }
  );
  
  const { data: course } = trpc.courses.getById.useQuery(
    { id: lesson?.courseId || 0 },
    { enabled: !!lesson?.courseId }
  );
  
  const { data: lessonProgress } = trpc.learningProgress.getLessonProgress.useQuery(
    { lessonId },
    { enabled: !!lessonId && isAuthenticated }
  );
  
  const { data: allLessons } = trpc.lessons.listByCourse.useQuery(
    { courseId: lesson?.courseId || 0 },
    { enabled: !!lesson?.courseId }
  );

  const utils = trpc.useUtils();
  
  const completeLesson = trpc.lessons.completeLesson.useMutation({
    onSuccess: (data) => {
      toast.success(`Lesson completed! +${data.xpEarned} XP earned! 🎉`);
      utils.learningProgress.getLessonProgress.invalidate();
      utils.learningProgress.getCourseProgress.invalidate();
      utils.learningProgress.getUserLessonProgress.invalidate();
      utils.auth.me.invalidate(); // Refresh user data to show updated XP
    },
    onError: (error) => {
      toast.error(`Failed to complete lesson: ${error.message}`);
    },
  });

  const handleComplete = () => {
    if (!lesson) return;
    completeLesson.mutate({
      lessonId: lesson.id,
      courseId: lesson.courseId,
    });
  };

  const copyPrompt = () => {
    if (!lesson?.prompt) return;
    navigator.clipboard.writeText(lesson.prompt);
    setCopied(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getCurrentLessonIndex = () => {
    if (!allLessons?.lessons || !lesson) return -1;
    return allLessons.lessons.findIndex(l => l.id === lesson.id);
  };

  const getNextLesson = () => {
    if (!allLessons?.lessons) return null;
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex === -1 || currentIndex >= allLessons.lessons.length - 1) return null;
    return allLessons.lessons[currentIndex + 1];
  };

  const getPreviousLesson = () => {
    if (!allLessons?.lessons) return null;
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex <= 0) return null;
    return allLessons.lessons[currentIndex - 1];
  };

  const nextLesson = getNextLesson();
  const previousLesson = getPreviousLesson();
  const isCompleted = lessonProgress?.isCompleted === 1;

  // Parse recommended tools
  const recommendedTools = lesson?.recommendedTools ? JSON.parse(lesson.recommendedTools) : [];

  // Define lesson steps
  const steps = [
    { id: 'tools', title: 'Recommended AI Tools', hasContent: recommendedTools.length > 0 },
    { id: 'prompt', title: 'The Prompt', hasContent: !!lesson?.prompt },
    { id: 'instructions', title: 'How to Use', hasContent: !!lesson?.promptInstructions },
    { id: 'example-input', title: 'Example Input', hasContent: !!lesson?.exampleInput },
    { id: 'example-output', title: 'Expected Results', hasContent: !!lesson?.exampleOutput },
    { id: 'tips', title: 'Pro Tips', hasContent: !!lesson?.tips },
    { id: 'quiz', title: 'Knowledge Check', hasContent: !!lesson?.quizQuestion },
    { id: 'complete', title: 'Complete', hasContent: true },
  ].filter(step => step.hasContent);

  const handleNextStep = () => {
    // If on quiz step, require correct answer before proceeding
    if (steps[currentStep]?.id === 'quiz' && !quizCorrect) {
      if (!quizAnswered) {
        toast.error('Please answer the quiz question first');
      } else {
        toast.error('Please answer correctly to continue');
      }
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (lessonLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Lesson Not Found</h1>
          <p className="text-muted-foreground mb-4">The lesson you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">AI Prompts Academy</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/courses" className="text-sm font-medium hover:text-primary transition-colors">
              Courses
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{user?.totalXp || 0} XP</span>
                </div>
                <span className="text-sm text-muted-foreground">{user?.name}</span>
              </>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Lesson Content */}
      <div className="container py-8 max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href={`/courses/${course?.slug}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {course?.title}
          </Link>
        </div>

        {/* Lesson Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary">Lesson {getCurrentLessonIndex() + 1}</Badge>
            <Badge variant="outline" className="gap-1">
              <Award className="h-3 w-3" />
              +{lesson.xpReward} XP
            </Badge>
            {isCompleted && (
              <Badge variant="default" className="gap-1 bg-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-4">{lesson.title}</h1>
          <p className="text-lg text-muted-foreground">{lesson.description}</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Step {currentStep + 1} of {steps.length}: {currentStepData.title}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step Content */}
        <div className="space-y-6">
          {currentStepData.id === 'tools' && recommendedTools.length > 0 && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Recommended AI Tools
                </CardTitle>
                <CardDescription>
                  These AI platforms work best for this specific prompt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {recommendedTools.map((tool: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg hover:border-primary transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-lg">{tool.name}</h4>
                        <Badge variant="secondary">Recommended</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                      <p className="text-sm mb-3"><strong>Why this tool:</strong> {tool.why}</p>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <a href={tool.url} target="_blank" rel="noopener noreferrer">
                          Try {tool.name} →
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStepData.id === 'prompt' && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>The Prompt</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPrompt}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </CardTitle>
                <CardDescription>
                  This is the AI prompt you'll use for this lesson
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                  {lesson.prompt}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStepData.id === 'instructions' && lesson.promptInstructions && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle>How to Use This Prompt</CardTitle>
                <CardDescription>
                  Follow these steps to get the best results
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lesson.promptInstructions.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n\n/g, '<br/><br/>') }} />
              </CardContent>
            </Card>
          )}

          {currentStepData.id === 'example-input' && lesson.exampleInput && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle>Example Input</CardTitle>
                <CardDescription>
                  See how to customize the prompt for your needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/50 rounded-lg text-sm">
                  {lesson.exampleInput}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStepData.id === 'example-output' && lesson.exampleOutput && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle>Expected Results</CardTitle>
                <CardDescription>
                  What you should expect from the AI
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ 
                  __html: lesson.exampleOutput
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\n/g, '<br/><br/>')
                    .replace(/(\d+\.)\s/g, '<br/>$1 ')
                    .trim()
                }} />
              </CardContent>
            </Card>
          )}

          {currentStepData.id === 'tips' && lesson.tips && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Pro Tips
                </CardTitle>
                <CardDescription>
                  Expert advice to maximize your results
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lesson.tips.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n\n/g, '<br/><br/>') }} />
              </CardContent>
            </Card>
          )}

          {currentStepData.id === 'quiz' && lesson.quizQuestion && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Knowledge Check
                </CardTitle>
                <CardDescription>
                  Test your understanding before moving on
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-medium text-lg">{lesson.quizQuestion}</p>
                
                <div className="space-y-2">
                  {JSON.parse(lesson.quizOptions || '[]').map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (!quizAnswered) {
                          setSelectedAnswer(index);
                          setQuizAnswered(true);
                          setQuizCorrect(index === lesson.quizCorrectAnswer);
                        }
                      }}
                      disabled={quizAnswered}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        !quizAnswered
                          ? 'hover:border-primary hover:bg-primary/5 cursor-pointer'
                          : selectedAnswer === index
                          ? index === lesson.quizCorrectAnswer
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                            : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                          : index === lesson.quizCorrectAnswer
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                          : 'opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          quizAnswered && selectedAnswer === index
                            ? index === lesson.quizCorrectAnswer
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-red-500 bg-red-500 text-white'
                            : quizAnswered && index === lesson.quizCorrectAnswer
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-muted-foreground'
                        }`}>
                          {quizAnswered && (selectedAnswer === index || index === lesson.quizCorrectAnswer) && (
                            index === lesson.quizCorrectAnswer ? '✓' : '✗'
                          )}
                        </div>
                        <span>{option}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {quizAnswered && (
                  <div className={`p-4 rounded-lg border-2 ${
                    quizCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                  }`}>
                    <p className="font-semibold mb-2">
                      {quizCorrect ? '✅ Correct!' : '💡 Not quite right'}
                    </p>
                    <p className="text-sm">{lesson.quizExplanation}</p>
                    {!quizCorrect && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => {
                          setSelectedAnswer(null);
                          setQuizAnswered(false);
                          setQuizCorrect(false);
                        }}
                      >
                        Try Again
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentStepData.id === 'complete' && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-2 border-dashed">
              <CardContent className="pt-6">
                <div className="text-center">
                  {isCompleted ? (
                    <div>
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <h3 className="text-xl font-bold mb-2">Lesson Completed! 🎉</h3>
                      <p className="text-muted-foreground mb-4">
                        You've earned {lesson.xpReward} XP for completing this lesson
                      </p>
                      <Button variant="outline" onClick={handleComplete}>
                        Review Again
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Award className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <h3 className="text-xl font-bold mb-2">Ready to Complete?</h3>
                      <p className="text-muted-foreground mb-4">
                        Mark this lesson as complete and earn {lesson.xpReward} XP
                      </p>
                      <Button 
                        onClick={handleComplete}
                        disabled={completeLesson.isPending}
                        size="lg"
                      >
                        {completeLesson.isPending ? "Completing..." : "Mark as Complete"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step Navigation */}
          <div className="flex items-center justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Step
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNextStep}
                className="gap-2"
              >
                Next Step
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                {nextLesson ? (
                  <Button
                    onClick={() => setLocation(`/lessons/${nextLesson.id}`)}
                    className="gap-2"
                  >
                    Next Lesson
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setLocation(`/courses/${course?.slug}`)}
                    variant="outline"
                  >
                    Back to Course
                  </Button>
                )}
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30 mt-20">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">AI Prompts Academy</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 AI Prompts Academy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
