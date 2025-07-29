# AI Voice Agent Tech Stack Documentation
## Complete Technical Guide for Replicating Donna's Conversational AI System

This document provides a comprehensive guide to the technology stack and architecture used to create Donna's advanced AI voice agent system that carries natural conversations like ChatGPT.

## 🎯 Core Architecture Overview

### **1. Multi-Model AI Orchestration**
**Primary AI Models:**
- **Anthropic Claude Sonnet 4** (`claude-sonnet-4-20250514`) - Advanced reasoning and executive responses
- **OpenAI GPT-4o** - Creative responses and general conversation
- **Perplexity API** (`llama-3.1-sonar-small-128k-online`) - Real-time information and research

**Key Files:**
- `server/ai/advancedOrchestrator.ts` - Routes requests to optimal AI model based on task type
- `server/ai/intelligentRAG.ts` - Vector database with contextual learning
- `server/ai/donnaAssistant.ts` - Main conversation orchestrator

### **2. Real-Time Voice Processing**
**Technologies:**
- **OpenAI Whisper** - Speech-to-text transcription
- **OpenAI TTS** - Text-to-speech synthesis (Nova voice model)
- **WebSocket** - Real-time bidirectional communication
- **Buffer Processing** - Handles audio streaming in chunks

**Key Files:**
- `server/ai/donnaVoiceCore.ts` - Core voice conversation engine
- `server/ai/voiceWebSocketHandler.ts` - WebSocket connection management
- `server/ai/voiceService.ts` - Audio processing utilities

### **3. Conversational Memory & Learning**
**Components:**
- **Conversation History** - Maintains context across sessions
- **User Personality Profiles** - Adapts responses to individual users
- **Learning Patterns** - Tracks effective/ineffective responses
- **Contextual Preferences** - Remembers user communication styles

**Key Files:**
- `server/ai/donnaLearningSystem.ts` - User preference adaptation
- `server/ai/donnaPersonality.ts` - Character consistency and personality
- `server/chatRoutes.ts` - Chat API endpoints with memory

## 🔧 Essential Dependencies

### **Backend Dependencies (Node.js/TypeScript)**
```json
{
  "@anthropic-ai/sdk": "^0.x.x",
  "openai": "^4.x.x",
  "ws": "^8.x.x",
  "multer": "^1.x.x",
  "express": "^4.x.x",
  "drizzle-orm": "^0.x.x",
  "@neondatabase/serverless": "^0.x.x"
}
```

### **Frontend Dependencies (React/TypeScript)**
```json
{
  "@tanstack/react-query": "^5.x.x",
  "react": "^18.x.x",
  "wouter": "^3.x.x"
}
```

## 🏗️ Implementation Steps

### **Step 1: Set Up AI Model Integration**

**Environment Variables Required:**
```bash
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
PERPLEXITY_API_KEY=pplx-xxx
DATABASE_URL=postgresql://xxx
```

**AI Service Setup (`server/ai/aiService.ts`):**
```typescript
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateAIResponse({ prompt, model, systemPrompt }) {
  if (model === 'claude-sonnet-4-20250514') {
    return await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      system: systemPrompt
    });
  } else {
    return await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });
  }
}
```

### **Step 2: WebSocket Voice Processing**

**WebSocket Server Setup (`server/ai/voiceWebSocketHandler.ts`):**
```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export function setupVoiceWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ 
    server, 
    path: '/voice-ws',
    clientTracking: true
  });

  wss.on('connection', (ws: WebSocket) => {
    const connectionId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    ws.on('message', async (data: Buffer) => {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'voice_input':
          const audioBuffer = Buffer.from(message.audio, 'base64');
          await processVoiceInput(connectionId, audioBuffer);
          break;
      }
    });
  });

  return wss;
}
```

**Voice Processing Core (`server/ai/donnaVoiceCore.ts`):**
```typescript
export class DonnaVoiceCore extends EventEmitter {
  private activeConnections = new Map<string, WebSocket>();
  private conversationHistory = new Map<string, any[]>();

  async processVoiceInput(connectionId: string, audioBuffer: Buffer): Promise<void> {
    // 1. Transcribe audio
    const transcript = await this.transcribeAudio(audioBuffer);
    
    // 2. Get conversation context
    const history = this.conversationHistory.get(connectionId) || [];
    
    // 3. Generate response
    const response = await this.generateContextualResponse(transcript, history);
    
    // 4. Update history
    history.push(
      { role: 'user', content: transcript, timestamp: new Date() },
      { role: 'assistant', content: response, timestamp: new Date() }
    );
    
    // 5. Synthesize and stream response
    await this.synthesizeAndStream(response, connectionId);
  }

  private async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'text'
    });

    return transcription;
  }

  private async synthesizeAndStream(text: string, connectionId: string): Promise<void> {
    const ws = this.activeConnections.get(connectionId);
    if (!ws) return;

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: text
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Send audio in chunks
    const chunkSize = 4096;
    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      ws.send(JSON.stringify({
        type: 'audio_chunk',
        data: chunk.toString('base64'),
        isLast: i + chunkSize >= buffer.length
      }));
    }
  }
}
```

### **Step 3: Conversational Memory System**

