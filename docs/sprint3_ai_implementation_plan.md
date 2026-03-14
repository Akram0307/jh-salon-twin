# SalonOS Sprint 3 AI Implementation Plan

## Overview
This document outlines the detailed implementation plan for two AI features in Sprint 3:
1. **Task 020: AI - PWA Concierge Integration (P0)** - Extend Aura AI concierge to work with Client PWA via WebSocket
2. **Task 021: AI - Smart Slot Suggestions Enhancement (P1)** - Enhance slot suggestion engine with ML-based recommendations

## Task 020: AI - PWA Concierge Integration (P0)

### Current Architecture Analysis
**Existing Components:**
- `src/agents/receptionist.ts` - Genkit-based AI concierge with Vertex AI integration
- `src/services/AIConciergeBookingService.ts` - Intent parsing, service/stylist matching, booking orchestration
- `src/services/BookingOrchestrator.ts` - Appointment creation logic
- `src/services/SlotGenerator.ts` - Available slot calculation
- `src/services/WebSocketService.ts` - WebSocket server with basic pub/sub
- `src/services/ConversationContextStore.ts` - Conversation state management
- `frontend/src/pages/client/ClientChat.tsx` - Basic chat UI with simulated responses

### Implementation Plan

#### 1. WebSocket Server Integration
**File:** `src/services/WebSocketService.ts`
**Modifications:**
- Add authentication middleware for WebSocket connections
- Implement AI concierge message routing
- Add session management for client connections
- Support for binary data (images, files) in messages

**New Message Types:**
```typescript
interface AIConciergeMessage {
  type: 'ai_concierge_message';
  payload: {
    sessionId: string;
    message: string;
    context?: ConversationContext;
    attachments?: string[];
  };
}

interface AIConciergeResponse {
  type: 'ai_concierge_response';
  payload: {
    sessionId: string;
    message: string;
    richMedia?: RichMediaResponse;
    actions?: ChatAction[];
    context?: ConversationContext;
  };
}
```

#### 2. Conversational Flow for PWA
**New File:** `src/services/PWAConciergeService.ts`
**Purpose:** Orchestrates the PWA-specific conversational flow

**Flow States:**
1. **GREETING** - Welcome message and service discovery
2. **SERVICE_DISCOVERY** - Browse/search services
3. **SERVICE_RECOMMENDATION** - AI-powered service suggestions
4. **STYLIST_PREFERENCE** - Stylist selection/preference
5. **TIME_SLOT_SUGGESTION** - Smart slot recommendations
6. **BOOKING_CONFIRMATION** - Final booking confirmation
7. **POST_BOOKING** - Care instructions and follow-up

**State Machine Implementation:**
```typescript
enum ConciergeState {
  GREETING = 'greeting',
  SERVICE_DISCOVERY = 'service_discovery',
  SERVICE_RECOMMENDATION = 'service_recommendation',
  STYLIST_PREFERENCE = 'stylist_preference',
  TIME_SLOT_SUGGESTION = 'time_slot_suggestion',
  BOOKING_CONFIRMATION = 'booking_confirmation',
  POST_BOOKING = 'post_booking'
}
```

#### 3. Rich Media Responses
**New File:** `src/services/RichMediaFormatter.ts`
**Purpose:** Formats responses for PWA components

**ServiceCard Data Structure:**
```typescript
interface ServiceCardData {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl: string;
  category: string;
  tags: string[];
  popularity: number;
  aiRecommendationScore?: number;
}
```

**SlotSelector Data Structure:**
```typescript
interface SlotSelectorData {
  slots: Array<{
    id: string;
    startTime: string;
    endTime: string;
    staffId: string;
    staffName: string;
    staffImage?: string;
    score: number; // Smart ranking score
    isGapFilling?: boolean;
    isOptimal?: boolean;
  }>;
  selectedDate: string;
  serviceId: string;
  serviceName: string;
}
```

#### 4. Context Management
**Enhanced File:** `src/services/ConversationContextStore.ts`
**Modifications:**
- Add PWA-specific context fields
- Implement session timeout (30 minutes inactivity)
- Add conversation history persistence
- Support for context transfer between devices

**Context Schema:**
```typescript
interface PWAConversationContext {
  sessionId: string;
  clientId?: string;
  salonId: string;
  currentState: ConciergeState;
  preferences: {
    servicePreferences: string[];
    stylistPreferences: string[];
    timePreferences: string[];
    priceRange?: { min: number; max: number };
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    metadata?: any;
  }>;
  bookingIntent?: BookingIntent;
  lastActivity: Date;
}
```

### Frontend Integration
**Modified File:** `frontend/src/pages/client/ClientChat.tsx`
**Changes:**
- Replace simulated responses with WebSocket connection
- Implement real-time message rendering
- Add rich media component rendering (ServiceCard, SlotSelector)
- Add typing indicators and connection status

