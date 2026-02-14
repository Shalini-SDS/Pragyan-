import React, { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { AuthDialog } from '../components/AuthDialog';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Activity,
  Brain,
  Shield,
  Zap,
  UserCheck,
  FileText,
  TrendingUp,
  Heart,
  Stethoscope,
  Users,
  Building2,
  Clock,
  Target,
  ArrowRight,
  LogIn,
  UserPlus,
  LogOut,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced machine learning algorithms analyze patient symptoms in real-time',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Shield,
      title: 'Risk Classification',
      description: 'Intelligent triage system categorizes patients into Low, Medium, High risk levels',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Zap,
      title: 'Instant Routing',
      description: 'Automatically recommends appropriate departments based on symptoms',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: FileText,
      title: 'Detailed Reports',
      description: 'Comprehensive health reports with organ-specific insights and recommendations',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: TrendingUp,
      title: 'Real-time Monitoring',
      description: 'Live updates on bed availability, equipment status, and patient flow',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: Users,
      title: 'Staff Management',
      description: 'Efficient doctor and nurse assignment with workload balancing',
      color: 'from-indigo-500 to-indigo-600',
    },
  ];

  const steps = [
    {
      icon: UserCheck,
      title: 'Patient Registration',
      description: 'Enter patient details, symptoms, and vitals',
    },
    {
      icon: Brain,
      title: 'AI Analysis',
      description: 'System analyzes data and classifies risk level',
    },
    {
      icon: Target,
      title: 'Department Routing',
      description: 'Recommended to appropriate medical department',
    },
    {
      icon: Stethoscope,
      title: 'Treatment',
      description: 'Assigned to available doctor/nurse for care',
    },
  ];

  const stats = [
    { label: 'Patients Processed', value: '10,000+', icon: Users },
    { label: 'Average Wait Time', value: '< 15 min', icon: Clock },
    { label: 'Accuracy Rate', value: '98.5%', icon: Target },
    { label: 'Departments', value: '12+', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FCF3EC] via-[#FDEEE4] to-[#FBE9E0] dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
        <div className="container mx-auto px-4 py-20 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4EDE4] dark:bg-[#3B2F2F] text-[#D96C2B] dark:text-[#F28C6F] mb-6">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">Next-Generation Healthcare</span>
              </div>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-[#D96C2B] via-[#F28C6F] to-[#E7C9A9] bg-clip-text text-transparent leading-tight"
            >
              Intelligent Patient Triage System
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Revolutionizing emergency care with AI-driven patient analysis, risk assessment, and smart department
              routing for faster, more efficient healthcare delivery.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center items-center">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img src={user?.photo} alt={user?.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      {user?.name} ({user?.role})
                    </span>
                  </div>
                  <Button onClick={logout} variant="outline" size="lg" className="group">
                    <LogOut className="w-5 h-5 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setAuthDialogOpen(true)} size="lg" className="group">
                    <LogIn className="w-5 h-5 mr-2" />
                    Login
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button onClick={() => setAuthDialogOpen(true)} variant="outline" size="lg">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Sign Up
                  </Button>
                </>
              )}
              <Link to="/triage">
                <Button size="lg" className="bg-gradient-to-r from-[#D96C2B] to-[#F28C6F] hover:from-[#C25D22] hover:to-[#E17B5F] text-white">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Start Triage
                </Button>
              </Link>
              <Link to="/hospital-overview">
                <Button variant="outline" size="lg">
                  <Building2 className="w-5 h-5 mr-2" />
                  Hospital Overview
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-5xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="text-center hover:shadow-lg transition-all duration-300 dark:bg-gray-900 dark:border-gray-800 hover:scale-105 bg-white/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <stat.icon className="w-8 h-8 mx-auto mb-3 text-[#D96C2B] dark:text-[#F28C6F]" />
                    <div className="text-3xl font-bold mb-1 dark:text-white">{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">System Features</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Cutting-edge technology designed to optimize patient care and hospital operations
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp} whileHover={{ y: -8 }} className="h-full">
                <Card className="h-full hover:shadow-xl transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 group">
                  <CardContent className="pt-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 dark:text-white">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Four simple steps to efficient patient care
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto"
          >
            {steps.map((step, index) => (
              <motion.div key={index} variants={fadeInUp} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 hidden lg:block" style={{ width: index < 3 ? 'calc(100% + 2rem)' : '0' }} />
                  <h3 className="text-lg font-bold mb-2 dark:text-white">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#F9DCC4] to-[#FDE2D3] dark:from-[#3B2F2F] dark:to-[#4A3835] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto text-center"
          >
            <Heart className="w-16 h-16 mx-auto mb-6 text-[#D96C2B] dark:text-[#F28C6F] opacity-80" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#3B2F2F] dark:text-white">Ready to Transform Healthcare?</h2>
            <p className="text-xl mb-8 text-[#6B5A50] dark:text-gray-300">
              Join thousands of healthcare professionals using MediTriage AI to deliver better patient outcomes
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/triage">
                <Button size="lg" className="group bg-gradient-to-r from-[#D96C2B] to-[#F28C6F] hover:from-[#C25D22] hover:to-[#E17B5F] text-white shadow-lg">
                  Get Started Now
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Button onClick={() => setAuthDialogOpen(true)} size="lg" variant="outline" className="border-[#D96C2B] text-[#D96C2B] hover:bg-[#F4EDE4] dark:border-[#F28C6F] dark:text-[#F28C6F] dark:hover:bg-[#3B2F2F]">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}