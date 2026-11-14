import React, { useEffect, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Download, MessageCircle, Share2, RotateCcw } from 'lucide-react';

const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1350;
const PosterDownload = registerPlugin('PosterDownload');

const loadImage = (source) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('A poster image could not be loaded.'));
  image.src = source;
});

const DESIGN_WIDTH = 768;
const DESIGN_HEIGHT = 960;

const traceShield = (context, inset = 0) => {
  context.beginPath();
  context.moveTo(121 + inset, 43 + inset);
  context.lineTo(635 - inset, 43 + inset);
  context.bezierCurveTo(640 - inset, 43 + inset, 642 - inset, 49 + inset, 645 - inset, 61 + inset);
  context.bezierCurveTo(662 - inset, 124 + inset, 698 - inset, 159 + inset, 748 - inset, 184 + inset);
  context.bezierCurveTo(715 - inset, 222 + inset, 689 - inset, 263 + inset, 683 - inset, 319 + inset);
  context.bezierCurveTo(674 - inset, 403, 694 - inset, 540 - inset, 718 - inset, 660 - inset);
  context.bezierCurveTo(733 - inset, 738 - inset, 695 - inset, 806 - inset, 605 - inset, 836 - inset);
  context.lineTo(437 - inset, 871 - inset);
  context.bezierCurveTo(411 - inset, 878 - inset, 396 - inset, 915 - inset, 384, 948 - inset);
  context.bezierCurveTo(369 + inset, 915 - inset, 352 + inset, 879 - inset, 324 + inset, 872 - inset);
  context.lineTo(155 + inset, 833 - inset);
  context.bezierCurveTo(69 + inset, 810 - inset, 36 + inset, 746 - inset, 49 + inset, 660 - inset);
  context.bezierCurveTo(72 + inset, 525 - inset, 91 + inset, 399, 79 + inset, 315 + inset);
  context.bezierCurveTo(72 + inset, 260 + inset, 43 + inset, 217 + inset, 10 + inset, 184 + inset);
  context.bezierCurveTo(64 + inset, 156 + inset, 102 + inset, 119 + inset, 116 + inset, 57 + inset);
  context.quadraticCurveTo(118 + inset, 43 + inset, 121 + inset, 43 + inset);
  context.closePath();
};

