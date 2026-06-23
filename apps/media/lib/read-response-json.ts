export async function readResponseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error("EMPTY_RESPONSE");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
  }
}

export const EMPTY_WEBHOOK_RESPONSE_MESSAGE =
  "The workflow returned no data. Ensure the n8n workflow ends with a Respond to Webhook node that returns blueprint JSON.";
