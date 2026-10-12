// Shareable outfit card: composites the character (with its current outfit)
// and the day's weather into one image (spec R24/R25), via the Canvas API.
// Uses the Web Share API when available (mobile browsers, mainly), falling
// back to a plain download link everywhere else.

const CHARACTER_BASE = "assets/character/character.png";

const SKY_GRADIENTS = {
  sunny: ["#8ec9f0", "#fef3c7"],
  "partly-cloudy": ["#a8c9e8", "#e8eef5"],
  cloudy: ["#b8c2cc", "#d9dee3"],
  rain: ["#5c6b7a", "#8fa0ad"],
  snow: ["#c9d6e3", "#eef3f7"],
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

async function generateShareCard(state, dateLabel) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");

  const [top, bottom] = SKY_GRADIENTS[state.weatherIcon] || SKY_GRADIENTS.sunny;
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const [base, footwear, lower, upper] = await Promise.all([
    loadImage(CHARACTER_BASE),
    loadImage(`assets/character/footwear-${state.outfit.footwear}.png`),
    loadImage(`assets/character/lower-${state.outfit.lower}.png`),
    loadImage(`assets/character/upper-${state.outfit.upper}.png`),
  ]);

  const charWidth = 600;
  const charHeight = charWidth * (3300 / 2550); // matches the source art's aspect ratio
  const charX = (canvas.width - charWidth) / 2;
  const charY = canvas.height - charHeight - 260;

  // Same stacking order as the Main screen: footwear under the lower layer.
  [base, footwear, lower, upper].forEach((img) => {
    ctx.drawImage(img, charX, charY, charWidth, charHeight);
  });

  const pillMargin = 40;
  const pillHeight = 200;
  const pillY = canvas.height - pillHeight - pillMargin;
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  roundRect(ctx, pillMargin, pillY, canvas.width - pillMargin * 2, pillHeight, 28);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 64px system-ui, sans-serif";
  ctx.fillText(`${state.temperature}°F`, pillMargin + 32, pillY + 80);

  ctx.font = "32px system-ui, sans-serif";
  ctx.fillStyle = "#5b6472";
  ctx.fillText(state.shortForecast, pillMargin + 32, pillY + 130);
  ctx.fillText(`${state.locationName} - ${dateLabel}`, pillMargin + 32, pillY + 170);

  ctx.textAlign = "right";
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillStyle = "#1a56db";
  ctx.fillText("Weather Fit", canvas.width - pillMargin - 32, pillY + 50);

  return canvas;
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "weather-fit-outfit.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareCard(state, dateLabel) {
  const canvas = await generateShareCard(state, dateLabel);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const file = new File([blob], "weather-fit-outfit.png", { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "My outfit for today",
        text: `${state.temperature}°F and ${state.shortForecast.toLowerCase()} in ${state.locationName}`,
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        // AbortError just means the user closed the share sheet - not a failure.
        downloadBlob(blob);
      }
    }
  } else {
    downloadBlob(blob);
  }
}
