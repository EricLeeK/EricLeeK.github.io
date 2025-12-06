import React, { useState, useEffect, useCallback } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
    src: string;
    alt: string;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, alt }) => {
    const [isOpen, setIsOpen] = useState(false);

    const openLightbox = () => setIsOpen(true);
    const closeLightbox = useCallback(() => setIsOpen(false), []);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                closeLightbox();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, closeLightbox]);

    return (
        <>
            {/* Thumbnail Image */}
            <figure className="my-6 group cursor-pointer" onClick={openLightbox}>
                <div className="relative overflow-hidden rounded-xl">
                    <img
                        src={src}
                        alt={alt}
                        className="w-full h-auto rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                    />
                    {/* Hover overlay with zoom icon */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-800/90 p-3 rounded-full shadow-lg">
                            <ZoomIn className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                        </div>
                    </div>
                </div>
                {alt && (
                    <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3 italic">
                        {alt}
                    </figcaption>
                )}
            </figure>

            {/* Lightbox Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
                    onClick={closeLightbox}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

                    {/* Close button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                        aria-label="Close lightbox"
                    >
                        <X className="w-8 h-8 text-white" />
                    </button>

                    {/* Image container */}
                    <div
                        className="relative max-w-[95vw] max-h-[90vh] z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={src}
                            alt={alt}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        />
                        {alt && (
                            <p className="text-center text-white/80 mt-4 text-sm">
                                {alt}
                            </p>
                        )}
                    </div>

                    {/* Hint text */}
                    <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
                        Click anywhere or press ESC to close
                    </p>
                </div>
            )}
        </>
    );
};

export default ImageLightbox;
