import { DEFAULT_MODEL } from "@/app/ai";
import { Chat } from "@/components/chat/chat";
import { generateUUID } from "@/lib/utils";
import { cookies } from "next/headers";

export default async function Page() {
  const id = generateUUID();
  const cookieStore = await cookies();
  const modelFromCookie = cookieStore.get("model-id")?.value || DEFAULT_MODEL;

  return (
    <Chat id={id} initialMessages={[]} selectedModelId={modelFromCookie} />
  );
}
