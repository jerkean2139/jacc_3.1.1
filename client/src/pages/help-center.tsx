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
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
    if (nextEl) nextEl.style.display = 'block';
  };

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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="quick-start">Quick Start</TabsTrigger>
            <TabsTrigger value="user-guide">User Guide</TabsTrigger>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Guide Tab */}
          <TabsContent value="user-guide" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Complete User Guide
                </CardTitle>
                <CardDescription>
                  Step-by-step instructions for using JACC with visual examples
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Getting Started Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Getting Started</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">1. Login Process</h4>
                      <p className="text-sm text-gray-600">
                        Access JACC using your credentials. Admin users get full access to all features including the admin control center.
                      </p>
                      <div className="bg-gray-50 p-3 rounded border">
                        <img 
                          src="/user-guide-screenshots/login-screen.png" 
                          alt="JACC Login Screen"
                          className="w-full rounded border shadow-sm"
                          onError={handleImageError}
                        />
                        <div style={{ display: 'none' }} className="text-center text-gray-500 py-8">
                          Screenshot: Login screen with username/password fields
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">2. Main Dashboard</h4>
                      <p className="text-sm text-gray-600">
                        After login, you'll see the main chat interface with conversation starters and the sidebar navigation.
                      </p>
                      <div className="bg-gray-50 p-3 rounded border">
                        <img 
                          src="/user-guide-screenshots/main-dashboard.png" 
                          alt="JACC Main Dashboard"
                          className="w-full rounded border shadow-sm"
                          onError={handleImageError}
                        />
                        <div style={{ display: 'none' }} className="text-center text-gray-500 py-8">
                          Screenshot: Main dashboard with chat interface and sidebar
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Using the Chat System */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Using the Chat System</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">3. Starting Conversations</h4>
                      <p className="text-sm text-gray-600">
                        Use conversation starters for quick access to common tasks like calculating rates, creating marketing content, or asking about processors.
                      </p>
                      <div className="bg-gray-50 p-3 rounded border">
                        <img 
                          src="/user-guide-screenshots/conversation-starters.png" 
                          alt="Conversation Starters"
                          className="w-full rounded border shadow-sm"
                          onError={handleImageError}
                        />
                        <div style={{ display: 'none' }} className="text-center text-gray-500 py-8">
                          Screenshot: Conversation starter buttons
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">4. Chat Interface</h4>
                      <p className="text-sm text-gray-600">
                        Type questions naturally. JACC provides intelligent responses with formatted content, bullet points, and relevant document references.
                      </p>
                      <div className="bg-gray-50 p-3 rounded border">
                        <img 
                          src="/user-guide-screenshots/chat-conversation.png" 
                          alt="Chat Conversation"
                          className="w-full rounded border shadow-sm"
                          onError={handleImageError}
                        />
                        <div style={{ display: 'none' }} className="text-center text-gray-500 py-8">
                          Screenshot: Active chat conversation with AI responses
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Document Management</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">5. Documents Page</h4>
                      <p className="text-sm text-gray-600">
                        Access organized folders containing merchant services documents, pricing sheets, processor information, and contracts.
                      </p>
                      <div className="bg-gray-50 p-3 rounded border">
                        <img 
                          src="/user-guide-screenshots/documents-page.png" 
                          alt="Documents Page"
                          className="w-full rounded border shadow-sm"
                          onError={handleImageError}
                        />
                        <div style={{ display: 'none' }} className="text-center text-gray-500 py-8">
                          Screenshot: Documents page with folder structure
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">6. Document Upload</h4>
                      <p className="text-sm text-gray-600">
                        Admins can upload new documents using the 3-step process: Select Files → Choose Folder → Set Permissions.
                      </p>
                      <div className="bg-gray-50 p-3 rounded border">
                        <img 
                          src="/user-guide-screenshots/document-upload.png" 
                          alt="Document Upload Process"
                          className="w-full rounded border shadow-sm"
                          onError={handleImageError}
                        />
                        <div style={{ display: 'none' }} className="text-center text-gray-500 py-8">
                          Screenshot: 3-step document upload interface
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Features */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Admin Features</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">7. Admin Control Center</h4>
                      <p className="text-sm text-gray-600">
                        Access the comprehensive 7-tab admin panel for managing Q&A knowledge base, documents, AI training, and system monitoring.
                      </p>
                      <div className="bg-gray-50 p-3 rounded border">
                        <img 
                          src="/user-guide-screenshots/admin-control-center.png" 
                          alt="Admin Control Center"
                          className="w-full rounded border shadow-sm"
                          onError={handleImageError}
                        />
                        <div style={{ display: 'none' }} className="text-center text-gray-500 py-8">
                          Screenshot: Admin control center with 7 navigation tabs
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">8. Settings Configuration</h4>
                      <p className="text-sm text-gray-600">
                        Configure AI models, user management, system performance, and API settings through the comprehensive settings panel.
                      </p>
                      <div className="bg-gray-50 p-3 rounded border">
                        <img 
                          src="/user-guide-screenshots/admin-settings.png" 
                          alt="Admin Settings"
                          className="w-full rounded border shadow-sm"
                          onError={handleImageError}
                        />
                        <div style={{ display: 'none' }} className="text-center text-gray-500 py-8">
                          Screenshot: Admin settings with multiple configuration tabs
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips and Best Practices */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Tips & Best Practices</h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Efficient Searching</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-600">
                        <ul className="space-y-1">
                          <li>• Use specific processor names (Clearent, Shift4, etc.)</li>
                          <li>• Ask about rates, fees, or setup requirements</li>
                          <li>• Reference specific document types needed</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Marketing Content</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-600">
                        <ul className="space-y-1">
                          <li>• Specify target merchant type</li>
                          <li>• Mention industry focus areas</li>
                          <li>• Request specific content formats</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Admin Management</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-600">
                        <ul className="space-y-1">
                          <li>• Use Settings tab for user management</li>
                          <li>• Monitor system performance regularly</li>
                          <li>• Review chat training data for improvements</li>
                        </ul>
                      </CardContent>
                    </Card>
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
                  <Globe className="w-5 h-5 text-purple-600" />
                  Interface Guide
                </CardTitle>
                <CardDescription>
                  Understanding JACC's user interface components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Interface guide content here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Features Overview
                </CardTitle>
                <CardDescription>
                  Comprehensive feature documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Features content here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Guide Tab */}
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Admin Guide
                </CardTitle>
                <CardDescription>
                  Complete administrative documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Admin guide content here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Reference Tab */}
          <TabsContent value="reference" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Quick Reference
                </CardTitle>
                <CardDescription>
                  Essential shortcuts and commands
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Quick reference content here...</p>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}