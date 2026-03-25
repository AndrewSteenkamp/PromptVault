import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';

export function Products() {
  const { data: products, isLoading } = trpc.products.list.useQuery();

  if (isLoading) {
    return <div className="container py-12">Loading products...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="container py-20 text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">
          Premium AI Prompt Guides
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          300+ carefully curated prompts for each guide. Master AI tools, boost sales, and create engaging content.
        </p>
      </div>

      {/* Products Grid */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products?.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-2xl">{product.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-600">
                      ${(product.price / 100).toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-500">one-time</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    📚 {product.promptCount} premium prompts
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    View Guide
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Trust Section */}
      <div className="bg-slate-100 py-12 mt-12">
        <div className="container text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            Why Choose PromptVault?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl mb-2">✨</div>
              <h3 className="font-semibold text-slate-900">Curated Prompts</h3>
              <p className="text-slate-600 text-sm">300+ tested and optimized prompts</p>
            </div>
            <div>
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold text-slate-900">Instant Access</h3>
              <p className="text-slate-600 text-sm">Download immediately after purchase</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-slate-900">Results Focused</h3>
              <p className="text-slate-600 text-sm">Designed for real-world productivity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
