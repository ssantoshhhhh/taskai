import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Zap, Brain, Shield, Clock, UserPlus, CheckSquare, Sparkles, Rocket } from 'lucide-react';
import Stepper, { Step } from '@/components/ui/Stepper';

import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [latestTasks, setLatestTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    if (user) {
      setLoadingTasks(true);
      const fetchTasks = async () => {
        const { data } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (data) setLatestTasks(data);
        setLoadingTasks(false);
      };
      fetchTasks();
    }
  }, [user]);

  const fadeIn = {
    initial: { opacity: 0, y: 10 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-10%" },
    transition: { duration: 0.5, ease: "easeOut" as const }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  return (
    <AppLayout>
      <div className="relative z-10 max-w-7xl mx-auto space-y-24 md:space-y-32 pb-20 overflow-x-hidden">

        {/* Hero Section */}
        <section className="relative pt-10 md:pt-20 text-center space-y-8 min-h-[60vh] flex flex-col justify-center items-center px-4 overflow-hidden">


          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 max-w-4xl"
          >
            <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-white/10 bg-white/5 text-sm text-cyan-300 font-medium">
              ✨ The Next Gen Task Management
            </div>
            <h1 className="text-4xl md:text-8xl font-bold tracking-tight text-white pb-4 leading-tight">
              Master Your Time.<br />
              <span className="text-cyan-400">Amplify Focus.</span>
            </h1>
            <p className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto mt-4 leading-relaxed">
              Uses advanced AI to organize your tasks, schedule your day, and help you achieve flow state effortlessly.
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col sm:flex-row justify-center gap-4 mt-8 md:mt-12"
            >
              <Button
                size="lg"
                className="h-14 rounded-full px-10 text-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/25 transition-transform active:scale-95"
                onClick={() => navigate('/auth')}
              >
                Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-full px-10 text-lg border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-transform active:scale-95"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="relative px-4">
          <div className="text-center mb-10 md:mb-16">
            <motion.h2 {...fadeIn} className="text-3xl md:text-5xl font-bold mb-4 text-white">Powerful Features</motion.h2>
            <motion.p {...fadeIn} className="text-gray-300 max-w-2xl mx-auto">Everything you need to stay productive, supercharged by AI.</motion.p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { icon: Brain, title: "AI Smart Planning", desc: "Let our AI analyze your workload and create the perfect schedule for your day automatically." },
              { icon: Zap, title: "Flow State Focus", desc: "Interactive tools to help you maintain deep focus and eliminate distractions while working." },
              { icon: Sparkles, title: "RAG & Knowledge Base", desc: "Chat with your tasks and notes. Our AI uses RAG to provide context-aware answers instantly." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 15 } }
                }}
                className="group p-8 rounded-3xl bg-neutral-900/90 border border-white/10 hover:border-cyan-500/30 transition-colors duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="w-14 h-14 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                  <feature.icon className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 relative z-10">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed relative z-10">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4">
          <div className="text-center mb-16">
            <motion.h2 {...fadeIn} className="text-3xl md:text-5xl font-bold mb-4 text-white">How It Works</motion.h2>
            <motion.p {...fadeIn} className="text-gray-300 max-w-2xl mx-auto">Get started with Task AI in just a few simple steps.</motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 md:p-12 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

            <Stepper
              initialStep={1}
              onStepChange={(step: number) => {
                console.log(step);
              }}
              onFinalStepCompleted={() => console.log("All steps completed!")}
              backButtonText="Previous"
              nextButtonText="Next"
              stepCircleContainerClassName="shadow-none border-0 bg-transparent mb-8"
              stepContainerClassName="bg-transparent"
              contentClassName="min-h-[200px]"
              footerClassName="bg-transparent"
            >
              <Step>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">1. Create an Account</h2>
                  <p className="text-gray-400 max-w-md mx-auto">Sign up for free to access your personalized dashboard. It only takes a few seconds to get started.</p>
                </div>
              </Step>
              <Step>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                    <CheckSquare className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">2. Add Your Tasks</h2>
                  <p className="text-gray-400 max-w-md mx-auto">Input your daily tasks, deadlines, and priorities. Our AI will automatically organize them for you.</p>
                </div>
              </Step>
              <Step>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">3. Generate Your Plan</h2>
                  <p className="text-gray-400 max-w-md mx-auto">Let Task AI create an optimized schedule for your day, ensuring you focus on what matters most.</p>
                </div>
              </Step>
              <Step>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-pink-500/10 text-pink-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.15)]">
                    <Rocket className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">4. Achieve Flow State</h2>
                  <p className="text-gray-400 max-w-md mx-auto">Follow your plan, track your progress, and enjoy a more productive, stress-free work day.</p>
                </div>
              </Step>
            </Stepper>
          </motion.div>
        </section>

        {/* Showcase Section */}



        {/* Showcase Section */}
        <section className="grid md:grid-cols-2 gap-12 md:gap-16 items-center py-10 md:py-20 px-4">
          <motion.div {...fadeIn} className="space-y-6 md:space-y-8 order-2 md:order-1">
            <h2 className="text-3xl md:text-6xl font-bold text-white leading-tight">
              Built for <span className="text-cyan-400">High Performers</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
              Task AI isn't just a todo list. It's a complete productivity system designed to help you achieve more with less stress.
            </p>

            <div className="space-y-4 md:space-y-6">
              {[
                { title: "Smart Prioritization", desc: "Automatically sorts tasks based on urgency and impact." },
                { title: "Daily Review", desc: "End your day with AI-generated insights and summaries." },
                { title: "Seamless Sync", desc: "Access your tasks and notes from any device, anywhere." }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex gap-4"
                >
                  <div className="mt-1">
                    <CheckCircle2 className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{item.title}</h4>
                    <p className="text-gray-400 text-sm md:text-base">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative order-1 md:order-2"
          >
            {/* Removed heavy blur gradient */}
            <div className="absolute inset-0 bg-cyan-500/5 rounded-3xl -z-10" />
            <div className="relative bg-[#0F0F0F] border border-white/10 rounded-2xl p-6 shadow-2xl">
              {/* Mock Card UI */}
              <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                  {user ? <CheckCircle2 className="w-6 h-6" /> : "AI"}
                </div>
                <div>
                  <div className="font-bold text-white">{user ? 'My Tasks' : 'Daily Plan'}</div>
                  <div className="text-xs text-gray-500">{user ? 'Latest updates' : 'Generated just now'}</div>
                </div>
              </div>
              <div className="space-y-3">
                {user && !loadingTasks ? (
                  latestTasks.length > 0 ? (
                    latestTasks.map((task) => (
                      <div key={task.id} className="h-16 bg-white/5 rounded-xl border border-white/5 flex items-center px-4 gap-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${task.status === 'done' ? 'bg-cyan-500/20 border-cyan-500' : 'border-gray-600'}`}>
                          {task.status === 'done' && <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm truncate">{task.title}</div>
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {task.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                        <Sparkles className="w-6 h-6 text-gray-500" />
                      </div>
                      <p className="text-gray-400 font-medium">No tasks found</p>
                      <p className="text-xs text-gray-600 mt-1">Add a task to see it here!</p>
                    </div>
                  )
                ) : (
                  [1, 2, 3].map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl border border-white/5 flex items-center px-4 gap-3">
                      <div className="w-5 h-5 rounded-full border border-gray-600" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-white/10 rounded w-3/4" />
                        <div className="h-2 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="py-10 md:py-20 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 md:p-12 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

            <h2 className="text-3xl md:text-6xl font-bold text-white mb-6">Ready to take control?</h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              Join thousands of users who have transformed their productivity with Task AI.
            </p>
            <Button
              size="lg"
              className="h-16 rounded-full px-12 text-xl bg-white text-black hover:bg-gray-200 font-bold transition-transform active:scale-95"
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
            >
              {user ? 'Go to Dashboard' : 'Login to Continue'}
            </Button>
          </motion.div>
        </section >

      </div >
    </AppLayout >
  );
}
