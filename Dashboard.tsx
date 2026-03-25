import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { BookOpen, Sparkles, ShoppingBag, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: purchases, isLoading: purchasesLoading } = trpc.purchases.myPurchases.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: bookmarks, isLoading: bookmarksLoading } = trpc.progress.myBookmarks.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const completedPurchases = purchases?.filter(p => p.status === 'completed') || [];

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
            <Link href="/dashboard" className="text-sm font-medium text-primary">
              Dashboard
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">
                Admin
              </Link>
            )}
            <span className="text-sm text-muted-foreground">{user?.name}</span>
          </div>
        </div>
      </nav>

      {/* Dashboard Header */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 border-b">
        <div className="container">
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Welcome back, {user?.name}! Track your learning progress and access your courses.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 border-b">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Courses Purchased</CardDescription>
                <CardTitle className="text-3xl">{completedPurchases.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Bookmarked Prompts</CardDescription>
                <CardTitle className="text-3xl">{bookmarks?.length || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Spent</CardDescription>
                <CardTitle className="text-3xl">
                  ${((completedPurchases.reduce((sum, p) => sum + p.amount, 0)) / 100).toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Member Since</CardDescription>
                <CardTitle className="text-lg">
                  {new Date(user?.createdAt || '').toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* My Courses */}
      <section className="py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">My Courses</h2>
              <p className="text-muted-foreground">
                Access all your purchased courses
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/courses">
                Browse More Courses
              </Link>
            </Button>
          </div>

          {purchasesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : completedPurchases.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedPurchases.filter(p => p.courseId).map((purchase) => (
                <PurchasedCourseCard key={purchase.id} courseId={purchase.courseId!} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2">
              <CardHeader className="text-center py-12">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <CardTitle className="mb-2">No Courses Yet</CardTitle>
                <CardDescription className="mb-4">
                  Start your learning journey by purchasing your first course
                </CardDescription>
                <Button asChild>
                  <Link href="/courses" className="inline-flex items-center">
                    Browse Courses
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
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

function PurchasedCourseCard({ courseId }: { courseId: number }) {
  const { data: course } = trpc.courses.getById.useQuery({ id: courseId });
  
  if (!course) {
    return null;
  }
  
  return (
    <Link href={`/courses/${course.slug}`} className="block">
      <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 hover:-translate-y-1">
          <CardHeader>
            <Badge variant="secondary" className="w-fit mb-2">{course.category}</Badge>
            <CardTitle className="line-clamp-2">{course.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {course.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 mr-1" />
                {course.promptCount} prompts
              </div>
              <Button size="sm" variant="ghost">
                Continue →
              </Button>
            </div>
          </CardContent>
      </Card>
    </Link>
  );
}
