"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SigninSchema } from "@repo/common/types";
import { useRouter } from "next/navigation";

export default function SigninForm({
  emailRef,
  passwordRef,
  onclick,
  loading
}: {
  emailRef: React.RefObject<HTMLInputElement | null>;
  passwordRef: React.RefObject<HTMLInputElement | null>;
  onclick: () => void;
  loading: boolean
}) {
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const router=useRouter();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedData = SigninSchema.safeParse({
      username: emailRef.current?.value,
      password: passwordRef.current?.value,
    });

    if (!parsedData.success) {
      const errors: { email?: string; password?: string } = {};
      parsedData.error.errors.forEach((err) => {
        if (err.path[0] === "username") {
          errors.email = err.message;
        }
        if (err.path[0] === "password") {
          errors.password = err.message;
        }
      });
      setFieldErrors(errors);
    } else {
      setFieldErrors({});
      onclick();
    }
  };

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Welcome to Vistara
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        Signin to Vistara to draw your thoughts.
      </p>

      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input ref={emailRef} id="email" placeholder="johncen69@gmail.com" type="email" />
          {fieldErrors.email && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
          )}
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input ref={passwordRef} id="password" placeholder="••••••••" type="password" />
          {fieldErrors.password && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
          )}
        </LabelInputContainer>

        <button
          disabled={loading}
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <>
              Sign in &rarr;
              <BottomGradient />
            </>
          )}
        </button>
        <p className="mt-4 text-sm text-center text-neutral-600 dark:text-neutral-300">
          New to Vistara?{" "}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="text-blue-600 cursor-pointer dark:text-blue-400"
          >
            Sign up
          </button>
        </p>

      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
