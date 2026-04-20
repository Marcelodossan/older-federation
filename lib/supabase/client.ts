import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    "https://jasuovixhduciaofgoao.supabase.co",
    "sb_publishable_QEyeR2JiV5S509AkjRVeEg_iCyReFbA"
  );
}