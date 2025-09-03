"use server";
import { cookies } from "next/headers";

export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("model-id", model);
}

export async function saveCustomModel(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("custom-model", model);
}
