/**
 * Widget Connector Service
 * Connects all widgets and features across the JACC platform
 * Provides cross-widget communication and data synchronization
 */

export interface WidgetEvent {
  type: string;
  source: string;
  target?: string;
  data?: any;
  timestamp: number;
}

export interface WidgetData {
  id: string;
  name: string;
  type: 'chat' | 'admin' | 'document' | 'analytics' | 'faq' | 'monitoring' | 'ai-config';
  status: 'active' | 'inactive' | 'updating' | 'error';
  data?: any;
  lastUpdate: number;
}

class WidgetConnectorService {
  private widgets: Map<string, WidgetData> = new Map();
  private eventListeners: Map<string, ((event: WidgetEvent) => void)[]> = new Map();
  private eventHistory: WidgetEvent[] = [];

  // Register a widget with the connector
  registerWidget(widget: WidgetData) {
    this.widgets.set(widget.id, { ...widget, lastUpdate: Date.now() });
    this.broadcastEvent({
      type: 'widget_registered',
      source: 'connector',
      data: widget,
      timestamp: Date.now()
    });
  }

  // Update widget data
  updateWidget(id: string, data: Partial<WidgetData>) {
    const existing = this.widgets.get(id);
    if (existing) {
      const updated = { ...existing, ...data, lastUpdate: Date.now() };
      this.widgets.set(id, updated);
      this.broadcastEvent({
        type: 'widget_updated',
        source: id,
        data: updated,
        timestamp: Date.now()
      });
    }
  }

  // Get widget by ID
  getWidget(id: string): WidgetData | undefined {
    return this.widgets.get(id);
  }

  // Get all widgets of a specific type
  getWidgetsByType(type: WidgetData['type']): WidgetData[] {
    return Array.from(this.widgets.values()).filter(w => w.type === type);
  }

  // Subscribe to events
  subscribe(eventType: string, callback: (event: WidgetEvent) => void) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  // Unsubscribe from events
  unsubscribe(eventType: string, callback: (event: WidgetEvent) => void) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Broadcast event to all subscribers
  broadcastEvent(event: WidgetEvent) {
    // Store in history (keep last 100 events)
    this.eventHistory.push(event);
    if (this.eventHistory.length > 100) {
      this.eventHistory.shift();
    }

    // Notify specific event type listeners
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }

    // Notify global listeners
    const globalListeners = this.eventListeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(callback => callback(event));
    }
  }

  // Send targeted message to specific widget
  sendToWidget(targetId: string, type: string, data?: any) {
    this.broadcastEvent({
      type,
      source: 'connector',
      target: targetId,
      data,
      timestamp: Date.now()
    });
  }

  // Cross-widget data sync methods
  syncChatData(chatData: any) {
    this.broadcastEvent({
      type: 'chat_data_sync',
      source: 'chat',
      data: chatData,
      timestamp: Date.now()
    });
  }

  syncDocumentData(documentData: any) {
    this.broadcastEvent({
      type: 'document_data_sync',
      source: 'documents',
      data: documentData,
      timestamp: Date.now()
    });
  }

  syncFAQData(faqData: any) {
    this.broadcastEvent({
      type: 'faq_data_sync',
      source: 'faq',
      data: faqData,
      timestamp: Date.now()
    });
  }

  syncAIConfigData(aiConfigData: any) {
    this.broadcastEvent({
      type: 'ai_config_sync',
      source: 'ai-config',
      data: aiConfigData,
      timestamp: Date.now()
    });
  }

  syncAnalyticsData(analyticsData: any) {
    this.broadcastEvent({
      type: 'analytics_sync',
      source: 'analytics',
      data: analyticsData,
      timestamp: Date.now()
    });
  }

  // Get system-wide status
  getSystemStatus() {
    const widgets = Array.from(this.widgets.values());
    const activeWidgets = widgets.filter(w => w.status === 'active').length;
    const errorWidgets = widgets.filter(w => w.status === 'error').length;
    
    return {
      totalWidgets: widgets.length,
      activeWidgets,
      errorWidgets,
      overallHealth: errorWidgets === 0 ? 'healthy' : 'degraded',
      lastSync: Math.max(...widgets.map(w => w.lastUpdate))
    };
  }

  // Get event history
  getEventHistory(limit = 50): WidgetEvent[] {
    return this.eventHistory.slice(-limit);
  }

  // Clear all data (for testing/reset)
  clear() {
    this.widgets.clear();
    this.eventListeners.clear();
    this.eventHistory = [];
  }
}

// Export singleton instance
export const widgetConnector = new WidgetConnectorService();

// React hook for using widget connector
import { useEffect, useState } from 'react';

export function useWidgetConnector(widgetId?: string) {
  const [systemStatus, setSystemStatus] = useState(widgetConnector.getSystemStatus());
  const [events, setEvents] = useState<WidgetEvent[]>([]);

  useEffect(() => {
    const handleSystemUpdate = () => {
      setSystemStatus(widgetConnector.getSystemStatus());
    };

    const handleEvent = (event: WidgetEvent) => {
      if (!widgetId || event.source === widgetId || event.target === widgetId) {
        setEvents(prev => [...prev.slice(-49), event]); // Keep last 50 events
      }
    };

    // Subscribe to all events
    widgetConnector.subscribe('*', handleEvent);
    widgetConnector.subscribe('widget_updated', handleSystemUpdate);
    widgetConnector.subscribe('widget_registered', handleSystemUpdate);

    return () => {
      widgetConnector.unsubscribe('*', handleEvent);
      widgetConnector.unsubscribe('widget_updated', handleSystemUpdate);
      widgetConnector.unsubscribe('widget_registered', handleSystemUpdate);
    };
  }, [widgetId]);

  return {
    systemStatus,
    events,
    registerWidget: (widget: WidgetData) => widgetConnector.registerWidget(widget),
    updateWidget: (id: string, data: Partial<WidgetData>) => widgetConnector.updateWidget(id, data),
    sendToWidget: (targetId: string, type: string, data?: any) => widgetConnector.sendToWidget(targetId, type, data),
    syncChatData: (data: any) => widgetConnector.syncChatData(data),
    syncDocumentData: (data: any) => widgetConnector.syncDocumentData(data),
    syncFAQData: (data: any) => widgetConnector.syncFAQData(data),
    syncAIConfigData: (data: any) => widgetConnector.syncAIConfigData(data),
    syncAnalyticsData: (data: any) => widgetConnector.syncAnalyticsData(data),
  };
}