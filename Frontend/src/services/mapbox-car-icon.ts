import mapboxgl from 'mapbox-gl';

class MapboxCarIconService {
  private static iconAdded = false;

  // Add car icon to map
  static addCarIcon(map: mapboxgl.Map): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.iconAdded) {
        resolve();
        return;
      }

      try {
        // Create car icon as SVG
        const carSvg = `
          <svg width="32" height="20" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
            <!-- Car body -->
            <path d="M6 14 L26 14 Q28 14 28 12 L28 9 Q28 8 26 8 L22 8 L21 5 Q20 4 19 4 L13 4 Q12 4 11 5 L10 8 L6 8 Q4 8 4 9 L4 12 Q4 14 6 14 Z" 
              fill="#2563eb" stroke="#1e40af" stroke-width="1"/>
            
            <!-- Car windows -->
            <path d="M11.5 5.5 L20.5 5.5 Q21 5.5 21 6 L21 7.5 L11 7.5 L11 6 Q11 5.5 11.5 5.5 Z" 
              fill="#87ceeb" stroke="#6bb6ff" stroke-width="0.5"/>
            
            <!-- Car wheels -->
            <circle cx="9" cy="14" r="2.5" fill="#333" stroke="#555" stroke-width="0.5"/>
            <circle cx="9" cy="14" r="1.5" fill="#666"/>
            
            <circle cx="23" cy="14" r="2.5" fill="#333" stroke="#555" stroke-width="0.5"/>
            <circle cx="23" cy="14" r="1.5" fill="#666"/>
            
            <!-- Car headlights -->
            <circle cx="26" cy="10" r="1" fill="#ffff99"/>
            <circle cx="26" cy="12" r="1" fill="#ffff99"/>
          </svg>
        `;

        // Convert SVG to canvas and then to image
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          
          // Get ImageData from canvas for Mapbox
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Add the icon to the map
          map.addImage('car-icon', imageData);
          this.iconAdded = true;
          resolve();
        };

        img.onerror = () => {
          reject(new Error('Failed to load car icon'));
        };

        const svgBlob = new Blob([carSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        img.src = url;

      } catch (error) {
        console.error('Error adding car icon:', error);
        reject(error);
      }
    });
  }

  // Create a simple fallback icon
  static addFallbackIcon(map: mapboxgl.Map): Promise<void> {
    return new Promise((resolve) => {
      if (this.iconAdded) {
        resolve();
        return;
      }

      try {
        // Create simple colored square as fallback
        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Blue square with white border
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(0, 0, 20, 20);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(0, 0, 20, 20);

          // Get ImageData from canvas for Mapbox
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          map.addImage('car-icon', imageData);
          this.iconAdded = true;
        }
        resolve();
      } catch (error) {
        console.error('Error adding fallback icon:', error);
        resolve(); // Don't fail on icon issues
      }
    });
  }
}

export default MapboxCarIconService; 