import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export function AuthScreen({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="relative hidden min-h-screen lg:block">
        <Image
          src="/landing-hero.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
        />
      </div>
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <Link
            href="/"
            aria-label="MakeMyMarriage"
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze"
          >
            <Wordmark size="header" />
          </Link>
          <h1 className="mb-8 mt-10 text-[28px] font-medium tracking-[-0.02em]">
            {title}
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
}
