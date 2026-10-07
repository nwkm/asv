import { setRequestLocale } from 'next-intl/server';
import { LoginForm } from './login-form';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-forest-900 p-14 text-forest-50 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -bottom-24 size-[28rem] rounded-full border-[3rem] border-clay-500/80" />
        <div className="absolute right-24 bottom-40 size-40 rounded-full bg-ochre-500/90" />
        <p className="font-display text-2xl tracking-wide">ASV</p>
        <h1 className="relative max-w-md font-display text-6xl leading-[1.05] font-medium">
          Every gift, every hand, every course — in one place.
        </h1>
      </section>
      <section className="flex items-center justify-center p-8">
        <LoginForm />
      </section>
    </main>
  );
}
