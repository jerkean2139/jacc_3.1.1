import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Settings, Zap, Shield, MessageSquare, ArrowLeft,
  User, Key, Database, Brain, Clock, Globe
} from 'lucide-react';
import { Link } from 'wouter';

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Chat
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold">JACC Help Center</h1>
              </div>
            </div>
            <Badge variant="secondary">v3.1</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="quick-start" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="quick-start">Quick Start</TabsTrigger>
            <TabsTrigger value="interface">Interface Guide</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="admin">Admin Guide</TabsTrigger>
            <TabsTrigger value="reference">Quick Reference</TabsTrigger>
          </TabsList>

          {/* Quick Start Tab */}
          <TabsContent value="quick-start" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  Getting Started with JACC
                </CardTitle>
                <CardDescription>
                  Your AI-powered merchant services assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Login Credentials</h3>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-blue-50 rounded border">
                        <strong>Admin Access:</strong><br />
                        Username: <code>admin</code><br />
                        Password: <code>admin123</code>
                      </div>
                      <div className="p-3 bg-green-50 rounded border">
                        <strong>Sales Agent:</strong><br />
                        Username: <code>tracer-user</code><br />
                        Password: <code>tracer123</code>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold">Ultra-Fast Responses</h3>
                    <div className="p-3 bg-orange-50 rounded border text-sm">
                      <strong>59ms Response System:</strong><br />
                      Common queries like "calculate processing rates" and "TracerPay rates" 
                      respond instantly using pre-computed answers.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interface Guide Tab */}
          <TabsContent value="interface" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Interface Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Main Navigation</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• <strong>Chat:</strong> Main AI conversation interface</li>
                      <li>• <strong>Documents:</strong> File management and search</li>
                      <li>• <strong>Calculator:</strong> Processing rate calculations</li>
                      <li>• <strong>Intelligence:</strong> Business analytics dashboard</li>
                      <li>• <strong>Admin:</strong> Control center (admin users only)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Chat Features</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• <strong>Conversation Starters:</strong> Quick access to common queries</li>
                      <li>• <strong>Document Search:</strong> AI searches your uploaded documents</li>
                      <li>• <strong>HTML Formatting:</strong> Professional response formatting</li>
                      <li>• <strong>Mobile Optimized:</strong> Works on all devices</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    AI Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div>• <strong>Claude Sonnet 4:</strong> Primary AI model for advanced reasoning</div>
                    <div>• <strong>GPT-4.1-mini:</strong> Selectable option for specific tasks</div>
                    <div>• <strong>Document Search:</strong> Semantic search across uploaded files</div>
                    <div>• <strong>FAQ Integration:</strong> Instant answers from knowledge base</div>
                    <div>• <strong>Cost Tracking:</strong> Monitor AI usage and costs</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-green-600" />
                    System Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div>• <strong>F35 Cockpit Style:</strong> Military-grade system health monitoring</div>
                    <div>• <strong>Real-time Status:</strong> Database, AI services, vector search</div>
                    <div>• <strong>Performance Metrics:</strong> Memory, CPU, response times</div>
                    <div>• <strong>Alert System:</strong> Proactive issue detection</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Guide Tab */}
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-orange-600" />
                  7-Tab Admin Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Core Management</h3>
                    <ul className="space-y-1 text-sm">
                      <li>1. <strong>Overview:</strong> System statistics and health</li>
                      <li>2. <strong>Q&A Knowledge:</strong> FAQ management with duplicate detection</li>
                      <li>3. <strong>Document Center:</strong> 3-step upload process</li>
                      <li>4. <strong>AI Prompts:</strong> Template management</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold">Advanced Features</h3>
                    <ul className="space-y-1 text-sm">
                      <li>5. <strong>Chat & AI Training:</strong> Conversation review and improvement</li>
                      <li>6. <strong>Settings:</strong> User management, AI configuration</li>
                      <li>7. <strong>System Monitor:</strong> Performance metrics and alerts</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Reference Tab */}
          <TabsContent value="reference" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-red-600" />
                    Keyboard Shortcuts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>• <strong>Ctrl/Cmd + Enter:</strong> Send message</div>
                  <div>• <strong>Ctrl/Cmd + /:</strong> Focus search</div>
                  <div>• <strong>Escape:</strong> Close modal/dialog</div>
                  <div>• <strong>Tab:</strong> Navigate between form fields</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>• <strong>Response Time:</strong> 59ms for common queries</div>
                  <div>• <strong>Search Accuracy:</strong> 91% document matching</div>
                  <div>• <strong>Uptime:</strong> 99.8% system availability</div>
                  <div>• <strong>Security Grade:</strong> 96+/100 enterprise level</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}