const fitFontSize = (context, text, family, weight, maxSize, minSize, maxWidth) => {
  let size = maxSize;
  while (size > minSize) {
    context.font = `${weight} ${size}px ${family}`;
    if (context.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  context.font = `${weight} ${size}px ${family}`;
};

const drawShadowText = (context, text, x, y, maxWidth) => {
  const fillStyle = context.fillStyle;
  context.fillStyle = '#101d73';
  context.fillText(text, x + 2, y + 3, maxWidth);
  context.fillStyle = fillStyle;
  context.fillText(text, x, y, maxWidth);
};

const drawPoster = async (canvas, player) => {
  if (!player.auctionCutoutPhoto) throw new Error('The transparent player cutout is not ready yet.');

  const playerImage = await loadImage(player.auctionCutoutPhoto);
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not prepare the poster.');
  context.setTransform(POSTER_WIDTH / DESIGN_WIDTH, 0, 0, POSTER_HEIGHT / DESIGN_HEIGHT, 0, 0);

  const background = context.createLinearGradient(0, 0, 0, DESIGN_HEIGHT);
  background.addColorStop(0, '#020503');
  background.addColorStop(0.62, '#061309');
  background.addColorStop(1, '#0c2e0d');
  context.fillStyle = background;
  context.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

  [[5, 365], [763, 365]].forEach(([x, y]) => {
    const glow = context.createRadialGradient(x, y, 2, x, y, 210);
    glow.addColorStop(0, 'rgba(235,255,232,0.9)');
    glow.addColorStop(0.08, 'rgba(145,255,106,0.45)');
    glow.addColorStop(0.48, 'rgba(46,195,54,0.16)');
    glow.addColorStop(1, 'rgba(25,160,40,0)');
    context.fillStyle = glow;
    context.fillRect(x - 210, y - 210, 420, 420);
    context.strokeStyle = 'rgba(221,255,205,0.32)';
    context.lineWidth = 1;
    for (let beam = 0; beam < 6; beam += 1) {
      context.beginPath();
      context.moveTo(x + (x === 5 ? 2 : -2), 230 + beam * 22);
      context.lineTo(x + (x === 5 ? 170 : -170), 570 + beam * 13);
      context.stroke();
    }
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        context.fillStyle = 'rgba(255,255,235,0.85)';
        context.fillRect(x + (x === 5 ? 13 : -25) + column * (x === 5 ? 7 : -7), 244 + row * 8, 3, 3);
      }
    }
  });

  context.fillStyle = 'rgba(4,18,8,0.56)';
  context.fillRect(0, 575, DESIGN_WIDTH, 232);
  for (let row = 0; row < 9; row += 1) {
    const y = 586 + row * 23;
    context.fillStyle = row % 2 ? 'rgba(15,77,30,0.45)' : 'rgba(1,9,5,0.7)';
    context.fillRect(0, y, DESIGN_WIDTH, 12);
    context.fillStyle = 'rgba(77,236,65,0.38)';
    context.fillRect(0, y + 12, DESIGN_WIDTH, 2);
  }
  const fieldGlow = context.createLinearGradient(0, 790, 0, DESIGN_HEIGHT);
  fieldGlow.addColorStop(0, '#103a13');
  fieldGlow.addColorStop(0.45, '#218b19');
  fieldGlow.addColorStop(1, '#061a08');
  context.fillStyle = fieldGlow;
  context.fillRect(0, 790, DESIGN_WIDTH, 170);
  context.strokeStyle = 'rgba(165,255,110,0.16)';
  context.lineWidth = 1;
  for (let y = 812; y < DESIGN_HEIGHT; y += 14) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(DESIGN_WIDTH, y);
    context.stroke();
  }

  const stadiumGreen = context.createRadialGradient(384, 615, 130, 384, 615, 510);
  stadiumGreen.addColorStop(0, 'rgba(19,81,28,0)');
  stadiumGreen.addColorStop(1, 'rgba(58,255,48,0.24)');
  context.fillStyle = stadiumGreen;
  context.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

  traceShield(context);
  context.fillStyle = '#020704';
  context.fill();
  context.save();
  traceShield(context, 20);
  context.clip();
  const insideGlow = context.createRadialGradient(384, 432, 20, 384, 432, 430);
  insideGlow.addColorStop(0, 'rgba(14,72,22,0.62)');
  insideGlow.addColorStop(0.58, 'rgba(8,41,12,0.55)');
  insideGlow.addColorStop(1, 'rgba(0,0,0,0.14)');
  context.fillStyle = insideGlow;
  context.fillRect(35, 75, 698, 790);
  [[84, 440], [684, 440]].forEach(([x, y]) => {
    const sideGlow = context.createRadialGradient(x, y, 0, x, y, 250);
    sideGlow.addColorStop(0, 'rgba(38,255,45,0.24)');
    sideGlow.addColorStop(0.4, 'rgba(20,130,31,0.17)');
    sideGlow.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = sideGlow;
    context.fillRect(x - 250, y - 250, 500, 500);
  });

  const sourceHeight = playerImage.naturalWidth / playerImage.naturalHeight < 0.9
    ? playerImage.naturalHeight * 0.74
    : playerImage.naturalHeight;
  const imageScale = Math.min(520 / playerImage.naturalWidth, 440 / sourceHeight);
  const imageWidth = playerImage.naturalWidth * imageScale;
  const imageHeight = sourceHeight * imageScale;
  context.drawImage(
    playerImage,
    0, 0, playerImage.naturalWidth, sourceHeight,
    (DESIGN_WIDTH - imageWidth) / 2, 203, imageWidth, imageHeight
  );
  const fade = context.createLinearGradient(0, 550, 0, 640);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(2,7,4,0.95)');
  context.fillStyle = fade;
  context.fillRect(120, 550, 528, 90);
  context.restore();

  const gold = context.createLinearGradient(20, 140, 740, 815);
  gold.addColorStop(0, '#ffefb0');
  gold.addColorStop(0.18, '#b87635');
  gold.addColorStop(0.39, '#ffdc85');
  gold.addColorStop(0.61, '#fff3c0');
  gold.addColorStop(0.82, '#a65d22');
  gold.addColorStop(1, '#ffe9a0');
  traceShield(context);
  context.strokeStyle = 'rgba(45,20,5,0.92)';
  context.lineWidth = 32;
  context.stroke();
  traceShield(context);
  context.strokeStyle = gold;
  context.lineWidth = 23;
  context.shadowColor = 'rgba(49,255,45,0.78)';
  context.shadowBlur = 26;
  context.stroke();
  context.shadowBlur = 0;
  traceShield(context, 20);
  context.strokeStyle = 'rgba(255,230,161,0.88)';
  context.lineWidth = 2;
  context.stroke();

  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  const displayFont = 'Impact, "Arial Narrow", sans-serif';
  context.fillStyle = '#77f547';
  context.font = `bold 46px ${displayFont}`;
  context.fillText('NPL', DESIGN_WIDTH / 2, 127);
  context.fillStyle = '#ffd20b';
  context.font = `bold 52px ${displayFont}`;
  drawShadowText(context, 'AUCTION', DESIGN_WIDTH / 2, 183);

  const playerName = String(player.fullName || player.name || '').trim().toUpperCase();
  if (playerName) {
    fitFontSize(context, playerName, displayFont, 'bold', 58, 20, 610);
    context.fillStyle = '#ffd20b';
    drawShadowText(context, playerName, DESIGN_WIDTH / 2, 656, 610);
  }

  const hasStyle = Boolean(player.role || player.bowlingStyle);

  if (hasStyle) {
    context.fillStyle = '#ffd20b';
    context.font = `bold 34px ${displayFont}`;
    context.fillText('STYLE', DESIGN_WIDTH / 2, 702);
    context.strokeStyle = 'rgba(133,237,53,0.9)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(214, 690);
    context.lineTo(312, 690);
    context.moveTo(456, 690);
    context.lineTo(554, 690);
    context.stroke();

    if (player.role) {
      context.fillStyle = '#f20b1d';
      context.beginPath();
      context.arc(245, 741, 17, 0, Math.PI * 2);
      context.fill();
      const role = String(player.role).trim().toUpperCase();
      fitFontSize(context, role, displayFont, 'bold', 18, 13, 100);
      context.fillStyle = '#fff';
      context.textAlign = 'left';
      context.fillText(role, 276, 750);
    }
    if (player.bowlingStyle) {
      const bowlingX = player.role ? 402 : 224;
      if (player.role) {
        context.strokeStyle = '#f4f4f4';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(380, 717);
        context.lineTo(380, 770);
        context.stroke();
      }
      const bowlingStyle = String(player.bowlingStyle).trim().toUpperCase();
      fitFontSize(context, bowlingStyle, displayFont, 'bold', 18, 13, player.role ? 190 : 320);
      context.fillStyle = '#ffae00';
      context.textAlign = 'left';
      context.fillText(bowlingStyle, bowlingX, 750);
    }
  }

  context.textAlign = 'center';
  if (player.registrationId) {
    const registrationId = String(player.registrationId).trim().toUpperCase();
    fitFontSize(context, registrationId, displayFont, 'bold', 48, 20, 530);
    context.fillStyle = '#ffd20b';
    drawShadowText(context, registrationId, DESIGN_WIDTH / 2, 812, 530);
  }
};

