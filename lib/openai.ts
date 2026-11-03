// Native fetch client for OpenAI API (gpt-4o-mini with structured outputs)
// Works with or without external openai npm dependency

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callOpenAI(messages: ChatMessage[], responseFormatJson: boolean = true) {
  const apiKey = process.env.OPENAI_API_KEY;

  // Fallback simulator for development/testing when no key is set
  if (!apiKey || apiKey === 'sk-placeholder' || apiKey.startsWith('sk-test-placeholder')) {
    console.warn('[OpenAI] No valid OPENAI_API_KEY detected. Using deterministic AI Risk Analysis simulation.');
    return {
      riskScore: 78,
      overallHealth: 'Critical',
      summary: 'Critical bottleneck identified in Stripe 3DS webhook listener (blocked 5+ days). High risk of sprint delay for payment milestone.',
      insights: [
        {
          issue_summary: 'Stripe 3DS Webhook Listener has been blocked for 5 days. Critical path for Checkout launch is stalling.',
          suggested_action: 'Reassign senior integration engineer to unblock webhook verification sandbox; review Stripe TLS certificate configs.',
          severity: 'Critical'
        },
        {
          issue_summary: 'Usage-Based Billing task has been 4 days in progress without code reviews.',
          suggested_action: 'Split into smaller deliverables: Metering ingestion first, rate limiting and quotas second.',
          severity: 'High'
        },
        {
          issue_summary: 'Assignee workload imbalance: Sarah Chen owns 2 high-complexity tasks with critical dependencies.',
          suggested_action: 'Pair with David Kim on checkout error boundary testing to redistribute load.',
          severity: 'Medium'
        }
      ]
    };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.2,
      response_format: responseFormatJson ? { type: 'json_object' } : undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (responseFormatJson && content) {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }
  return content;
}
