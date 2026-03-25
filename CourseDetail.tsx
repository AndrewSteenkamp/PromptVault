import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { BookOpen, Sparkles, Lock, CheckCircle2, ArrowLeft, Award, Clock } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  
  const { data: course, isLoading: courseLoading } = trpc.courses.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );
  
  const { data: modules, isLoading: modulesLoading } = trpc.modules.listByCourse.useQuery(
    { courseId: course?.id || 0 },
    { enabled: !!course?.id }
  );
  
  const { data: lessonsData, isLoading: lessonsLoading } = trpc.lessons.listByCourse.useQuery(
    { courseId: course?.id || 0 },
    { enabled: !!course?.id }
  );
  
  const { data: courseProgress } = trpc.learningProgress.getCourseProgress.useQuery(
    { courseId: course?.id || 0 },
    { enabled: !!course?.id && isAuthenticated }
  );
  
  const { data: lessonProgressList } = trpc.learningProgress.getUserLessonProgress.useQuery(
    { courseId: course?.id || 0 },
    { enabled: !!course?.id && isAuthenticated }
  );
  
  const { data: hasPurchased } = trpc.purchases.hasPurchased.useQuery(
    { courseId: course?.id || 0 },
    { enabled: !!course?.id && isAuthenticated }
  );
  
  const createPurchase = trpc.purchases.create.useMutation({
    onSuccess: () => {
      toast.success("Course purchased successfully!");
      window.location.reload();
    },
    onError: (error) => {
      toast.error(`Purchase failed: ${error.message}`);
    },
  });

  const handlePurchase = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    
    if (!course) return;
    
    // In a real app, this would integrate with PayFast
    // For now, we'll create a completed purchase directly
    createPurchase.mutate({
      courseId: course.id,
      amount: course.price,
    });
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const isLessonCompleted = (lessonId: number) => {
    return lessonProgressList?.some(p => p.lessonId === lessonId && p.isCompleted === 1) || false;
  };

  const getModuleLessons = (moduleId: number) => {
    return lessonsData?.lessons.filter(l => l.moduleId === moduleId) || [];
  };

  const getModuleProgress = (moduleId: number) => {
    const moduleLessons = getModuleLessons(moduleId);
    if (moduleLessons.length === 0) return 0;
    const completed = moduleLessons.filter(l => isLessonCompleted(l.id)).length;
    return Math.round((completed / moduleLessons.length) * 100);
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
          <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/courses">
              Back to Courses
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const lessons = lessonsData?.lessons || [];
  const isPreview = lessonsData?.isPreview || false;
  const hasAccess = hasPurchased || user?.role === 'admin';
  const totalLessons = modules?.reduce((sum, mod) => {
    const modLessons = lessons.filter(l => l.moduleId === mod.id);
    return sum + modLessons.length;
  }, 0) || course.promptCount;

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

      {/* Course Header */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 border-b">
        <div className="container">
          <Link href="/courses" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Courses
          </Link>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Badge className="mb-4">{course.category}</Badge>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">
                {course.description}
              </p>
              
              <div className="flex items-center gap-6 text-sm flex-wrap">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  <span className="font-medium">{totalLessons} lessons</span>
                </div>
                {modules && modules.length > 0 && (
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-medium">{modules.length} modules</span>
                  </div>
                )}
                {course.estimatedDuration > 0 && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-medium">{Math.round(course.estimatedDuration / 60)} hours</span>
                  </div>
                )}
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                  <span className="font-medium">Lifetime access</span>
                </div>
              </div>

              {/* Progress Bar (if enrolled) */}
              {hasAccess && courseProgress && (
                <div className="mt-6 p-4 bg-primary/5 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Your Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {courseProgress.completedLessons} / {courseProgress.totalLessons} lessons
                    </span>
                  </div>
                  <Progress value={courseProgress.progressPercent} className="h-2" />
                  {courseProgress.isCompleted === 1 && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Course Completed! 🎉
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <div className="text-3xl font-bold text-primary mb-2">
                    ${(course.price / 100).toFixed(2)}
                  </div>
                  <CardDescription>One-time purchase</CardDescription>
                </CardHeader>
                <CardContent>
                  {hasAccess ? (
                    <Button className="w-full" disabled>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Already Purchased
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={handlePurchase}
                      disabled={createPurchase.isPending}
                    >
                      {createPurchase.isPending ? "Processing..." : "Purchase Course"}
                    </Button>
                  )}
                  
                  {!isAuthenticated && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Sign in required to purchase
                    </p>
                  )}

                  <Separator className="my-4" />

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      <span>Step-by-step lessons</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      <span>Practical examples</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      <span>Earn XP & badges</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Course Curriculum */}
      <section className="py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Course Curriculum</h2>
              <p className="text-muted-foreground">
                {hasAccess 
                  ? `${modules?.length || 0} modules with ${totalLessons} lessons` 
                  : `Preview: Showing first 3 lessons`
                }
              </p>
            </div>
            {isPreview && (
              <Badge variant="secondary">
                <Lock className="h-3 w-3 mr-1" />
                Preview Mode
              </Badge>
            )}
          </div>

          {modulesLoading || lessonsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : modules && modules.length > 0 ? (
            <div className="space-y-4">
              {modules.map((module, moduleIndex) => {
                const moduleLessons = getModuleLessons(module.id);
                const moduleProgress = getModuleProgress(module.id);
                const isExpanded = expandedModules.includes(module.id);

                return (
                  <Card key={module.id} className="overflow-hidden">
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline">Module {moduleIndex + 1}</Badge>
                            {hasAccess && moduleProgress > 0 && (
                              <span className="text-sm text-muted-foreground">
                                {moduleProgress}% complete
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-xl mb-2">{module.title}</CardTitle>
                          <CardDescription>{module.description}</CardDescription>
                          {hasAccess && moduleProgress > 0 && (
                            <Progress value={moduleProgress} className="h-1 mt-3" />
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          {isExpanded ? "−" : "+"}
                        </Button>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        <div className="space-y-3">
                          {moduleLessons.map((lesson, lessonIndex) => {
                            const completed = isLessonCompleted(lesson.id);
                            
                            // Check if lesson is unlocked (first lesson or previous lesson completed)
                            const isUnlocked = lesson.orderIndex === 1 || 
                              (lesson.orderIndex > 1 && isLessonCompleted(
                                moduleLessons.find(l => l.orderIndex === lesson.orderIndex - 1)?.id || 0
                              ));
                            
                            return (
                              <div
                                key={lesson.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                  completed ? 'bg-green-50 dark:bg-green-950/20' : 
                                  !isUnlocked ? 'opacity-60 bg-muted/30' : 'hover:border-primary/50'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  {completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                  ) : !isUnlocked ? (
                                    <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border-2 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs text-muted-foreground">
                                        Lesson {lessonIndex + 1}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        +{lesson.xpReward} XP
                                      </Badge>
                                      {!isUnlocked && (
                                        <Badge variant="secondary" className="text-xs">
                                          Locked
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="font-medium truncate">{lesson.title}</p>
                                    {!isUnlocked && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Complete previous lesson to unlock
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {hasAccess ? (
                                  <Button 
                                    size="sm" 
                                    variant={completed ? "outline" : "default"}
                                    onClick={() => setLocation(`/lessons/${lesson.id}`)}
                                    disabled={!isUnlocked}
                                  >
                                    {completed ? "Review" : "Start"}
                                  </Button>
                                ) : (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}

              {isPreview && (
                <Card className="border-dashed border-2 bg-muted/30">
                  <CardHeader className="text-center py-12">
                    <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <CardTitle className="mb-2">
                      {totalLessons - 3} More Lessons Locked
                    </CardTitle>
                    <CardDescription className="mb-4">
                      Purchase this course to unlock all {totalLessons} lessons across {modules.length} modules
                    </CardDescription>
                    <Button onClick={handlePurchase}>
                      Unlock Full Course - ${(course.price / 100).toFixed(2)}
                    </Button>
                  </CardHeader>
                </Card>
              )}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardHeader className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <CardTitle className="mb-2">Curriculum Coming Soon</CardTitle>
                <CardDescription>
                  This course is being updated with structured lessons and modules.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </section>

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
