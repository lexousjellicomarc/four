import { Loader2, ShieldCheck } from 'lucide-react';

type BookingFormLoadingLayerProps = {
    visible: boolean;
    label?: string;
    sublabel?: string;
};

export function BookingFormLoadingLayer({
    visible,
    label = 'Loading reservation form',
    sublabel = 'Please wait while the next booking section is prepared.',
}: BookingFormLoadingLayerProps) {
    if (!visible) return null;

    return (
        <div className="booking-form-loading-layer">
            <div className="booking-form-loading-card">
                <div className="booking-form-loading-icon">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>

                <div className="min-w-0">
                    <p className="backend-booking-label">BCCC EASE</p>
                    <h3>{label}</h3>
                    <span>{sublabel}</span>
                </div>

                <div className="booking-form-loading-seal">
                    <ShieldCheck className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}
