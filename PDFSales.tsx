import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, Zap, TrendingUp, Sparkles, Package } from 'lucide-react';
import { trpc } from '@/lib/trpc';

const PRODUCTS = [
  {
    id: 1,
    name: 'AI Tools & Automation (Single)',
    tagline: 'Work Smarter, Not Harder',
    description: 'Master ChatGPT, Claude, and 50+ AI tools with battle-tested prompts designed to automate your workflow and save 10+ hours per week.',
    price: 17,
    filename: 'https://dailyinsighttoday.com/wp-content/uploads/2026/03/Product_AI_Tools_and_Automation.pdf',
    icon: Zap,
    benefits: ['158+ Technical Guides', 'ChatGPT & Claude mastery', 'Automation workflows', 'Integration strategies'],
    color: 'from-blue-600 to-cyan-600',
    accent: 'bg-blue-500/10 border-blue-500/30',
  },
  {
    id: 2,
    name: 'Content Creation & Marketing (Single)',
    tagline: 'Go Viral with AI',
    description: 'Create scroll-stopping content, viral copy, and high-converting marketing campaigns. Used by 1000+ creators and marketers.',
    price: 27,
    filename: 'https://dailyinsighttoday.com/wp-content/uploads/2026/03/Product_Content_Creation_and_Marketing.pdf',
    icon: Sparkles,
    benefits: ['20+ Marketing Frameworks', 'Social media templates', 'Email copy formulas', 'Ad copy generators'],
    color: 'from-purple-600 to-pink-600',
    accent: 'bg-purple-500/10 border-purple-500/30',
  },
  {
    id: 3,
    name: 'Sales & Revenue Generation (Single)',
    tagline: 'Close More Deals',
    description: 'Proven sales funnels, persuasive copywriting, and deal-closing techniques. Trusted by top sales professionals and entrepreneurs.',
    price: 37,
    filename: 'https://dailyinsighttoday.com/wp-content/uploads/2026/03/Product_Sales_and_Revenue_Generation.pdf',
    icon: TrendingUp,
    benefits: ['41+ Sales & Funnel Guides', 'Objection handling', 'Closing techniques', 'Revenue optimization'],
    color: 'from-green-600 to-emerald-600',
    accent: 'bg-green-500/10 border-green-500/30',
  },
  {
    id: 4,
    name: 'Bundle: AI + Content Marketing',
    tagline: 'Automate & Go Viral',
    description: 'Combine the power of AI tool mastery with viral content generation. Automate your entire marketing pipeline.',
    price: 34,
    filename: 'https://dailyinsighttoday.com/wp-content/uploads/2026/03/Bundle_AI_and_Content.zip',
    icon: Package,
    benefits: ['Includes AI Tools PDF', 'Includes Content Marketing PDF', 'Over 170+ total guides', '$10 Bundle Discount'],
    color: 'from-indigo-600 to-blue-600',
    accent: 'bg-indigo-500/10 border-indigo-500/30',
  },
  {
    id: 5,
    name: 'Bundle: AI + Sales Revenue',
    tagline: 'Automate & Close',
    description: 'The ultimate backend operations bundle. Master the tools and build the exact funnels that drive direct revenue.',
    price: 44,
    filename: 'https://dailyinsighttoday.com/wp-content/uploads/2026/03/Bundle_AI_and_Sales.zip',
    icon: Package,
    benefits: ['Includes AI Tools PDF', 'Includes Sales & Revenue PDF', 'Over 190+ total guides', '$10 Bundle Discount'],
    color: 'from-teal-600 to-green-600',
    accent: 'bg-teal-500/10 border-teal-500/30',
  },
  {
    id: 6,
    name: 'Bundle: Content + Sales',
    tagline: 'The Growth Engine',
    description: 'The perfect front-end bundle. Generate massive attention with content and convert it seamlessly with proven sales funnels.',
    price: 49,
    filename: 'https://dailyinsighttoday.com/wp-content/uploads/2026/03/Bundle_Content_and_Sales.zip',
    icon: Package,
    benefits: ['Includes Content Marketing PDF', 'Includes Sales & Revenue PDF', 'Over 60+ targeted guides', '$15 Bundle Discount'],
    color: 'from-rose-600 to-orange-600',
    accent: 'bg-rose-500/10 border-rose-500/30',
  },
  {
    id: 7,
    name: 'THE ULTIMATE PROMPT VAULT',
    tagline: 'The Complete Business Brain',
    description: 'Unlock the entire 219-guide ecosystem. AI mastery, viral marketing, and high-ticket sales frameworks all in one place.',
    price: 59,
    filename: 'https://dailyinsighttoday.com/wp-content/uploads/2026/03/Bundle_Ultimate_Vault.zip',
    icon: Package,
    benefits: ['All 3 Core PDFs Included', '219 Master Guides', 'Save $22 Instantly', 'Lifetime knowledge access'],
    color: 'from-yellow-500 to-red-600',
    accent: 'bg-yellow-500/10 border-yellow-500/30',
  }
];