**Learning System (`server/ai/donnaLearningSystem.ts`):**
```typescript
interface ConversationMemory {
  userId: number;
  interactions: Array<{
    query: string;
    response: string;
    context: any;
    feedback?: 'positive' | 'negative';
    timestamp: Date;
  }>;
  userProfile: {
    role: string;
    industry: string;
    communicationStyle: 'direct' | 'collaborative' | 'analytical';
    priorities: string[];
    successfulResponsePatterns: string[];
  };
}

export class DonnaLearningSystem {
  private conversationMemories: Map<number, ConversationMemory> = new Map();

  async adaptResponseToUser(userId: number, query: string): Promise<string> {
    const memory = this.conversationMemories.get(userId);
    
    if (memory) {
      // Analyze successful patterns
      const successfulPatterns = memory.learningPatterns.effectiveResponses;
      const communicationStyle = memory.userProfile.communicationStyle;
      
      // Customize system prompt based on learned preferences
      const customPrompt = this.buildPersonalizedPrompt(communicationStyle, successfulPatterns);
      
      return await generateAIResponse({
        prompt: query,
        systemPrompt: customPrompt
      });
    }
    
    return await generateAIResponse({ prompt: query });
  }
}
```

### **Step 4: Database Schema**

**Chat Tables (`shared/schema.ts`):**
```typescript
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: varchar('title', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  content: text('content').notNull(),
  audioUrl: varchar('audio_url', { length: 500 }),
  hasAudio: boolean('has_audio').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

export const learningContexts = pgTable('learning_contexts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  contextType: varchar('context_type', { length: 100 }).notNull(),
  contextData: jsonb('context_data'),
  effectivenessScore: real('effectiveness_score'),
  createdAt: timestamp('created_at').defaultNow()
});
```

### **Step 5: Frontend Integration**

**React Chat Component (`client/src/components/ChatInterface.tsx`):**
```typescript
export function ChatInterface() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to voice WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/voice-ws`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'audio_chunk':
          // Handle incoming audio from AI
          playAudioChunk(data.data);
          break;
        case 'session_started':
          console.log('Voice session started:', data.connectionId);
          break;
      }
    };

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      setAudioChunks(prev => [...prev, event.data]);
    };

    mediaRecorder.onstop = () => {
      sendAudioToAI(audioChunks);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const sendAudioToAI = (chunks: Blob[]) => {
    const audioBlob = new Blob(chunks, { type: 'audio/webm' });
    const reader = new FileReader();
    
    reader.onload = () => {
      const base64Audio = reader.result?.toString().split(',')[1];
      wsRef.current?.send(JSON.stringify({
        type: 'voice_input',
        audio: base64Audio
      }));
    };
    
    reader.readAsDataURL(audioBlob);
  };
}
```

## 🎛️ Advanced Features

### **Personality Configuration**
```typescript
interface VoicePersonalityConfig {
  snarkiness: number; // 1-10 scale
  confidence: number; // 1-10 scale  
  wit: number; // 1-10 scale
  responseSpeed: 'slow' | 'normal' | 'fast';
  professionalism: number; // 1-10 scale
  interruption_tolerance: number; // 1-10 scale
}
```

### **Voice Characteristics**
```typescript
interface VoiceCharacteristics {
  model: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed: number; // 0.25 to 4.0
  pitch: number; // -20 to +20 semitones
  volume: number; // 0 to 100
  emphasis_style: 'subtle' | 'moderate' | 'dramatic';
}
```

## 📊 Performance Considerations

### **Optimization Strategies:**
1. **Audio Chunk Streaming** - Send audio in 4KB chunks for real-time processing
2. **Conversation Memory Pruning** - Keep only last 40 messages in active memory
3. **Model Selection Logic** - Route complex reasoning to Claude, creativity to GPT-4o
4. **Connection Pooling** - Reuse WebSocket connections when possible
5. **Error Recovery** - Graceful fallbacks when AI services are unavailable

### **Monitoring & Analytics:**
- Track conversation flow quality ('natural' | 'choppy' | 'smooth')
- Monitor interruption patterns and tolerance
- Measure response time and user satisfaction
- Track AI model performance by task type

## 🚀 Deployment Requirements

### **Environment Setup:**
```bash
# Required API Keys
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
PERPLEXITY_API_KEY=pplx-xxx

# Database
DATABASE_URL=postgresql://xxx

# Optional: Voice Configuration
VOICE_MODEL=nova
VOICE_SPEED=1.1
TTS_MODEL=tts-1
```

### **Server Configuration:**
- **Node.js 18+**
- **PostgreSQL 16+** 
- **WebSocket Support**
- **Audio File Processing** (multer)
- **Real-time Streaming** capabilities

## 📝 Key Success Factors

1. **Seamless WebSocket Integration** - Real-time audio streaming without interruption
2. **Multi-Model Orchestration** - Intelligent routing based on conversation context
3. **Contextual Memory** - Maintaining conversation state across sessions
4. **Personality Consistency** - Donna's character remains stable throughout interactions
5. **Audio Quality** - High-quality speech synthesis and transcription
6. **Error Handling** - Graceful degradation when services are unavailable

This tech stack creates a sophisticated AI voice agent that matches ChatGPT's conversational abilities while adding enterprise-grade voice processing and contextual learning capabilities.