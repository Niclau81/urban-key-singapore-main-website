type ResponseLike = { status: (statusCode: number) => ResponseLike; json: (body: Record<string, string>) => void };

export default function handler(_request: unknown, response: ResponseLike) {
  response.status(200).json({ service: "urban-key-main", status: "ok", paymentProvider: "excluded" });
}