export default function PDFSales() {
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const captureLead = trpc.pdf.captureLead.useMutation();

  const handleDownload = async (product: typeof PRODUCTS[0]) => {
    if (!email.trim()) {
      alert('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      // Capture email in database
      await captureLead.mutateAsync({
        productId: product.id,
        email: email,
      });

      // Download the PDF
      const link = document.createElement('a');
      link.href = product.filename;
      link.download = product.filename.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(true);
      setEmail('');
      setSelectedProduct(null);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 inline-block">
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              ✨ 900+ AI Prompts Ready to Use
            </span>
          </div>

          <h1 className="text-6xl sm:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              PromptVault
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            The complete AI prompt library for professionals who want to work smarter, create faster, and earn more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <div className="flex items-center gap-2 text-gray-400">
              <Check size={20} className="text-green-400" />
              <span>300+ prompts per guide</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Check size={20} className="text-green-400" />
              <span>Instant PDF download</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Check size={20} className="text-green-400" />
              <span>Lifetime access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top">
          <div className="px-6 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg text-green-300 flex items-center gap-2 backdrop-blur-sm">
            <Check size={20} />
            <span>✅ Check your email for the PDF!</span>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="grid md:grid-cols-3 gap-8">
          {PRODUCTS.map((product) => {
            const Icon = product.icon;
            return (
              <div
                key={product.id}
                className="group relative"
                onClick={() => setSelectedProduct(product)}
              >
                {/* Gradient border effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${product.color} rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300 blur-xl -z-10`}></div>

                <Card className={`relative h-full bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 group-hover:border-slate-600 transition duration-300 cursor-pointer overflow-hidden`}>
                  {/* Top accent bar */}
                  <div className={`h-1 bg-gradient-to-r ${product.color}`}></div>

                  <div className="p-8">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-xl ${product.accent} flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300`}>
                      <Icon size={32} className="text-white" />
                    </div>

                    {/* Title and tagline */}
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {product.name}
                    </h3>
                    <p className={`text-sm font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r ${product.color}`}>
                      {product.tagline}
                    </p>

                    {/* Description */}
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Benefits */}
                    <ul className="space-y-3 mb-8">
                      {product.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check size={16} className="text-green-400 mt-1 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-700">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">One-time payment</p>
                        <p className="text-3xl font-black text-white">${product.price}</p>
                      </div>
                      <Button
                        className={`bg-gradient-to-r ${product.color} hover:shadow-lg hover:shadow-blue-500/50 text-white font-bold px-6 py-3 rounded-lg transition duration-300 transform hover:scale-105`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        Get Access
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 max-w-md w-full">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                {(() => {
                  const Icon = selectedProduct.icon;
                  return <Icon key="icon" size={32} className="text-white" />;
                })()}
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedProduct.name}
                  </h2>
                  <p className={`text-sm text-transparent bg-clip-text bg-gradient-to-r ${selectedProduct.color}`}>
                    {selectedProduct.tagline}
                  </p>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-6">
                Enter your email to get instant access to the complete PDF guide.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder-gray-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedProduct(null);
                      setEmail('');
                    }}
                    className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    className={`flex-1 bg-gradient-to-r ${selectedProduct.color} hover:shadow-lg text-white font-bold`}
                    onClick={() => handleDownload(selectedProduct)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Get PDF - $${selectedProduct.price}`}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center mt-6">
                🔒 Secure • 📧 Instant delivery • ♾️ Lifetime access
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Footer CTA */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to level up with AI?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals using PromptVault to work smarter, create faster, and earn more.
          </p>
          <Button
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg hover:shadow-blue-500/50 text-white font-bold px-8 py-3 text-lg"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Explore All Guides
          </Button>
        </div>
      </div>
    </div>
  );
}