import { useLocation, useNavigate } from 'react-router-dom';

export function Navigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const isHome = location.pathname === '/';

    if (isHome) return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#F0F0F0]">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
                <button
                    onClick={() => navigate('/')}
                    className="font-display text-xl font-[700] text-black hover:text-[#666666] transition-colors"
                >
                    ← HOME
                </button>
                <p className="font-primary text-sm text-[#999999]">
                    AI Fashion Hub
                </p>
            </div>
        </nav>
    );
}
