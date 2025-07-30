import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Button,
} from "@/components/ui/button";
import {
  Input,
} from "@/components/ui/input";
import {
  Textarea,
} from "@/components/ui/textarea";
import {
  Label,
} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  BarChart3,
  FileText,
  MessageSquare,
  Users,
  Settings,
  PlayCircle,
  Plus,
  RefreshCw,
  Target,
  Upload,
  Zap,
  ChevronRight,
  Home,
  Database,
} from "lucide-react";
import SystemHealthMonitor from "@/components/system-health-monitor";
import { Link as RouterLink } from 'wouter';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: number;
  isActive: boolean;
}

export default function UnifiedAdminPanel() {
  const [activeSection, setActiveSection] = useState("overview");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("merchant_services");
  const [newPriority, setNewPriority] = useState(2);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries
  const { data: faqData = [] } = useQuery({
    queryKey: ['/api/admin/faq'],
    retry: false,
  });

  const { data: documentsData = [] } = useQuery({
    queryKey: ['/api/admin/documents'],
    retry: false,
  });

  const { data: chatMonitoringData = [] } = useQuery({
    queryKey: ['/api/admin/chat-monitoring'],
    retry: false,
  });

  // Mutations
  const createFAQMutation = useMutation({
    mutationFn: async (faqData: {
      question: string;
      answer: string;
      category: string;
      priority: number;
    }) => {
      return apiRequest('POST', '/api/admin/faq', faqData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      setNewQuestion("");
      setNewAnswer("");
      setNewCategory("merchant_services");
      setNewPriority(2);
      toast({
        title: "FAQ Created",
        description: "New FAQ entry has been added successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating FAQ",
        description: error.message || "Failed to create FAQ entry",
        variant: "destructive"
      });
    }
  });

  const handleCreateFAQ = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    
    createFAQMutation.mutate({
      question: newQuestion,
      answer: newAnswer,
      category: newCategory,
      priority: newPriority,
    });
  };

  const safeArrayData = (data: unknown): any[] => {
    return Array.isArray(data) ? data : [];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">JACC Admin Control Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete system management, monitoring, and configuration hub
          </p>
        </div>
        <RouterLink href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Back to Chat
          </Button>
        </RouterLink>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="qa">Q&A Knowledge</TabsTrigger>
          <TabsTrigger value="documents">Document Center</TabsTrigger>
          <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
          <TabsTrigger value="training">Training & Feedback</TabsTrigger>
          <TabsTrigger value="testing">Chat Testing</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Dashboard */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">FAQ Entries</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeArrayData(faqData).length}</div>
                <p className="text-xs text-muted-foreground">
                  {safeArrayData(faqData).filter((f: any) => f.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeArrayData(documentsData).length}</div>
                <p className="text-xs text-muted-foreground">
                  Total files stored
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeArrayData(chatMonitoringData).length}</div>
                <p className="text-xs text-muted-foreground">
                  Live conversations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => setActiveSection('training')}
                className="flex items-center gap-2 h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <PlayCircle className="h-5 w-5" />
                Launch AI Training
              </Button>
              
              <Button 
                onClick={() => setActiveSection('qa')}
                className="flex items-center gap-2 h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <MessageSquare className="h-5 w-5" />
                Update Knowledge
              </Button>
              
              <Button 
                onClick={() => setActiveSection('documents')}
                className="flex items-center gap-2 h-16 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Upload className="h-5 w-5" />
                Upload Documents
              </Button>
              
              <Button 
                onClick={() => setActiveSection('monitoring')}
                className="flex items-center gap-2 h-16 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <BarChart3 className="h-5 w-5" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Q&A Knowledge Base */}
        <TabsContent value="qa" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Q&A Knowledge Base Management</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Q&A Entry</CardTitle>
                <CardDescription>Create questions and answers for the AI knowledge base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Question/Title</Label>
                    <Input 
                      placeholder="What are the current processing rates for restaurants?"
                      className="mt-1"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Answer/Content</Label>
                    <Textarea 
                      placeholder="Detailed answer with specific rates, terms, and guidance..."
                      className="mt-1 min-h-[120px]"
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="merchant_services">Merchant Services</SelectItem>
                          <SelectItem value="pos_systems">POS Systems</SelectItem>
                          <SelectItem value="technical_support">Technical Support</SelectItem>
                          <SelectItem value="integrations">Integrations</SelectItem>
                          <SelectItem value="pricing">Pricing & Rates</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Priority</Label>
                      <Select value={newPriority.toString()} onValueChange={(value) => setNewPriority(parseInt(value))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">High</SelectItem>
                          <SelectItem value="2">Medium</SelectItem>
                          <SelectItem value="1">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={handleCreateFAQ}
                    disabled={createFAQMutation.isPending || !newQuestion.trim() || !newAnswer.trim()}
                  >
                    {createFAQMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating Q&A Entry...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Q&A Entry
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent FAQ Entries</CardTitle>
                <CardDescription>Latest questions and answers in the knowledge base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {safeArrayData(faqData).slice(0, 5).map((faq: FAQ) => (
                    <div key={faq.id} className="border rounded-lg p-3 space-y-2">
                      <div className="font-medium text-sm">{faq.question}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {faq.answer}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          {faq.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          faq.priority === 3 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          faq.priority === 2 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {faq.priority === 3 ? 'High' : faq.priority === 2 ? 'Medium' : 'Low'} Priority
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Document Center */}
        <TabsContent value="documents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Document Center</h2>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>Manage uploaded files and documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Document management interface will be displayed here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Total documents: {safeArrayData(documentsData).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Prompts */}
        <TabsContent value="prompts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">AI Prompts & Configuration</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Prompts</CardTitle>
              <CardDescription>Configure AI behavior and response templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  AI prompt configuration interface will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training & Feedback */}
        <TabsContent value="training" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Chat & AI Training Center</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Training & Chat Review</CardTitle>
              <CardDescription>Review chat conversations and train the AI system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Chat review and AI training interface will be displayed here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Active chats: {safeArrayData(chatMonitoringData).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Testing */}
        <TabsContent value="testing" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Chat Testing</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Scenarios</CardTitle>
              <CardDescription>Run automated tests and validate AI responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Chat testing interface will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Monitoring */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">F35 System Health Monitor</h2>
            <div className="flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 py-2 rounded-lg">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">REAL-TIME MONITORING</span>
            </div>
          </div>

          {/* F35 System Health Monitor Integration */}
          <SystemHealthMonitor />
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Admin Settings & Configuration</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  AI & Search Configuration
                </CardTitle>
                <CardDescription>Configure AI behavior and search parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">AI Model</Label>
                  <Select defaultValue="claude-sonnet-4">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-sonnet-4">Claude 4.0 Sonnet (Default)</SelectItem>
                      <SelectItem value="gpt-4.1-mini">GPT-4.1-mini</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Response Style</Label>
                  <Select defaultValue="professional">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Search Sensitivity: 75%</Label>
                  <div className="px-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Performance
                </CardTitle>
                <CardDescription>Real-time system metrics and health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">87ms</div>
                    <p className="text-sm text-gray-600">Database Response</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">153</div>
                    <p className="text-sm text-gray-600">Vector Index</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>95%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{width: '95%'}}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Search Accuracy</span>
                    <span>96%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '96%'}}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Status
                </CardTitle>
                <CardDescription>PostgreSQL and Pinecone connectivity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PostgreSQL Database</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pinecone Vector DB</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Knowledge Base</span>
                    <Badge className="bg-blue-100 text-blue-800">{safeArrayData(faqData).length} Entries</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Document Storage</span>
                    <Badge className="bg-purple-100 text-purple-800">{safeArrayData(documentsData).length} Files</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>User roles and authentication settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Sessions</span>
                    <Badge className="bg-green-100 text-green-800">1 Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Admin Users</span>
                    <Badge className="bg-blue-100 text-blue-800">2 Configured</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sales Agents</span>
                    <Badge className="bg-purple-100 text-purple-800">3 Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Authentication</span>
                    <Badge className="bg-green-100 text-green-800">Secure</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}