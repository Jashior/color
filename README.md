# Color Analysis Tool

[View Demo](https://jashior.github.io/color/)

A web-based tool for analyzing and visualizing the color composition of images. This application provides detailed color insights through various visualizations including dominant color extraction, color distribution charts, and an interactive color wheel.

## Features

- **Simple Upload Interface**: Drag and drop images or click to upload
- **Dominant Color Extraction**: Identifies and displays the main colors in your image with percentage breakdowns
- **Color Distribution Analysis**: Visualizes the proportion of different color categories (reds, blues, greens, etc.)
- **Interactive Color Wheel**: Shows color distribution mapped to a color wheel for a comprehensive view of color relationships

## How It Works

1. Upload any image by dragging it into the drop area or clicking to select a file
2. The tool automatically processes the image and displays:
   - A preview of your image
   - A palette of dominant colors with hex codes and percentages
   - A bar chart showing the distribution of color categories
   - A color wheel visualization showing hue distribution

## Screenshots

### Main Interface
![Main Interface](https://i.imgur.com/Emdxmii.png)

### Color Wheel Visualization
![Color Wheel](https://i.imgur.com/KrJz5X7.png)

## Technical Details

The application uses:
- HTML5 File API for image uploads
- Canvas API for image processing and color extraction
- Chart.js for visualization of color distributions
- Advanced color quantization algorithms to identify dominant colors
- HSL color space analysis for accurate color categorization

## Use Cases

- Graphic design: Understand color relationships in existing designs
- Photography: Analyze color composition of photographs
- UI/UX design: Extract exact color values from reference images
- Art: Study color distribution in paintings or other artwork
- Branding: Identify and extract exact colors from logos or brand materials
