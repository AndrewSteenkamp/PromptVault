import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Star, Users, Zap, TrendingUp, Lock, Download, Mail } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
          PromptVault
        </div>
        <Button
          onClick={() => navigate('/sell')}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg hover:shadow-blue-500/50 text-white font-bold"
        >
          Get Started
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="mb-8 inline-block">
          <span className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            🚀 Join 5,000+ Professionals
          </span>
        </div>

        <h1 className="text-7xl sm:text-8xl font-black mb-6 leading-tight">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
            900+ AI Prompts
          </span>
          <br />
          <span className="text-white">That Actually Work</span>
        </h1>

        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          Stop wasting time figuring out how to use AI. Get battle-tested prompts that work with ChatGPT, Claude, Gemini, and 50+ other AI tools. Used by entrepreneurs, marketers, and creators to save 10+ hours per week.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            onClick={() => navigate('/sell')}
            className="px-8 py-4 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-2xl hover:shadow-blue-500/50 text-white font-bold rounded-lg transition transform hover:scale-105"
          >
            View All 3 Guides →
          </Button>
          <Button
            variant="outline"
            className="px-8 py-4 text-lg border-blue-500/50 text-blue-400 hover:bg-blue-500/10 font-bold rounded-lg"
          >
            See What's Inside
          </Button>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            <span>300+ prompts per guide</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            <span>Instant PDF download</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            <span>Lifetime access</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            <span>Money-back guarantee</span>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Trusted by Professionals</h2>
          <p className="text-gray-400">Join thousands of creators, entrepreneurs, and marketers</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            { number: '5,000+', label: 'Active Users' },
            { number: '900+', label: 'AI Prompts' },
            { number: '4.9★', label: 'Average Rating' },
          ].map((stat, i) => (
            <Card key={i} className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-8 text-center">
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-400">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              name: 'Sarah Chen',
              role: 'Content Creator',
              text: 'These prompts saved me 15 hours a week. My content is now 10x better and I\'m getting 3x more engagement.',
              avatar: '👩‍💼',
            },
            {
              name: 'Marcus Johnson',
              role: 'SaaS Founder',
              text: 'The sales prompts alone paid for themselves 100x over. Closed 5 deals I wouldn\'t have otherwise.',
              avatar: '👨‍💼',
            },
            {
              name: 'Emily Rodriguez',
              role: 'Marketing Manager',
              text: 'Our team uses these daily. The email copy templates have increased our open rates by 40%.',
              avatar: '👩‍🔬',
            },
            {
              name: 'David Kim',
              role: 'Entrepreneur',
              text: 'Best $17 I\'ve spent. The automation prompts have freed up so much time for actual business growth.',
              avatar: '👨‍💻',
            },
          ].map((testimonial, i) => (
            <Card key={i} className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">{testimonial.avatar}</div>
                <div>
                  <div className="font-bold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-300">{testimonial.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* What You Get Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">What's Inside Each Guide</h2>
          <p className="text-gray-400">300+ prompts organized by use case</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            {[
              { icon: Zap, title: 'Ready-to-Use Prompts', desc: 'Copy & paste into ChatGPT, Claude, or any AI tool' },
              { icon: TrendingUp, title: 'Proven Results', desc: 'Each prompt tested and optimized for real-world use' },
              { icon: Users, title: 'Community Feedback', desc: 'Refined based on feedback from 5,000+ users' },
              { icon: Lock, title: 'Lifetime Access', desc: 'One-time purchase, use forever' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-500/20 border border-blue-500/30">
                      <Icon size={24} className="text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6">The 3 Guides Include:</h3>
            <div className="space-y-4">
              {[
                { emoji: '🤖', title: 'AI Tools & Automation', count: '300+' },
                { emoji: '✍️', title: 'Content Creation & Marketing', count: '300+' },
                { emoji: '💰', title: 'Sales & Revenue Generation', count: '300+' },
              ].map((guide, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div>
                    <div className="text-2xl mb-1">{guide.emoji}</div>
                    <div className="font-semibold text-white">{guide.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                      {guide.count}
                    </div>
                    <div className="text-xs text-gray-400">prompts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Common Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Do I need AI experience?',
              a: 'No! All prompts are written for beginners. Just copy, paste, and customize.',
            },
            {
              q: 'Which AI tools work with these prompts?',
              a: 'ChatGPT, Claude, Gemini, Copilot, and 50+ other AI tools. The prompts are universal.',
            },
            {
              q: 'Can I get a refund?',
              a: '100% money-back guarantee if you\'re not satisfied. No questions asked.',
            },
            {
              q: 'Do I get lifetime access?',
              a: 'Yes! One-time purchase means you own it forever. Future updates included.',
            },
          ].map((faq, i) => (
            <Card key={i} className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-6">
              <h3 className="font-bold text-white mb-2">{faq.q}</h3>
              <p className="text-gray-400">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-3xl p-16">
          <h2 className="text-5xl font-black mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
              Ready to Level Up?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get instant access to 900+ AI prompts. Just enter your email and download.
          </p>
          <Button
            onClick={() => navigate('/sell')}
            className="px-12 py-4 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-2xl hover:shadow-blue-500/50 text-white font-bold rounded-lg transition transform hover:scale-105"
          >
            Get All 3 Guides Now - $17 Each
          </Button>
          <p className="text-sm text-gray-500 mt-6">
            🔒 Secure • 📧 Instant delivery • ♾️ Lifetime access
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 py-12 px-6 text-center text-gray-500 text-sm">
        <p>© 2026 PromptVault. All rights reserved.</p>
      </footer>
    </div>
  );
}
