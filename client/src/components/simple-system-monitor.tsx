import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, Brain, Zap, Search, CheckCircle, XCircle, Activity,
  Server, MemoryStick, HardDrive
} from 'lucide-react';

const SimpleSystemMonitor: React.FC = () => {
  // Fetch system health from working API
  const { data: healthData } = useQuery({
    queryKey: ['/api/admin/system/health'],
    refetchInterval: 5000
  });

  const { data: performanceData } = useQuery({
    queryKey: ['/api/admin/performance'],
    refetchInterval: 5000
  });

  const { data: pineconeData } = useQuery({
    queryKey: ['/api/admin/pinecone/health'],
    refetchInterval: 10000
  });

  const getStatusBadge = (isOnline: boolean) => {
    return isOnline ? (
      <Badge className="bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="w-3 h-3 mr-1" />
        Online
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Offline
      </Badge>
    );
  };

  const memoryPercent = Math.round((healthData?.performance?.memory?.rss || 0) / (1024 * 1024 * 1024) * 100);

  return (
    <div className="space-y-6">
      {/* F35 Cockpit-Style Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">F35 System Monitor</h2>
          </div>
          <div className="text-sm text-slate-300">
            Last Update: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Database */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Database</h3>
                  <p className="text-sm text-gray-600">
                    {healthData?.systems?.database?.responseTime || 0}ms
                  </p>
                </div>
              </div>
              {getStatusBadge(healthData?.systems?.database?.status === 'online')}
            </div>
          </CardContent>
        </Card>

        {/* Claude AI */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-orange-600" />
                <div>
                  <h3 className="font-semibold">Claude AI</h3>
                  <p className="text-sm text-gray-600">Sonnet 4.0</p>
                </div>
              </div>
              {getStatusBadge(healthData?.systems?.aiServices?.claude === 'operational')}
            </div>
          </CardContent>
        </Card>

        {/* OpenAI */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">OpenAI GPT</h3>
                  <p className="text-sm text-gray-600">GPT-4o</p>
                </div>
              </div>
              {getStatusBadge(healthData?.systems?.aiServices?.openai === 'operational')}
            </div>
          </CardContent>
        </Card>

        {/* Pinecone */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Search className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Pinecone Vector DB</h3>
                  <p className="text-sm text-gray-600">
                    {pineconeData?.stats?.namespaces?.['']?.recordCount || 0} vectors
                  </p>
                </div>
              </div>
              {getStatusBadge(pineconeData?.isConnected === true)}
            </div>
          </CardContent>
        </Card>

        {/* Server */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Express Server</h3>
                  <p className="text-sm text-gray-600">
                    Uptime: {Math.round((healthData?.performance?.uptime || 0) / 60)}m
                  </p>
                </div>
              </div>
              {getStatusBadge(true)} {/* If we're getting data, server is online */}
            </div>
          </CardContent>
        </Card>

        {/* Memory Status */}
        <Card className={`border-l-4 ${memoryPercent > 90 ? 'border-l-red-500' : 'border-l-green-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MemoryStick className="w-8 h-8 text-indigo-600" />
                <div>
                  <h3 className="font-semibold">Memory Usage</h3>
                  <p className="text-sm text-gray-600">{memoryPercent}% used</p>
                </div>
              </div>
              <Badge className={memoryPercent > 90 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                {memoryPercent}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {healthData?.systems?.database?.responseTime || 0}ms
              </div>
              <div className="text-sm text-gray-600">DB Response</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((healthData?.performance?.memory?.rss || 0) / (1024 * 1024))}MB
              </div>
              <div className="text-sm text-gray-600">Memory Used</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {pineconeData?.stats?.namespaces?.['']?.recordCount || 0}
              </div>
              <div className="text-sm text-gray-600">Vectors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((healthData?.performance?.uptime || 0) / 60)}m
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleSystemMonitor;