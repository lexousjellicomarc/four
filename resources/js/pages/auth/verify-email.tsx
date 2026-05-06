import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/email/verification-notification');
    };

    return (
        <AuthLayout
            title="Verify email"
            description="Please verify your email address by clicking the link we sent to your inbox."
        >
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    A new verification link has been sent to your email address.
                </div>
            )}

            <form onSubmit={submit} className="space-y-6 text-center">
                <Button type="submit" disabled={processing} variant="secondary">
                    {processing && (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    )}
                    Resend verification email
                </Button>

                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="mx-auto block text-sm underline underline-offset-4"
                >
                    Log out
                </Link>
            </form>
        </AuthLayout>
    );
}
