function Logo({ className = "h-10", showText = false, theme = "dark" }) {
    // theme: 'dark' (dark text for light bg), 'light' (white text for dark bg)
    
    return (
        <div className={`flex items-center gap-2 select-none ${className}`}>
             <img 
                src="https://app.trickle.so/storage/public/images/usr_19c684eaa8000001/2a234d6e-1c33-459a-b89f-c1a196d1be38.png" 
                alt="QuranIQ Logo" 
                className="h-full w-auto object-contain"
            />
            {showText && (
                <span className={`font-ui font-bold text-lg tracking-wide ${theme === 'light' ? 'text-white' : 'text-[var(--ink-color)]'}`}>
                    QuranIQ
                </span>
            )}
        </div>
    );
}