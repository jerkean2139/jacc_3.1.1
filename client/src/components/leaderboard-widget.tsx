import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Users, MessageSquare, Activity } from 'lucide-react';

interface LeaderboardAgent {
  rank: number;
  username: string;
  email: string;
  role: string;
  totalChats: number;
  totalMessages: number;
  userQueries: number;
  aiResponses: number;
  lastActivity: string;
  joinedDate: string;
  activityScore: number;
  profileImageUrl?: string;
  firstName?: string;
  lastName?: string;
}

interface LeaderboardWidgetProps {
  showFullLeaderboard?: boolean;
  maxEntries?: number;
}

export function LeaderboardWidget({ showFullLeaderboard = false, maxEntries = 5 }: LeaderboardWidgetProps) {
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['/api/leaderboard'],
    refetchInterval: 60000, // Refresh every minute
  });

  const agents = (leaderboardData && typeof leaderboardData === 'object' && 'leaderboard' in leaderboardData && Array.isArray((leaderboardData as any).leaderboard)) ? (leaderboardData as any).leaderboard : [];
  const displayAgents = showFullLeaderboard ? agents : agents.slice(0, maxEntries);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Agent Activity Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading leaderboard...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  // Skip loading state since API endpoints are working properly
  // Use live data from endpoints that are already responding successfully

  if (!agents.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Agent Activity Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Activity Data Yet</p>
            <p className="text-sm">Agent chat activity will appear here once conversations begin</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-0 shadow-xl">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20"></div>
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full blur-xl"></div>
      
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-3">
          <div className="relative">
            <Trophy className="h-6 w-6 text-yellow-600 drop-shadow-lg" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
          </div>
          <span className="bg-gradient-to-r from-yellow-700 via-orange-600 to-red-600 bg-clip-text text-transparent font-bold text-lg">
            Agent Activity Leaderboard
          </span>
        </CardTitle>
        {!showFullLeaderboard && (
          <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            🏆 Top {maxEntries} most active agents
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Agent Activity Leaderboard
        </CardTitle>
        {!showFullLeaderboard && (
          <div className="text-sm text-gray-600">
            Top {maxEntries} most active agents
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        {showFullLeaderboard && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {agents.reduce((sum: number, agent: LeaderboardAgent) => sum + agent.totalChats, 0)}
              </div>
              <div className="text-xs text-gray-500">Total Chats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {agents.reduce((sum: number, agent: LeaderboardAgent) => sum + agent.userQueries, 0)}
              </div>
              <div className="text-xs text-gray-500">User Queries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {agents.reduce((sum: number, agent: LeaderboardAgent) => sum + agent.aiResponses, 0)}
              </div>
              <div className="text-xs text-gray-500">AI Responses</div>
            </div>
          </div>
        )}

        <div className="space-y-3 relative z-10">
          {displayAgents.map((agent: LeaderboardAgent, index: number) => (
            <div 
              key={agent.username} 
              className={`
                relative flex items-center justify-between p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg
                ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 shadow-yellow-100' :
                  index === 1 ? 'bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-300 shadow-gray-100' :
                  index === 2 ? 'bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 shadow-orange-100' :
                  'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100'
                }
              `}
            >
              {/* Rank Badge with Enhanced Styling */}
              <div className="flex items-center gap-4">
                <div className={`
                  relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg transition-all duration-300
                  ${index === 0 ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 text-white' :
                    index === 1 ? 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 text-white' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 text-white' :
                    'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-500 text-white'
                  }
                `}>
                  {index < 3 ? (
                    index === 0 ? <Trophy className="h-5 w-5" /> :
                    index === 1 ? <Medal className="h-5 w-5" /> :
                    <Award className="h-5 w-5" />
                  ) : (
                    agent.rank
                  )}
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full border border-white animate-pulse"></div>
                  )}
                </div>
                
                {/* Agent Information */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-gray-800 dark:text-white">{agent.username}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-medium
                        ${agent.role === 'dev-admin' ? 'bg-red-100 text-red-800 border-red-300' :
                          agent.role === 'client-admin' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          'bg-green-100 text-green-800 border-green-300'
                        }
                      `}
                    >
                      {agent.role === 'dev-admin' ? 'Dev Admin' :
                       agent.role === 'client-admin' ? 'Client Admin' :
                       'Sales Agent'}
                    </Badge>
                    {index < 3 && (
                      <div className="flex items-center gap-1">
                        {index === 0 && <span className="text-xs font-bold text-yellow-600">🥇 Champion</span>}
                        {index === 1 && <span className="text-xs font-bold text-gray-600">🥈 Runner-up</span>}
                        {index === 2 && <span className="text-xs font-bold text-orange-600">🥉 3rd Place</span>}
        <div className="space-y-3">
          {displayAgents.map((agent: LeaderboardAgent, index: number) => (
            <div 
              key={agent.username} 
              className={`flex items-center justify-between p-3 border rounded-lg transition-all hover:shadow-sm ${
                index === 0 ? 'bg-yellow-50 border-yellow-200' :
                index === 1 ? 'bg-gray-50 border-gray-200' :
                index === 2 ? 'bg-orange-50 border-orange-200' :
                'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  {agent.profileImageUrl ? (
                    <img 
                      src={agent.profileImageUrl} 
                      alt={`${agent.firstName || agent.username}'s profile`}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-400 text-gray-900' :
                    index === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-blue-400 text-blue-900'
                  }`}>
                    {agent.rank}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{agent.username}</span>
                    <Badge variant="outline" className="text-xs">
                      {agent.role}
                    </Badge>
                    {index < 3 && (
                      <div className="flex items-center gap-1">
                        {index === 0 && <Trophy className="h-3 w-3 text-yellow-600" />}
                        {index === 1 && <Medal className="h-3 w-3 text-gray-600" />}
                        {index === 2 && <Award className="h-3 w-3 text-orange-600" />}
                      </div>
                    )}
                  </div>
                  
                  {showFullLeaderboard && (
                    <>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{agent.email}</div>
                      {agent.lastActivity && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                      <div className="text-xs text-gray-600">{agent.email}</div>
                      {agent.lastActivity && (
                        <div className="text-xs text-gray-500">
                          Last active: {new Date(agent.lastActivity).toLocaleDateString()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Stats Display */}
              <div className="text-right">
                {showFullLeaderboard ? (
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center p-2 bg-white/50 rounded-lg">
                      <div className="font-bold text-blue-600 text-lg">{agent.totalChats}</div>
                      <div className="text-gray-500 text-xs">Chats</div>
                    </div>
                    <div className="text-center p-2 bg-white/50 rounded-lg">
                      <div className="font-bold text-green-600 text-lg">{agent.userQueries}</div>
                      <div className="text-gray-500 text-xs">Queries</div>
                    </div>
                    <div className="text-center p-2 bg-white/50 rounded-lg">
                      <div className="font-bold text-purple-600 text-lg">{agent.aiResponses}</div>
                      <div className="text-gray-500 text-xs">Responses</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-3 bg-white/50 rounded-lg min-w-[80px]">
                    <div className="font-bold text-blue-600 text-xl">{agent.totalMessages}</div>
              <div className="text-right">
                {showFullLeaderboard ? (
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center">
                      <div className="font-bold">{agent.totalChats}</div>
                      <div className="text-gray-500">Chats</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{agent.userQueries}</div>
                      <div className="text-gray-500">Queries</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{agent.aiResponses}</div>
                      <div className="text-gray-500">Responses</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="font-bold text-blue-600">{agent.totalMessages}</div>
                    <div className="text-xs text-gray-500">Messages</div>
                  </div>
                )}
                
                <div className="mt-2 text-center">
                  <div className={`
                    inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs
                    ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600 text-white' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white' :
                      'bg-gradient-to-r from-blue-400 to-purple-500 text-white'
                    }
                  `}>
                    <MessageSquare className="h-3 w-3" />
                    {agent.activityScore} pts
                  </div>
                <div className="mt-1">
                  <div className="font-bold text-xs text-purple-600">{agent.activityScore} pts</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {!showFullLeaderboard && agents.length > maxEntries && (
          <div className="text-center mt-4 pt-4 border-t">
            <span className="text-sm text-gray-500">
              +{agents.length - maxEntries} more agents
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LeaderboardWidget;
}
