import { FormEvent } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import GoogleSignInButton from '@/components/auth/google-sign-in-button';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type SharedProps = {
    features?: {
        googleAuthEnabled?: boolean;
    };
};

export default function Register() {
    const { features } = usePage<SharedProps>().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        organization_name: '',
        organization_type: '',
        position_title: '',
        address_line1: '',
        barangay: '',
        city_municipality: '',
        province: '',
        postal_code: '',
        country: 'Philippines',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Create an account"
            description="Provide your client details so the admin team can properly verify and contact you."
        >
            <Head title="Register" />

            <div className="flex flex-col gap-6">
                {!!features?.googleAuthEnabled && (
                    <>
                        <GoogleSignInButton label="Sign up with Google" />

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-[0.18em]">
                                <span className="bg-background px-3 text-muted-foreground">
                                    Or continue with email
                                </span>
                            </div>
                        </div>
                    </>
                )}

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <div className="grid gap-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="first_name">First name</Label>
                                <Input
                                    id="first_name"
                                    type="text"
                                    required
                                    autoFocus
                                    autoComplete="given-name"
                                    placeholder="First name"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                />
                                <InputError message={errors.first_name} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="middle_name">Middle name</Label>
                                <Input
                                    id="middle_name"
                                    type="text"
                                    autoComplete="additional-name"
                                    placeholder="Middle name"
                                    value={data.middle_name}
                                    onChange={(e) => setData('middle_name', e.target.value)}
                                />
                                <InputError message={errors.middle_name} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="last_name">Last name</Label>
                                <Input
                                    id="last_name"
                                    type="text"
                                    required
                                    autoComplete="family-name"
                                    placeholder="Last name"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                />
                                <InputError message={errors.last_name} className="mt-2" />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone_number">Philippine mobile number</Label>
                                <Input
                                    id="phone_number"
                                    type="text"
                                    required
                                    inputMode="numeric"
                                    autoComplete="tel"
                                    placeholder="09171234567"
                                    value={data.phone_number}
                                    onChange={(e) => setData('phone_number', e.target.value.replace(/\D/g, ''))}
                                />
                                <p className="text-xs text-muted-foreground">Digits only. Example: 09171234567</p>
                                <InputError message={errors.phone_number} className="mt-2" />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="organization_name">Organization / company</Label>
                                <Input
                                    id="organization_name"
                                    type="text"
                                    placeholder="Agency, company, school, or organization"
                                    value={data.organization_name}
                                    onChange={(e) => setData('organization_name', e.target.value)}
                                />
                                <InputError message={errors.organization_name} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="organization_type">Organization type</Label>
                                <Input
                                    id="organization_type"
                                    type="text"
                                    placeholder="Government, private, NGO, school"
                                    value={data.organization_type}
                                    onChange={(e) => setData('organization_type', e.target.value)}
                                />
                                <InputError message={errors.organization_type} className="mt-2" />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="position_title">Position / designation</Label>
                                <Input
                                    id="position_title"
                                    type="text"
                                    placeholder="Coordinator, representative, officer"
                                    value={data.position_title}
                                    onChange={(e) => setData('position_title', e.target.value)}
                                />
                                <InputError message={errors.position_title} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address_line1">Address line</Label>
                                <Input
                                    id="address_line1"
                                    type="text"
                                    placeholder="House / building / street"
                                    value={data.address_line1}
                                    onChange={(e) => setData('address_line1', e.target.value)}
                                />
                                <InputError message={errors.address_line1} className="mt-2" />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="grid gap-2">
                                <Label htmlFor="barangay">Barangay</Label>
                                <Input
                                    id="barangay"
                                    type="text"
                                    placeholder="Barangay"
                                    value={data.barangay}
                                    onChange={(e) => setData('barangay', e.target.value)}
                                />
                                <InputError message={errors.barangay} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="city_municipality">City / municipality</Label>
                                <Input
                                    id="city_municipality"
                                    type="text"
                                    required
                                    placeholder="City / municipality"
                                    value={data.city_municipality}
                                    onChange={(e) => setData('city_municipality', e.target.value)}
                                />
                                <InputError message={errors.city_municipality} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="province">Province</Label>
                                <Input
                                    id="province"
                                    type="text"
                                    required
                                    placeholder="Province"
                                    value={data.province}
                                    onChange={(e) => setData('province', e.target.value)}
                                />
                                <InputError message={errors.province} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="postal_code">Postal code</Label>
                                <Input
                                    id="postal_code"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Postal code"
                                    value={data.postal_code}
                                    onChange={(e) => setData('postal_code', e.target.value.replace(/\D/g, ''))}
                                />
                                <InputError message={errors.postal_code} className="mt-2" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                id="country"
                                type="text"
                                value={data.country}
                                readOnly
                                disabled
                            />
                            <InputError message={errors.country} className="mt-2" />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    placeholder="Password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    placeholder="Confirm password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                />
                                <InputError message={errors.password_confirmation} className="mt-2" />
                            </div>
                        </div>

                        <Button type="submit" className="mt-2 w-full" disabled={processing}>
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Create account
                        </Button>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="underline underline-offset-4">
                            Log in
                        </Link>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}
