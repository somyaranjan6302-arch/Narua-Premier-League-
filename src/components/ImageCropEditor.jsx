import React, { useRef, useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';

export const ImageCropEditor = ({ file, previewUrl, title, aspectRatio = 1, rounded = false, fit = false, dragOnly = false, onApply, onCancel }) => {
  const [imageSize, setImageSize] = useState(null);
  const [zoom, setZoom] = useState(dragOnly ? 1 : 1.15);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [error, setError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const imageRef = useRef(null);
  const dragStart = useRef(null);
  const activePointers = useRef(new Map());
  const pinchStart = useRef(null);
  const zoomRef = useRef(dragOnly ? 1 : 1.15);
  const applyingCrop = useRef(false);

  const imageAspect = imageSize ? imageSize.width / imageSize.height : 1;
  const previewWidth = imageSize
    ? (fit
      ? Math.min(100, (imageAspect / aspectRatio) * 100)
      : Math.max(100, (imageAspect / aspectRatio) * 100)) * zoom
    : 100;
  const previewHeight = imageSize
    ? (fit
      ? Math.min(100, (aspectRatio / imageAspect) * 100)
      : Math.max(100, (aspectRatio / imageAspect) * 100)) * zoom
    : 100;
  // For cover crops, stop zooming out when the entire source image fits inside
  // the fixed frame. This keeps the frame ratio while preserving every edge.
  const minimumZoom = imageSize && !fit
    ? Math.min(1, imageAspect / aspectRatio, aspectRatio / imageAspect)
    : 0.2;
  const canMoveHorizontally = Math.abs(previewWidth - 100) > 0.01;
  const canMoveVertically = Math.abs(previewHeight - 100) > 0.01;
  const clampZoom = (value) => Math.min(3, Math.max(minimumZoom, value));

  const updateZoom = (value) => {
    const nextZoom = clampZoom(value);
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
  };

  const updatePosition = (axis, value) => {
    setPosition((current) => ({ ...current, [axis]: Number(value) / 100 }));
  };

  const startPinch = () => {
    const [first, second] = [...activePointers.current.entries()].slice(0, 2);
    if (!first || !second) return;
    pinchStart.current = {
      pointerIds: [first[0], second[0]],
      distance: Math.max(1, Math.hypot(first[1].x - second[1].x, first[1].y - second[1].y)),
      zoom: zoomRef.current
    };
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.current.size >= 2) {
      dragStart.current = null;
      startPinch();
      return;
    }

    dragStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      position
    };
  };

  const handlePointerMove = (event) => {
    if (!activePointers.current.has(event.pointerId)) return;
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const pinch = pinchStart.current;
    if (pinch?.pointerIds.includes(event.pointerId)) {
      const first = activePointers.current.get(pinch.pointerIds[0]);
      const second = activePointers.current.get(pinch.pointerIds[1]);
      if (!first || !second) return;
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      updateZoom(pinch.zoom * distance / pinch.distance);
      return;
    }

    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const xRange = (previewWidth - 100) / 100;
    const yRange = (previewHeight - 100) / 100;
    setPosition({
      x: xRange === 0
        ? start.position.x
        : Math.min(1, Math.max(0, start.position.x - (event.clientX - start.x) / (bounds.width * xRange))),
      y: yRange === 0
        ? start.position.y
        : Math.min(1, Math.max(0, start.position.y - (event.clientY - start.y) / (bounds.height * yRange)))
    });
  };

  const handlePointerUp = (event) => {
    activePointers.current.delete(event.pointerId);
    const remaining = [...activePointers.current.entries()];
    if (remaining.length >= 2) {
      dragStart.current = null;
      startPinch();
      return;
    }

    pinchStart.current = null;
    if (remaining.length === 1) {
      const [pointerId, point] = remaining[0];
      dragStart.current = {
        pointerId,
        x: point.x,
        y: point.y,
        position
      };
      return;
    }

    dragStart.current = null;
  };

  const handleWheel = (event) => {
    event.preventDefault();
    updateZoom(zoomRef.current * Math.exp(-event.deltaY * 0.002));
  };

  const applyCrop = async () => {
    const image = imageRef.current;
    if (!imageSize || !image?.complete || !image.naturalWidth || applyingCrop.current) return;
    applyingCrop.current = true;
    setIsApplying(true);
    setError('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 960;
      canvas.height = Math.max(1, Math.round(canvas.width / aspectRatio));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not prepare this crop.');

      // Draw using the exact same frame-relative geometry as the preview.
      // When zoomed out, the unused area stays transparent, so the full photo
      // is visible without changing the section's fixed aspect ratio.
      context.drawImage(
        image,
        ((100 - previewWidth) * position.x / 100) * canvas.width,
        ((100 - previewHeight) * position.y / 100) * canvas.height,
        (previewWidth / 100) * canvas.width,
        (previewHeight / 100) * canvas.height
      );

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not prepare this crop.');

      const baseName = file.name.replace(/\.[^.]+$/, '');
      await onApply(new File([blob], `${baseName}-cropped.png`, { type: 'image/png' }));
    } catch (cropError) {
      setError(cropError.message || 'This image could not be cropped. Try another image.');
    } finally {
      applyingCrop.current = false;
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <section role="dialog" aria-modal="true" aria-label={`Crop for ${title}`} className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl space-y-3 overflow-y-auto rounded-xl border border-amber-500/30 bg-slate-950 p-3 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">Crop for {title}</p>
          <p className="text-xs text-slate-400">
            {dragOnly
              ? 'Drag to position the photo. Pinch with two fingers to zoom.'
              : 'Drag to position, pinch or scroll to zoom, or use the controls.'}
          </p>
        </div>
        <button type="button" onClick={onCancel} disabled={isApplying} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50" aria-label="Cancel crop">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-lg">
        <div
          className={`relative mx-auto touch-none select-none overflow-hidden border border-amber-400/70 bg-slate-900 ${rounded ? 'rounded-full' : 'rounded-lg'} ${canMoveHorizontally || canMoveVertically ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          style={{ aspectRatio }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          {previewUrl && (
            <img
              ref={imageRef}
              src={previewUrl}
              alt={`Crop preview for ${title}`}
              onLoad={(event) => setImageSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight
              })}
              onError={() => setError('This image preview could not be loaded. Choose another image.')}
              className="pointer-events-none absolute max-w-none select-none"
              draggable="false"
              style={{
                width: `${previewWidth}%`,
                height: `${previewHeight}%`,
                left: `${(100 - previewWidth) * position.x}%`,
                top: `${(100 - previewHeight) * position.y}%`
              }}
            />
          )}
          {!imageSize && (
            <div role={error ? 'alert' : 'status'} className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/70 px-4 text-center text-xs font-semibold text-slate-200">
              {error || (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-amber-400" />
                  Preparing preview…
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {!dragOnly && (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="text-xs text-slate-300">
              Zoom <span className="float-right font-mono">{Math.round(zoom * 100)}%</span>
              <input
                type="range"
                min={minimumZoom}
                max="3"
                step="0.05"
                value={zoom}
                onChange={(event) => updateZoom(Number(event.target.value))}
                aria-label={`Adjust zoom for ${title}`}
                className="mt-1 w-full accent-amber-500"
              />
            </label>
            <label className="text-xs text-slate-300">
              Horizontal crop <span className="float-right font-mono">{Math.round(position.x * 100)}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(position.x * 100)}
                onChange={(event) => updatePosition('x', event.target.value)}
                aria-label={`Adjust horizontal crop for ${title}`}
                className="mt-1 w-full cursor-ew-resize accent-amber-500"
              />
            </label>
            <label className="text-xs text-slate-300">
              Vertical crop <span className="float-right font-mono">{Math.round(position.y * 100)}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(position.y * 100)}
                onChange={(event) => updatePosition('y', event.target.value)}
                aria-label={`Adjust vertical crop for ${title}`}
                className="mt-1 w-full cursor-ns-resize accent-amber-500"
              />
            </label>
          </div>
          <p className="text-[11px] text-slate-500">Zoom out to fit the whole photo inside the frame, or use the horizontal and vertical controls to position it precisely.</p>
        </>
      )}

      {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            updateZoom(dragOnly ? 1 : 1.15);
            setPosition({ x: 0.5, y: 0.5 });
          }}
          disabled={isApplying}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
        <button
          type="button"
          onClick={applyCrop}
          disabled={!imageSize || isApplying}
          aria-busy={isApplying}
          className="inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:cursor-wait disabled:opacity-50"
        >
          {isApplying
            ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
            : <Check className="h-3.5 w-3.5" />}
          {isApplying ? 'Saving crop…' : 'Use this crop'}
        </button>
      </div>
      </section>
    </div>
  );
};
