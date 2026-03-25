import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

type Inquiry = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  inquiry_type: string | null;
  event_date: string | null;
  venue: string | null;
  guest_count: number | null;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  read_at: string | null;
  created_at: string | null;
};

type PaginatedInquiries = {
  data: Inquiry[];
  current_page: number;
  last_page: number;
  links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
  inquiries: PaginatedInquiries;
};

const statusClasses: Record<Inquiry['status'], string> = {
  new: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200',
  read: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
  replied: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  closed: 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-200',
};

export default function AdminInquiriesIndex({ inquiries }: Props) {
  function updateStatus(id: number, status: Inquiry['status']) {
    router.put(`/admin/inquiries/${id}`, { status }, { preserveScroll: true });
  }

  function deleteInquiry(id: number) {
    if (!window.confirm('Are you sure you want to delete this inquiry? This action cannot be undone.')) {
      return;
    }

    router.delete(`/admin/inquiries/${id}`, { preserveScroll: true });
  }

  return (
    <AdminLayout
      title="Public inquiries"
      subtitle="Messages from the contact page are stored here for admin and manager monitoring."
    >
      <Head title="Inquiries" />

      <div className="space-y-5">
        {inquiries.data.length === 0 ? (
          <div className="rounded-[2rem] border border-black/10 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-[#16171b] dark:text-slate-300">
            No inquiries found yet.
          </div>
        ) : (
          inquiries.data.map((inquiry) => (
            <section
              key={inquiry.id}
              className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClasses[inquiry.status]}`}>
                      {inquiry.status}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {inquiry.created_at ?? 'No date'}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">{inquiry.subject}</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {inquiry.name} • {inquiry.email}{inquiry.phone ? ` • ${inquiry.phone}` : ''}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2 xl:grid-cols-4">
                    <div><strong>Type:</strong> {inquiry.inquiry_type ?? '-'}</div>
                    <div><strong>Event date:</strong> {inquiry.event_date ?? '-'}</div>
                    <div><strong>Venue:</strong> {inquiry.venue ?? '-'}</div>
                    <div><strong>Guests:</strong> {inquiry.guest_count ?? '-'}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <button onClick={() => updateStatus(inquiry.id, 'read')} className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/10">Mark Read</button>
                  <button onClick={() => updateStatus(inquiry.id, 'replied')} className="rounded-full bg-[#174f40] px-4 py-2 text-sm font-semibold text-white dark:bg-[#2d47ff]">Mark Replied</button>
                  <button onClick={() => updateStatus(inquiry.id, 'closed')} className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/10">Close</button>
                  <button onClick={() => deleteInquiry(inquiry.id)} className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">Delete</button>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-black/5 bg-[#f7f5ef] p-4 text-sm leading-7 text-slate-700 dark:border-white/10 dark:bg-[#121318] dark:text-slate-200">
                {inquiry.message}
              </div>
            </section>
          ))
        )}

        {inquiries.last_page > 1 ? (
          <div className="flex flex-wrap gap-2">
            {inquiries.links.map((link, index) => (
              <button
                key={index}
                type="button"
                disabled={!link.url}
                onClick={() => link.url && router.visit(link.url)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${link.active ? 'bg-[#174f40] text-white dark:bg-[#2d47ff]' : 'border border-black/10 bg-white dark:border-white/10 dark:bg-[#16171b]'} ${!link.url ? 'opacity-50' : ''}`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
