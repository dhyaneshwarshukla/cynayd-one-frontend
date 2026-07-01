import { redirect } from 'next/navigation';

type LoginPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default function LoginRedirectPage({ searchParams }: LoginPageProps) {
  const next = typeof searchParams.next === 'string' ? searchParams.next : undefined;
  const target = next
    ? `/auth/login?next=${encodeURIComponent(next)}`
    : '/auth/login';
  redirect(target);
}
