import { aiUsageAnalytics } from '../features/analytics/AIUsageAnalytics';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  private apiKey: string;
  private model: string;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo';
    
    console.log('OpenAI Service: Initializing...');
    console.log('OpenAI Service: API Key exists:', !!this.apiKey);
    console.log('OpenAI Service: API Key length:', this.apiKey?.length);
    console.log('OpenAI Service: Model:', this.model);
    
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.');
    } else {
      console.log('OpenAI Service: Successfully configured with API key');
    }
  }

  async sendMessage(
    userMessage: string, 
    conversationHistory: ChatMessage[] = [],
    systemPrompt?: string,
    documentInfo?: { id?: string; title?: string }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const startTime = Date.now();
    let success = false;
    let error: string | undefined;

    try {
      // Prepare messages array
      const messages: ChatMessage[] = [];
      
      // Add system prompt if provided
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }
      
      // Add conversation history
      messages.push(...conversationHistory);
      
      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      console.log('OpenAI Service: Sending request with messages:', messages.length);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API Error:', response.status, errorData);
        
        // Log more details for debugging
        console.error('OpenAI API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          apiKeyLength: this.apiKey?.length,
          apiKeyPrefix: this.apiKey?.substring(0, 10) + '...',
          model: this.model,
          url: `${this.baseUrl}/chat/completions`
        });
        
        if (response.status === 401) {
          error = `OpenAI API Authentication Error (401): Invalid API key. Please check your API key in the .env file.`;
          throw new Error(error);
        } else if (response.status === 429) {
          error = `OpenAI API Rate Limit Error (429): Too many requests. Please try again later.`;
          throw new Error(error);
        } else {
          error = `OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`;
          throw new Error(error);
        }
      }

      const data: OpenAIResponse = await response.json();
      
      console.log('OpenAI Service: Response received, tokens used:', data.usage);
      
      const responseTime = Date.now() - startTime;
      const aiResponse = data.choices[0]?.message?.content || 'No response from AI';
      success = true;

      // Track usage analytics
      await aiUsageAnalytics.trackUsage({
        userId: undefined, // TODO: Get from auth context
        documentId: documentInfo?.id,
        documentTitle: documentInfo?.title,
        userMessage,
        aiResponse,
        tokensUsed: {
          prompt: data.usage.prompt_tokens,
          completion: data.usage.completion_tokens,
          total: data.usage.total_tokens,
        },
        model: this.model,
        responseTime,
        success: true,
      });
      
      return aiResponse;
    } catch (err) {
      const responseTime = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error = errorMessage;

      // Track failed usage
      await aiUsageAnalytics.trackUsage({
        userId: undefined, // TODO: Get from auth context
        documentId: documentInfo?.id,
        documentTitle: documentInfo?.title,
        userMessage,
        aiResponse: '',
        tokensUsed: {
          prompt: 0,
          completion: 0,
          total: 0,
        },
        model: this.model,
        responseTime,
        success: false,
        error: errorMessage,
      });

      console.error('OpenAI Service: Error calling API:', err);
      throw err;
    }
  }

  // Helper method to create a system prompt for PDF analysis
  createPDFSystemPrompt(documentTitle?: string): string {
    return `You are an AI assistant helping users analyze and understand PDF documents. 

${documentTitle ? `The current document is titled: "${documentTitle}"` : 'A PDF document is currently open.'}

Your role is to:
- Answer questions about the document content
- Help users navigate and understand the document
- Provide summaries and insights
- Assist with document-related tasks
- Be helpful, accurate, and concise

If the user asks about content that isn't visible in the current document, politely explain that you can only analyze what's currently available.`;
  }

  // Check if the service is properly configured
  isConfigured(): boolean {
    const configured = !!this.apiKey;
    console.log('OpenAI Service: isConfigured called, result:', configured);
    return configured;
  }

  // Test API key format and validity
  async testAPIKey(): Promise<boolean> {
    if (!this.apiKey) {
      console.error('OpenAI Service: No API key configured');
      return false;
    }

    console.log('OpenAI Service: Testing API key...');
    console.log('OpenAI Service: API Key length:', this.apiKey.length);
    console.log('OpenAI Service: API Key format check:', this.apiKey.startsWith('sk-') ? 'Valid format (starts with sk-)' : 'Invalid format (should start with sk-)');

    try {
      // Make a simple test call to validate the API key
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('OpenAI Service: API key is valid!');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI Service: API key test failed:', response.status, errorData);
        return false;
      }
    } catch (error) {
      console.error('OpenAI Service: API key test error:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const openAIService = new OpenAIService();
