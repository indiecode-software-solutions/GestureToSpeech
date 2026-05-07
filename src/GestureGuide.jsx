import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, XCircle, BookOpen, Layers } from 'lucide-react';
import { gestures } from './data/gestures';

const GestureGuide = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(13, 27, 42, 0.8)', // Navy backdrop
                            backdropFilter: 'blur(4px)',
                            zIndex: 40
                        }}
                    />

                    {/* Modal Container */}
                    <div style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '80vh',
                        zIndex: 50,
                        display: 'flex',
                        justifyContent: 'center',
                        pointerEvents: 'none' // Let clicks pass through empty space
                    }}>
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                width: '100%',
                                maxWidth: '800px', // Constrain width on large screens
                                background: '#1B263B', // Slate
                                borderTop: '1px solid #778DA9',
                                borderTopLeftRadius: '24px',
                                borderTopRightRadius: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                                pointerEvents: 'auto', // Re-enable clicks
                                overflow: 'hidden'
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                background: '#0D1B2A' // Deep Navy Header
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '8px', background: 'rgba(224, 225, 221, 0.1)', borderRadius: '8px' }}>
                                        <BookOpen color="#E0E1DD" size={24} />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '20px', fontFamily: 'Space Grotesk', color: '#E0E1DD', fontWeight: 700 }}>Gesture Dictionary</h2>
                                        <span style={{ fontSize: '13px', color: '#778DA9' }}>A-Z Reference Guide</span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    style={{
                                        background: 'rgba(224, 225, 221, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: 'rgb(224, 225, 221)',
                                        transition: '0.2s',
                                        transform: 'scale(1)'
                                    }}
                                >
                                    <X size={24} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Content Grid */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '24px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                gap: '16px',
                                alignContent: 'start'
                            }}>
                                {gestures.map((g) => (
                                    <div key={g.letter} style={{
                                        background: '#0D1B2A', // Navy Card
                                        borderRadius: '12px',
                                        padding: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px',
                                        border: '1px solid rgba(119, 141, 169, 0.2)', // Slate Border
                                        textAlign: 'center',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        cursor: 'default'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
                                            e.currentTarget.style.borderColor = '#778DA9';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.borderColor = 'rgba(119, 141, 169, 0.2)';
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '32px',
                                            fontWeight: '700',
                                            fontFamily: 'Space Grotesk',
                                            color: '#E0E1DD',
                                            width: '56px',
                                            height: '56px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: '#1B263B', // Slate Circle
                                            borderRadius: '12px',
                                            marginBottom: '4px',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                        }}>
                                            {g.letter}
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '13px', color: '#778DA9', lineHeight: 1.4, fontWeight: 500 }}>
                                                {g.desc}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default GestureGuide;
