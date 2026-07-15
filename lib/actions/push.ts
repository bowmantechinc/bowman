"use server";

import { requireSession } from "@/lib/auth/dal";
import { pushSubscriptionsRepo, removeByEndpoint } from "@/lib/db/pushSubscriptions";

export async function subscribeToPush(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<void> {
  const session = await requireSession();
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return;

  await removeByEndpoint(sub.endpoint);
  await pushSubscriptionsRepo.create({
    id: crypto.randomUUID(),
    memberId: session.sub,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    createdAt: new Date().toISOString(),
  });
}

export async function unsubscribeFromPush(endpoint: string): Promise<void> {
  await requireSession();
  await removeByEndpoint(endpoint);
}
