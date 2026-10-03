import React, { useRef, useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';

export const ImageCropEditor = ({ file, previewUrl, title, aspectRatio = 1, rounded = false, fit = false, onApply, onCancel }) => {
  const [imageSize, setImageSize] = useState(null);
  const [zoom, setZoom] = useState(1.15);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [error, setError] = useState('');
  const imageRef = useRef(null);
  const dragStart = useRef(null);

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
  const canMoveHorizontally = Math.abs(previewWidth - 100) > 0.01;
  const canMoveVertically = Math.abs(previewHeight - 100) > 0.01;

  const updatePosition = (axis, value) => {
    setPosition((current) => ({ ...current, [axis]: Number(value) / 100 }));
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      position
    };
  };

  const handlePointerMove = (event) => {
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

  const handlePointerUp = () => {
    dragStart.current = null;
  };

  const applyCrop = async () => {
    const image = imageRef.current;
    if (!imageSize || !image?.complete || !image.naturalWidth) return;
    setError('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 960;
      canvas.height = Math.max(1, Math.round(canvas.width / aspectRatio));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not prepare this crop.');

      if (fit) {
        const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) * zoom;
        const drawWidth = image.naturalWidth * scale;
        const drawHeight = image.naturalHeight * scale;
        context.drawImage(
          image,
          (canvas.width - drawWidth) * position.x,
          (canvas.height - drawHeight) * position.y,
          drawWidth,
          drawHeight
        );
      } else {
        const imageAspectRatio = image.naturalWidth / image.naturalHeight;
        const cropWidth = (imageAspectRatio > aspectRatio
          ? image.naturalHeight * aspectRatio
          : image.naturalWidth) / zoom;
        const cropHeight = (imageAspectRatio > aspectRatio
          ? image.naturalHeight
          : image.naturalWidth / aspectRatio) / zoom;
        const sourceX = (image.naturalWidth - cropWidth) * position.x;
        const sourceY = (image.naturalHeight - cropHeight) * position.y;
        context.drawImage(
          image,
          sourceX,
          sourceY,
          cropWidth,
          cropHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not prepare this crop.');

      const baseName = file.name.replace(/\.[^.]+$/, '');
      onApply(new File([blob], `${baseName}-cropped.png`, { type: 'image/png' }));
    } catch (cropError) {
      setError(cropError.message || 'This image could not be cropped. Try another image.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <section role="dialog" aria-modal="true" aria-label={`Crop for ${title}`} className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl space-y-3 overflow-y-auto rounded-xl border border-amber-500/30 bg-slate-950 p-3 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">Crop for {title}</p>
          <p className="text-xs text-slate-400">Preview opens here immediately. Drag or zoom to adjust it.</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Cancel crop">
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

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-xs text-slate-300">
          Zoom <span className="float-right font-mono">{Math.round(zoom * 100)}%</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
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
      <p className="text-[11px] text-slate-500">Drag the photo to reposition it. Zoom in when the image already matches this section’s shape.</p>

      {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setZoom(1.15);
            setPosition({ x: 0.5, y: 0.5 });
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
        <button
          type="button"
          onClick={applyCrop}
          disabled={!imageSize}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          Use this crop
        </button>
      </div>
      </section>
    </div>
  );
};
