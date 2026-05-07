import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Circle, X } from 'lucide-react';

const TrainingPanel = ({ isOpen, onClose, trainingData, onAddClass, onStartRecording, onStopRecording, onClearClass, mlReady }) => {
    const [newClassName, setNewClassName] = useState('');
    const [recordingClass, setRecordingClass] = useState(null);

    const handleAddClass = () => {
        const name = newClassName.trim();
        if (name && !(name in trainingData)) {
            onAddClass(name);
            setNewClassName('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleAddClass();
    };

    const handleRecordStart = useCallback((className) => {
        setRecordingClass(className);
        onStartRecording(className);
    }, [onStartRecording]);

    const handleRecordStop = useCallback(() => {
        setRecordingClass(null);
        onStopRecording();
    }, [onStopRecording]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    className="training-panel glass-panel"
                    style={{
                        position: 'fixed',
                        right: '20px',
                        top: '80px',
                        bottom: '20px',
                        width: '320px',
                        zIndex: 50,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        padding: '20px',
                        border: '2px solid rgba(119, 141, 169, 0.55)',
                        boxShadow: '0 0 0 1px rgba(224, 225, 221, 0.08), 0 16px 35px rgba(0,0,0,0.45)',
                        background: 'var(--bg-deep)',
                        borderRadius: '16px',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                            🎓 Train Gestures
                        </h2>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'var(--text-dim)',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                padding: '6px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* ML Status */}
                    <div style={{
                        fontSize: '12px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: mlReady ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                        color: mlReady ? '#22c55e' : '#fbbf24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <div style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: mlReady ? '#22c55e' : '#fbbf24'
                        }} />
                        {mlReady ? 'ML Engine Ready' : 'Loading ML Engine...'}
                    </div>

                    {/* Add New Class */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Sign Name (e.g. Hello)"
                            style={{
                                flex: 1,
                                padding: '10px 12px',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                outline: 'none',
                                fontSize: '13px'
                            }}
                        />
                        <button
                            onClick={handleAddClass}
                            disabled={!newClassName.trim()}
                            style={{
                                padding: '10px',
                                borderRadius: '10px',
                                border: 'none',
                                background: newClassName.trim() ? 'var(--accent, #6366f1)' : 'rgba(255,255,255,0.05)',
                                color: newClassName.trim() ? 'white' : 'var(--text-dim)',
                                cursor: newClassName.trim() ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Classes List */}
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Object.keys(trainingData).length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                color: 'var(--text-dim)',
                                marginTop: '40px',
                                fontSize: '13px',
                                lineHeight: 1.6
                            }}>
                                Type a sign name above<br />
                                and click <strong>+</strong> to add it
                            </div>
                        ) : (
                            Object.entries(trainingData).map(([name, count]) => (
                                <div
                                    key={name}
                                    style={{
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        background: recordingClass === name ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${recordingClass === name ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {count} example{count !== 1 ? 's' : ''} recorded
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {/* RECORD BUTTON — Hold to record */}
                                        <button
                                            onMouseDown={() => handleRecordStart(name)}
                                            onMouseUp={handleRecordStop}
                                            onMouseLeave={handleRecordStop}
                                            onTouchStart={() => handleRecordStart(name)}
                                            onTouchEnd={handleRecordStop}
                                            disabled={!mlReady}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: recordingClass === name
                                                    ? '#ef4444'
                                                    : mlReady ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                                                color: recordingClass === name
                                                    ? 'white'
                                                    : mlReady ? '#818cf8' : 'var(--text-dim)',
                                                cursor: mlReady ? 'pointer' : 'not-allowed',
                                                transition: 'all 0.15s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '11px',
                                                fontWeight: 600
                                            }}
                                            title={mlReady ? 'Hold to Record' : 'Waiting for ML engine...'}
                                        >
                                            <Circle size={12} fill={recordingClass === name ? 'white' : 'none'} />
                                            {recordingClass === name ? 'REC' : 'Record'}
                                        </button>

                                        {/* DELETE BUTTON */}
                                        <button
                                            onClick={() => onClearClass(name)}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Instructions */}
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        lineHeight: 1.5
                    }}>
                        <strong>How to train:</strong><br />
                        1. Add a sign name with <strong>+</strong><br />
                        2. <strong>Hold</strong> the Record button while signing<br />
                        3. Move hand slightly for different angles<br />
                        4. Aim for 30+ examples per sign
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TrainingPanel;
