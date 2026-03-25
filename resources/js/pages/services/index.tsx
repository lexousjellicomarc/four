import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Service, type BreadcrumbItem, type ServiceTypeOption } from '@/types';

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

import ServiceFormModal from './ServiceFormModal';
import DeleteServiceDialog from './DeleteServiceDialog';
import servicesRoutes from '@/routes/services';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Services', href: servicesRoutes.index.url() },
];

interface LaravelPaginationLink {
    url: string | null;
    label: string;
    page: number;
    active: boolean;
}

interface ServicesPageProps {
    services: {
        data: Service[];
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            links: LaravelPaginationLink[];
        };
        links: {
            first: string | null;
            last: string | null;
            prev: string | null;
            next: string | null;
        };
    };
    serviceTypes: ServiceTypeOption[];
}

function guestLimitLabel(service: Service) {
    const min = service.min_guests ?? null;
    const max = service.max_guests ?? null;

    if (min !== null && max !== null) return `${min}–${max}`;
    if (min !== null) return `Min ${min}`;
    if (max !== null) return `Max ${max}`;

    return 'No limit';
}

export default function Services({ services, serviceTypes }: ServicesPageProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [selected, setSelected] = useState<Service | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function openCreate() {
        setSelected(null);
        setMode('create');
        setModalOpen(true);
    }

    function openEdit(service: Service) {
        setSelected(service);
        setMode('edit');
        setModalOpen(true);
    }

    function openDelete(service: Service) {
        setSelected(service);
        setDeleteOpen(true);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Services" />

            <div className="space-y-6 p-4 md:p-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Services</CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Manage booking options, prices, and guest-capacity rules. Stock and quantity are fixed to one booking option per schedule.
                            </p>
                        </div>

                        <Button onClick={openCreate}>New Service</Button>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableCaption>A list of services offered.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>UoM</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead>Guest Limit</TableHead>
                                    <TableHead>Capacity Note</TableHead>
                                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {services.data.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium">{service.name}</TableCell>
                                        <TableCell>{service.service_type ?? '-'}</TableCell>
                                        <TableCell className="max-w-[260px] whitespace-normal">
                                            {service.description}
                                        </TableCell>
                                        <TableCell>{service.uom}</TableCell>
                                        <TableCell className="text-right">
                                            {Number(service.price).toFixed(2)}
                                        </TableCell>
                                        <TableCell>{guestLimitLabel(service)}</TableCell>
                                        <TableCell className="max-w-[240px] whitespace-normal">
                                            {service.capacity_note ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => openEdit(service)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => openDelete(service)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="mt-6">
                            <Pagination>
                                <PaginationContent>
                                    {services.meta.links.map((link, i) => (
                                        <PaginationItem key={`${link.label}-${i}`}>
                                            {link.label.includes('Previous') ? (
                                                <PaginationPrevious
                                                    href={link.url ?? '#'}
                                                    className={!link.url ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            ) : link.label.includes('Next') ? (
                                                <PaginationNext
                                                    href={link.url ?? '#'}
                                                    className={!link.url ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            ) : link.label === '...' ? (
                                                <PaginationEllipsis />
                                            ) : (
                                                <PaginationLink
                                                    href={link.url ?? '#'}
                                                    isActive={link.active}
                                                    className={!link.url ? 'pointer-events-none opacity-50' : ''}
                                                >
                                                    {link.label}
                                                </PaginationLink>
                                            )}
                                        </PaginationItem>
                                    ))}
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </CardContent>
                </Card>

                <ServiceFormModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    mode={mode}
                    service={selected}
                    serviceTypes={serviceTypes}
                />

                <DeleteServiceDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    service={selected}
                />
            </div>
        </AppLayout>
    );
}
