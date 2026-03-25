import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { BookOpen, Sparkles, TrendingUp, Users, ArrowRight, Search } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: courses, isLoading } = trpc.courses.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(courses?.map(c => c.category) || []));

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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="mr-1 h-3 w-3" />
              1,141+ Premium AI Prompts
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Master AI Prompts for SaaS, Business & Beyond
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
   Access our comprehensive library of premium AI prompts across 70+
            specialized courses.
              Learn prompt engineering, SaaS development, no-code solutions, and business strategies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/courses" className="flex items-center">
                  Browse Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {!isAuthenticated && (
                <Button size="lg" variant="outline" asChild>
                  <a href={getLoginUrl()}>Get Started Free</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-b">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-2">193</div>
              <div className="text-gray-600">Expert Courses</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-2">9,352</div>
              <div className="text-gray-600">AI Prompts</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-2">14</div>
              <div className="text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-2">100%</div>
              <div className="text-gray-600">Practical</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose AI Prompts Academy?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to master AI prompts and accelerate your projects
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Comprehensive Library</CardTitle>
                <CardDescription>
                  Access 1,141+ carefully curated prompts covering SaaS, AI, business, and no-code development
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Practical & Actionable</CardTitle>
                <CardDescription>
                  Every prompt is designed for real-world application with clear formats and use cases
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Lifetime Access</CardTitle>
                <CardDescription>
                  One-time purchase gives you unlimited access to course materials forever
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Course Preview Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Courses</h2>
              <p className="text-muted-foreground">Explore our most popular prompt collections</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/courses">View All Courses</Link>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mb-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.slice(0, 8).map((category) => (
              <Badge key={category} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                {category}
              </Badge>
            ))}
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses?.slice(0, 6).map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow hover:border-primary/50">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary">{course.category}</Badge>
                          <span className="text-sm font-semibold text-primary">
                            ${(course.price / 100).toFixed(2)}
                          </span>
                        </div>
                        <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-3">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {course.promptCount} prompts
                        </div>
                      </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-primary/20">
            <CardHeader className="text-center pb-12">
              <CardTitle className="text-3xl mb-4">Ready to Master AI Prompts?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of learners and unlock the full potential of AI
              </CardDescription>
              <div className="flex justify-center gap-4 mt-6">
                <Button size="lg" asChild>
                  <Link href="/courses">Explore All Courses</Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
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
