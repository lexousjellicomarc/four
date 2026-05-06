import GoogleSignInButton from '@/components/auth/google-sign-in-button';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

type SharedProps = {
    features?: {
        googleAuthEnabled?: boolean;
    };
};

export default function Login({ status, canResetPassword }: LoginProps) {
    const { features } = usePage<SharedProps>().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Log in to your account"
            description="Use your email and password, or continue with Google if it is enabled."
        >
            <Head title="Log in" />

            {status && (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    {status}
                </div>
            )}

            <div className="flex flex-col gap-6">
                {!!features?.googleAuthEnabled && (
                    <>
                        <GoogleSignInButton label="Log in with Google" />

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs tracking-[0.18em] uppercase">
                                <span className="bg-background px-3 text-muted-foreground">
                                    Or continue with email
                                </span>
                            </div>
                        </div>
                    </>
                )}

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                placeholder="email@example.com"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                            />
                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>

                                {canResetPassword && (
                                    <TextLink
                                        href="/forgot-password"
                                        className="ml-auto text-sm"
                                        tabIndex={5}
                                    >
                                        Forgot password?
                                    </TextLink>
                                )}
                            </div>

                            <Input
                                id="password"
                                type="password"
                                name="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                placeholder="Password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                            />
                            <InputError
                                message={errors.password}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="remember"
                                checked={data.remember}
                                onCheckedChange={(checked) =>
                                    setData('remember', !!checked)
                                }
                                tabIndex={3}
                            />
                            <Label htmlFor="remember">Remember me</Label>
                        </div>

                        <Button
                            type="submit"
                            className="mt-2 w-full"
                            tabIndex={4}
                            disabled={processing}
                        >
                            {processing && (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            )}
                            Log in
                        </Button>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/register"
                            className="underline underline-offset-4"
                        >
                            Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}
