export const __trash = `
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Event Booking System" />
            {/* Clean landing page BELOW; legacy scaffold is removed */}
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-white to-orange-50 dark:from-[#0a0a0a] dark:via-[#141312] dark:to-[#1d140d] text-neutral-900 dark:text-neutral-100">
                <header className="w-full px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="font-semibold tracking-tight text-lg">Event Booking</Link>
                    <nav className="flex items-center gap-3 text-sm">
                        {auth.user ? (
                            <>
                                <Link href={dashboard()} className="rounded-md px-4 py-2 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Dashboard</Link>
                                <Link href={servicesRoutes.index.url()} className="rounded-md px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Services</Link>
                                <Link href={bookingsRoutes.index.url()} className="rounded-md px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Bookings</Link>
                            </>
                        ) : (
                            <>
                                <Link href={login()} className="rounded-md px-4 py-2 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Log in</Link>
                                <Link href={register()} className="rounded-md px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium shadow hover:shadow-md transition-shadow">Get Started</Link>
                            </>
                        )}
                    </nav>
                </header>
                <section className="px-6 py-10 md:py-20 flex flex-col items-center text-center">
                    <h1 className="max-w-3xl text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-orange-600 via-red-600 to-fuchsia-600 bg-clip-text text-transparent">Plan, Manage & Elevate Your Events</h1>
                    <p className="mt-6 max-w-2xl text-lg md:text-xl text-neutral-700 dark:text-neutral-300">A modern platform to build a service catalog, create multi-service bookings, and track statuses & payments effortlessly.</p>
                </section>
            </div>
                                        stroke="#1B1B18"
                                        strokeWidth={1}
                                    />
                                </g>
                                <g
                                    style={{ mixBlendMode: 'hard-light' }}
                                    className="translate-y-0 opacity-100 transition-all delay-300 duration-750 starting:translate-y-4 starting:opacity-0"
                                >
                                    <path
                                        d="M217.342 305.363L217.673 305.363C224.519 298.478 234.844 289.393 248.647 278.11C262.008 266.826 272.056 257.837 278.792 251.144C285.418 244.259 289.945 236.991 292.374 229.341C294.803 221.691 293.643 213.753 288.895 205.529C283.594 196.349 276.14 188.985 266.532 183.438C257.035 177.7 246.986 174.831 236.385 174.83C226.005 174.83 219.214 177.603 216.012 183.149C212.699 188.504 213.804 195.963 219.325 205.527L154.725 205.524C145.449 189.458 141.473 175.114 142.798 162.491C144.343 149.868 150.637 140.114 161.68 133.229C172.833 126.153 187.685 122.615 206.237 122.616C225.672 122.617 244.942 126.156 264.046 133.233C283.039 140.119 300.377 149.874 316.058 162.497C331.739 175.121 344.218 189.466 353.495 205.532C362.108 220.45 365.919 233.551 364.925 244.835C364.153 256.12 360.454 265.969 353.828 274.384C347.424 282.799 337.486 293.127 324.014 305.367L406.172 305.37L434.996 355.289L246.165 355.282L217.342 305.363Z"
                                        fill="#F0ACB8"
                                    />
                                    <path
                                        import { Head } from '@inertiajs/react';

                                        export default function Welcome() {
                                          return (
                                            <>
                                              <Head title="Welcome" />
                                              <div className="min-h-screen flex items-center justify-center">
                                                <div className="text-center">
                                                  <h1 className="text-2xl font-semibold">Welcome</h1>
                                                  <p className="text-neutral-600 dark:text-neutral-300 mt-2">This page is not used. Visit the homepage.</p>
                                                </div>
                                              </div>
                                            </>
                                          );
                                        }
                                    <path
                                        d="M217.342 305.363L217.673 305.363C224.519 298.478 234.844 289.393 248.647 278.11C262.008 266.826 272.056 257.837 278.792 251.144C285.418 244.259 289.945 236.991 292.374 229.341C294.803 221.691 293.643 213.753 288.895 205.529C283.594 196.349 276.14 188.985 266.532 183.438C257.035 177.7 246.986 174.831 236.385 174.83C226.005 174.83 219.214 177.603 216.012 183.149C212.699 188.504 213.804 195.963 219.325 205.527L154.725 205.524C145.449 189.458 141.473 175.114 142.798 162.491C144.343 149.868 150.637 140.114 161.68 133.229C172.833 126.153 187.685 122.615 206.237 122.616C225.672 122.617 244.942 126.156 264.046 133.233C283.039 140.119 300.377 149.874 316.058 162.497C331.739 175.121 344.218 189.466 353.495 205.532C362.108 220.45 365.919 233.551 364.925 244.835C364.153 256.12 360.454 265.969 353.828 274.384C347.424 282.799 337.486 293.127 324.014 305.367L406.172 305.37L434.996 355.289L246.165 355.282L217.342 305.363Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                    />
                                    <path
                                        d="M38.197 175.972L15.3385 175.971L-13.6505 125.765L72.1515 125.768L204.673 355.282L141.729 355.279L38.197 175.972Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                    />
                                </g>
                                <g className="translate-y-0 opacity-100 transition-all delay-300 duration-750 starting:translate-y-4 starting:opacity-0">
                                    <path
                                        d="M217.342 305.363L217.673 305.363C224.519 298.478 234.844 289.393 248.647 278.11C262.008 266.826 272.056 257.837 278.792 251.144C285.418 244.259 289.945 236.991 292.374 229.341C294.803 221.691 293.643 213.753 288.895 205.529C283.594 196.349 276.14 188.985 266.532 183.438C257.035 177.7 246.986 174.831 236.385 174.83C226.005 174.83 219.214 177.603 216.012 183.149C212.699 188.504 213.804 195.963 219.325 205.527L154.726 205.524C145.449 189.458 141.473 175.114 142.798 162.491C144.343 149.868 150.637 140.114 161.68 133.229C172.833 126.153 187.685 122.615 206.237 122.616C225.672 122.617 244.942 126.156 264.046 133.233C283.039 140.119 300.377 149.874 316.058 162.497C331.739 175.121 344.218 189.466 353.495 205.532C362.108 220.45 365.919 233.551 364.925 244.835C364.153 256.12 360.454 265.969 353.828 274.384C347.424 282.799 337.486 293.127 324.014 305.367L406.172 305.37L434.996 355.289L246.165 355.282L217.342 305.363Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                    />
                                    <path
                                        d="M38.197 175.972L15.3385 175.971L-13.6505 125.765L72.1515 125.768L204.673 355.282L141.729 355.279L38.197 175.972Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                    />
                                </g>
                                <g className="translate-y-0 opacity-100 transition-all delay-300 duration-750 starting:translate-y-4 starting:opacity-0">
                                    <path
                                        d="M188.467 355.363L188.798 355.363C195.644 348.478 205.969 339.393 219.772 328.11C233.133 316.826 243.181 307.837 249.917 301.144C253.696 297.217 256.792 293.166 259.205 288.991C261.024 285.845 262.455 282.628 263.499 279.341C265.928 271.691 264.768 263.753 260.02 255.529C254.719 246.349 247.265 238.985 237.657 233.438C228.16 227.7 218.111 224.831 207.51 224.83C197.13 224.83 190.339 227.603 187.137 233.149C183.824 238.504 184.929 245.963 190.45 255.527L125.851 255.524C116.574 239.458 112.598 225.114 113.923 212.491C114.615 206.836 116.261 201.756 118.859 197.253C122.061 191.704 126.709 187.03 132.805 183.229C143.958 176.153 158.81 172.615 177.362 172.616C196.797 172.617 216.067 176.156 235.171 183.233C254.164 190.119 271.502 199.874 287.183 212.497C302.864 225.121 315.343 239.466 324.62 255.532C333.233 270.45 337.044 283.551 336.05 294.835C335.46 303.459 333.16 311.245 329.151 318.194C327.915 320.337 326.515 322.4 324.953 324.384C318.549 332.799 308.611 343.127 295.139 355.367L377.297 355.37L406.121 405.289L217.29 405.282L188.467 355.363Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M9.32197 225.972L-13.5365 225.971L-42.5255 175.765L43.2765 175.768L175.798 405.282L112.854 405.279L9.32197 225.972Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M345.247 111.915C329.566 99.2919 312.229 89.5371 293.235 82.6512L235.167 183.228C254.161 190.114 271.498 199.869 287.179 212.492L345.247 111.915Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M382.686 154.964C373.41 138.898 360.931 124.553 345.25 111.93L287.182 212.506C302.863 225.13 315.342 239.475 324.618 255.541L382.686 154.964Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M293.243 82.6472C274.139 75.57 254.869 72.031 235.434 72.0303L177.366 172.607C196.801 172.608 216.071 176.147 235.175 183.224L293.243 82.6472Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M394.118 194.257C395.112 182.973 391.301 169.872 382.688 154.953L324.619 255.53C333.233 270.448 337.044 283.55 336.05 294.834L394.118 194.257Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M235.432 72.0311C216.88 72.0304 202.027 75.5681 190.875 82.6442L132.806 183.221C143.959 176.145 158.812 172.607 177.363 172.608L235.432 72.0311Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M265.59 124.25C276.191 124.251 286.24 127.12 295.737 132.858L237.669 233.435C228.172 227.697 218.123 224.828 207.522 224.827L265.59 124.25Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M295.719 132.859C305.326 138.406 312.78 145.77 318.081 154.95L260.013 255.527C254.712 246.347 247.258 238.983 237.651 233.436L295.719 132.859Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M387.218 217.608C391.227 210.66 393.527 202.874 394.117 194.25L336.049 294.827C335.459 303.451 333.159 311.237 329.15 318.185L387.218 217.608Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M245.211 132.577C248.413 127.03 255.204 124.257 265.584 124.258L207.516 224.835C197.136 224.834 190.345 227.607 187.143 233.154L245.211 132.577Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M318.094 154.945C322.842 163.17 324.002 171.107 321.573 178.757L263.505 279.334C265.934 271.684 264.774 263.746 260.026 255.522L318.094 154.945Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M176.925 96.6737C180.127 91.1249 184.776 86.4503 190.871 82.6499L132.803 183.227C126.708 187.027 122.059 191.702 118.857 197.25L176.925 96.6737Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M387.226 217.606C385.989 219.749 384.59 221.813 383.028 223.797L324.96 324.373C326.522 322.39 327.921 320.326 329.157 318.183L387.226 217.606Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M317.269 188.408C319.087 185.262 320.519 182.045 321.562 178.758L263.494 279.335C262.451 282.622 261.019 285.839 259.201 288.985L317.269 188.408Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M245.208 132.573C241.895 137.928 243 145.387 248.522 154.95L190.454 255.527C184.932 245.964 183.827 238.505 187.14 233.15L245.208 132.573Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M176.93 96.6719C174.331 101.175 172.686 106.255 171.993 111.91L113.925 212.487C114.618 206.831 116.263 201.752 118.862 197.249L176.93 96.6719Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M317.266 188.413C314.853 192.589 311.757 196.64 307.978 200.566L249.91 301.143C253.689 297.216 256.785 293.166 259.198 288.99L317.266 188.413Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M464.198 304.708L435.375 254.789L377.307 355.366L406.13 405.285L464.198 304.708Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M353.209 254.787C366.68 242.548 376.618 232.22 383.023 223.805L324.955 324.382C318.55 332.797 308.612 343.124 295.141 355.364L353.209 254.787Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M435.37 254.787L353.212 254.784L295.144 355.361L377.302 355.364L435.37 254.787Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M183.921 154.947L248.521 154.95L190.453 255.527L125.853 255.524L183.921 154.947Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M171.992 111.914C170.668 124.537 174.643 138.881 183.92 154.947L125.852 255.524C116.575 239.458 112.599 225.114 113.924 212.491L171.992 111.914Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M307.987 200.562C301.251 207.256 291.203 216.244 277.842 227.528L219.774 328.105C233.135 316.821 243.183 307.832 249.919 301.139L307.987 200.562Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M15.5469 75.1797L44.5359 125.386L-13.5321 225.963L-42.5212 175.756L15.5469 75.1797Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M277.836 227.536C264.033 238.82 253.708 247.904 246.862 254.789L188.794 355.366C195.64 348.481 205.965 339.397 219.768 328.113L277.836 227.536Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M275.358 304.706L464.189 304.713L406.12 405.29L217.29 405.283L275.358 304.706Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M44.5279 125.39L67.3864 125.39L9.31834 225.967L-13.5401 225.966L44.5279 125.39Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M101.341 75.1911L233.863 304.705L175.795 405.282L43.2733 175.768L101.341 75.1911ZM15.5431 75.19L-42.525 175.767L43.277 175.77L101.345 75.1932L15.5431 75.19Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M246.866 254.784L246.534 254.784L188.466 355.361L188.798 355.361L246.866 254.784Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M246.539 254.781L275.362 304.701L217.294 405.277L188.471 355.358L246.539 254.781Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M67.3906 125.391L170.923 304.698L112.855 405.275L9.32257 225.967L67.3906 125.391Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                    <path
                                        d="M170.921 304.699L233.865 304.701L175.797 405.278L112.853 405.276L170.921 304.699Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="bevel"
                                    />
                                </g>
                                <g
                                    className="translate-y-0 opacity-100 transition-all delay-300 duration-750 starting:translate-y-4 starting:opacity-0"
                                    style={{ mixBlendMode: 'hard-light' }}
                                >
                                    <path
                                        d="M246.544 254.79L246.875 254.79C253.722 247.905 264.046 238.82 277.849 227.537C291.21 216.253 301.259 207.264 307.995 200.57C314.62 193.685 319.147 186.418 321.577 178.768C324.006 171.117 322.846 163.18 318.097 154.956C312.796 145.775 305.342 138.412 295.735 132.865C286.238 127.127 276.189 124.258 265.588 124.257C255.208 124.257 248.416 127.03 245.214 132.576C241.902 137.931 243.006 145.39 248.528 154.953L183.928 154.951C174.652 138.885 170.676 124.541 172 111.918C173.546 99.2946 179.84 89.5408 190.882 82.6559C202.035 75.5798 216.887 72.0421 235.439 72.0428C254.874 72.0435 274.144 75.5825 293.248 82.6598C312.242 89.5457 329.579 99.3005 345.261 111.924C360.942 124.548 373.421 138.892 382.697 154.958C391.311 169.877 395.121 182.978 394.128 194.262C393.355 205.546 389.656 215.396 383.031 223.811C376.627 232.226 366.688 242.554 353.217 254.794L435.375 254.797L464.198 304.716L275.367 304.709L246.544 254.79Z"
                                        fill="#4B0600"
                                    />
                                    <path
                                        d="M246.544 254.79L246.875 254.79C253.722 247.905 264.046 238.82 277.849 227.537C291.21 216.253 301.259 207.264 307.995 200.57C314.62 193.685 319.147 186.418 321.577 178.768C324.006 171.117 322.846 163.18 318.097 154.956C312.796 145.775 305.342 138.412 295.735 132.865C286.238 127.127 276.189 124.258 265.588 124.257C255.208 124.257 248.416 127.03 245.214 132.576C241.902 137.931 243.006 145.39 248.528 154.953L183.928 154.951C174.652 138.885 170.676 124.541 172 111.918C173.546 99.2946 179.84 89.5408 190.882 82.6559C202.035 75.5798 216.887 72.0421 235.439 72.0428C254.874 72.0435 274.144 75.5825 293.248 82.6598C312.242 89.5457 329.579 99.3005 345.261 111.924C360.942 124.548 373.421 138.892 382.697 154.958C391.311 169.877 395.121 182.978 394.128 194.262C393.355 205.546 389.656 215.396 383.031 223.811C376.627 232.226 366.688 242.554 353.217 254.794L435.375 254.797L464.198 304.716L275.367 304.709L246.544 254.79Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="round"
                                    />
                                </g>
                                <g
                                    className="translate-y-0 opacity-100 transition-all delay-300 duration-750 starting:translate-y-4 starting:opacity-0"
                                    style={{ mixBlendMode: 'hard-light' }}
                                >
                                    <path
                                        d="M67.41 125.402L44.5515 125.401L15.5625 75.1953L101.364 75.1985L233.886 304.712L170.942 304.71L67.41 125.402Z"
                                        fill="#4B0600"
                                    />
                                    <path
                                        d="M67.41 125.402L44.5515 125.401L15.5625 75.1953L101.364 75.1985L233.886 304.712L170.942 304.71L67.41 125.402Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                    />
                                </g>
                            </svg>
                            <div className="absolute inset-0 rounded-t-lg shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-t-none lg:rounded-r-lg dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]" />
                        </div>
                    </main>
                </div>
                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
`;

import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold">Welcome</h1>
                    <p className="text-neutral-600 dark:text-neutral-300 mt-2">This page is not used. Visit the homepage.</p>
                </div>
            </div>
        </>
    );
}