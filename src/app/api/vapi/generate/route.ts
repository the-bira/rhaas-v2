

export async function GET() {
  return Response.json(
    { success: true, data: "Hello, world!" },
    { status: 200 }
  );
}