**New Components:**
1. `frontend/src/components/concierge/ServiceCard.tsx` - Service recommendation cards
2. `frontend/src/components/concierge/SlotSelector.tsx` - Time slot selection
3. `frontend/src/components/concierge/BookingSummary.tsx` - Booking confirmation
4. `frontend/src/components/concierge/TypingIndicator.tsx` - Real-time typing indicator

### WebSocket Protocol
**Connection URL:** `wss://[domain]/ws?salon_id=[id]&user_id=[id]&token=[jwt]`

**Message Flow:**
1. Client connects with authentication
2. Server sends welcome message with session ID
3. Client sends user message
4. Server processes through AI pipeline
5. Server responds with rich media response
6. Client renders appropriate components
7. Repeat until booking complete or session timeout

**Error Handling:**
- Connection drops: Auto-reconnect with exponential backoff
- Authentication failure: Redirect to login
- AI service failure: Fallback to basic responses
- Network issues: Queue messages for retry

## Task 021: AI - Smart Slot Suggestions Enhancement (P1)

### Current Slot Generation Analysis
**Existing Implementation:**
- `SlotGenerator.ts` - Basic availability calculation based on:
  - Service duration
  - Staff working hours
  - Existing appointments
  - Salon capacity

### Implementation Plan

#### 1. Client History Analysis
**New File:** `src/services/ClientHistoryAnalyzer.ts`
**Purpose:** Analyzes client booking patterns and preferences

**Data Sources:**
- `appointments` table - Historical bookings
- `client_beauty_profiles` - Service preferences
- `conversation_contexts` - Interaction history
- `slot_suggestion_feedback` - Acceptance/rejection data

**Analysis Metrics:**
```typescript
interface ClientBookingPattern {
  clientId: string;
  preferredTimes: Array<{
    hour: number;
    dayOfWeek: number;
    frequency: number;
  }>;
  preferredStylists: Array<{
    staffId: string;
    frequency: number;
    lastBooked: Date;
  }>;
  rebookingPatterns: Array<{
    serviceId: string;
    averageInterval: number; // days
    lastBooked: Date;
  }>;
  priceSensitivity: 'low' | 'medium' | 'high';
  advanceBookingPreference: number; // days in advance
}
```

#### 2. Gap-Filling Optimization
**New File:** `src/services/GapFillOptimizer.ts`
**Purpose:** Identifies and prioritizes schedule gaps

**Gap Detection Algorithm:**
```typescript
interface ScheduleGap {
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  staffId?: string;
  priority: number; // 0-1, higher = more important to fill
  surroundingAppointments: Array<{
    before?: Appointment;
    after?: Appointment;
  }>;
}

class GapFillOptimizer {
  async identifyGaps(salonId: string, date: string): Promise<ScheduleGap[]> {
    // 1. Get all appointments for the day
    // 2. Identify gaps between appointments
    // 3. Calculate gap priority based on:
    //    - Size of gap (larger gaps = higher priority)
    //    - Time of day (peak hours = higher priority)
    //    - Staff utilization (underutilized staff = higher priority)
    //    - Revenue potential (higher-value services = higher priority)
    // 4. Return sorted gaps by priority
  }
}
```

#### 3. Smart Ranking Algorithm
**New File:** `src/services/SmartSlotRanker.ts`
**Purpose:** Scores and ranks available slots using ML-based algorithm

**Ranking Factors & Weights:**
```typescript
interface SlotRankingFactors {
  clientPreferenceMatch: number; // 0.35 weight
  scheduleOptimization: number; // 0.25 weight
  staffAvailability: number; // 0.20 weight
  serviceDurationFit: number; // 0.10 weight
  revenueOptimization: number; // 0.10 weight
}

class SmartSlotRanker {
  async rankSlots(
    slots: SuggestedSlot[],
    clientId: string,
    serviceId: string,
    salonId: string
  ): Promise<RankedSlot[]> {
    // 1. Get client history analysis
    // 2. Get schedule gaps
    // 3. Calculate each factor score
    // 4. Apply weights and calculate total score
    // 5. Apply business rules (e.g., don't suggest late slots for new clients)
    // 6. Return ranked slots with scores
  }
  
  private calculateClientPreferenceScore(
    slot: SuggestedSlot,
    clientPattern: ClientBookingPattern
  ): number {
    // Score based on:
    // - Time of day match
    // - Day of week match
    // - Stylist preference match
    // - Historical booking patterns
  }
  
  private calculateScheduleOptimizationScore(
    slot: SuggestedSlot,
    gaps: ScheduleGap[],
    staffUtilization: Map<string, number>
  ): number {
    // Score based on:
    // - Gap filling potential
    // - Staff utilization balancing
    // - Schedule density optimization
  }
}
```

#### 4. A/B Testing Framework
**New Files:**
- `src/services/ABTestingService.ts` - Manages experiments
- `src/services/MetricsCollector.ts` - Collects and analyzes metrics

