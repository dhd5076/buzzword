type CamelidCoinResponse = {
  choices: Array<{
    message?: { content?: string };
  }>;
};

export default async function generateCompletion(prompt: string): Promise<string> {
  const apiKey = process.env.CAMELIDCOIN_API_KEY;
  const baseUrl = process.env.CAMELIDCOIN_URL;
  const model = process.env.CAMELIDCOIN_MODEL;
  if (!apiKey) {
    throw new Error("Missing CAMELIDCOIN_API_KEY");
  }
  if (!baseUrl) {
    throw new Error("Missing CAMELIDCOIN_URL");
  }
  if (!model) {
    throw new Error("Missing CAMELIDCOIN_MODEL");
  }

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CamelidCoin error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as CamelidCoinResponse;
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
