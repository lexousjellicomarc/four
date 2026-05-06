import { Link, usePage } from '@inertiajs/react';

type PublicSiteSettings = {
  logo_url?: string | null;
  city_seal_url?: string | null;
  philippines_seal_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
};

type PageProps = {
  siteSettings?: PublicSiteSettings;
};

export default function PublicFooter() {
  const { props } = usePage<PageProps>();
  const settings = props.siteSettings || {};

  const citySealUrl = settings.city_seal_url || settings.logo_url || '/images/baguio-city-seal.png';
  const philippinesSealUrl = settings.philippines_seal_url || '/images/philippines-coat-of-arms.png';

  return (
    <footer className="bgo-reference-footer-wrap">
      <div className="bgo-reference-footer">
        <div className="bgo-reference-footer-grid">
          <section className="bgo-reference-footer-emblem">
            <img src={philippinesSealUrl} alt="Republic of the Philippines coat of arms" />
          </section>

          <section className="bgo-reference-footer-block">
            <h3>Republic of the Philippines</h3>
            <p>All content is in the public domain unless otherwise stated.</p>
            <p>© {new Date().getFullYear()}. All rights reserved.</p>
          </section>

          <section className="bgo-reference-footer-block">
            <h3>About GOVPH</h3>
            <p>Learn more about the Philippine government, its structure, how government works and the people behind it.</p>

            <div className="bgo-reference-footer-links">
              <a href="https://www.gov.ph/" target="_blank" rel="noreferrer">GOV.PH</a>
              <a href="https://data.gov.ph/" target="_blank" rel="noreferrer">Open Data Portal</a>
              <a href="https://www.officialgazette.gov.ph/" target="_blank" rel="noreferrer">Official Gazette</a>
            </div>
          </section>

          <section className="bgo-reference-footer-block">
            <h3>Government Links</h3>

            <div className="bgo-reference-footer-links">
              <a href="https://op-proper.gov.ph/" target="_blank" rel="noreferrer">Office of the President</a>
              <a href="https://ovp.gov.ph/" target="_blank" rel="noreferrer">Office of the Vice President</a>
              <a href="https://legacy.senate.gov.ph/" target="_blank" rel="noreferrer">Senate of the Philippines</a>
              <a href="https://www.congress.gov.ph/" target="_blank" rel="noreferrer">House of Representatives</a>
              <a href="https://sc.judiciary.gov.ph/" target="_blank" rel="noreferrer">Supreme Court</a>
              <a href="https://ca.judiciary.gov.ph/" target="_blank" rel="noreferrer">Court of Appeals</a>
              <a href="https://sb.judiciary.gov.ph/" target="_blank" rel="noreferrer">Sandiganbayan</a>
            </div>
          </section>

          <section className="bgo-reference-footer-block bgo-reference-footer-contact">
            <h3>Contact Us</h3>
            <p>Email: {settings.contact_email || 'pacd@baguio.gov.ph'}</p>
            <p>Viber: {settings.contact_phone || '+63 945 823 7040'}</p>

            <div className="bgo-reference-footer-quick">
              <Link href="/contact">Contact BCCC</Link>
              <Link href="/book">Book Your Event</Link>
            </div>
          </section>

          <section className="bgo-reference-footer-city-seal">
            <img src={citySealUrl} alt="City of Baguio official seal" />
          </section>
        </div>

        <div className="bgo-reference-footer-divider" />

        <div className="bgo-reference-footer-powered">
          Powered by: City Mayor&apos;s Office-Management in Information and Technology Division
        </div>

        <div className="bgo-reference-footer-watermark one" aria-hidden="true" />
        <div className="bgo-reference-footer-watermark two" aria-hidden="true" />
      </div>
    </footer>
  );
}
