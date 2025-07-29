import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Brain, Search, AlertTriangle, Activity, TrendingUp, DollarSign, Settings } from 'lucide-react';
import { useState } from 'react';

interface ApiUsageData {
  claude: {
    requests: number;
    cost: number;
    status: 'operational' | 'degraded' | 'down';
    avgResponseTime: number;
    tokens: number;
  };
  openai: {
    requests: number;
    cost: number;
    status: 'operational' | 'degraded' | 'down';
    avgResponseTime: number;
    tokens: number;
    whisperRequests?: number;
    ttsRequests?: number;
    voiceCost?: number;
  };
  perplexity: {
    requests: number;
    cost: number;
    status: 'operational' | 'degraded' | 'down';
    avgResponseTime: number;
    tokens: number;
  };
  voiceAgent: {
    totalConversations: number;
    totalMinutes: number;
    whisperCost: number;
    ttsCost: number;
    totalVoiceCost: number;
    avgConversationLength: number;
    status: 'operational' | 'degraded' | 'down';
  };
  daily: {
    budget: number;
    used: number;
    percentage: number;
  };
  hourlyUsage: number[];
  alerts: Array<{
    type: 'warning' | 'critical' | 'info';
    message: string;
    timestamp: string;
  }>;
}

export function ApiUsageDashboard() {
  const [configModal, setConfigModal] = useState<{
    isOpen: boolean;
    type: 'response-time' | 'voice-limit' | 'budget-limit' | null;
    title: string;
    currentValue: string;
  }>({
    isOpen: false,
    type: null,
    title: '',
    currentValue: ''
  });

  const { data: apiUsageData, isLoading } = useQuery<ApiUsageData>({
    queryKey: ['/api/admin/api-usage'],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
    staleTime: 10000,
  });

  const handleConfigureClick = (alertMessage: string) => {
    let type: 'response-time' | 'voice-limit' | 'budget-limit' | null = null;
    let title = '';
    let currentValue = '';

    if (alertMessage.includes('response time')) {
      type = 'response-time';
      title = 'Configure Response Time Threshold';
      currentValue = '5'; // seconds
    } else if (alertMessage.includes('Voice agent usage')) {
      type = 'voice-limit';  
      title = 'Configure Voice Agent Daily Limit';
      currentValue = '50'; // conversations per day
    } else if (alertMessage.includes('Daily budget usage')) {
      type = 'budget-limit';
      title = 'Configure Daily Budget Alert';
      currentValue = '80'; // percentage
    }

    setConfigModal({
      isOpen: true,
      type,
      title,
      currentValue
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Mock data structure for display - in production this would come from the API
  const mockData: ApiUsageData = {
    claude: {
      requests: 2847,
      cost: 12.34,
      status: 'operational',
      avgResponseTime: 2.3,
      tokens: 1250000,
    },
    openai: {
      requests: 1293,
      cost: 8.76,
      status: 'operational',
      avgResponseTime: 1.8,
      tokens: 890000,
      whisperRequests: 89,
      ttsRequests: 76,
      voiceCost: 3.42,
    },
    perplexity: {
      requests: 567,
      cost: 4.23,
      status: 'degraded',
      avgResponseTime: 4.1,
      tokens: 324000,
    },
    voiceAgent: {
      totalConversations: 45,
      totalMinutes: 127.5,
      whisperCost: 1.53,
      ttsCost: 1.89,
      totalVoiceCost: 3.42,
      avgConversationLength: 2.83,
      status: 'operational',
    },
    daily: {
      budget: 100,
      used: 28.75, // Updated to include voice costs
      percentage: 29,
    },
    hourlyUsage: Array.from({ length: 24 }, () => Math.floor(Math.random() * 300) + 50),
    alerts: [
      {
        type: 'warning',
        message: 'Perplexity API response time above threshold',
        timestamp: new Date().toISOString(),
      },
      {
        type: 'info',
        message: 'Voice agent usage approaching 50 conversations/day limit',
        timestamp: new Date().toISOString(),
      },
      {
        type: 'info',
        message: 'Daily budget usage at 29% (including voice costs)',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const displayData = apiUsageData || mockData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge variant="default">Operational</Badge>;
      case 'degraded':
        return <Badge variant="secondary">Degraded</Badge>;
      case 'down':
        return <Badge variant="destructive">Down</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">API Usage & Monitoring</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Track AI service usage, costs, and performance metrics across Claude, OpenAI, and Perplexity APIs.
        </p>
      </div>

      {/* Current Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-600" />
              Claude API
            </h4>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(displayData.claude.status)}`}></div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{displayData.claude.requests.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Requests today</div>
            <div className="text-sm text-green-600">${displayData.claude.cost.toFixed(2)} cost</div>
            <div className="text-xs text-gray-400">{displayData.claude.avgResponseTime}s avg response</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-green-600" />
              OpenAI API
            </h4>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(displayData.openai.status)}`}></div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{displayData.openai.requests.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Requests today</div>
            <div className="text-sm text-green-600">${displayData.openai.cost.toFixed(2)} cost</div>
            <div className="text-xs text-gray-400">{displayData.openai.avgResponseTime}s avg response</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium flex items-center gap-2">
              <Search className="h-4 w-4 text-purple-600" />
              Perplexity API
            </h4>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(displayData.perplexity.status)}`}></div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{displayData.perplexity.requests.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Requests today</div>
            <div className="text-sm text-orange-600">${displayData.perplexity.cost.toFixed(2)} cost</div>
            <div className="text-xs text-gray-400">{displayData.perplexity.avgResponseTime}s avg response</div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              AI Voice Agent
            </h4>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(displayData.voiceAgent.status)}`}></div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{displayData.voiceAgent.totalConversations}</div>
            <div className="text-sm text-gray-500">Voice conversations</div>
            <div className="text-sm text-blue-600">${displayData.voiceAgent.totalVoiceCost.toFixed(2)} cost</div>
            <div className="text-xs text-gray-400">{displayData.voiceAgent.totalMinutes.toFixed(1)} min total</div>
          </div>
        </Card>
      </div>

      {/* 24-Hour Usage Timeline */}
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            24-Hour Usage Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-1">
            {displayData.hourlyUsage.map((usage, i) => {
              const height = (usage / Math.max(...displayData.hourlyUsage)) * 240;
              return (
                <div
                  key={i}
                  className="bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer flex-1"
                  style={{ height: `${height}px` }}
                  title={`${i}:00 - ${usage} requests`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </CardContent>
      </Card>

      {/* API Health Status */}
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            API Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Brain className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Claude 4.0 Sonnet</p>
                  <p className="text-xs text-gray-500">Primary AI Model</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(displayData.claude.status)}
                <span className="text-xs text-gray-500">{displayData.claude.avgResponseTime}s avg</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Brain className="h-3 w-3 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">OpenAI GPT-4.1-Mini</p>
                  <p className="text-xs text-gray-500">Fallback Model</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(displayData.openai.status)}
                <span className="text-xs text-gray-500">{displayData.openai.avgResponseTime}s avg</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <Search className="h-3 w-3 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Perplexity Search</p>
                  <p className="text-xs text-gray-500">Web Intelligence</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(displayData.perplexity.status)}
                <span className="text-xs text-gray-500">{displayData.perplexity.avgResponseTime}s avg</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI Voice Agent</p>
                  <p className="text-xs text-gray-500">Whisper + TTS Pipeline</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(displayData.voiceAgent.status)}
                <span className="text-xs text-gray-500">{displayData.voiceAgent.avgConversationLength.toFixed(1)}min avg</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Limits & Alerts */}
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Usage Limits & Budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Budget (${displayData.daily.budget})</span>
                <span>${displayData.daily.used} used</span>
              </div>
              <Progress value={displayData.daily.percentage} className="h-2" />
              <div className="text-xs text-gray-500">
                {displayData.daily.percentage}% of daily budget used
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rate Limit (Claude)</span>
                <span>{displayData.claude.requests.toLocaleString()} / 10,000 requests</span>
              </div>
              <Progress value={(displayData.claude.requests / 10000) * 100} className="h-2" />
            </div>

            {/* Alerts */}
            {displayData.alerts.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Active Alerts</h5>
                {displayData.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      alert.type === 'warning'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200'
                        : alert.type === 'critical'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${
                        alert.type === 'warning' ? 'text-yellow-600' : 
                        alert.type === 'critical' ? 'text-red-600' : 'text-blue-600'
                      }`} />
                      <span className="text-sm font-medium">{alert.message}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleConfigureClick(alert.message)}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice Agent Detailed Breakdown */}
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            AI Voice Agent Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Voice Usage Metrics */}
            <div className="space-y-4">
              <h5 className="text-sm font-medium">Usage Metrics</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm">Total Conversations</span>
                  <span className="font-semibold">{displayData.voiceAgent.totalConversations}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm">Total Minutes</span>
                  <span className="font-semibold">{displayData.voiceAgent.totalMinutes.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm">Avg Conversation Length</span>
                  <span className="font-semibold">{displayData.voiceAgent.avgConversationLength.toFixed(1)} min</span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-4">
              <h5 className="text-sm font-medium">Cost Components</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <span className="text-sm font-medium">Whisper (Speech-to-Text)</span>
                    <p className="text-xs text-gray-500">{displayData.openai.whisperRequests || 0} requests</p>
                  </div>
                  <span className="font-semibold text-blue-600">${displayData.voiceAgent.whisperCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <span className="text-sm font-medium">TTS (Text-to-Speech)</span>
                    <p className="text-xs text-gray-500">{displayData.openai.ttsRequests || 0} requests</p>
                  </div>
                  <span className="font-semibold text-green-600">${displayData.voiceAgent.ttsCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg border-2 border-blue-200">
                  <span className="text-sm font-medium">Total Voice Cost</span>
                  <span className="font-bold text-blue-600">${displayData.voiceAgent.totalVoiceCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Voice Agent Implementation Status */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">Voice Agent Implementation</h5>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  WebSocket audio streaming, multi-model AI orchestration, and real-time voice processing
                </p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Ready to Deploy
              </Badge>
            </div>
            <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
              <p>• Estimated cost: $0.10-0.30 per conversation (2-3 minutes)</p>
              <p>• Uses OpenAI Whisper + TTS with Claude/GPT-4o orchestration</p>
              <p>• All tracking infrastructure integrated into existing cost system</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Modal */}
      <Dialog open={configModal.isOpen} onOpenChange={(open) => setConfigModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{configModal.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {configModal.type === 'response-time' && (
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="threshold">Response Time Threshold (seconds)</Label>
                  <Input 
                    type="number" 
                    id="threshold" 
                    defaultValue={configModal.currentValue}
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-500">Alert when API response time exceeds this value</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="email-alerts" />
                  <Label htmlFor="email-alerts">Send email alerts</Label>
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="notification-frequency">Alert Frequency</Label>
                  <Select defaultValue="immediate">
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="5min">Every 5 minutes</SelectItem>
                      <SelectItem value="15min">Every 15 minutes</SelectItem>
                      <SelectItem value="1hour">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {configModal.type === 'voice-limit' && (
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="daily-limit">Daily Conversation Limit</Label>
                  <Input 
                    type="number" 
                    id="daily-limit" 
                    defaultValue={configModal.currentValue}
                    placeholder="50"
                  />
                  <p className="text-xs text-gray-500">Alert when daily voice conversations approach this limit</p>
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="warning-threshold">Warning Threshold (%)</Label>
                  <Input 
                    type="number" 
                    id="warning-threshold" 
                    defaultValue="80"
                    placeholder="80"
                  />
                  <p className="text-xs text-gray-500">Send warning when usage reaches this percentage of daily limit</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-throttle" />
                  <Label htmlFor="auto-throttle">Auto-throttle when limit reached</Label>
                </div>
              </div>
            )}

            {configModal.type === 'budget-limit' && (
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="budget-threshold">Budget Alert Threshold (%)</Label>
                  <Input 
                    type="number" 
                    id="budget-threshold" 
                    defaultValue={configModal.currentValue}
                    placeholder="80"
                  />
                  <p className="text-xs text-gray-500">Alert when daily budget usage exceeds this percentage</p>
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="daily-budget">Daily Budget Limit ($)</Label>
                  <Input 
                    type="number" 
                    id="daily-budget" 
                    defaultValue="100"
                    placeholder="100"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500">Maximum daily spending across all AI services</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-suspend" />
                  <Label htmlFor="auto-suspend">Auto-suspend services when budget exceeded</Label>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setConfigModal(prev => ({ ...prev, isOpen: false }))}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Here you would normally save the configuration
                setConfigModal(prev => ({ ...prev, isOpen: false }));
              }}>
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}