const canvasBlob = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => blob
    ? resolve(blob)
    : reject(new Error('Could not export the poster image. Try again.')), 'image/png');
});

const createPosterFile = async (canvas) => new File(
  [await canvasBlob(canvas)],
  'npl-auction-poster.png',
  { type: 'image/png' }
);

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      reject(new Error('Could not prepare the poster for download.'));
      return;
    }
    const comma = reader.result.indexOf(',');
    if (comma < 0) {
      reject(new Error('Could not prepare the poster for download.'));
      return;
    }
    resolve(reader.result.slice(comma + 1));
  };
  reader.onerror = () => reject(new Error('Could not prepare the poster for download.'));
  reader.readAsDataURL(file);
});

export const AuctionPlayerPoster = ({
  player,
  onRetry,
  onManualUpload,
  isRetrying = false,
  generationError = '',
  generationProgress = null
}) => {
  const canvasRef = useRef(null);
  const [posterError, setPosterError] = useState('');
  const [posterReady, setPosterReady] = useState(false);
  const [shareError, setShareError] = useState('');
  const [downloadMessage, setDownloadMessage] = useState('');
  const [isDownloadingPoster, setIsDownloadingPoster] = useState(false);
  const downloadInProgress = useRef(false);
  const [renderVersion, setRenderVersion] = useState(0);

  useEffect(() => {
    let active = true;
    if (!player.auctionCutoutPhoto) return () => { active = false; };
    drawPoster(canvasRef.current, player)
      .then(() => {
        if (active) {
          setPosterError('');
          setPosterReady(true);
        }
      })
      .catch((error) => {
        if (active) {
          setPosterError(error.message || 'Could not generate the player poster.');
          setPosterReady(false);
        }
      });
    return () => { active = false; };
  }, [player, renderVersion]);

  const downloadPoster = async () => {
    if (downloadInProgress.current) return;
    downloadInProgress.current = true;
    setIsDownloadingPoster(true);
    setShareError('');
    setDownloadMessage('');
    try {
      const file = await createPosterFile(canvasRef.current);
      if (Capacitor.getPlatform() === 'android') {
        const result = await PosterDownload.savePoster({
          fileName: file.name,
          data: await fileToBase64(file)
        });
        setDownloadMessage(`Poster saved to ${result.location}.`);
        return;
      }

      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setShareError(error.message || 'Could not download the poster.');
    } finally {
      downloadInProgress.current = false;
      setIsDownloadingPoster(false);
    }
  };

  const sharePoster = async () => {
    setShareError('');
    try {
      const file = await createPosterFile(canvasRef.current);
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: `${player.fullName || player.name} • NPL Auction`,
          text: 'My Narua Premier League auction player card'
        });
        return;
      }
      await downloadPoster();
    } catch (error) {
      if (error?.name !== 'AbortError') setShareError(error.message || 'Could not share the poster.');
    }
  };

  const shareOnWhatsApp = async () => {
    setShareError('');
    try {
      const file = await createPosterFile(canvasRef.current);
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: `${player.fullName || player.name} • NPL Auction`,
          text: 'My Narua Premier League auction player card'
        });
        return;
      }
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`My NPL Auction player card${player.registrationId ? ` • ${player.registrationId}` : ''}. Download the poster here and attach it to your message.`)}`,
        '_blank',
        'noopener,noreferrer'
      );
      await downloadPoster();
    } catch (error) {
      if (error?.name !== 'AbortError') setShareError(error.message || 'Could not share the poster.');
    }
  };

  const retry = async () => {
    setPosterError('');
    setPosterReady(false);
    setShareError('');
    if (player.auctionCutoutPhoto) {
      setRenderVersion((version) => version + 1);
      return;
    }
    await onRetry?.();
  };

  const error = posterError || generationError;

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-500/30 bg-slate-950/70 p-4 text-left">
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
          {player.auctionCutoutPhoto ? 'Your auction player card is ready!' : 'Preparing your auction player card'}
        </p>
        <h4 className="mt-1 font-sports text-xl text-white">PERSONALIZED NPL POSTER</h4>
      </div>
      <div className="mx-auto w-full max-w-[432px] overflow-hidden rounded-xl border border-amber-400/60 bg-black shadow-[0_0_30px_rgba(34,197,94,0.2)]">
        {player.auctionCutoutPhoto ? (
          <canvas
            ref={canvasRef}
            width={POSTER_WIDTH}
            height={POSTER_HEIGHT}
            aria-label={`NPL auction poster for ${player.fullName || player.name}`}
            className="block h-auto w-full"
          />
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center px-6 text-center text-sm text-slate-400" role="status">
            Your registration is confirmed. We’re preparing the transparent player cutout.
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="text-center text-xs text-rose-300">
          {error}
        </p>
      )}
      {!player.auctionCutoutPhoto && !error && (
        <div className="space-y-2 text-center" role="status" aria-live="polite">
          <p className="text-xs text-slate-300">
            {generationProgress?.message || 'Preparing your transparent player cutout...'}
          </p>
          {generationProgress && (
            <div className="mx-auto h-2 max-w-sm overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-400 transition-[width]"
                style={{ width: `${Math.min(100, Math.max(0, Math.round(generationProgress.progress * 100)))}%` }}
              />
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            Background removal runs on this device. Keep this screen open while the badge is generating. First use downloads and loads the model; later runs may be faster if your browser keeps it cached.
          </p>
        </div>
      )}
      {!player.auctionCutoutPhoto && error && (
        <label className="mx-auto flex min-h-11 w-full max-w-sm cursor-pointer items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-center text-xs font-bold uppercase text-emerald-100 hover:bg-emerald-900/50">
          Use a transparent PNG or WebP instead
          <input
            type="file"
            accept="image/png,image/webp"
            className="sr-only"
            disabled={isRetrying}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void onManualUpload?.(file);
              event.currentTarget.value = '';
            }}
          />
        </label>
      )}
      {shareError && <p role="alert" className="text-center text-xs text-rose-300">{shareError}</p>}
      {downloadMessage && <p role="status" className="text-center text-xs text-emerald-300">{downloadMessage}</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" disabled={!posterReady || Boolean(posterError) || isDownloadingPoster} aria-busy={isDownloadingPoster} onClick={downloadPoster} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black uppercase text-slate-950 hover:bg-amber-300 disabled:cursor-wait disabled:opacity-50">
          <Download className="h-4 w-4" /> {isDownloadingPoster ? 'Saving poster…' : 'Download Poster'}
        </button>
        <button type="button" disabled={!posterReady || Boolean(posterError)} onClick={shareOnWhatsApp} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/60 px-4 py-2 text-xs font-black uppercase text-emerald-100 hover:bg-emerald-900/70 disabled:cursor-not-allowed disabled:opacity-50">
          <MessageCircle className="h-4 w-4" /> Share on WhatsApp
        </button>
        <button type="button" disabled={!posterReady || Boolean(posterError)} onClick={sharePoster} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-950/50 px-4 py-2 text-xs font-black uppercase text-sky-100 hover:bg-sky-900/70 disabled:cursor-not-allowed disabled:opacity-50">
          <Share2 className="h-4 w-4" /> Share Poster
        </button>
        <button type="button" disabled={isRetrying} onClick={retry} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 text-xs font-black uppercase text-slate-200 hover:bg-slate-800 disabled:opacity-50">
          <RotateCcw className="h-4 w-4" /> {isRetrying ? 'Retrying...' : 'Retry Poster'}
        </button>
      </div>
    </section>
  );
};