**Database Schema:**
```sql
CREATE TABLE slot_suggestion_experiments (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  algorithm_version VARCHAR(50) NOT NULL,
  weights JSONB, -- Ranking factor weights
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE slot_suggestion_metrics (
  id UUID PRIMARY KEY,
  experiment_id UUID REFERENCES slot_suggestion_experiments(id),
  client_id UUID,
  service_id UUID,
  suggested_slots JSONB, -- Array of suggested slots
  selected_slot JSONB, -- Slot selected by client
  acceptance_rate DECIMAL(5,4),
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Experiment Tracking:**
```typescript
interface ExperimentMetrics {
  experimentId: string;
  totalSuggestions: number;
  acceptedSuggestions: number;
  acceptanceRate: number;
  averageResponseTime: number;
  clientSatisfaction?: number; // From feedback
  revenueImpact?: number;
}
```

### Integration with Existing Systems

#### 1. Enhanced SlotGenerator
**Modified File:** `src/services/SlotGenerator.ts`
**Changes:**
- Integrate SmartSlotRanker for ranking
- Add gap-filling optimization
- Include client preference analysis
- Support for A/B testing variations

#### 2. AI Concierge Integration
**Modified File:** `src/services/AIConciergeBookingService.ts`
**Changes:**
- Use SmartSlotRanker for slot suggestions
- Include ranking scores in responses
- Track suggestion acceptance for A/B testing

#### 3. Database Migrations
**New Migration Files:**
1. `db/migrations/XXXX_add_slot_ranking_columns.sql`
2. `db/migrations/XXXX_create_experiment_tables.sql`
3. `db/migrations/XXXX_add_client_preferences.sql`

### Testing Strategy

#### Unit Tests
1. **WebSocket Service Tests** (`__tests__/services/WebSocketService.test.ts`)
   - Connection/authentication
   - Message routing
   - Session management
   - Error handling

2. **PWA Concierge Service Tests** (`__tests__/services/PWAConciergeService.test.ts`)
   - State machine transitions
   - Context management
   - Rich media formatting
   - Error recovery

3. **Smart Slot Ranker Tests** (`__tests__/services/SmartSlotRanker.test.ts`)
   - Ranking algorithm accuracy
   - Factor weight calculations
   - Edge case handling
   - Performance with large datasets

#### Integration Tests
1. **End-to-End Booking Flow** (`__tests__/integration/pwaConcierge.test.ts`)
   - WebSocket connection → AI processing → Booking creation
   - Context persistence across messages
   - Rich media rendering

2. **A/B Testing Framework** (`__tests__/integration/abTesting.test.ts`)
   - Experiment assignment
   - Metrics collection
   - Statistical significance calculation

#### Performance Tests
1. **WebSocket Load Testing** (`__tests__/performance/websocketLoad.test.ts`)
   - Concurrent connections (target: 1000+)
   - Message throughput
   - Memory usage under load

2. **Slot Ranking Performance** (`__tests__/performance/slotRanking.test.ts`)
   - Ranking 1000+ slots
   - Response time < 200ms
   - Memory efficiency

### Deployment Plan

#### Phase 1: Backend Implementation (Days 1-3)
1. Implement WebSocket authentication and routing
2. Create PWAConciergeService with state machine
3. Implement RichMediaFormatter
4. Enhance ConversationContextStore

#### Phase 2: Smart Slot Suggestions (Days 4-6)
1. Implement ClientHistoryAnalyzer
2. Create GapFillOptimizer
3. Build SmartSlotRanker with ML algorithms
4. Set up A/B testing framework

#### Phase 3: Frontend Integration (Days 7-9)
1. Update ClientChat.tsx with WebSocket connection
2. Create rich media components
3. Implement real-time updates
4. Add connection status and error handling

#### Phase 4: Testing & Optimization (Days 10-12)
1. Unit and integration testing
2. Performance optimization
3. A/B testing setup
4. Documentation and monitoring

### Success Metrics

#### Task 020 Success Criteria:
1. WebSocket connection success rate > 99%
2. AI response time < 2 seconds
3. Booking completion rate increase by 25%
4. User satisfaction score > 4.5/5

#### Task 021 Success Criteria:
1. Slot suggestion acceptance rate increase by 30%
2. Schedule utilization improvement by 15%
3. Client preference match accuracy > 80%
4. A/B testing statistical significance achieved

### Risk Mitigation

#### Technical Risks:
1. **WebSocket Scalability**: Implement connection pooling and horizontal scaling
2. **AI Service Latency**: Add caching and fallback mechanisms
3. **Data Privacy**: Implement encryption and access controls
4. **Algorithm Bias**: Regular bias audits and diverse training data

#### Business Risks:
1. **User Adoption**: Gradual rollout with feature flags
2. **Performance Impact**: Load testing and monitoring
3. **Integration Complexity**: Comprehensive integration tests
4. **Maintenance Overhead**: Automated testing and monitoring

