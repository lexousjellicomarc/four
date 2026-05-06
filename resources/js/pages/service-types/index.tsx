import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import serviceTypesRoutes from '@/routes/service-types';
import { type BreadcrumbItem, type ServiceTypeEntity } from '@/types';
import { Head } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteServiceTypeDialog from './DeleteServiceTypeDialog';
import ServiceTypeFormModal from './ServiceTypeFormModal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Service Types', href: serviceTypesRoutes.index.url() },
];

interface LaravelPaginationLink {
    url: string | null;
    label: string;
    page: number;
    active: boolean;
}

interface PageProps {
    serviceTypes: {
        data: ServiceTypeEntity[];
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
}

export default function ServiceTypesPage({ serviceTypes }: PageProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [selected, setSelected] = useState<ServiceTypeEntity | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function openCreate() {
        setSelected(null);
        setMode('create');
        setModalOpen(true);
    }

    function openEdit(st: ServiceTypeEntity) {
        setSelected(st);
        setMode('edit');
        setModalOpen(true);
    }

    function openDelete(st: ServiceTypeEntity) {
        setSelected(st);
        setDeleteOpen(true);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Service Types" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between px-6">
                        <CardTitle>Service Types</CardTitle>
                        <Button onClick={openCreate} size="sm">
                            New Type
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableCaption>
                                A list of service types.
                            </TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">
                                        Name
                                    </TableHead>
                                    <TableHead className="w-[150px] text-center">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {serviceTypes.data.map((st) => (
                                    <TableRow key={st.id}>
                                        <TableCell className="font-medium">
                                            {st.name}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => openEdit(st)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() =>
                                                        openDelete(st)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <Pagination>
                            <PaginationContent>
                                {serviceTypes.meta.links.map((link, i) => (
                                    <PaginationItem key={i}>
                                        {link.label.includes('Previous') ? (
                                            <PaginationPrevious
                                                href={link.url ?? '#'}
                                                aria-disabled={!link.url}
                                                tabIndex={link.url ? 0 : -1}
                                            >
                                                Previous
                                            </PaginationPrevious>
                                        ) : link.label.includes('Next') ? (
                                            <PaginationNext
                                                href={link.url ?? '#'}
                                                aria-disabled={!link.url}
                                                tabIndex={link.url ? 0 : -1}
                                            >
                                                Next
                                            </PaginationNext>
                                        ) : link.label === '...' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink
                                                isActive={link.active}
                                                href={link.url ?? '#'}
                                                aria-current={
                                                    link.active
                                                        ? 'page'
                                                        : undefined
                                                }
                                            >
                                                {link.label}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}
                            </PaginationContent>
                        </Pagination>
                    </CardContent>
                </Card>
            </div>

            <ServiceTypeFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                mode={mode}
                serviceType={selected}
            />

            <DeleteServiceTypeDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                serviceType={selected}
            />
        </AppLayout>
    );
}
