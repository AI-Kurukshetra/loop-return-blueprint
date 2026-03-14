type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type SmsPayload = {
  to: string;
  body: string;
};

type ConnectorResult = {
  ok: boolean;
  providerRef?: string;
  error?: string;
  provider: "mcp_resend" | "mcp_twilio" | "mcp_shopify" | "mock";
};

async function postToConnector(
  url: string,
  token: string | undefined,
  payload: Record<string, unknown>
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function sendEmailViaMcp(payload: EmailPayload): Promise<ConnectorResult> {
  const url = process.env.MCP_RESEND_ENDPOINT;
  const token = process.env.MCP_RESEND_TOKEN;

  if (!url) {
    return {
      ok: true,
      provider: "mock",
      providerRef: `mock-email-${Date.now()}`,
    };
  }

  try {
    const { response, data } = await postToConnector(url, token, {
      tool: "resend.send",
      ...payload,
    });

    if (!response.ok) {
      return {
        ok: false,
        provider: "mcp_resend",
        error: data?.error ?? `Connector failed with status ${response.status}`,
      };
    }

    return {
      ok: true,
      provider: "mcp_resend",
      providerRef: data?.id ?? data?.messageId,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "mcp_resend",
      error: error instanceof Error ? error.message : "Unknown connector error",
    };
  }
}

export async function sendSmsViaMcp(payload: SmsPayload): Promise<ConnectorResult> {
  const url = process.env.MCP_TWILIO_ENDPOINT;
  const token = process.env.MCP_TWILIO_TOKEN;

  if (!url) {
    return {
      ok: true,
      provider: "mock",
      providerRef: `mock-sms-${Date.now()}`,
    };
  }

  try {
    const { response, data } = await postToConnector(url, token, {
      tool: "twilio.sms.send",
      ...payload,
    });

    if (!response.ok) {
      return {
        ok: false,
        provider: "mcp_twilio",
        error: data?.error ?? `Connector failed with status ${response.status}`,
      };
    }

    return {
      ok: true,
      provider: "mcp_twilio",
      providerRef: data?.sid ?? data?.id,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "mcp_twilio",
      error: error instanceof Error ? error.message : "Unknown connector error",
    };
  }
}

type ShopifyConnectPayload = {
  shopifyDomain: string;
  shopifyAccessToken: string;
};

export async function connectShopifyViaMcp(
  payload: ShopifyConnectPayload
): Promise<ConnectorResult> {
  const url = process.env.MCP_SHOPIFY_ENDPOINT;
  const token = process.env.MCP_SHOPIFY_TOKEN;

  if (!url) {
    return {
      ok: true,
      provider: "mock",
      providerRef: `mock-shopify-${Date.now()}`,
    };
  }

  try {
    const { response, data } = await postToConnector(url, token, {
      tool: "shopify.connect",
      domain: payload.shopifyDomain,
      accessToken: payload.shopifyAccessToken,
    });

    if (!response.ok) {
      return {
        ok: false,
        provider: "mcp_shopify",
        error: data?.error ?? `Connector failed with status ${response.status}`,
      };
    }

    return {
      ok: true,
      provider: "mcp_shopify",
      providerRef: data?.connectionId ?? data?.id,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "mcp_shopify",
      error: error instanceof Error ? error.message : "Unknown connector error",
    };
  }
}
