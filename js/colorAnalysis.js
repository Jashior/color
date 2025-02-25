document.addEventListener('DOMContentLoaded', () => {
  const dropArea = document.getElementById('dropArea');
  const fileInput = document.getElementById('fileInput');
  const results = document.getElementById('results');
  const previewImage = document.getElementById('previewImage');
  const colorPalette = document.getElementById('colorPalette');
  let colorChart = null;

  // Setup drag and drop events
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropArea.classList.add('highlight');
  }

  function unhighlight() {
    dropArea.classList.remove('highlight');
  }

  // Handle file selection
  dropArea.addEventListener('drop', handleDrop, false);
  dropArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  function handleFileSelect(e) {
    if (e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  }

  function processFile(file) {
    if (!file.type.match('image.*')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewImage.onload = () => {
        analyzeImage(previewImage);
        results.style.display = 'flex';
      };
    };
    reader.readAsDataURL(file);
  }

  function analyzeImage(image) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const colorData = extractColors(imageData.data);

    // Display dominant colors
    displayDominantColors(colorData.dominantColors);

    // Display color distribution
    displayColorDistribution(colorData.colorGroups);

    // Display color wheel
    displayColorWheel(colorData.allColors);
  }

  function extractColors(pixelData) {
    const pixels = pixelData.length / 4;
    const colorCounts = {};
    const colorGroups = {
      reds: 0,
      oranges: 0,
      yellows: 0,
      greens: 0,
      blues: 0,
      purples: 0,
      pinks: 0,
      browns: 0,
      whites: 0,
      grays: 0,
      blacks: 0,
    };

    // Store all colors by hue for the color wheel
    const allColors = Array(360)
      .fill()
      .map(() => ({
        count: 0,
        saturation: 0,
        lightness: 0,
      }));

    // Process each pixel
    for (let i = 0; i < pixelData.length; i += 4) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];

      // Skip fully transparent pixels
      if (pixelData[i + 3] < 128) continue;

      // Get quantized color to reduce the number of unique colors
      const quantizedColor = quantizeColor(r, g, b);
      const colorKey = quantizedColor.join(',');

      if (colorCounts[colorKey]) {
        colorCounts[colorKey].count++;
      } else {
        colorCounts[colorKey] = {
          color: quantizedColor,
          count: 1,
        };
      }

      // Get HSL values for color wheel
      const [h, s, l] = rgbToHsl(r, g, b);

      // Add to color wheel data (by hue)
      if (h >= 0 && h < 360) {
        allColors[h].count++;
        // Weighted average for saturation and lightness
        const currentTotal = allColors[h].count - 1;
        allColors[h].saturation =
          (allColors[h].saturation * currentTotal + s) / allColors[h].count;
        allColors[h].lightness =
          (allColors[h].lightness * currentTotal + l) / allColors[h].count;
      }

      // Categorize color for distribution
      categorizeColor(r, g, b, colorGroups);
    }

    // Convert to array and sort by count
    const colorArray = Object.values(colorCounts);
    colorArray.sort((a, b) => b.count - a.count);

    // Get top colors (excluding very similar ones)
    const dominantColors = [];

    for (const colorInfo of colorArray) {
      if (dominantColors.length >= 8) break;

      // Skip colors that are too similar to already selected ones
      if (
        !dominantColors.some((c) => isSimilarColor(c.color, colorInfo.color))
      ) {
        dominantColors.push({
          color: colorInfo.color,
          percentage: (colorInfo.count / pixels) * 100,
        });
      }
    }

    // Convert counts to percentages for color groups
    for (const group in colorGroups) {
      colorGroups[group] = (colorGroups[group] / pixels) * 100;
    }

    return {
      dominantColors,
      colorGroups,
      allColors,
    };
  }

  function quantizeColor(r, g, b) {
    // Quantize to reduce number of unique colors (using 8 levels per channel)
    const step = 32;
    return [
      Math.floor(r / step) * step,
      Math.floor(g / step) * step,
      Math.floor(b / step) * step,
    ];
  }

  function isSimilarColor(color1, color2) {
    // Calculate color distance (Euclidean distance in RGB space)
    const dr = color1[0] - color2[0];
    const dg = color1[1] - color2[1];
    const db = color1[2] - color2[2];
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);

    // Colors are considered similar if their distance is less than this threshold
    return distance < 40;
  }

  function categorizeColor(r, g, b, groups) {
    // Convert RGB to HSL for easier categorization
    const [h, s, l] = rgbToHsl(r, g, b);

    // Categorize based on HSL values
    if (l < 10) {
      groups.blacks++;
    } else if (l > 90) {
      groups.whites++;
    } else if (s < 10) {
      groups.grays++;
    } else {
      // Categorize by hue
      if (h >= 0 && h < 30) {
        groups.reds++;
      } else if (h >= 30 && h < 45) {
        groups.oranges++;
      } else if (h >= 45 && h < 70) {
        groups.yellows++;
      } else if (h >= 70 && h < 150) {
        groups.greens++;
      } else if (h >= 150 && h < 210) {
        groups.blues++;
      } else if (h >= 210 && h < 280) {
        groups.purples++;
      } else if (h >= 280 && h < 330) {
        groups.pinks++;
      } else {
        groups.reds++; // 330-360 is also red
      }

      // Brown is a special case (dark orange/yellow)
      if (h >= 20 && h < 70 && s > 10 && l < 40) {
        groups.browns++;
        // Remove from the previous category
        if (h < 45) groups.oranges--;
        else groups.yellows--;
      }
    }
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h *= 60; // degrees
    }

    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }

  function displayDominantColors(colors) {
    colorPalette.innerHTML = '';

    colors.forEach((colorInfo) => {
      const [r, g, b] = colorInfo.color;
      const percentage = colorInfo.percentage.toFixed(1);
      const hexColor = rgbToHex(r, g, b);

      const colorBox = document.createElement('div');
      colorBox.className = 'color-box';

      const colorDisplay = document.createElement('div');
      colorDisplay.className = 'color-display';
      colorDisplay.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

      const colorLabel = document.createElement('div');
      colorLabel.className = 'color-label';
      colorLabel.textContent = `${hexColor} ${percentage}%`;

      colorBox.appendChild(colorDisplay);
      colorBox.appendChild(colorLabel);
      colorPalette.appendChild(colorBox);
    });
  }

  function rgbToHex(r, g, b) {
    return (
      '#' +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  }

  function displayColorDistribution(colorGroups) {
    const ctx = document.getElementById('colorChart').getContext('2d');

    // Destroy existing chart if it exists
    if (colorChart) {
      colorChart.destroy();
    }

    // Prepare data for chart
    const labels = [];
    const data = [];
    const backgroundColors = [];

    for (const [group, percentage] of Object.entries(colorGroups)) {
      if (percentage > 0.5) {
        // Only include colors that make up more than 0.5%
        labels.push(group.charAt(0).toUpperCase() + group.slice(1));
        data.push(percentage.toFixed(1));

        // Set the color for each bar
        switch (group) {
          case 'reds':
            backgroundColors.push('rgba(255, 99, 132, 0.7)');
            break;
          case 'oranges':
            backgroundColors.push('rgba(255, 159, 64, 0.7)');
            break;
          case 'yellows':
            backgroundColors.push('rgba(255, 205, 86, 0.7)');
            break;
          case 'greens':
            backgroundColors.push('rgba(75, 192, 192, 0.7)');
            break;
          case 'blues':
            backgroundColors.push('rgba(54, 162, 235, 0.7)');
            break;
          case 'purples':
            backgroundColors.push('rgba(153, 102, 255, 0.7)');
            break;
          case 'pinks':
            backgroundColors.push('rgba(255, 153, 204, 0.7)');
            break;
          case 'browns':
            backgroundColors.push('rgba(139, 69, 19, 0.7)');
            break;
          case 'whites':
            backgroundColors.push('rgba(240, 240, 240, 0.7)');
            break;
          case 'grays':
            backgroundColors.push('rgba(128, 128, 128, 0.7)');
            break;
          case 'blacks':
            backgroundColors.push('rgba(0, 0, 0, 0.7)');
            break;
          default:
            backgroundColors.push('rgba(128, 128, 128, 0.7)');
        }
      }
    }

    // Create chart
    colorChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Color Distribution (%)',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map((color) =>
              color.replace('0.7', '1')
            ),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }

  function displayColorWheel(colorData) {
    const canvas = document.getElementById('colorWheel');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 10;
    const innerRadius = outerRadius * 0.4; // Create a donut-shaped wheel

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find the maximum count for scaling
    let maxCount = 0;
    for (let i = 0; i < colorData.length; i++) {
      if (colorData[i].count > maxCount) {
        maxCount = colorData[i].count;
      }
    }

    // Draw color wheel segments
    for (let hue = 0; hue < 360; hue++) {
      const colorInfo = colorData[hue];

      // Skip hues with no pixels
      if (colorInfo.count === 0) continue;

      // Calculate segment size based on count (normalized)
      const segmentSize =
        innerRadius +
        (outerRadius - innerRadius) *
          Math.min(1, colorInfo.count / (maxCount * 0.25));

      // Use average saturation and lightness values for this hue
      const s = colorInfo.saturation;
      const l = Math.min(Math.max(colorInfo.lightness, 20), 80); // Keep lightness in a visible range

      // Start and end angles for this segment (in radians)
      const startAngle = (hue - 0.5) * (Math.PI / 180);
      const endAngle = (hue + 0.5) * (Math.PI / 180);

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(
        centerX + innerRadius * Math.cos(startAngle),
        centerY + innerRadius * Math.sin(startAngle)
      );
      ctx.arc(centerX, centerY, innerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, segmentSize, endAngle, startAngle, true);
      ctx.closePath();

      // Fill with the appropriate color
      ctx.fillStyle = `hsl(${hue}, ${s}%, ${l}%)`;
      ctx.fill();

      // Outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 0.2;
      ctx.stroke();
    }

    // Draw color wheel indicators
    // Draw a circle in the center
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Add color wheel markers for primary colors
    const markerPositions = [
      { hue: 0, label: 'Red' }, // Red
      { hue: 60, label: 'Yellow' }, // Yellow
      { hue: 120, label: 'Green' }, // Green
      { hue: 180, label: 'Cyan' }, // Cyan
      { hue: 240, label: 'Blue' }, // Blue
      { hue: 300, label: 'Magenta' }, // Magenta
    ];

    for (const marker of markerPositions) {
      const angle = (marker.hue * Math.PI) / 180;
      const x = centerX + (innerRadius - 15) * Math.cos(angle);
      const y = centerY + (innerRadius - 15) * Math.sin(angle);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(marker.label, x, y);
    }

    // Draw outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
});
