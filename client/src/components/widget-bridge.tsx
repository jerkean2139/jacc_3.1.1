/**
 * Widget Bridge Component
 * Provides visual connection indicators and status for connected widgets
 */
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Zap, 
  Activity, 
  MessageSquare, 
  FileText, 
  Brain, 
  BarChart3,
  Settings,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useWidgetConnector } from '@/services/widget-connector';

interface WidgetBridgeProps {
  className?: string;
  showDetails?: boolean;
}

export function WidgetBridge({ className = '', showDetails = false }: WidgetBridgeProps) {
  const { systemStatus, events } = useWidgetConnector();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const recentEvents = events.slice(-5).reverse();

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Widget Bridge</span>
        </div>
        <Badge variant="outline" className={getStatusColor(systemStatus.overallHealth)}>
          {getStatusIcon(systemStatus.overallHealth)}
          <span className="ml-1">{systemStatus.activeWidgets}/{systemStatus.totalWidgets}</span>
        </Badge>
      </div>
    );
  }

  return (
    <Card className={`border-2 border-blue-500 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <Zap className="w-5 h-5" />
          Widget Connection Bridge
          <Badge variant="outline" className={getStatusColor(systemStatus.overallHealth)}>
            {getStatusIcon(systemStatus.overallHealth)}
            <span className="ml-1">{systemStatus.overallHealth}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{systemStatus.activeWidgets}</div>
            <div className="text-sm text-gray-600">Active Widgets</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{systemStatus.totalWidgets}</div>
            <div className="text-sm text-gray-600">Total Connected</div>
          </div>
        </div>

        {/* Connected Widget Types */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Connected Widgets</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Chat System
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Document Center
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              AI Engine
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Analytics
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Admin Panel
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              User Manager
            </Badge>
          </div>
        </div>

        {/* Recent Activity */}
        {recentEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {recentEvents.map((event, index) => (
                <div key={index} className="text-xs bg-gray-50 rounded p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{event.type.replace('_', ' ')}</span>
                    <span className="text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-600">From: {event.source}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection Status Indicator */}
        <div className="flex items-center justify-center pt-2 border-t">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-600 animate-pulse" />
            <span className="text-xs text-gray-600">
              Real-time sync active • Last update: {new Date(systemStatus.lastSync).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}