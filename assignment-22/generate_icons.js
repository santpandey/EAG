// This is a simple script to generate placeholder icons
// In a real implementation, you would create proper icons with a design tool

document.addEventListener('DOMContentLoaded', function() {
  const sizes = [16, 48, 128];
  
  sizes.forEach(size => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = '#3498db';
    ctx.fillRect(0, 0, size, size);
    
    // Draw music note
    ctx.fillStyle = 'white';
    const noteSize = size * 0.6;
    const x = (size - noteSize) / 2;
    const y = (size - noteSize) / 2;
    
    // Simple music note shape
    ctx.beginPath();
    ctx.arc(x + noteSize * 0.7, y + noteSize * 0.7, noteSize * 0.3, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillRect(x + noteSize * 0.7 - noteSize * 0.05, y, noteSize * 0.1, noteSize * 0.7);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    
    // In a real implementation, you would save this to a file
    console.log(`Icon ${size}x${size} generated`);
    
    // For demonstration, we could download the icon
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `icon${size}.png`;
    document.body.appendChild(link);
    // link.click(); // Uncomment to auto-download
    document.body.removeChild(link);
  });
});
