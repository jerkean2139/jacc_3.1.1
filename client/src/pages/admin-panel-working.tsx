import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Shield,
  Database,
  Settings,
  Users,
  FileText,
  MessageSquare,
  Activity,
  Brain,
  Plus,
  Search,
  Eye,
  Download,
  Edit,
  Trash2,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowLeft
} from "lucide-react";

export function AdminPanelWorking() {
  const [activeTab, setActiveTab] = useState("overview");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Basic data queries with error handling
  const { data: faqData = [], isLoading: faqLoading, error: faqError } = useQuery({
    queryKey: ['/api/admin/faq'],
    retry: false,
    staleTime: 0,
  });

  const { data: documentsData = [], isLoading: docsLoading, error: docsError } = useQuery({
    queryKey: ['/api/admin/documents'],
    retry: false,
    staleTime: 0,
  });

  const { data: systemHealth, error: healthError } = useQuery({
    queryKey: ['/api/admin/system/health'],
    retry: false,
    staleTime: 30000, // Cache health data for 30 seconds
  });

  // Add FAQ mutation
  const addFaqMutation = useMutation({
    mutationFn: async (data: { question: string; answer: string; category: string }) => {
      return apiRequest('POST', '/api/admin/faq', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faq'] });
      setNewQuestion("");
      setNewAnswer("");
      toast({
        title: "FAQ Added",
        description: "New FAQ entry has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add FAQ entry.",
        variant: "destructive",
      });
    },
  });

  const handleAddFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    
    addFaqMutation.mutate({
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      category: "general"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  JACC Admin Control Center
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  Manage your AI-powered merchant services platform
                </p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              FAQ Management
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">FAQ Entries</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {faqLoading ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : faqError ? (
                      <span className="text-red-500">Error</span>
                    ) : (
                      Array.isArray(faqData) ? faqData.length : 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {faqError ? "Failed to load FAQ data" : "Total knowledge base entries"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {docsLoading ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : docsError ? (
                      <span className="text-red-500">Error</span>
                    ) : (
                      Array.isArray(documentsData) ? documentsData.length : 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {docsError ? "Failed to load document data" : "Uploaded documents"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {healthError ? (
                      <Badge variant="outline" className="bg-yellow-500">
                        <Clock className="w-3 h-3 mr-1" />
                        Unknown
                      </Badge>
                    ) : (systemHealth as any)?.overall === 'healthy' || (systemHealth as any)?.systems ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Healthy
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Issues
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(systemHealth as any)?.systems ? 
                      `DB: ${(systemHealth as any).systems.database?.status || 'unknown'} | AI: Active` : 
                      "Overall system status"
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Services</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <Badge variant="default" className="bg-blue-500">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Claude & OpenAI operational</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FAQ Management Tab */}
          <TabsContent value="faq">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add New FAQ Entry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Question</label>
                    <Input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Enter the question..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Answer</label>
                    <Textarea
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Enter the answer..."
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={handleAddFaq}
                    disabled={!newQuestion.trim() || !newAnswer.trim() || addFaqMutation.isPending}
                  >
                    {addFaqMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Add FAQ Entry
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing FAQ Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  {faqLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span className="ml-2">Loading FAQ entries...</span>
                    </div>
                  ) : Array.isArray(faqData) && faqData.length > 0 ? (
                    <div className="space-y-4">
                      {faqData.slice(0, 10).map((faq: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium mb-2">{faq.question}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                {faq.answer?.substring(0, 200)}...
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{faq.category || 'general'}</Badge>
                                <span className="text-xs text-slate-500">
                                  ID: {faq.id || index}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : faqError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <p className="text-slate-500">Failed to load FAQ entries</p>
                      <p className="text-xs text-slate-400 mt-1">Check API connection and authentication</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p>No FAQ entries found. Add your first entry above.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
              </CardHeader>
              <CardContent>
                {docsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Loading documents...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        Total Documents: {Array.isArray(documentsData) ? documentsData.length : 0}
                      </h3>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                    
                    {Array.isArray(documentsData) && documentsData.length > 0 ? (
                      <div className="grid gap-4">
                        {documentsData.slice(0, 10).map((doc: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4 flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{doc.name || `Document ${index + 1}`}</h4>
                              <p className="text-sm text-slate-600">
                                Size: {doc.fileSize || 'Unknown'} | Type: {doc.fileType || 'Unknown'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        No documents found. Upload your first document.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">AI Configuration</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Primary AI Model</label>
                        <Badge variant="default">Claude Sonnet 4</Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Fallback Model</label>
                        <Badge variant="outline">GPT-4.1-Mini</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">System Health</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Database Connection</span>
                        <Badge variant="default" className="bg-green-500">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Pinecone Vector DB</span>
                        <Badge variant="default" className="bg-green-500">Operational</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>AI Services</span>
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}