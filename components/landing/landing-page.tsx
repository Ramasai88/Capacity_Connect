"use client";

import Link from "next/link";
import {
  Layers,
  Sparkles,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  GraduationCap,
  ShieldCheck,
  Bot,
  LogIn,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface LandingPageProps {
  isAuthenticated?: boolean;
  userName?: string | null;
}

export function LandingPage({ isAuthenticated = false, userName }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden flex flex-col justify-between">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-gradient-to-tr from-indigo-600/20 via-primary/25 to-blue-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-[38%] right-[-100px] w-[500px] h-[400px] bg-gradient-to-bl from-indigo-700/15 via-purple-600/10 to-transparent blur-[140px] pointer-events-none rounded-full animate-float-slow" />
      <div className="absolute bottom-[10%] left-[-100px] w-[450px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-indigo-900/10 to-transparent blur-[120px] pointer-events-none rounded-full animate-float-reverse" />

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Top Navigation Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-600 text-white shadow-md shadow-indigo-950/30 border border-indigo-500/20">
              <Layers className="h-5 w-5 text-indigo-200" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white leading-tight">
                Capacity Connect
              </span>
              <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                Enterprise Platform
              </span>
            </div>
          </div>

          {/* Header Action Button */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 hidden sm:inline">
                  Welcome back, <span className="font-semibold text-white">{userName || "User"}</span>
                </span>
                <Link href="/dashboard">
                  <Button className="h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs gap-1.5 transition-all">
                    <span>Open Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/login">
                <Button className="h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/20 gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto animate-slide-up">
            
            {/* Exact Required Project Slogan Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-medium shadow-xs shadow-indigo-950/40 backdrop-blur-sm animate-pulse-glow">
              <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>AI-Powered Employee Skill Gap Identification and Competency Development System</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Intelligent Skill Diagnostics &{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-200 to-sky-300">
                Workforce Capacity Building
              </span>
            </h1>

            {/* Professional Platform Description */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal">
              Capacity Connect enables organizations to systematically benchmark role requirements, 
              detect multi-dimensional skill gaps, generate tailored AI learning pathways, 
              and verify employee capability growth with data-driven precision.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-3 w-full sm:w-auto">
              <Link href="/login" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-11 px-7 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-600/25 gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In to Platform</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-11 px-6 text-sm font-medium border-slate-700/80 bg-slate-900/50 hover:bg-slate-800/80 text-slate-200 hover:text-white shadow-xs backdrop-blur-sm">
                  <span>Explore Capabilities</span>
                </Button>
              </a>
            </div>

            {/* Interactive Preview / Metrics Showcase Card */}
            <div className="w-full pt-10">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                      Enterprise Competency Matrix Live Stream
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[11px] font-mono border-slate-700 bg-slate-800/80 text-slate-300">
                      Standard: 1–5 Universal Rubric
                    </Badge>
                  </div>
                </div>

                {/* Showcase KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                      <BarChart3 className="h-4 w-4" />
                      <span>Skill Gap Engine</span>
                    </div>
                    <div className="text-xl font-bold text-white">gap = max(0, Req - Cur)</div>
                    <div className="text-[11px] text-slate-400">Automated multi-level delta calculations</div>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                      <BrainCircuit className="h-4 w-4" />
                      <span>AI Recommendations</span>
                    </div>
                    <div className="text-xl font-bold text-white">Tailored Curriculums</div>
                    <div className="text-[11px] text-slate-400">Personalized courses & diagnostics</div>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Role-Based Access</span>
                    </div>
                    <div className="text-xl font-bold text-white">Admin • Manager • Emp</div>
                    <div className="text-[11px] text-slate-400">Strict multi-tenant security & review</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/60">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Enterprise Digital Capacity Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Engineered for seamless competency lifecycle management from evaluation to certification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-sm rounded-xl hover:border-slate-700 transition-all duration-200">
              <CardContent className="p-5 space-y-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-950/90 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Skill Gap Analysis</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time workforce evaluation comparing current competencies against designation benchmarks with granular severity indicators.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-sm rounded-xl hover:border-slate-700 transition-all duration-200">
              <CardContent className="p-5 space-y-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-950/90 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">AI Recommendations</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Intelligent curriculum mapping algorithmically recommends targeted courses to bridge specific employee deficiencies.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-sm rounded-xl hover:border-slate-700 transition-all duration-200">
              <CardContent className="p-5 space-y-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-950/90 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">AI Learning Assistant</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive contextual AI tutor grounded in employee profile data, enrolled courses, and behavioral rubric definitions.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-sm rounded-xl hover:border-slate-700 transition-all duration-200">
              <CardContent className="p-5 space-y-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-950/90 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Modular LMS & Diagnostic Exams</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Structured learning modules with step-by-step progress tracking, interactive quizzes, and diagnostic evaluations.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-sm rounded-xl hover:border-slate-700 transition-all duration-200">
              <CardContent className="p-5 space-y-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-950/90 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Reassessment Verification</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Formal manager review and approval workflows for post-training competency level promotions and compliance audit logs.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-sm rounded-xl hover:border-slate-700 transition-all duration-200">
              <CardContent className="p-5 space-y-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-950/90 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Executive Reports & Exports</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Comprehensive PDF and CSV exports for organization-wide readiness, competency matrix grids, and employee audits.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-900 text-white shadow-2xs">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-slate-200">Capacity Connect</span>
            <span className="text-slate-600">•</span>
            <span>Enterprise Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-slate-200 transition-colors font-medium">
              Sign In
            </Link>
            <span className="text-slate-700">|</span>
            <span>© {new Date().getFullYear()} Capacity Connect. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
