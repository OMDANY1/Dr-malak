import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/lib/locales";

export default function RootRedirectPage() {
  redirect(`/${DEFAULT_LOCALE}`);
}
