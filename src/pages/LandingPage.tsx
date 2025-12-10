import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Zap, Brain, Shield, Clock } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const fadeIn = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.7, ease: "easeOut" as const }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-32 pb-20 overflow-x-hidden">

        {/* Hero Section */}
        <section className="relative pt-10 md:pt-20 text-center space-y-8 min-h-[60vh] flex flex-col justify-center items-center">
          {/* Decorative blurred spots */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] -z-10" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: "circOut" }}
            className="relative z-10 max-w-4xl"
          >
            <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-white/10 bg-white/5 text-sm text-cyan-300 font-medium backdrop-blur-md">
              ✨ The Next Gen Task Management
            </div>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 pb-4 leading-tight">
              Master Your Time.<br />
              <span className="text-cyan-400">Amplify Focus.</span>
            </h1>
            <p className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto mt-6 leading-relaxed">
              Uses advanced AI to organize your tasks, schedule your day, and help you achieve flow state effortlessly.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row justify-center gap-4 mt-12"
            >
              <Button
                size="lg"
                className="h-14 rounded-full px-10 text-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
                onClick={() => navigate('/auth')}
              >
                Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-full px-10 text-lg border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm transition-all hover:scale-105"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="relative">
          <div className="text-center mb-16">
            <motion.h2 {...fadeIn} className="text-3xl md:text-5xl font-bold mb-4">Powerful Features</motion.h2>
            <motion.p {...fadeIn} className="text-gray-400 max-w-2xl mx-auto">Everything you need to stay productive, supercharged by AI.</motion.p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { icon: Brain, title: "AI Smart Planning", desc: "Let our AI analyze your workload and create the perfect schedule for your day automatically." },
              { icon: Zap, title: "Flow State Focus", desc: "Interactive tools to help you maintain deep focus and eliminate distractions while working." },
              { icon: Clock, title: "Time Tracking", desc: "Effortlessly track where your time goes and get insights to improve your efficiency." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } }
                }}
                className="group p-8 rounded-3xl bg-neutral-900/50 border border-white/5 hover:border-cyan-500/30 hover:bg-neutral-900/80 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-14 h-14 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5">
                  <feature.icon className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 relative z-10">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed relative z-10">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Showcase Section */}
        <section className="grid md:grid-cols-2 gap-16 items-center py-20">
          <motion.div {...fadeIn} className="space-y-8 order-2 md:order-1">
            <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">High Performers</span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              TaskWeaver isn't just a todo list. It's a complete productivity system designed to help you achieve more with less stress.
            </p>

            <div className="space-y-6">
              {[
                { title: "Smart Prioritization", desc: "Automatically sorts tasks based on urgency and impact." },
                { title: "Daily Review", desc: "End your day with AI-generated insights and summaries." },
                { title: "Seamless Sync", desc: "Access your tasks and notes from any device, anywhere." }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="mt-1">
                    <CheckCircle2 className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{item.title}</h4>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative order-1 md:order-2"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 blur-3xl rounded-full animate-pulse" />
            <div className="relative bg-[#0F0F0F] border border-white/10 rounded-2xl p-6 shadow-2xl skew-y-1 transform transition-transform hover:skew-y-0 duration-500">
              {/* Mock Card UI */}
              <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">AI</div>
                <div>
                  <div className="font-bold text-white">Daily Plan</div>
                  <div className="text-xs text-gray-500">Generated just now</div>
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-xl border border-white/5 flex items-center px-4 gap-3">
                    <div className="w-5 h-5 rounded-full border border-gray-600" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2 bg-white/10 rounded w-3/4" />
                      <div className="h-2 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <div className="h-8 w-32 bg-cyan-500/20 rounded-full flex items-center justify-center text-xs text-cyan-400 font-bold">
                  View Full Schedule
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-b from-neutral-900 to-black border border-white/10 rounded-3xl p-12 md:p-24 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to take control?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Join thousands of users who have transformed their productivity with TaskWeaver.
            </p>
            <Button
              size="lg"
              className="h-16 rounded-full px-12 text-xl bg-white text-black hover:bg-gray-200 font-bold transition-transform hover:scale-105"
              onClick={() => navigate('/auth')}
            >
              Get Started for Free
            </Button>
          </motion.div>
        </section>

      </div>
    </AppLayout>
  );
}
