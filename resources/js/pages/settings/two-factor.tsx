import HeadingSmall from '@/components/heading-small';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ShieldBan, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface TwoFactorProps {
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Two-Factor Authentication', href: '/settings/two-factor' },
];

export default function TwoFactor({
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: TwoFactorProps) {
    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();

    const [showSetupModal, setShowSetupModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    const enableTwoFactor = () => {
        setProcessing(true);

        router.post(
            '/user/two-factor-authentication',
            {},
            {
                preserveScroll: true,
                onSuccess: async () => {
                    await fetchSetupData();
                    setShowSetupModal(true);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const disableTwoFactor = () => {
        setProcessing(true);

        router.delete('/user/two-factor-authentication', {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Two-Factor Authentication" />

            <SettingsLayout>
                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
                        <HeadingSmall
                            title="Two-Factor Authentication"
                            description="Add an extra layer of security to your account."
                        />

                        <div className="mt-6 flex flex-col gap-4 rounded-[2rem] border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center gap-3">
                                <Badge
                                    variant={
                                        twoFactorEnabled
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                </Badge>

                                {twoFactorEnabled ? (
                                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                ) : (
                                    <ShieldBan className="h-5 w-5 text-slate-500" />
                                )}
                            </div>

                            {twoFactorEnabled ? (
                                <>
                                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                                        Two-factor authentication is enabled.
                                        You will be prompted for a secure,
                                        random pin from your authenticator app
                                        during login.
                                    </p>

                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={disableTwoFactor}
                                            disabled={processing}
                                        >
                                            Disable 2FA
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={async () => {
                                                await fetchSetupData();
                                                setShowSetupModal(true);
                                            }}
                                        >
                                            View Setup
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                                        When you enable two-factor
                                        authentication, you will be prompted for
                                        a secure pin from a TOTP-supported
                                        authenticator app on your phone.
                                    </p>

                                    <Button
                                        type="button"
                                        onClick={enableTwoFactor}
                                        disabled={processing}
                                    >
                                        Enable 2FA
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {twoFactorEnabled && (
                        <TwoFactorRecoveryCodes
                            recoveryCodesList={recoveryCodesList}
                            fetchRecoveryCodes={fetchRecoveryCodes}
                            errors={errors}
                        />
                    )}

                    <TwoFactorSetupModal
                        isOpen={showSetupModal}
                        onClose={() => setShowSetupModal(false)}
                        requiresConfirmation={requiresConfirmation}
                        twoFactorEnabled={twoFactorEnabled}
                        qrCodeSvg={qrCodeSvg}
                        manualSetupKey={manualSetupKey}
                        clearSetupData={clearSetupData}
                        fetchSetupData={fetchSetupData}
                        errors={errors}
                    />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
