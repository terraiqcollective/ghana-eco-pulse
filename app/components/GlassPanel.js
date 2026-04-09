export const GlassPanel = ({ children, className = "" }) => {
    return (
        <div className={`bg-brand-deep/90 backdrop-blur-xl border border-brand-gold/30 shadow-2xl overflow-hidden ${className}`}>
            {children}
        </div>
    );
};
